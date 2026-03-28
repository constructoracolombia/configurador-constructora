"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatoPrecio } from "@/lib/utils/format";

interface HitoProyecto {
  id: string;
  nombre: string;
  telefono: string | null;
  nombre_proyecto: string | null;
  fecha_entrega_apartamento: string;
  etapa: string;
  presupuesto_estimado: number | null;
}

function mesIndexDesdeFecha(fechaStr: string): number | null {
  const raw = fechaStr.split("T")[0];
  const parts = raw.split("-");
  if (parts.length !== 3) return null;
  const m = Number(parts[1]);
  if (Number.isNaN(m) || m < 1 || m > 12) return null;
  return m - 1;
}

function diaDesdeFecha(fechaStr: string): number {
  const raw = fechaStr.split("T")[0];
  const d = Number(raw.split("-")[2]);
  return Number.isNaN(d) ? 1 : d;
}

type CalendarioAnualProps = {
  /** Se incrementa tras recargar leads en el padre para refrescar hitos. */
  refreshKey?: number;
};

export default function CalendarioAnual({ refreshKey = 0 }: CalendarioAnualProps) {
  const [anoActual, setAnoActual] = useState(new Date().getFullYear());
  const [hitos, setHitos] = useState<HitoProyecto[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  useEffect(() => {
    void cargarHitos();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- año o recarga explícita desde el padre
  }, [anoActual, refreshKey]);

  const cargarHitos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id, nombre, telefono, nombre_proyecto, fecha_entrega_apartamento, etapa, presupuesto_estimado"
        )
        .is("deleted_at", null)
        .not("fecha_entrega_apartamento", "is", null)
        .gte("fecha_entrega_apartamento", `${anoActual}-01-01`)
        .lte("fecha_entrega_apartamento", `${anoActual}-12-31`)
        .order("fecha_entrega_apartamento", { ascending: true });

      if (error) throw error;
      setHitos((data as HitoProyecto[]) || []);
    } catch (error) {
      console.error("Error cargando hitos:", error);
    } finally {
      setCargando(false);
    }
  };

  const getHitosPorMes = (mes: number) => {
    return hitos.filter((h) => mesIndexDesdeFecha(h.fecha_entrega_apartamento) === mes);
  };

  const getColorEtapa = (etapa: string) => {
    const key = (etapa || "").toUpperCase();
    const colores: Record<string, string> = {
      PROSPECCION: "bg-blue-500",
      PRIMER_CONTACTO: "bg-purple-500",
      REUNION: "bg-yellow-500",
      PRESENTACION: "bg-yellow-500",
      COTIZACION_ENVIADA: "bg-orange-500",
      COTIZACION: "bg-orange-500",
      NEGOCIACION: "bg-teal-500",
      CIERRE: "bg-green-500",
    };
    return colores[key] || "bg-gray-500";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <span className="text-3xl">📅</span>
              Calendario de Entregas
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {hitos.length} entregas programadas para {anoActual}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnoActual(anoActual - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
            >
              ←
            </button>
            <div className="rounded-lg bg-blue-50 px-4 py-2 font-bold text-blue-700">
              {anoActual}
            </div>
            <button
              type="button"
              onClick={() => setAnoActual(anoActual + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {cargando ? (
          <div className="py-12 text-center text-gray-500">Cargando calendario...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {meses.map((mes, index) => {
              const hitosMes = getHitosPorMes(index);
              const tieneHitos = hitosMes.length > 0;

              return (
                <div
                  key={mes}
                  role="button"
                  tabIndex={0}
                  onClick={() => setMesSeleccionado(mesSeleccionado === index ? null : index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMesSeleccionado(mesSeleccionado === index ? null : index);
                    }
                  }}
                  className={`
                    cursor-pointer rounded-xl border-2 p-4 transition-all
                    ${
                      tieneHitos
                        ? "border-blue-300 bg-blue-50 hover:border-blue-500 hover:shadow-md"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }
                    ${mesSeleccionado === index ? "shadow-lg ring-2 ring-blue-500" : ""}
                  `}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-bold text-gray-900">{mes}</div>
                    {tieneHitos && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {hitosMes.length}
                      </div>
                    )}
                  </div>

                  {hitosMes.length > 0 && (
                    <div className="space-y-2">
                      {hitosMes.slice(0, 3).map((hito) => (
                        <div
                          key={hito.id}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-xs"
                        >
                          <div className="truncate font-medium text-gray-900">{hito.nombre}</div>
                          <div className="truncate text-gray-600">
                            {hito.nombre_proyecto || "—"}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <div className={`h-2 w-2 rounded-full ${getColorEtapa(hito.etapa)}`} />
                            <span className="text-gray-500">
                              {diaDesdeFecha(hito.fecha_entrega_apartamento)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {hitosMes.length > 3 && (
                        <div className="text-center text-xs font-medium text-blue-600">
                          +{hitosMes.length - 3} más
                        </div>
                      )}
                    </div>
                  )}

                  {hitosMes.length === 0 && (
                    <div className="py-4 text-center text-xs text-gray-400">Sin entregas</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {mesSeleccionado !== null && (
          <div className="mt-6 rounded-2xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                📍 Entregas en {meses[mesSeleccionado]} {anoActual}
              </h3>
              <button
                type="button"
                onClick={() => setMesSeleccionado(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {getHitosPorMes(mesSeleccionado).map((hito) => (
                <div
                  key={hito.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 text-lg font-bold text-gray-900">{hito.nombre}</div>
                      <div className="mb-2 text-sm text-gray-600">
                        📱 {hito.telefono || "—"}
                      </div>
                      <div className="text-sm text-gray-600">
                        📍 {hito.nombre_proyecto || "Proyecto no especificado"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium text-white ${getColorEtapa(hito.etapa)}`}
                      >
                        {hito.etapa.replace(/_/g, " ")}
                      </div>
                      {(hito.presupuesto_estimado ?? 0) > 0 && (
                        <div className="text-sm font-bold text-green-600">
                          {formatoPrecio(hito.presupuesto_estimado ?? 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-200 pt-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <div className="text-xs text-gray-500">Fecha de entrega</div>
                      <div className="font-bold text-gray-900">
                        {new Date(hito.fecha_entrega_apartamento + "T12:00:00").toLocaleDateString(
                          "es-CO",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
