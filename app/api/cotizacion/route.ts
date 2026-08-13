// POST  /api/cotizacion — crea cotización + lead + presupuesto desde /resumen (service role)
// PATCH /api/cotizacion — actualiza estado_crm de una cotización por numero_cotizacion

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCatalogoIdPorProyecto } from "@/lib/data/catalogo";

// Mapea el plan_tipo del store ("basico"/"intermedio") a las claves reales
// de SECCIONES_POR_PLAN en lib/plan-constants.ts — son literales distintos
// a los nombres comerciales de planesBase ("Básico Esencial"/"Intermedio
// Plus"), así que no se pueden derivar directo de ahí.
const PLAN_BASE_PRESUPUESTO: Record<string, string> = {
  basico: "Plan Básico",
  intermedio: "Plan Intermedio Plus",
};

// Mismo criterio de normalización ya usado en lib/utils/crm-groups.ts
// (Kanban viejo /crm) — solo dígitos, ignora espacios/guiones/+57, para
// poder comparar contra lo que ya haya en la BD sin importar el formato
// con que se guardó cada vez.
function normalizarTelefono(telefono: string | null | undefined): string {
  return (telefono || "").replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      // Cotización
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      proyecto_id,
      proyecto_nombre,
      plan_tipo,
      plan_nombre,
      precio_plan,
      total,
      pdf_url,
      numero_cotizacion,
      adicionales,
      // Ítems adicionales seleccionados, con precio unitario y cantidad
      // separados (a diferencia de `adicionales` arriba, que ya viene
      // aplanado a texto para mostrar) — se usan para armar la fila real
      // en `presupuestos`, la misma tabla que alimenta /p/[token] y el
      // generador de contrato.
      items_manuales,
      // Lead
      presupuesto_estimado,
      fuente,
      origen,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
      gclid,
      landing_page,
      referrer,
    } = body;

    if (!cliente_nombre || !cliente_email || !numero_cotizacion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: cliente_nombre, cliente_email, numero_cotizacion" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent");

    const { data: cotizacion, error: cotError } = await supabaseAdmin
      .from("cotizaciones")
      .insert({
        cliente_nombre,
        cliente_email,
        cliente_telefono: cliente_telefono || null,
        proyecto_id,
        proyecto_nombre,
        plan_tipo,
        plan_nombre,
        precio_plan,
        total,
        pdf_url,
        numero_cotizacion,
        estado_crm: "NUEVO",
        posicion_kanban: 0,
        adicionales: adicionales ?? [],
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (cotError) {
      console.error("Error insertando cotización:", cotError);
      return NextResponse.json({ error: cotError.message }, { status: 500 });
    }

    // Agrupar por teléfono los leads que vienen de WEB — antes, cada vez
    // que el mismo cliente volvía a cotizar (ej. cambiaba acabados) desde
    // el configurador, se creaba un lead nuevo en el Kanban en vez de sumar
    // el presupuesto al lead ya existente. Bug real reportado por Javier
    // 2026-08-12. Solo aplica cuando el origen resuelto es "WEB" (el único
    // caso pedido) y hay un teléfono real — nunca agrupa contra leads de
    // otros canales (PAUTA_META, WHATSAPP, manual) ni entre sí los leads
    // sin teléfono.
    const origenResuelto = origen ?? "WEB";
    const telefonoLimpio = normalizarTelefono(cliente_telefono);

    let leadExistente: { id: string; presupuesto_estimado: number | null } | null = null;
    if (telefonoLimpio && origenResuelto === "WEB") {
      const { data: leadsWeb, error: buscarError } = await supabaseAdmin
        .from("leads")
        .select("id, telefono, presupuesto_estimado")
        .eq("origen", "WEB")
        .is("deleted_at", null);

      if (buscarError) {
        console.error("Error buscando lead existente por teléfono:", buscarError);
      } else {
        leadExistente = (leadsWeb || []).find((l) => normalizarTelefono(l.telefono) === telefonoLimpio) ?? null;
      }
    }

    let lead: { id: string } | null = null;

    if (leadExistente) {
      // Mismo cliente WEB de siempre: no crea lead nuevo — actualiza el
      // existente con los datos más recientes y sube presupuesto_estimado
      // solo si el nuevo total es mayor (el indicador del lead siempre
      // muestra el valor más alto que ese cliente ha cotizado, no el
      // último que haya tocado por accidente un plan más barato).
      const presupuestoMasAlto = Math.max(
        Number(leadExistente.presupuesto_estimado) || 0,
        Number(presupuesto_estimado) || 0
      );
      const { data: leadActualizado, error: updateError } = await supabaseAdmin
        .from("leads")
        .update({
          nombre: cliente_nombre,
          email: cliente_email,
          proyecto: proyecto_nombre,
          presupuesto_estimado: presupuestoMasAlto,
          cotizacion_id: cotizacion.id,
          ultima_interaccion: new Date().toISOString(),
          ultima_actividad_fecha: new Date().toISOString(),
          // etapa/probabilidad NO se tocan — si el asesor ya avanzó este
          // lead a NEGOCIACION/CIERRE, una nueva cotización del cliente no
          // debe retrocederlo a COTIZACION.
        })
        .eq("id", leadExistente.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("Error actualizando lead existente:", updateError);
      } else {
        lead = leadActualizado;
      }

      if (lead?.id) {
        const { error: actividadError } = await supabaseAdmin.from("lead_actividades").insert({
          lead_id: lead.id,
          // "NOTA" es el valor de tipo más cercano disponible en el CHECK
          // de lead_actividades — no existe "NUEVA_COTIZACION" y agregar un
          // valor nuevo requeriría su propia migración (mismo bug real ya
          // encontrado 2026-08-12 en construnovelas_estilo_check).
          tipo: "NOTA",
          descripcion: `Cliente generó una nueva cotización desde el configurador web (#${numero_cotizacion}) — mismo lead, teléfono ya registrado.`,
          usuario: "Sistema",
        });
        if (actividadError) console.error("Error registrando actividad de re-cotización:", actividadError);
      }
    } else {
      const { data: leadNuevo, error: leadError } = await supabaseAdmin
        .from("leads")
        .insert({
          nombre: cliente_nombre,
          telefono: cliente_telefono || "Sin teléfono",
          email: cliente_email,
          proyecto: proyecto_nombre,
          presupuesto_estimado,
          fuente: fuente ?? "WEB",
          origen: origenResuelto,
          fuente_detalle: "Configurador online",
          etapa: "COTIZACION",
          probabilidad: 40,
          cotizacion_id: cotizacion.id,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          utm_term,
          fbclid,
          gclid,
          landing_page,
          referrer,
        })
        .select("id")
        .single();

      if (leadError) {
        console.error("Error insertando lead:", leadError);
      } else {
        lead = leadNuevo;
      }
    }

    // Fila real en `presupuestos` — misma tabla que usa el presupuesto
    // manual, así que este presupuesto automático queda visible en el
    // historial de versiones del lead (CRM) y listo para que el generador
    // de contrato tome de ahí el alcance de la obra.
    let token_publico: string | null = null;
    if (lead?.id) {
      token_publico = randomUUID();
      const { error: pptoError } = await supabaseAdmin.from("presupuestos").insert({
        lead_id: lead.id,
        estado: "ENVIADA",
        total_final: total,
        precio_base: precio_plan,
        precio_manual: null,
        nombre_cliente: cliente_nombre,
        telefono_cliente: cliente_telefono || null,
        nombre_proyecto: proyecto_nombre,
        catalogo_id: getCatalogoIdPorProyecto(proyecto_id) ?? null,
        plan_base: PLAN_BASE_PRESUPUESTO[plan_tipo] ?? plan_nombre,
        conjunto: proyecto_nombre,
        seleccionados: {},
        items_plan_estado: {},
        items_ocultos: [],
        items_manuales: items_manuales ?? [],
        aplica_iva: false,
        // Antes se guardaba acá "Generado automáticamente desde el
        // configurador web (sin intervención de un asesor)." — `notas` es
        // el mismo campo "Notas y condiciones" que ve el cliente en /p/[token]
        // y en el PDF (lo edita un asesor a mano en presupuesto-manual), no
        // un marcador interno; ese texto solo restaba profesionalismo frente
        // al cliente sin cumplir ninguna función real. Bug real reportado
        // por Javier 2026-08-10.
        notas: "",
        precios_snapshot: {},
        pdf_url: pdf_url ?? null,
        token_publico,
      });
      if (pptoError) {
        console.error("Error insertando presupuesto:", pptoError);
        token_publico = null;
      }
    }

    return NextResponse.json({ success: true, cotizacion_id: cotizacion.id, token_publico });
  } catch (error) {
    console.error("Error en /api/cotizacion:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { numero_cotizacion, estado_crm } = await request.json();

    if (!numero_cotizacion || !estado_crm) {
      return NextResponse.json({ error: "Faltan numero_cotizacion y estado_crm" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("cotizaciones")
      .update({ estado_crm })
      .eq("numero_cotizacion", numero_cotizacion);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/cotizacion:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
