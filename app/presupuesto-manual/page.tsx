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

// ─── precios por plan y conjunto ─────────────────────────────────────────────

const PRECIOS_PLAN: Record<string, { basico: number; intermedio: number }> = {
  "Ciudadela Verde": { basico: 15900000, intermedio: 31900000 },
  default: { basico: 16900000, intermedio: 32900000 },
};

// ─── conjuntos y planes ──────────────────────────────────────────────────────

const CONJUNTOS = [
  "Ciudadela Verde",
  "Beltramonto",
  "Fiore",
  "Azafrán",
  "Parque Oriente",
  "Montebello",
  "Alto Tramonti",
  "Morada del Viento",
  "Fontana de la Sierra",
  "San Juan de la Cuesta",
  "Otro",
];

const ITEMS_PLAN_BASICO = [
  "Estuco muros + techo",
  "Pintura 3 manos muros y techo",
  "Mortero de nivelación del piso impermeabilizado",
  "Enchape piso cerámica + guardaescobas",
  "Drywall cocina y baños",
  "Enchape baño completo",
  "Combo Básico: Sanitario, lavamanos, grifería",
  "Nicho iluminado",
  "Enchape salpicadero",
  "Enchape zona húmeda",
  "Luminarias LED",
  "Aseo final",
];

const ITEMS_PLAN_INTERMEDIO = [
  "Estuco muros + techo",
  "Pintura 3 manos muros y techo",
  "Mortero de nivelación del piso impermeabilizado",
  "Enchape piso cerámica + guardaescobas",
  "Drywall cocina y baños",
  "Enchape baño completo",
  "Combo Básico: Sanitario, lavamanos, grifería",
  "Nicho iluminado",
  "División de baño, vidrio de seguridad 8 mm",
  "Demolición enchape existente",
  "Enchape salpicadero",
  "Mesón granito negro o quartzone blanco",
  "Barra granito negro o quartzone blanco con soporte",
  "Enchape zona húmeda",
  "Puerta RH",
  "Mueble cocina superior e inferior una tonalidad RH",
  "Closet principal RH",
  "Closet secundario RH",
  "Luminarias LED",
  "Aseo final",
];

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
  const [conjunto, setConjunto] = useState("");
  const [planBase, setPlanBase] = useState("");
  const [precioBase, setPrecioBase] = useState<number | null>(null);
  const [itemsPlanIds, setItemsPlanIds] = useState<string[]>([]);

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

  // recalcula precioBase cuando cambia planBase o conjunto
  useEffect(() => {
    if (!planBase || planBase === "") { setPrecioBase(null); return; }
    const precios = PRECIOS_PLAN[conjunto] || PRECIOS_PLAN["default"];
    if (planBase === "Plan Básico") setPrecioBase(precios.basico);
    else if (planBase === "Plan Intermedio Plus") setPrecioBase(precios.intermedio);
    else setPrecioBase(null);
  }, [planBase, conjunto]);

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

      const listaPlan =
        planBase === "Plan Básico"
          ? ITEMS_PLAN_BASICO
          : planBase === "Plan Intermedio Plus"
            ? ITEMS_PLAN_INTERMEDIO
            : [];

      const catalogoItems: CatalogoItem[] = data || [];

      const preseleccion: Record<string, number> = {};
      catalogoItems.forEach((item) => {
        const nombreNorm = item.nombre?.toLowerCase().trim();
        const enPlan = listaPlan.some(
          (n) => n.toLowerCase().trim() === nombreNorm
        );
        if (enPlan) preseleccion[item.id] = 1;
      });

      const nombresEnCatalogo = new Set(
        catalogoItems.map((i) => i.nombre?.toLowerCase().trim())
      );
      const extras: CatalogoItem[] = listaPlan
        .filter((n) => !nombresEnCatalogo.has(n.toLowerCase().trim()))
        .map((n, idx) => ({
          id: `extra-${idx}`,
          codigo: null,
          categoria: "⚠ Sin precio en catálogo",
          nombre: n,
          descripcion: null,
          valor_venta: 0,
        }));
      extras.forEach((e) => {
        preseleccion[e.id] = 1;
      });

      // guardar IDs del plan para distinguirlos de adicionales
      setItemsPlanIds(Object.keys(preseleccion));

      setItems([...catalogoItems, ...extras]);
      setSeleccionados(preseleccion);
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
  const itemsPlanSet = new Set(itemsPlanIds);

  // ítems adicionales = seleccionados que NO son del plan
  const itemsAdicionales = itemsSeleccionados.filter((i) => !itemsPlanSet.has(i.id));

  // ítems del plan que fueron removidos
  const planItemsRemovidos = itemsPlanIds.filter((id) => !seleccionados[id]).length;

  // subtotal de adicionales con +20% utilidad
  const subtotalAdicionales = itemsAdicionales.reduce(
    (s, i) => s + Math.round(i.valor_venta * 1.20) * (seleccionados[i.id] || 1),
    0
  );

  // subtotal cuando no hay plan (todos los ítems con +20%)
  const subtotalSinPlan = itemsSeleccionados.reduce(
    (s, i) => s + Math.round(i.valor_venta * 1.20) * (seleccionados[i.id] || 1),
    0
  );

  const baseTotal = precioBase !== null
    ? precioBase + subtotalAdicionales
    : subtotalSinPlan;

  const iva = aplicaIva ? Math.round(baseTotal * 0.19) : 0;
  const totalFinal = baseTotal + iva;

  // ── PDF profesional ────────────────────────────────────────────────────────
  const descargarPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── HEADER negro ──────────────────────────────────────────────
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, pageW, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CONSTRUCTORA COLOMBIA REMODELA", 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("SU ALIADO EN REMODELACIÓN", 14, 20);

    doc.setFontSize(8);
    doc.text(`Nro: ${numeroCot}`, pageW - 14, 14, { align: "right" });
    doc.text(`Fecha: ${fecha}`, pageW - 14, 19, { align: "right" });
    if (planBase) doc.text(`Plan: ${planBase}`, pageW - 14, 24, { align: "right" });

    // ── DATOS CLIENTE ─────────────────────────────────────────────
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 42, pageW - 28, 24, 2, 2, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Cliente:", 18, 49);
    doc.text("Conjunto:", 18, 55);
    doc.text("Ciudad:", 18, 61);
    doc.setFont("helvetica", "normal");
    doc.text(
      cliente.nombre + (cliente.telefono ? `  ·  ${cliente.telefono}` : ""),
      35, 49
    );
    doc.text(cliente.proyecto || conjunto, 35, 55);
    doc.text("Bucaramanga", 35, 61);

    // ── TÍTULO TABLA ──────────────────────────────────────────────
    doc.setFillColor(20, 20, 20);
    doc.rect(14, 70, pageW - 28, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Constructora Colombia Remodela — ${cliente.proyecto || conjunto}`,
      pageW / 2, 75, { align: "center" }
    );

    // ── TABLA DE ÍTEMS ────────────────────────────────────────────
    const tableBody: string[][] = [];

    // línea 1: plan base si aplica
    if (precioBase !== null && planBase) {
      tableBody.push([
        "—",
        planBase,
        "1",
        cop(precioBase),
        cop(precioBase),
      ]);
    }

    // ítems adicionales (o todos si no hay plan)
    const itemsParaPDF = precioBase !== null
      ? itemsSeleccionados.filter((i) => !itemsPlanSet.has(i.id))
      : itemsSeleccionados;

    itemsParaPDF.forEach((item) => {
      const precioUtil = Math.round(item.valor_venta * 1.20);
      tableBody.push([
        item.codigo || "—",
        item.nombre + (item.descripcion ? `\n${item.descripcion}` : ""),
        String(seleccionados[item.id] || 1),
        item.valor_venta > 0 ? cop(precioUtil) : "A convenir",
        item.valor_venta > 0
          ? cop(precioUtil * (seleccionados[item.id] || 1))
          : "A convenir",
      ]);
    });

    autoTable(doc, {
      startY: 78,
      head: [["Cód.", "Ítem / Descripción", "Cant.", "Vlr. Unitario", "Total"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 28, halign: "right" },
        4: { cellWidth: 28, halign: "right" },
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 14, right: 14 },
    });

    // ── TOTALES ───────────────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY + 4;
    const colDerX = pageW - 14;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");

    let currentY = finalY + 5;
    if (precioBase !== null) {
      doc.text("Plan base:", colDerX - 50, currentY, { align: "left" });
      doc.text(cop(precioBase), colDerX, currentY, { align: "right" });
      currentY += 6;
      doc.text("Adicionales:", colDerX - 50, currentY, { align: "left" });
      doc.text(cop(subtotalAdicionales), colDerX, currentY, { align: "right" });
      currentY += 6;
    } else {
      doc.text("Subtotal:", colDerX - 50, currentY, { align: "left" });
      doc.text(cop(subtotalSinPlan), colDerX, currentY, { align: "right" });
      currentY += 6;
    }

    let totalY: number;
    if (aplicaIva) {
      doc.text("IVA 19%:", colDerX - 50, currentY, { align: "left" });
      doc.text(cop(iva), colDerX, currentY, { align: "right" });
      totalY = currentY + 8;
    } else {
      totalY = currentY + 2;
    }

    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.5);
    doc.line(colDerX - 55, totalY - 3, colDerX, totalY - 3);
    doc.setFillColor(20, 20, 20);
    doc.rect(colDerX - 55, totalY - 2, 55, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("TOTAL", colDerX - 50, totalY + 4);
    doc.text(cop(totalFinal), colDerX - 2, totalY + 4, { align: "right" });

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.text("★ Tendedero abatible en zona húmeda — BONUS GRATIS", 14, totalY + 4);

    // ── NOTAS ─────────────────────────────────────────────────────
    if (notas.trim()) {
      const notasY = totalY + 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text("Notas y condiciones:", 14, notasY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const notasLines = doc.splitTextToSize(notas, pageW - 28);
      doc.text(notasLines, 14, notasY + 5);
    }

    // ── PIE DE PÁGINA ─────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Este presupuesto tiene una validez de 30 días.",
      pageW / 2, pageH - 12, { align: "center" }
    );
    doc.text(
      "Constructora Colombia Remodela · Bucaramanga, Colombia",
      pageW / 2, pageH - 8, { align: "center" }
    );

    doc.save(`Presupuesto_${(cliente.nombre || "cliente").replace(/\s+/g, "_")}_${numeroCot}.pdf`);
  };

  // ── guardar en BD ──────────────────────────────────────────────────────────
  const guardarCotizacion = async () => {
    setGuardando(true);
    try {
      let toastMsg: string;

      if (leadId) {
        await supabase.from("lead_actividades").insert({
          lead_id: leadId,
          tipo: "NOTA",
          descripcion: `Presupuesto manual generado — ${cliente.proyecto} — Total: $${totalFinal.toLocaleString("es-CO")} — Nro: ${numeroCot}`,
          usuario: "Comercial",
        });
        toastMsg = "✅ Cotización guardada y nota añadida al lead en el CRM";
      } else {
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

      const { error } = await supabase.from("cotizaciones").insert({
        cliente_nombre: cliente.nombre,
        cliente_telefono: cliente.telefono,
        cliente_email: "",
        proyecto_id: catalogoId,
        proyecto_nombre: cliente.proyecto,
        plan_tipo: "manual",
        plan_nombre: planBase || "Presupuesto Manual",
        precio_plan: precioBase ?? baseTotal,
        total: totalFinal,
        adicionales: JSON.stringify(itemsAdicionales),
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

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Conjunto residencial *
                  </label>
                  <select
                    value={conjunto}
                    onChange={(e) => {
                      setConjunto(e.target.value);
                      if (!cliente.proyecto.trim()) {
                        setCliente((p) => ({ ...p, proyecto: e.target.value }));
                      }
                    }}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona un conjunto…</option>
                    {CONJUNTOS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Plan base (opcional)
                  </label>
                  <select
                    value={planBase}
                    onChange={(e) => setPlanBase(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">(ninguno)</option>
                    <option value="Plan Básico">Plan Básico</option>
                    <option value="Plan Intermedio Plus">Plan Intermedio Plus</option>
                  </select>
                  {planBase && precioBase !== null && (
                    <p className="mt-1 text-xs text-emerald-600">
                      Precio: {cop(precioBase)} — {conjunto || "precio estándar"}
                    </p>
                  )}
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
          <div>
            {/* Banner plan base */}
            {precioBase !== null && (
              <div
                className="mb-4 rounded-xl"
                style={{
                  background: "#14532d",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                    {planBase} — {conjunto}
                  </div>
                  <div style={{ color: "#86efac", fontSize: 12 }}>
                    Precio base del plan incluido
                  </div>
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>
                  {cop(precioBase)}
                </div>
              </div>
            )}

            {/* Aviso ítems del plan removidos */}
            {planItemsRemovidos > 0 && (
              <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs text-yellow-800">
                {planItemsRemovidos} ítem{planItemsRemovidos > 1 ? "s" : ""} del plan removido{planItemsRemovidos > 1 ? "s" : ""} — el precio base no varía
              </div>
            )}

            <div className="flex gap-6">
              {/* columna ítems */}
              <div className="min-w-0 flex-1">
                <div className="mb-4">
                  {/* CAMBIO 3 — fix color texto buscador */}
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o descripción…"
                    style={{
                      color: "var(--color-text-primary, #111827)",
                      backgroundColor: "var(--color-background-primary, #ffffff)",
                    }}
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
                        const esDePlan = itemsPlanSet.has(item.id);
                        const precioConUtilidad = Math.round(item.valor_venta * 1.20);
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
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.codigo && (
                                    <span className="text-xs text-gray-400">{item.codigo} · </span>
                                  )}
                                  <span className="font-semibold text-gray-900">{item.nombre}</span>
                                  {esDePlan && (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      Incluido en plan
                                    </span>
                                  )}
                                </div>
                                {item.descripcion && (
                                  <p className="mt-0.5 text-xs text-gray-500">{item.descripcion}</p>
                                )}
                                {item.id.startsWith("extra-") && (
                                  <span className="mt-1 inline-block rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                                    Sin precio — actualizar en catálogo
                                  </span>
                                )}
                              </div>

                              {/* CAMBIO 4 — doble precio: costo tachado + utilidad */}
                              <div className="flex shrink-0 flex-col items-end gap-0.5">
                                {item.valor_venta > 0 ? (
                                  <>
                                    <span className="text-xs text-gray-400 line-through">
                                      {cop(item.valor_venta)}
                                    </span>
                                    <span className="text-sm font-bold text-emerald-700">
                                      {cop(precioConUtilidad)}
                                    </span>
                                    <span className="text-[10px] text-emerald-500">+20% utilidad</span>
                                  </>
                                ) : (
                                  <span className="text-sm font-semibold text-gray-400">A convenir</span>
                                )}
                                {sel && (
                                  <input
                                    type="number"
                                    min={1}
                                    value={seleccionados[item.id]}
                                    onChange={(e) => setCantidad(item.id, e.target.value)}
                                    className="mt-1 h-8 w-16 rounded border border-gray-300 px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    style={{ color: "#111827", backgroundColor: "#fff" }}
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
                        Ítems:{" "}
                        <span className="font-semibold text-gray-900">
                          {itemsSeleccionados.length}
                        </span>
                      </div>

                      <div className="mb-4 space-y-2 border-t border-gray-100 pt-4">
                        {precioBase !== null ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Plan base</span>
                              <span className="font-semibold text-gray-900">{cop(precioBase)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Adicionales</span>
                              <span className="font-semibold text-gray-900">{cop(subtotalAdicionales)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
                              <span className="font-bold text-gray-900">TOTAL</span>
                              <span className="font-bold text-emerald-700">{cop(totalFinal)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total (+20%)</span>
                            <span className="font-bold text-emerald-700">{cop(totalFinal)}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={itemsSeleccionados.length === 0 && precioBase === null}
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

                {/* tabla de ítems — desglose plan + adicionales */}
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
                      {/* línea plan base */}
                      {precioBase !== null && (
                        <tr className="bg-emerald-50">
                          <td className="py-2 pr-3 text-xs text-gray-400">—</td>
                          <td className="py-2 pr-3 font-semibold text-emerald-800">
                            {planBase}
                            <span className="ml-2 rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              Plan
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-center text-gray-700">1</td>
                          <td className="py-2 pr-3 text-right text-gray-700">{cop(precioBase)}</td>
                          <td className="py-2 text-right font-semibold text-emerald-700">{cop(precioBase)}</td>
                        </tr>
                      )}

                      {/* ítems adicionales (o todos si no hay plan) */}
                      {(precioBase !== null ? itemsAdicionales : itemsSeleccionados).map((item) => {
                        const precioUtil = Math.round(item.valor_venta * 1.20);
                        const cant = seleccionados[item.id] || 1;
                        return (
                          <tr key={item.id}>
                            <td className="py-2 pr-3 text-xs text-gray-400">{item.codigo || "—"}</td>
                            <td className="py-2 pr-3 font-medium text-gray-900">{item.nombre}</td>
                            <td className="py-2 pr-3 text-center text-gray-700">{cant}</td>
                            <td className="py-2 pr-3 text-right text-gray-700">
                              {item.valor_venta > 0 ? cop(precioUtil) : "A convenir"}
                            </td>
                            <td className="py-2 text-right font-semibold text-gray-900">
                              {item.valor_venta > 0 ? cop(precioUtil * cant) : "A convenir"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* totales */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex flex-col items-end gap-2">
                    {precioBase !== null ? (
                      <>
                        <div className="flex w-64 justify-between text-sm">
                          <span className="text-gray-600">Plan base</span>
                          <span className="font-semibold text-gray-900">{cop(precioBase)}</span>
                        </div>
                        <div className="flex w-64 justify-between text-sm">
                          <span className="text-gray-600">Adicionales</span>
                          <span className="font-semibold text-gray-900">{cop(subtotalAdicionales)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex w-64 justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-900">{cop(subtotalSinPlan)}</span>
                      </div>
                    )}

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
