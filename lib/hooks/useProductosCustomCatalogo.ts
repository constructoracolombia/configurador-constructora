import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Producto } from "@/lib/data/catalogo";

// Productos creados desde /alcance/catalogo/[catalogoId] en Finanzas
// (botón "Crear en Personalizar") para ítems del catálogo que no tenían
// tarjeta equivalente hardcodeada en lib/data/catalogo.ts — viven en la
// tabla personalizar_items_custom (misma instancia de Supabase que
// Finanzas) y se mezclan con el arreglo `adicionales` de siempre en
// /personalizar. El precio real lo sigue resolviendo
// preciosLiveAdicionales (adicional_ppto_id = id de esta tabla), acá solo
// se arma la tarjeta (nombre/categoría/imagen).
export function useProductosCustomCatalogo(catalogoId: string | undefined): Producto[] {
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    let cancelado = false;
    if (!catalogoId) {
      setProductos([]);
      return;
    }
    supabase
      .from("personalizar_items_custom")
      .select("id, nombre, descripcion, categoria, imagen_url")
      .eq("catalogo_id", catalogoId)
      .then(({ data, error }) => {
        if (cancelado || error || !data) return;
        setProductos(
          data.map((r) => ({
            id: r.id,
            nombre: r.nombre,
            descripcion: r.descripcion || "",
            precio: 0,
            categoria: r.categoria,
            imagen: r.imagen_url,
          }))
        );
      });
    return () => {
      cancelado = true;
    };
  }, [catalogoId]);

  return productos;
}
