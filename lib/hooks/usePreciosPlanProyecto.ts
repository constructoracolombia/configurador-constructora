import { useEffect, useState } from "react";
import {
  getCatalogoIdPorProyecto,
  getPreciosPlanLive,
  getPreciosPlanPorProyecto,
  getPreciosAdicionalesLive,
} from "@/lib/data/catalogo";
import { useCotizador } from "@/lib/store/cotizador";

// Un solo hook para /plan, /personalizar y /resumen: evita que las tres
// páginas (incluida la que arma la cotización final que se envía) muestren
// precios distintos para el mismo proyecto. Además de devolver el precio
// del plan para mostrarlo, sincroniza TODOS los precios en vivo (plan +
// adicionales mapeados) en el store — es lo que leen store.getPrecioPlanBase(),
// getPrecioAdicionales() y getTotal(), usados por /resumen y por el envío
// real de la cotización.
//
// Empieza en el fallback (instantáneo, sin parpadeo de "cargando" para
// proyectos sin catálogo — la mayoría hoy) y, si el proyecto tiene
// catálogo asignado en Finanzas, lo reemplaza por el precio real en cuanto
// llega.
export function usePreciosPlanProyecto(proyectoId: string | null) {
  const catalogoId = getCatalogoIdPorProyecto(proyectoId);
  const fallback = getPreciosPlanPorProyecto(proyectoId);
  const setPreciosLive = useCotizador((s) => s.setPreciosLive);

  const [precios, setPrecios] = useState(fallback);
  const [cargando, setCargando] = useState(!!catalogoId);

  useEffect(() => {
    let cancelado = false;
    if (!catalogoId) {
      setPrecios(getPreciosPlanPorProyecto(proyectoId));
      setCargando(false);
      setPreciosLive(null, {});
      return;
    }
    setCargando(true);
    Promise.all([getPreciosPlanLive(proyectoId), getPreciosAdicionalesLive(proyectoId)]).then(
      ([live, adicionalesLive]) => {
        if (cancelado) return;
        const resuelto = live ?? getPreciosPlanPorProyecto(proyectoId);
        setPrecios(resuelto);
        setCargando(false);
        setPreciosLive(live, adicionalesLive);
      }
    );
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogoId, proyectoId]);

  return { precios, cargando: cargando && !!catalogoId, esLive: !!catalogoId };
}
