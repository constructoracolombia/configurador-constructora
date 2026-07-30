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
//
// El nombre se lee EN VIVO de catalogo_items.nombre (join por FK
// catalogo_item_id) en vez de la columna `nombre` propia de esta tabla —
// así, si Javier renombra el ítem en Finanzas, /personalizar lo refleja
// sin ningún paso extra. `nombre` sigue existiendo en la tabla solo como
// respaldo por si el ítem de catálogo se borra (catalogo_item_id queda
// null).
type FilaCustom = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  imagen_url: string | null;
  catalogo_items: { nombre: string; codigo: string | null } | { nombre: string; codigo: string | null }[] | null;
};

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
      .select("id, nombre, descripcion, categoria, imagen_url, catalogo_items(nombre, codigo)")
      .eq("catalogo_id", catalogoId)
      .then(({ data, error }) => {
        if (cancelado || error || !data) return;
        setProductos(
          (data as FilaCustom[]).map((r) => {
            const catalogoItem = Array.isArray(r.catalogo_items) ? r.catalogo_items[0] : r.catalogo_items;
            const nombreBase = catalogoItem?.nombre || r.nombre;
            // Prefijo con el código de catálogo (ej. "42 · Mesón granito
            // cocina") para poder cruzar con Finanzas de un vistazo — solo
            // aplica a estos productos custom, los únicos con un código
            // de catálogo vinculado en vivo.
            const nombre = catalogoItem?.codigo ? `${catalogoItem.codigo} · ${nombreBase}` : nombreBase;
            return {
              id: r.id,
              nombre,
              descripcion: r.descripcion || "",
              precio: 0,
              categoria: r.categoria,
              // Sin foto todavía (imagen_url null) -> ImagenOptimizada cae
              // a su placeholder de placehold.co con el nombre del ítem.
              imagen: r.imagen_url || "",
            };
          })
        );
      });
    return () => {
      cancelado = true;
    };
  }, [catalogoId]);

  return productos;
}
