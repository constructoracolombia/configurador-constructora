'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface LeadGrafica {
  id: string;
  nombre: string;
  etapa: string;
  telefono: string | null;
  nombre_proyecto: string | null;
  ultima_actividad_fecha: string | null;
  fecha_contacto: string | null;
  observaciones: string | null;
  es_caliente: boolean | null;
  presupuesto_estimado: number | null;
}

export default function GraficaSeguimiento() {
  const [leads, setLeads] = useState<LeadGrafica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [leadSeleccionado, setLeadSeleccionado] = useState<LeadGrafica | null>(null);
  const [semanas, setSemanas] = useState<Date[]>([]);

  useEffect(() => {
    cargarLeads();
    generarSemanas();
  }, []);

  const generarSemanas = () => {
    const hoy = new Date();
    const semanasArray: Date[] = [];
    for (let i = -8; i <= 2; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - (fecha.getDay() === 0 ? 6 : fecha.getDay() - 1) + (i * 7));
      fecha.setHours(0, 0, 0, 0);
      semanasArray.push(fecha);
    }
    setSemanas(semanasArray);
  };

  const cargarLeads = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nombre, etapa, telefono, nombre_proyecto, ultima_actividad_fecha, fecha_contacto, observaciones, es_caliente, presupuesto_estimado')
        .is('deleted_at', null)
        .not('etapa', 'in', '("PERDIDO","DESCALIFICADO")')
        .order('ultima_actividad_fecha', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setLeads(data || []);
    } catch {
      // Fallback: si ultima_actividad_fecha no existe aún, cargar sin ese orden
      try {
        const { data } = await supabase
          .from('leads')
          .select('id, nombre, etapa, telefono, nombre_proyecto, fecha_contacto, observaciones, es_caliente, presupuesto_estimado')
          .is('deleted_at', null)
          .not('etapa', 'in', '("PERDIDO","DESCALIFICADO")')
          .order('fecha_contacto', { ascending: false, nullsFirst: false });
        setLeads((data || []).map(l => ({ ...l, ultima_actividad_fecha: null })));
      } catch (err2) {
        console.error('Error cargando leads para gráfica:', err2);
      }
    } finally {
      setCargando(false);
    }
  };

  const getFechaActividad = (lead: LeadGrafica): string => {
    return lead.ultima_actividad_fecha || lead.fecha_contacto || new Date().toISOString();
  };

  const getDiasSinActividad = (lead: LeadGrafica) => {
    const ultimaActividad = new Date(getFechaActividad(lead));
    const hoy = new Date();
    return Math.floor((hoy.getTime() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getSemanaDelLead = (lead: LeadGrafica) => {
    const ultimaActividad = new Date(getFechaActividad(lead));
    ultimaActividad.setHours(0, 0, 0, 0);
    return semanas.findIndex(semana => {
      const fin = new Date(semana);
      fin.setDate(fin.getDate() + 6);
      return ultimaActividad >= semana && ultimaActividad <= fin;
    });
  };

  const esEstaSemana = (semana: Date) => {
    const hoy = new Date();
    const fin = new Date(semana);
    fin.setDate(fin.getDate() + 6);
    return hoy >= semana && hoy <= fin;
  };

  const getColorAlerta = (dias: number) => {
    if (dias <= 3) return 'bg-green-500';
    if (dias <= 7) return 'bg-yellow-500';
    if (dias <= 14) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getColorEtapa = (etapa: string) => {
    const colores: Record<string, string> = {
      'PROSPECCION': 'bg-blue-500',
      'PRIMER_CONTACTO': 'bg-purple-500',
      'REUNION': 'bg-yellow-500',
      'COTIZACION_ENVIADA': 'bg-orange-500',
      'NEGOCIACION': 'bg-teal-500',
      'CIERRE': 'bg-green-500',
    };
    return colores[etapa] || 'bg-gray-500';
  };

  const formatoFecha = (fecha: Date) =>
    fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

  if (cargando) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="text-gray-500">Cargando gráfica de seguimiento...</div>
      </div>
    );
  }

  const semanaActualIdx = semanas.findIndex(esEstaSemana);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <span className="text-3xl">📊</span>
              Timeline de Seguimiento
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {leads.length} leads activos en el flujo comercial
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {[
              { color: 'bg-green-500', label: '0-3 días' },
              { color: 'bg-yellow-500', label: '4-7 días' },
              { color: 'bg-orange-500', label: '8-14 días' },
              { color: 'bg-red-500', label: '+15 días' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${color}`} />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfica */}
      <div className="overflow-x-auto p-6">
        <div className="min-w-[1100px]">
          {/* Header de semanas */}
          <div className="mb-4 flex">
            <div className="w-48 flex-shrink-0" />
            <div className="flex flex-1">
              {semanas.map((semana, index) => {
                const esActual = esEstaSemana(semana);
                return (
                  <div
                    key={index}
                    className={`flex-1 border-b-2 pb-2 text-center ${esActual ? 'border-blue-500' : 'border-gray-200'}`}
                  >
                    <div className={`text-xs font-medium ${esActual ? 'text-blue-600' : 'text-gray-600'}`}>
                      {formatoFecha(semana)}
                    </div>
                    {esActual && (
                      <div className="mt-1 text-[10px] font-bold text-blue-600">ESTA SEMANA</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filas de leads */}
          <div className="space-y-3">
            {leads.map(lead => {
              const semanaIndex = getSemanaDelLead(lead);
              const dias = getDiasSinActividad(lead);

              return (
                <div
                  key={lead.id}
                  className="group flex items-center rounded-lg transition-colors hover:bg-gray-50"
                >
                  {/* Info del lead */}
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="flex items-center gap-2">
                      {lead.es_caliente && (
                        <span className="animate-pulse text-sm text-red-500">🔥</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-900">{lead.nombre}</div>
                        <div className="truncate text-xs text-gray-500">{lead.telefono || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative flex h-12 flex-1 items-center">
                    {/* Columnas de semana */}
                    <div className="absolute inset-0 flex">
                      {semanas.map((s, index) => (
                        <div
                          key={index}
                          className={`flex-1 border-r ${
                            esEstaSemana(s) ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Línea desde punto hasta semana actual */}
                    {semanaIndex >= 0 && semanaIndex < semanas.length && semanaActualIdx > semanaIndex && (
                      <div
                        className={`absolute h-0.5 opacity-20 ${getColorAlerta(dias)}`}
                        style={{
                          left: `${((semanaIndex + 0.5) / semanas.length) * 100}%`,
                          width: `${((semanaActualIdx - semanaIndex) / semanas.length) * 100}%`,
                        }}
                      />
                    )}

                    {/* Punto de actividad */}
                    {semanaIndex >= 0 && semanaIndex < semanas.length && (
                      <div
                        className="absolute flex items-center justify-center"
                        style={{
                          left: `${((semanaIndex + 0.5) / semanas.length) * 100}%`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <button
                          onClick={() => setLeadSeleccionado(lead)}
                          className="group/dot relative z-10"
                        >
                          <div
                            className={`h-6 w-6 rounded-full border-4 border-white shadow-lg transition-transform group-hover/dot:scale-150 ${getColorAlerta(dias)}`}
                          />
                          <div
                            className={`absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover/dot:opacity-100 ${getColorEtapa(lead.etapa)}`}
                          >
                            {lead.etapa.replace(/_/g, ' ')}
                          </div>
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/dot:opacity-100">
                            {dias}d sin actividad
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {leadSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  {leadSeleccionado.es_caliente && <span className="animate-pulse text-2xl">🔥</span>}
                  <h3 className="text-2xl font-bold text-gray-900">{leadSeleccionado.nombre}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>📱 {leadSeleccionado.telefono || '—'}</span>
                  {leadSeleccionado.nombre_proyecto && (
                    <span>📍 {leadSeleccionado.nombre_proyecto}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setLeadSeleccionado(null)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <div className="mb-1 text-sm font-medium text-blue-600">Última Actividad</div>
                <div className="text-lg font-bold text-blue-900">
                  Hace {getDiasSinActividad(leadSeleccionado)} días
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  {new Date(getFechaActividad(leadSeleccionado)).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4">
                <div className="mb-1 text-sm font-medium text-green-600">Presupuesto</div>
                <div className="text-lg font-bold text-green-900">
                  {leadSeleccionado.presupuesto_estimado
                    ? `$ ${leadSeleccionado.presupuesto_estimado.toLocaleString('es-CO')}`
                    : 'No definido'}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-2 text-sm font-medium text-gray-600">Etapa Actual</div>
              <div className={`inline-block rounded-lg px-4 py-2 font-medium text-white ${getColorEtapa(leadSeleccionado.etapa)}`}>
                {leadSeleccionado.etapa.replace(/_/g, ' ')}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-gray-600">Historial de Seguimiento</div>
              <div className="max-h-60 overflow-y-auto rounded-xl bg-gray-50 p-4">
                {leadSeleccionado.observaciones ? (
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {leadSeleccionado.observaciones}
                  </div>
                ) : (
                  <div className="text-sm italic text-gray-400">No hay observaciones registradas</div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  window.location.href = `/?lead=${leadSeleccionado.id}`;
                }}
                className="h-11 flex-1 rounded-lg bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Ver en Flujo
              </button>
              <button
                onClick={() => setLeadSeleccionado(null)}
                className="h-11 rounded-lg bg-gray-200 px-6 font-medium text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
