// POST /api/track-view — registra apertura de presupuesto público (service role)

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { id?: string; visto_primera_vez?: string; veces_visto?: number };
    const { id, visto_primera_vez, veces_visto } = body;

    console.log("[track-view] body recibido:", JSON.stringify({ id, veces_visto }));

    if (!id) {
      console.error("[track-view] Falta id en el body");
      return NextResponse.json({ error: "Falta id del presupuesto" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const nuevoConteo = (veces_visto ?? 0) + 1;

    console.log(`[track-view] UPDATE presupuestos SET veces_visto=${nuevoConteo} WHERE id=${id}`);

    const { error, count } = await supabaseAdmin
      .from("presupuestos")
      .update({
        visto_primera_vez: visto_primera_vez ?? now,
        visto_ultima_vez: now,
        veces_visto: nuevoConteo,
      })
      .eq("id", id);

    if (error) {
      console.error("[track-view] Error Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[track-view] OK — veces_visto actualizado a ${nuevoConteo}`);
    return NextResponse.json({ success: true, veces_visto: nuevoConteo });
  } catch (error) {
    console.error("[track-view] Error interno:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
