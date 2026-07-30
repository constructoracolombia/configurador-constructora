import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type CatalogoInfo = { nombre: string; codigo: string | null };

// Nombre y código EN VIVO de cualquier producto de /personalizar (estático
// o creado desde Finanzas) que ya esté vinculado a un catalogo_item —
// query directa a catalogo_items por catalogo_id, sin pasar por
// personalizar_items_custom, para que cubra TAMBIÉN los ~54 productos
// estáticos que ya estaban vinculados desde antes (ej. "porcelanato" ->
// catalogo_items.codigo "3.1"), no solo los creados con el botón "Crear
// en Personalizar". Clave del mapa = adicional_ppto_id (el mismo id que
// ya usa producto.id para resolver el precio en vivo).
export function useCatalogoInfoLive(catalogoId: string | undefined): Map<string, CatalogoInfo> {
  const [mapa, setMapa] = useState<Map<string, CatalogoInfo>>(new Map());

  useEffect(() => {
    let cancelado = false;
    if (!catalogoId) {
      setMapa(new Map());
      return;
    }
    supabase
      .from("catalogo_items")
      .select("adicional_ppto_id, nombre, codigo")
      .eq("catalogo_id", catalogoId)
      .eq("activo", true)
      .not("adicional_ppto_id", "is", null)
      .then(({ data, error }) => {
        if (cancelado || error || !data) return;
        setMapa(
          new Map(
            data
              .filter((r) => r.adicional_ppto_id)
              .map((r) => [r.adicional_ppto_id as string, { nombre: r.nombre, codigo: r.codigo }])
          )
        );
      });
    return () => {
      cancelado = true;
    };
  }, [catalogoId]);

  return mapa;
}
