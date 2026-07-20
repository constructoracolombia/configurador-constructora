"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// ─── tipos ────────────────────────────────────────────────────────────────────

type ApuCalc = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  unidad: string | null;
  mdo: number;
  ai_porcentaje: number;
  costo_materiales: number;
  costo_directo: number;
  costo_apu: number;
  updated_at: string;
};

type Material = {
  id: string;
  apu_id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  valor_unitario: number;
  orden: number;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const cop = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CO");

// ─── componente ───────────────────────────────────────────────────────────────

export default function ApusPage() {
  const [apus, setApus] = useState<ApuCalc[]>([]);
  const [utilidadPct, setUtilidadPct] = useState(20);
  const [utilidadDraft, setUtilidadDraft] = useState("20");
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // edición de APU
  const [apuEdit, setApuEdit] = useState<ApuCalc | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [mdo, setMdo] = useState("");
  const [guardandoApu, setGuardandoApu] = useState(false);

  // nuevo material en el editor
  const [nuevoMat, setNuevoMat] = useState({
    nombre: "",
    unidad: "und",
    cantidad: "",
    valor_unitario: "",
  });

  // preview del % global
  const utilidadPreview = parseFloat(utilidadDraft) || utilidadPct;
  const previewActivo =
    !isNaN(parseFloat(utilidadDraft)) &&
    parseFloat(utilidadDraft) !== utilidadPct;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── carga inicial ──────────────────────────────────────────────────────────

  const cargarApus = async () => {
    const { data } = await supabase
      .from("v_apus_calculados")
      .select("*")
      .order("codigo")
      .order("nombre");
    setApus((data as ApuCalc[]) || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [{ data: configData }] = await Promise.all([
        supabase.from("config_precios").select("utilidad_pct").single(),
        cargarApus(),
      ]);
      if (configData) {
        const pct = Number(configData.utilidad_pct);
        setUtilidadPct(pct);
        setUtilidadDraft(String(pct));
      }
      setLoading(false);
    };
    void init();
  }, []);

  // ── guardar % global ───────────────────────────────────────────────────────

  const guardarUtilidad = async () => {
    const pct = parseFloat(utilidadDraft);
    if (isNaN(pct) || pct < 0 || pct > 200) {
      showToast("⚠️ Ingresa un porcentaje válido (0–200)");
      return;
    }
    setGuardandoConfig(true);
    const { error } = await supabase
      .from("config_precios")
      .update({ utilidad_pct: pct })
      .eq("id", true);
    if (error) {
      showToast("❌ Error al guardar: " + error.message);
    } else {
      setUtilidadPct(pct);
      showToast("✅ % utilidad actualizado a " + pct + "%");
    }
    setGuardandoConfig(false);
  };

  // ── abrir editor de APU ────────────────────────────────────────────────────

  const abrirApu = async (apu: ApuCalc) => {
    setApuEdit(apu);
    setMdo(String(apu.mdo));
    const { data } = await supabase
      .from("apu_materiales")
      .select("*")
      .eq("apu_id", apu.id)
      .order("orden");
    setMateriales((data as Material[]) || []);
    setNuevoMat({ nombre: "", unidad: "und", cantidad: "", valor_unitario: "" });
  };

  const cerrarEditor = () => {
    setApuEdit(null);
    setMateriales([]);
  };

  // ── edición inline de material ─────────────────────────────────────────────

  const editarMaterial = (idx: number, campo: keyof Material, valor: string) => {
    setMateriales((prev) =>
      prev.map((m, i) =>
        i === idx
          ? { ...m, [campo]: campo === "nombre" || campo === "unidad" ? valor : Number(valor) }
          : m
      )
    );
  };

  const eliminarMaterial = (idx: number) => {
    setMateriales((prev) => prev.filter((_, i) => i !== idx));
  };

  const agregarMaterial = () => {
    if (!nuevoMat.nombre.trim()) return;
    const nuevo: Material = {
      id: `temp_${Date.now()}`,
      apu_id: apuEdit!.id,
      nombre: nuevoMat.nombre.trim(),
      unidad: nuevoMat.unidad || "und",
      cantidad: parseFloat(nuevoMat.cantidad) || 0,
      valor_unitario: parseFloat(nuevoMat.valor_unitario) || 0,
      orden: materiales.length,
    };
    setMateriales((prev) => [...prev, nuevo]);
    setNuevoMat({ nombre: "", unidad: "und", cantidad: "", valor_unitario: "" });
  };

  // ── guardar APU (MDO + materiales) ────────────────────────────────────────

  const guardarApu = async () => {
    if (!apuEdit) return;
    setGuardandoApu(true);
    try {
      // 1. Actualizar MDO
      const { error: errApu } = await supabase
        .from("apus")
        .update({ mdo: parseFloat(mdo) || 0 })
        .eq("id", apuEdit.id);
      if (errApu) throw errApu;

      // 2. Borrar materiales existentes y reinsertarlos
      const { error: errDel } = await supabase
        .from("apu_materiales")
        .delete()
        .eq("apu_id", apuEdit.id);
      if (errDel) throw errDel;

      const materialesValidos = materiales.filter((m) => m.nombre.trim());
      if (materialesValidos.length > 0) {
        const payload = materialesValidos.map((m, i) => ({
          apu_id: apuEdit.id,
          nombre: m.nombre,
          unidad: m.unidad,
          cantidad: m.cantidad,
          valor_unitario: m.valor_unitario,
          orden: i,
        }));
        const { error: errIns } = await supabase
          .from("apu_materiales")
          .insert(payload);
        if (errIns) throw errIns;
      }

      showToast("✅ APU guardado");
      cerrarEditor();
      await cargarApus();
    } catch (err: any) {
      showToast("❌ Error: " + err.message);
    } finally {
      setGuardandoApu(false);
    }
  };

  // ── cálculo local del costo mientras se edita ──────────────────────────────

  const costoMaterialesLocal = materiales.reduce(
    (s, m) => s + m.cantidad * m.valor_unitario,
    0
  );
  const mdoNum = parseFloat(mdo) || 0;
  const costoDirectoLocal = costoMaterialesLocal + mdoNum;
  const costoApuLocal = Math.round(
    costoDirectoLocal * (1 + (apuEdit?.ai_porcentaje ?? 10) / 100)
  );
  const precioVentaLocal = Math.round(costoApuLocal * (1 + utilidadPct / 100));

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* header */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">APUs</h1>
            <p className="text-xs text-gray-500">Análisis de Precios Unitarios — {apus.length} registros</p>
          </div>

          {/* % utilidad global */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
            <span className="text-sm font-medium text-gray-700">% Utilidad global</span>
            <input
              type="number"
              min={0}
              max={200}
              step={0.5}
              value={utilidadDraft}
              onChange={(e) => setUtilidadDraft(e.target.value)}
              className="h-8 w-20 rounded-lg border border-gray-300 px-2 text-center text-sm font-bold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-500">%</span>
            <button
              onClick={() => void guardarUtilidad()}
              disabled={guardandoConfig || !previewActivo}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-300"
            >
              {guardandoConfig ? "Guardando…" : "Aplicar"}
            </button>
          </div>
        </div>

        {/* banner preview del % */}
        {previewActivo && (
          <div className="mx-auto mt-2 max-w-5xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            <strong>Preview:</strong> cambiará el % de <strong>{utilidadPct}%</strong> a{" "}
            <strong>{utilidadPreview}%</strong>. Los presupuestos <em>ya guardados</em> no se afectan
            (usan su snapshot). Solo afecta presupuestos nuevos y la pantalla de configurador.
          </div>
        )}
      </div>

      {/* lista de APUs */}
      <div className="mx-auto max-w-5xl px-6 pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            Cargando APUs…
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500">
                  <th className="px-4 py-3">Cód.</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3 text-right">Materiales</th>
                  <th className="px-4 py-3 text-right">MDO</th>
                  <th className="px-4 py-3 text-right">Costo directo</th>
                  <th className="px-4 py-3 text-right">Costo APU</th>
                  <th className="px-4 py-3 text-right">
                    Precio venta
                    <span className="ml-1 font-normal text-gray-400">(+{utilidadPreview}%)</span>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {apus.map((apu) => {
                  const precioVenta = Math.round(apu.costo_apu * (1 + utilidadPreview / 100));
                  const precioActual = Math.round(apu.costo_apu * (1 + utilidadPct / 100));
                  return (
                    <tr key={apu.id} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{apu.codigo}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{apu.nombre}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{cop(apu.costo_materiales)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{cop(apu.mdo)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{cop(apu.costo_directo)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{cop(apu.costo_apu)}</td>
                      <td className="px-4 py-3 text-right">
                        {previewActivo ? (
                          <span className="flex flex-col items-end gap-0.5">
                            <span className="text-xs text-gray-400 line-through">{cop(precioActual)}</span>
                            <span className="font-bold text-emerald-700">{cop(precioVenta)}</span>
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700">{cop(precioVenta)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void abrirApu(apu)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* panel de edición lateral */}
      {apuEdit && (
        <div className="fixed inset-0 z-40 flex">
          {/* overlay */}
          <div
            className="flex-1 bg-black/40"
            onClick={cerrarEditor}
          />

          {/* drawer */}
          <div className="relative flex w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
            {/* header del drawer */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <span className="font-mono text-xs text-gray-400">{apuEdit.codigo}</span>
                <h2 className="text-base font-bold text-gray-900">{apuEdit.nombre}</h2>
              </div>
              <button
                onClick={cerrarEditor}
                className="ml-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* cuerpo */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* MDO */}
              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                  MANO DE OBRA (MDO)
                </label>
                <input
                  type="number"
                  min={0}
                  value={mdo}
                  onChange={(e) => setMdo(e.target.value)}
                  className="h-9 w-48 rounded-lg border border-gray-300 px-3 text-right text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* materiales */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">MATERIALES</span>
                  <span className="text-xs text-gray-400">{materiales.length} ítems</span>
                </div>

                {materiales.length > 0 && (
                  <table className="mb-3 w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-400">
                        <th className="pb-2 pr-2">Nombre</th>
                        <th className="pb-2 pr-2 w-16">Unidad</th>
                        <th className="pb-2 pr-2 w-20 text-right">Cantidad</th>
                        <th className="pb-2 pr-2 w-24 text-right">Vlr. Unit.</th>
                        <th className="pb-2 w-20 text-right">Total</th>
                        <th className="pb-2 w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {materiales.map((mat, idx) => (
                        <tr key={mat.id}>
                          <td className="py-1.5 pr-2">
                            <input
                              value={mat.nombre}
                              onChange={(e) => editarMaterial(idx, "nombre", e.target.value)}
                              className="w-full rounded border border-transparent px-1.5 py-1 text-gray-900 hover:border-gray-200 focus:border-emerald-400 focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              value={mat.unidad}
                              onChange={(e) => editarMaterial(idx, "unidad", e.target.value)}
                              className="w-full rounded border border-transparent px-1.5 py-1 text-gray-600 hover:border-gray-200 focus:border-emerald-400 focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={mat.cantidad}
                              onChange={(e) => editarMaterial(idx, "cantidad", e.target.value)}
                              className="w-full rounded border border-transparent px-1.5 py-1 text-right text-gray-900 hover:border-gray-200 focus:border-emerald-400 focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={mat.valor_unitario}
                              onChange={(e) => editarMaterial(idx, "valor_unitario", e.target.value)}
                              className="w-full rounded border border-transparent px-1.5 py-1 text-right text-gray-900 hover:border-gray-200 focus:border-emerald-400 focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 pr-2 text-right text-gray-500">
                            {cop(mat.cantidad * mat.valor_unitario)}
                          </td>
                          <td className="py-1.5 text-center">
                            <button
                              onClick={() => eliminarMaterial(idx)}
                              className="text-gray-300 hover:text-red-400"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* fila de nuevo material */}
                <div className="rounded-lg border border-dashed border-gray-200 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-400">+ Agregar material</p>
                  <div className="flex gap-2">
                    <input
                      placeholder="Nombre"
                      value={nuevoMat.nombre}
                      onChange={(e) => setNuevoMat((p) => ({ ...p, nombre: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-400 focus:outline-none"
                    />
                    <input
                      placeholder="Unidad"
                      value={nuevoMat.unidad}
                      onChange={(e) => setNuevoMat((p) => ({ ...p, unidad: e.target.value }))}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 focus:border-emerald-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Cant."
                      value={nuevoMat.cantidad}
                      onChange={(e) => setNuevoMat((p) => ({ ...p, cantidad: e.target.value }))}
                      className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-right text-xs text-gray-900 focus:border-emerald-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Vlr."
                      value={nuevoMat.valor_unitario}
                      onChange={(e) => setNuevoMat((p) => ({ ...p, valor_unitario: e.target.value }))}
                      className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-right text-xs text-gray-900 focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                      onClick={agregarMaterial}
                      disabled={!nuevoMat.nombre.trim()}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* footer del drawer — costos calculados + guardar */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="mb-4 grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg border border-gray-100 bg-white p-2">
                  <div className="text-gray-400">Materiales</div>
                  <div className="mt-0.5 font-bold text-gray-800">{cop(costoMaterialesLocal)}</div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-2">
                  <div className="text-gray-400">Costo APU (+{apuEdit.ai_porcentaje}% AI)</div>
                  <div className="mt-0.5 font-bold text-gray-800">{cop(costoApuLocal)}</div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                  <div className="text-emerald-600">Precio venta (+{utilidadPct}%)</div>
                  <div className="mt-0.5 font-bold text-emerald-800">{cop(precioVentaLocal)}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cerrarEditor}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void guardarApu()}
                  disabled={guardandoApu}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300"
                >
                  {guardandoApu ? "Guardando…" : "Guardar APU"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
