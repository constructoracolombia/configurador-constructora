"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── tipos ───────────────────────────────────────────────────────────────────

type Catalogo = {
  id: string;
  nombre: string;
};

type CatalogoItem = {
  id: string;
  codigo: string | null;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  valor_venta: number;
};

type Cliente = {
  nombre: string;
  telefono: string;
  proyecto: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const cop = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CO");

const randomSuffix = () =>
  Math.random().toString(36).substring(2, 5).toUpperCase();

const numeroCotizacion = (fecha: string) =>
  "MAN-" + fecha.replace(/-/g, "") + "-" + randomSuffix();

// agrupa items por categoría manteniendo el orden de aparición
const agruparPorCategoria = (items: CatalogoItem[]) => {
  const orden: string[] = [];
  const mapa: Record<string, CatalogoItem[]> = {};
  for (const item of items) {
    if (!mapa[item.categoria]) {
      orden.push(item.categoria);
      mapa[item.categoria] = [];
    }
    mapa[item.categoria].push(item);
  }
  return orden.map((cat) => ({ categoria: cat, items: mapa[cat] }));
};

// ─── componente principal ────────────────────────────────────────────────────

export default function PresupuestoManual() {
  const router = useRouter();

  const [paso, setPaso] = useState(1);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [catalogoId, setCatalogoId] = useState("");
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [seleccionados, setSeleccionados] = useState<Record<string, number>>({});
  const [busqueda, setBusqueda] = useState("");
  const [cliente, setCliente] = useState<Cliente>({ nombre: "", telefono: "", proyecto: "" });
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [aplicaIva, setAplicaIva] = useState(false);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numeroCot] = useState(() => numeroCotizacion(new Date().toISOString().split("T")[0]));
  const [toast, setToast] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [busquedaLead, setBusquedaLead] = useState("");
  const [mostrarDropdownLead, setMostrarDropdownLead] = useState(false);

  // carga catálogos y leads activos al montar
  useEffect(() => {
    const cargar = async () => {
      const [{ data: catData }, { data: leadsData }] = await Promise.all([
        supabase
          .from("catalogos_precios")
          .select("id, nombre")
          .eq("activo", true)
          .order("nombre"),
        supabase
          .from("leads")
          .select("id, nombre, telefono, nombre_proyecto, etapa, tipo_proyecto")
          .not("etapa", "in", '("PERDIDO","DESCALIFICADO")')
          .order("updated_at", { ascending: false })
          .limit(200),
      ]);
      setCatalogos(catData || []);
      setLeads(leadsData || []);
    };
    void cargar();
  }, []);

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ── paso 1 → 2: cargar ítems del catálogo ──────────────────────────────────
  const continuar = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("catalogo_items")
        .select("id, codigo, categoria, nombre, descripcion, valor_venta")
        .eq("catalogo_id", catalogoId)
        .eq("activo", true)
        .order("categoria");
      setItems(data || []);
      setSeleccionados({});
      setPaso(2);
    } finally {
      setLoading(false);
    }
  };

  // ── manejo de selección ────────────────────────────────────────────────────
  const toggleItem = (item: CatalogoItem, checked: boolean) => {
    if (checked) {
      setSeleccionados((prev) => ({ ...prev, [item.id]: 1 }));
    } else {
      setSeleccionados((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  const setCantidad = (id: string, val: string) => {
    const n = Number(val);
    if (n >= 1) setSeleccionados((prev) => ({ ...prev, [id]: n }));
  };

  // ── cálculos ───────────────────────────────────────────────────────────────
  const itemsSeleccionados = items.filter((i) => seleccionados[i.id] !== undefined);

  const subtotal = itemsSeleccionados.reduce(
    (s, i) => s + i.valor_venta * (seleccionados[i.id] || 1),
    0
  );
  const iva = aplicaIva ? subtotal * 0.19 : 0;
  const totalFinal = subtotal + iva;

  // ── PDF ────────────────────────────────────────────────────────────────────
  const descargarPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    const margen = 14;

    // encabezado
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CONSTRUCTORA COLOMBIA", margen, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("NIT: 901.234.567-8", margen, 24);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Presupuesto de Remodelación", margen, 32);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`No. ${numeroCot}`, margen, 38);
    doc.text(
      `Fecha: ${new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      margen,
      43
    );

    // datos cliente
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Cliente:", margen, 52);
    doc.setFont("helvetica", "normal");
    doc.text(cliente.nombre, margen + 18, 52);
    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", margen, 58);
    doc.setFont("helvetica", "normal");
    doc.text(cliente.telefono, margen + 22, 58);
    doc.setFont("helvetica", "bold");
    doc.text("Proyecto:", margen, 64);
    doc.setFont("helvetica", "normal");
    doc.text(cliente.proyecto, margen + 22, 64);

    // tabla
    autoTable(doc, {
      startY: 72,
      head: [["Cód.", "Descripción", "Cant.", "Vlr. Unitario", "Total"]],
      body: itemsSeleccionados.map((i) => [
        i.codigo || "",
        i.nombre,
        String(seleccionados[i.id] || 1),
        cop(i.valor_venta),
        cop(i.valor_venta * (seleccionados[i.id] || 1)),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 78, 139], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 20 },
        2: { halign: "center", cellWidth: 14 },
        3: { halign: "right", cellWidth: 32 },
        4: { halign: "right", cellWidth: 32 },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 72;

    // totales
    let y = finalY + 8;
    doc.setFontSize(9);
    doc.text(`Subtotal: ${cop(subtotal)}`, 140, y, { align: "right" });
    if (aplicaIva) {
      y += 6;
      doc.text(`IVA 19%: ${cop(iva)}`, 140, y, { align: "right" });
    }
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`TOTAL: ${cop(totalFinal)}`, 140, y, { align: "right" });

    // notas
    if (notas.trim()) {
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const lineas = doc.splitTextToSize(`${notas.trim()}\n\nValidez: 30 días.`, 175);
      doc.text(lineas, margen, y);
    } else {
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Validez: 30 días.", margen, y);
    }

    doc.save(`presupuesto-${numeroCot}.pdf`);
  };

  // ── guardar en BD ──────────────────────────────────────────────────────────
  const guardarCotizacion = async () => {
    setGuardando(true);
    try {
      let toastMsg: string;

      if (leadId) {
        // Caso A — lead existente: solo añadir nota en lead_actividades
        await supabase.from("lead_actividades").insert({
          lead_id: leadId,
          tipo: "NOTA",
          descripcion: `Presupuesto manual generado — ${cliente.proyecto} — Total: $${totalFinal.toLocaleString("es-CO")} — Nro: ${numeroCot}`,
          usuario: "Comercial",
        });
        toastMsg = "✅ Cotización guardada y nota añadida al lead en el CRM";
      } else {
        // Caso B — sin lead: crear lead nuevo en Prospección
        const { data: nuevoLead } = await supabase
          .from("leads")
          .insert({
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            email: "",
            fecha_contacto: fecha,
            origen: "OTRO",
            tipo_proyecto: "VIS",
            nombre_proyecto: cliente.proyecto,
            presupuesto_estimado: totalFinal,
            observaciones: "ppto manual",
            etapa: "PROSPECCION",
            probabilidad: 10,
            fuente: "OTRO",
            responsable: "Jeisson",
          })
          .select("id")
          .single();

        if (nuevoLead) {
          await supabase.from("lead_actividades").insert({
            lead_id: nuevoLead.id,
            tipo: "NOTA",
            descripcion: `Lead creado desde Presupuesto Manual — ${cliente.proyecto} — Total: $${totalFinal.toLocaleString("es-CO")} — Nro: ${numeroCot}`,
            usuario: "Comercial",
          });
        }
        toastMsg = "✅ Cotización guardada y lead creado en Prospección del CRM";
      }

      // insertar cotización en ambos casos
      const { error } = await supabase.from("cotizaciones").insert({
        cliente_nombre: cliente.nombre,
        cliente_telefono: cliente.telefono,
        cliente_email: "",
        proyecto_id: catalogoId,
        proyecto_nombre: cliente.proyecto,
        plan_tipo: "manual",
        plan_nombre: "Presupuesto Manual",
        precio_plan: subtotal,
        total: totalFinal,
        adicionales: JSON.stringify(itemsSeleccionados),
        numero_cotizacion: numeroCot,
        estado_crm: "NUEVO",
      });
      if (error) throw error;

      mostrarToast(toastMsg);
    } catch (err: any) {
      mostrarToast(`❌ Error: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const paso1Completo =
    cliente.nombre.trim() &&
    cliente.telefono.trim() &&
    cliente.proyecto.trim() &&
    fecha &&
    catalogoId;

  const itemsFiltrados = items.filter((i) => {
    if (!busqueda.trim()) return true;
    const t = busqueda.toLowerCase();
    return i.nombre.toLowerCase().includes(t) || (i.descripcion || "").toLowerCase().includes(t);
  });

  const grupos = agruparPorCategoria(itemsFiltrados);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Presupuesto Manual</h1>
              <p className="text-sm text-gray-500">
                Paso {paso} de 3 —{" "}
                {paso === 1
                  ? "Datos del cliente"
                  : paso === 2
                    ? "Selección de ítems"
                    : "Resumen y PDF"}
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Volver
            </button>
          </div>

          {/* barra de pasos */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  n <= paso ? "bg-emerald-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* ═══════════════ PASO 1 ═══════════════ */}
        {paso === 1 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-5 p-8">
              <h2 className="text-lg font-bold text-gray-900">Datos del cliente</h2>

              {/* ── buscador de lead existente ─────────────────────────── */}
              <div className="relative">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Buscar lead existente (opcional)
                </label>
                <Input
                  value={busquedaLead}
                  onChange={(e) => {
                    setBusquedaLead(e.target.value);
                    setLeadId(null);
                    setMostrarDropdownLead(e.target.value.length >= 2);
                  }}
                  onFocus={() => {
                    if (busquedaLead.length >= 2) setMostrarDropdownLead(true);
                  }}
                  onBlur={() => setTimeout(() => setMostrarDropdownLead(false), 150)}
                  placeholder="Nombre o teléfono del lead…"
                />

                {mostrarDropdownLead && (() => {
                  const t = busquedaLead.toLowerCase();
                  const resultados = leads
                    .filter(
                      (l) =>
                        l.nombre?.toLowerCase().includes(t) ||
                        (l.telefono || "").replace(/\s/g, "").includes(t.replace(/\s/g, ""))
                    )
                    .slice(0, 6);
                  return resultados.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      {resultados.map((lead) => (
                        <button
                          key={lead.id}
                          type="button"
                          onMouseDown={() => {
                            setLeadId(lead.id);
                            setCliente({
                              nombre: lead.nombre,
                              telefono: lead.telefono || "",
                              proyecto: lead.nombre_proyecto || cliente.proyecto,
                            });
                            setBusquedaLead(lead.nombre + " — " + (lead.telefono || ""));
                            setMostrarDropdownLead(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {lead.nombre}
                            </p>
                            <p className="text-xs text-gray-500">{lead.telefono || "Sin teléfono"}</p>
                          </div>
                          <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {lead.etapa?.replace(/_/g, " ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
                      <p className="text-sm text-gray-500">Sin resultados — llena los datos manualmente</p>
                    </div>
                  );
                })()}

                {/* badge de estado CRM */}
                <div className="mt-2">
                  {leadId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Lead vinculado — se actualizará en el flujo comercial
                    </span>
                  ) : cliente.nombre.trim() && cliente.telefono.trim() ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      Se creará un lead nuevo en Prospección
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nombre del cliente *
                  </label>
                  <Input
                    value={cliente.nombre}
                    onChange={(e) => setCliente((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: María García"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Teléfono *
                  </label>
                  <Input
                    value={cliente.telefono}
                    onChange={(e) => setCliente((p) => ({ ...p, telefono: e.target.value }))}
                    placeholder="Ej: 310 234 5678"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nombre del proyecto *
                  </label>
                  <Input
                    value={cliente.proyecto}
                    onChange={(e) => setCliente((p) => ({ ...p, proyecto: e.target.value }))}
                    placeholder="Ej: Fiore 2 - Torre A Apto 301"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Fecha *
                  </label>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Catálogo de precios *
                </label>
                <select
                  value={catalogoId}
                  onChange={(e) => setCatalogoId(e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona un catálogo…</option>
                  {catalogos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={continuar}
                  disabled={!paso1Completo || loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? "Cargando ítems…" : "Continuar →"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══════════════ PASO 2 ═══════════════ */}
        {paso === 2 && (
          <div className="flex gap-6">
            {/* columna ítems */}
            <div className="min-w-0 flex-1">
              <div className="mb-4">
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o descripción…"
                />
              </div>

              {grupos.length === 0 && (
                <p className="py-12 text-center text-sm text-gray-500">
                  No se encontraron ítems
                </p>
              )}

              {grupos.map(({ categoria, items: gItems }) => (
                <div key={categoria} className="mb-6">
                  <div className="mb-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
                    {categoria}
                  </div>
                  <div className="space-y-2">
                    {gItems.map((item) => {
                      const sel = seleccionados[item.id] !== undefined;
                      return (
                        <div
                          key={item.id}
                          className={`rounded-lg border px-4 py-3 transition-colors ${
                            sel ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={(e) => toggleItem(item, e.target.checked)}
                              className="mt-1 h-4 w-4 cursor-pointer accent-emerald-600"
                            />
                            <div className="min-w-0 flex-1">
                              {item.codigo && (
                                <span className="text-xs text-gray-400">{item.codigo} · </span>
                              )}
                              <span className="font-semibold text-gray-900">{item.nombre}</span>
                              {item.descripcion && (
                                <p className="mt-0.5 text-xs text-gray-500">{item.descripcion}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900">
                                {cop(item.valor_venta)}
                              </span>
                              {sel && (
                                <input
                                  type="number"
                                  min={1}
                                  value={seleccionados[item.id]}
                                  onChange={(e) => setCantidad(item.id, e.target.value)}
                                  className="h-8 w-16 rounded border border-gray-300 px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* panel lateral sticky */}
            <div className="w-64 shrink-0">
              <div className="sticky top-6">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="mb-4 font-bold text-gray-900">Resumen</h3>
                    <div className="mb-2 text-sm text-gray-600">
                      Ítems seleccionados:{" "}
                      <span className="font-semibold text-gray-900">
                        {itemsSeleccionados.length}
                      </span>
                    </div>
                    <div className="mb-4 border-t border-gray-100 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-bold text-gray-900">{cop(subtotal)}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={itemsSeleccionados.length === 0}
                      onClick={() => setPaso(3)}
                    >
                      Ver resumen →
                    </Button>
                    <button
                      onClick={() => setPaso(1)}
                      className="mt-3 w-full text-center text-xs text-gray-500 hover:text-gray-700"
                    >
                      ← Volver
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ PASO 3 ═══════════════ */}
        {paso === 3 && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Resumen del presupuesto</h2>
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-mono text-gray-600">
                    {numeroCot}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
                  <div>
                    <span className="text-gray-500">Cliente</span>
                    <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Teléfono</span>
                    <p className="font-semibold text-gray-900">{cliente.telefono}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Proyecto</span>
                    <p className="font-semibold text-gray-900">{cliente.proyecto}</p>
                  </div>
                </div>

                {/* tabla de ítems */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                        <th className="pb-2 pr-3">Cód.</th>
                        <th className="pb-2 pr-3">Descripción</th>
                        <th className="pb-2 pr-3 text-center">Cant.</th>
                        <th className="pb-2 pr-3 text-right">Vlr. Unitario</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itemsSeleccionados.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 pr-3 text-xs text-gray-400">{item.codigo || "—"}</td>
                          <td className="py-2 pr-3 font-medium text-gray-900">{item.nombre}</td>
                          <td className="py-2 pr-3 text-center text-gray-700">
                            {seleccionados[item.id]}
                          </td>
                          <td className="py-2 pr-3 text-right text-gray-700">
                            {cop(item.valor_venta)}
                          </td>
                          <td className="py-2 text-right font-semibold text-gray-900">
                            {cop(item.valor_venta * (seleccionados[item.id] || 1))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* totales */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex w-64 justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-900">{cop(subtotal)}</span>
                    </div>

                    {/* toggle IVA */}
                    <div className="flex w-64 items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={aplicaIva}
                            onChange={(e) => setAplicaIva(e.target.checked)}
                          />
                          <div
                            className={`h-5 w-9 rounded-full transition-colors ${
                              aplicaIva ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                          />
                          <div
                            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              aplicaIva ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </div>
                        Aplicar IVA 19%
                      </label>
                      {aplicaIva && (
                        <span className="text-sm font-semibold text-gray-900">{cop(iva)}</span>
                      )}
                    </div>

                    <div className="flex w-64 justify-between border-t border-gray-300 pt-2">
                      <span className="text-base font-bold text-gray-900">TOTAL</span>
                      <span className="text-base font-bold text-emerald-700">{cop(totalFinal)}</span>
                    </div>
                  </div>
                </div>

                {/* notas */}
                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Notas y condiciones
                  </label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={4}
                    placeholder="Validez de la cotización, forma de pago, exclusiones, etc."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* acciones */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPaso(2)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Volver a ítems
              </button>
              <div className="flex-1" />
              <Button
                onClick={descargarPDF}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Descargar PDF
              </Button>
              <Button
                onClick={guardarCotizacion}
                disabled={guardando}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {guardando ? "Guardando…" : "Guardar cotización"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/crm")}
                className="text-gray-600"
              >
                Ir al CRM →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
