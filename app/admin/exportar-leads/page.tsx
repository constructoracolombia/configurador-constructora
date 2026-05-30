"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

function limpiarTelefono(raw: string | null): string {
  if (!raw) return "";
  // Eliminar todo excepto dígitos y el símbolo +
  let t = raw.replace(/[\s\-().]/g, "");
  // Si ya empieza con + dejarlo, normalizar a solo dígitos
  if (t.startsWith("+")) {
    t = t.slice(1);
  } else if (t.startsWith("57") && t.length > 10) {
    // Ya tiene prefijo 57, dejarlo
  } else if (t.startsWith("3") && t.length === 10) {
    t = "57" + t;
  }
  return t;
}

function primerNombre(nombre: string | null): string {
  if (!nombre) return "";
  return nombre.trim().split(/\s+/)[0] ?? "";
}

export default function ExportarLeadsPage() {
  const [total, setTotal] = useState<number | null>(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    void contarLeads();
  }, []);

  const contarLeads = async () => {
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .not("etapa", "in", '("PERDIDO","DESCALIFICADO")');
    setTotal(count ?? 0);
  };

  const descargarCSV = async () => {
    setDescargando(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("nombre, telefono, email")
        .not("etapa", "in", '("PERDIDO","DESCALIFICADO")');

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("No hay leads activos para exportar.");
        return;
      }

      const filas = data
        .map((lead) => {
          const phone = limpiarTelefono(lead.telefono);
          const email = lead.email ?? "";
          const fn = primerNombre(lead.nombre);
          return `${phone},${email},${fn}`;
        })
        .filter((fila) => fila !== ",,");

      const csv = ["phone,email,fn", ...filas].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const fecha = new Date().toISOString().split("T")[0];
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_meta_audience_${fecha}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error al exportar: ${err.message}`);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Exportar audiencia para Meta Ads
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Genera el CSV para subir como audiencia personalizada en Meta Ads Manager
        </p>

        <div className="mb-6 rounded-xl bg-green-50 px-6 py-4 text-center">
          <div className="text-4xl font-bold text-green-700">
            {total === null ? "..." : total}
          </div>
          <div className="mt-1 text-sm text-green-600">
            leads activos que se exportarán
          </div>
        </div>

        <button
          onClick={() => void descargarCSV()}
          disabled={descargando || total === 0}
          className="w-full rounded-xl bg-green-600 py-3 text-base font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {descargando ? "Generando CSV..." : "Descargar CSV para Meta Ads"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          Columnas exportadas: phone · email · fn (primer nombre)
        </p>
      </div>
    </div>
  );
}
