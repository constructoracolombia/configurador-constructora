"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  updated_at: string | null;
  created_at: string | null;
};

export default function NoCerradosPage() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [leadsNoCerrados, setLeadsNoCerrados] = useState<LeadRow[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const cargarLeadsNoCerrados = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("etapa", ["PERDIDO", "DESCALIFICADO"])
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setLeadsNoCerrados((data || []) as LeadRow[]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin_auth") === "true") {
      setAutenticado(true);
      void cargarLeadsNoCerrados();
    }
  }, [cargarLeadsNoCerrados]);

  const verificarPassword = () => {
    if (password === "admin2026") {
      localStorage.setItem("admin_auth", "true");
      setAutenticado(true);
      void cargarLeadsNoCerrados();
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const reactivarLead = async (lead: LeadRow) => {
    const confirmacion = confirm(
      `¿Reactivar este lead?\n\n` +
        `${lead.nombre}\n\n` +
        `Se moverá a PROSPECCIÓN.`
    );

    if (!confirmacion) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          etapa: "PROSPECCION",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (error) throw error;

      await supabase.from("lead_actividades").insert({
        lead_id: lead.id,
        tipo: "CAMBIO_ETAPA",
        descripcion: "Lead reactivado desde No Cerrados",
        usuario: "Admin",
      });

      alert("✅ Lead reactivado");
      await cargarLeadsNoCerrados();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Error: ${msg}`);
    }
  };

  const eliminarPermanentemente = async (lead: LeadRow) => {
    const confirmacion = confirm(
      `⚠️ ¿ELIMINAR PERMANENTEMENTE?\n\n` +
        `${lead.nombre}\n\n` +
        `Esta acción NO se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (error) throw error;

      alert("✅ Lead eliminado permanentemente");
      await cargarLeadsNoCerrados();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Error: ${msg}`);
    }
  };

  const leadsFiltrados = leadsNoCerrados.filter((lead) => {
    if (!busqueda.trim()) return true;
    const termino = busqueda.toLowerCase();
    return (
      lead.nombre?.toLowerCase().includes(termino) ||
      lead.telefono?.includes(termino) ||
      lead.email?.toLowerCase().includes(termino) ||
      lead.nombre_proyecto?.toLowerCase().includes(termino)
    );
  });

  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              🔒 Acceso Restringido
            </CardTitle>
            <p className="mt-2 text-sm text-gray-600">Leads No Cerrados</p>
          </CardHeader>
          <CardContent className="p-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verificarPassword()}
              placeholder="Contraseña"
              className="mb-4 h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={verificarPassword}
              className="h-12 w-full bg-blue-600 hover:bg-blue-700"
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📁 Leads No Cerrados</h1>
            <p className="mt-1 text-gray-600">{leadsFiltrados.length} leads archivados</p>
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
                No hay leads archivados
              </div>
              <div className="text-gray-600">
                {busqueda
                  ? "No se encontraron resultados"
                  : "Los leads no cerrados aparecerán aquí"}
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
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        lead.etapa === "PERDIDO"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {lead.etapa === "PERDIDO" ? "No Cerrado" : "Descalificado"}
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

                  {lead.observaciones && (
                    <div className="mb-3 line-clamp-2 rounded border-l-2 border-gray-300 bg-gray-50 p-2 text-xs text-gray-500">
                      {lead.observaciones}
                    </div>
                  )}

                  <div className="mb-3 text-xs text-gray-400">
                    Archivado:{" "}
                    {new Date(
                      lead.updated_at || lead.created_at || Date.now()
                    ).toLocaleDateString("es-CO")}
                  </div>

                  <div className="flex gap-2 border-t border-gray-200 pt-3">
                    <button
                      type="button"
                      onClick={() => void reactivarLead(lead)}
                      className="h-9 flex-1 rounded-lg bg-green-600 text-xs font-medium text-white transition-colors hover:bg-green-700"
                    >
                      ↻ Reactivar
                    </button>
                    <button
                      type="button"
                      onClick={() => void eliminarPermanentemente(lead)}
                      className="h-9 rounded-lg bg-red-100 px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                    >
                      🗑️
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
