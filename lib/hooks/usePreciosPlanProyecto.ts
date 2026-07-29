import { useEffect, useState } from "react";
import {
  getCatalogoIdPorProyecto,
  getPreciosPlanLive,
  getPreciosPlanPorProyecto,
} from "@/lib/data/catalogo";

// Un solo hook para /plan y /personalizar: evita que las dos páginas
// muestren precios distintos para el mismo proyecto (una con el precio en
// vivo y otra con el fallback hardcodeado desincronizado).
//
// Empieza en el fallback (instantáneo, sin parpadeo de "cargando" para
// proyectos sin catálogo — la mayoría hoy) y, si el proyecto tiene
// catálogo asignado en Finanzas, lo reemplaza por el precio real de
// catalogos_precios en cuanto llega.
export function usePreciosPlanProyecto(proyectoId: string | null) {
  const catalogoId = getCatalogoIdPorProyecto(proyectoId);
  const fallback = getPreciosPlanPorProyecto(proyectoId);

  const [precios, setPrecios] = useState(fallback);
  const [cargando, setCargando] = useState(!!catalogoId);

  useEffect(() => {
    let cancelado = false;
    if (!catalogoId) {
      setPrecios(getPreciosPlanPorProyecto(proyectoId));
      setCargando(false);
      return;
    }
    setCargando(true);
    getPreciosPlanLive(proyectoId).then((live) => {
      if (cancelado) return;
      setPrecios(live ?? getPreciosPlanPorProyecto(proyectoId));
      setCargando(false);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogoId, proyectoId]);

  return { precios, cargando: cargando && !!catalogoId, esLive: !!catalogoId };
}
