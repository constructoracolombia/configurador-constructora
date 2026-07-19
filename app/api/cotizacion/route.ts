// POST  /api/cotizacion — crea cotización + lead desde /resumen (service role)
// PATCH /api/cotizacion — actualiza estado_crm de una cotización por numero_cotizacion

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    const { error: leadError } = await supabaseAdmin.from("leads").insert({
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
    });

    if (leadError) {
      console.error("Error insertando lead:", leadError);
    }

    return NextResponse.json({ success: true, cotizacion_id: cotizacion.id });
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
