"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatoPrecio } from "@/lib/utils/format";

type LeadRow = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  etapa: string;
  tipo_proyecto: string | null;
  nombre_proyecto: string | null;
  presupuesto_estimado: number | null;
  observaciones: string | null;
  fecha_entrega_apartamento: string | null;
  updated_at: string | null;
  created_at: string | null;
};

export default function Entrega2027Page() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const cargarLeadsEntrega2027 = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .gte("fecha_entrega_apartamento", "2027-01-01")
        .lt("fecha_entrega_apartamento", "2028-01-01")
        .is("deleted_at", null)
        .order("fecha_entrega_apartamento", { ascending: true });

      if (error) throw error;
      setLeads((data || []) as LeadRow[]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargarLeadsEntrega2027(); }, [cargarLeadsEntrega2027]);

  const leadsFiltrados = leads.filter((lead) => {
    if (!busqueda.trim()) return true;
    const termino = busqueda.toLowerCase();
    return (
      lead.nombre?.toLowerCase().includes(termino) ||
      lead.telefono?.includes(termino) ||
      lead.email?.toLowerCase().includes(termino) ||
      lead.nombre_proyecto?.toLowerCase().includes(termino)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📅 Entrega 2027</h1>
            <p className="mt-1 text-gray-600">{leadsFiltrados.length} leads con entrega de apartamento en 2027</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg bg-gray-200 px-4 py-2 transition-colors hover:bg-gray-300"
          >
            ← Volver al Dashboard
          </button>
        </div>

        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-lg text-gray-400">🔍</span>
              </div>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, teléfono, email, proyecto..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {cargando ? (
          <div className="py-12 text-center text-gray-500">Cargando...</div>
        ) : leadsFiltrados.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-6xl">📭</div>
              <div className="mb-2 text-xl font-semibold text-gray-900">
                No hay leads con entrega en 2027
              </div>
              <div className="text-gray-600">
                {busqueda
                  ? "No se encontraron resultados"
                  : "Los leads con fecha de entrega de apartamento en 2027 aparecerán aquí"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leadsFiltrados.map((lead) => (
              <Card
                key={lead.id}
                className="border-0 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 font-bold text-gray-900">{lead.nombre}</div>
                      <div className="text-sm text-gray-600">📱 {lead.telefono}</div>
                      {lead.email && (
                        <div className="text-sm text-gray-600">📧 {lead.email}</div>
                      )}
                    </div>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {lead.etapa}
                    </span>
                  </div>

                  {lead.tipo_proyecto && (
                    <div className="mb-2">
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                        {lead.tipo_proyecto}
                      </span>
                    </div>
                  )}

                  {lead.nombre_proyecto && (
                    <div className="mb-2 text-sm text-gray-600">
                      📍 {lead.nombre_proyecto}
                    </div>
                  )}

                  {lead.presupuesto_estimado != null && Number(lead.presupuesto_estimado) > 0 && (
                    <div className="mb-2 text-sm font-semibold text-gray-900">
                      💰 {formatoPrecio(Number(lead.presupuesto_estimado))}
                    </div>
                  )}

                  {lead.fecha_entrega_apartamento && (
                    <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-800">
                      📅 Entrega:{" "}
                      {new Date(lead.fecha_entrega_apartamento + "T12:00:00").toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  )}

                  {lead.observaciones && (
                    <div className="mb-3 line-clamp-2 rounded border-l-2 border-gray-300 bg-gray-50 p-2 text-xs text-gray-500">
                      {lead.observaciones}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
