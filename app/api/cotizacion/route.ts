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

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert({
        nombre: cliente_nombre,
        telefono: cliente_telefono || "Sin teléfono",
        email: cliente_email,
        proyecto: proyecto_nombre,
        presupuesto_estimado,
        fuente: fuente ?? "WEB",
        origen: origen ?? "WEB",
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
        notas: "Generado automáticamente desde el configurador web (sin intervención de un asesor).",
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
