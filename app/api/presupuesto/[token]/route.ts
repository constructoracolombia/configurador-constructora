// GET /api/presupuesto/[token] — sirve presupuesto + catálogo para /p/[token] (service role)

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const { data: ppto, error } = await supabaseAdmin
    .from("presupuestos")
    .select("*")
    .eq("token_publico", token)
    .single();

  if (error || !ppto) {
    return NextResponse.json(
      { error: "Presupuesto no encontrado o token inválido" },
      { status: 404 }
    );
  }

  const selIds = Object.keys(ppto.seleccionados || {});
  let catItems: Array<{ id: string; nombre: string; codigo: string | null }> = [];

  if (selIds.length > 0) {
    const { data: cats } = await supabaseAdmin
      .from("catalogo_items")
      .select("id, nombre, codigo")
      .in("id", selIds);
    catItems = cats ?? [];
  }

  return NextResponse.json({ presupuesto: ppto, catItems });
}
