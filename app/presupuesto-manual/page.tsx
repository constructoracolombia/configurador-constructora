"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── tipos ───────────────────────────────────────────────────────────────────

type Catalogo = { id: string; nombre: string };
type CatalogoItem = {
  id: string;
  codigo: string | null;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  valor_venta: number;
};
type Cliente = { nombre: string; telefono: string; proyecto: string };
type PlanSeccion = { seccion: string; items: string[] };
type EstadoItemPlan = { aplica: boolean; cantidad: number; descuento: number };

// ─── helpers ─────────────────────────────────────────────────────────────────

const cop = (n: number) => "$ " + Math.round(n).toLocaleString("es-CO");
const randomSuffix = () => Math.random().toString(36).substring(2, 5).toUpperCase();
const numeroCotizacion = (fecha: string) =>
  "MAN-" + fecha.replace(/-/g, "") + "-" + randomSuffix();

const agruparPorCategoria = (items: CatalogoItem[]) => {
  const orden: string[] = [];
  const mapa: Record<string, CatalogoItem[]> = {};
  for (const item of items) {
    if (!mapa[item.categoria]) { orden.push(item.categoria); mapa[item.categoria] = []; }
    mapa[item.categoria].push(item);
  }
  return orden.map((cat) => ({ categoria: cat, items: mapa[cat] }));
};

// ─── precios por plan y conjunto ─────────────────────────────────────────────

const PRECIOS_PLAN: Record<string, { basico: number; intermedio: number }> = {
  "Ciudadela Verde": { basico: 15900000, intermedio: 31900000 },
  default: { basico: 16900000, intermedio: 32900000 },
};

// ─── secciones de planes ─────────────────────────────────────────────────────

const PLAN_BASICO_SECCIONES: PlanSeccion[] = [
  { seccion: "GENERAL", items: [
    "Estuco muros + techo",
    "Pintura 3 manos muros y techo",
    "Mortero de nivelación del piso impermeabilizado",
    "Enchape piso cerámica + guardaescobas",
    "Drywall cocina y baños",
  ]},
  { seccion: "BAÑO PRINCIPAL", items: [
    "Enchape baño completo",
    "Combo Básico: Sanitario, lavamanos, grifería",
    "Nicho iluminado",
  ]},
  { seccion: "COCINA", items: ["Enchape salpicadero"] },
  { seccion: "ZONA HÚMEDA", items: ["Enchape zona húmeda"] },
  { seccion: "OTROS", items: ["Luminarias LED", "Aseo final"] },
];

const PLAN_INTERMEDIO_SECCIONES: PlanSeccion[] = [
  { seccion: "GENERAL", items: [
    "Estuco muros + techo",
    "Pintura 3 manos muros y techo",
    "Mortero de nivelación del piso impermeabilizado",
    "Enchape piso cerámica + guardaescobas",
    "Drywall cocina y baños",
  ]},
  { seccion: "BAÑO PRINCIPAL", items: [
    "Enchape baño completo",
    "Combo Básico: Sanitario, lavamanos, grifería",
    "Nicho iluminado",
    "División de baño, vidrio de seguridad 8 mm",
  ]},
  { seccion: "BAÑO AUXILIAR", items: [
    "Demolición enchape existente",
    "Enchape baño completo",
    "Nicho iluminado",
    "División de baño, vidrio de seguridad 8 mm",
  ]},
  { seccion: "COCINA", items: [
    "Enchape salpicadero",
    "Mesón granito negro o quartzone blanco",
    "Barra granito negro o quartzone blanco con soporte",
  ]},
  { seccion: "ZONA HÚMEDA", items: ["Enchape zona húmeda"] },
  { seccion: "CARPINTERÍA (Toda en melamina RH Alta calidad)", items: [
    "Puerta RH",
    "Mueble cocina superior e inferior una tonalidad RH",
    "Closet principal RH",
    "Closet secundario RH",
  ]},
  { seccion: "OTROS", items: ["Luminarias LED", "Aseo final"] },
];

// ─── conjuntos y listas planas de ítems (para preselección en catálogo) ───────

const CONJUNTOS = [
  "Ciudadela Verde", "Beltramonto", "Fiore", "Azafrán", "Parque Oriente",
  "Montebello", "Alto Tramonti", "Morada del Viento", "Fontana de la Sierra",
  "San Juan de la Cuesta", "Otro",
];

const ITEMS_PLAN_BASICO = [
  "Estuco muros + techo", "Pintura 3 manos muros y techo",
  "Mortero de nivelación del piso impermeabilizado", "Enchape piso cerámica + guardaescobas",
  "Drywall cocina y baños", "Enchape baño completo",
  "Combo Básico: Sanitario, lavamanos, grifería", "Nicho iluminado",
  "Enchape salpicadero", "Enchape zona húmeda", "Luminarias LED", "Aseo final",
];

const ITEMS_PLAN_INTERMEDIO = [
  "Estuco muros + techo", "Pintura 3 manos muros y techo",
  "Mortero de nivelación del piso impermeabilizado", "Enchape piso cerámica + guardaescobas",
  "Drywall cocina y baños", "Enchape baño completo",
  "Combo Básico: Sanitario, lavamanos, grifería", "Nicho iluminado",
  "División de baño, vidrio de seguridad 8 mm", "Demolición enchape existente",
  "Enchape salpicadero", "Mesón granito negro o quartzone blanco",
  "Barra granito negro o quartzone blanco con soporte", "Enchape zona húmeda",
  "Puerta RH", "Mueble cocina superior e inferior una tonalidad RH",
  "Closet principal RH", "Closet secundario RH", "Luminarias LED", "Aseo final",
];

// ─── bonus y condiciones ─────────────────────────────────────────────────────

const BONUS_ITEMS = [
  "Ducha elegante cuadrada métalica + mezclador monocontrol baño principal",
  "Asesoría arquitectónica en selección de enchape y carpintería.",
  "Recorrido virtual 360° del apartamento una vez remodelado.",
  "Trabajo supervisado por profesionales (Ing. civiles y arquitectos).",
  "Atención al cliente, tranquilidad y cero sobrecostos.",
  "Garantía de calidad materiales y mano de obra.",
];

const CONDICIONES = [
  "* Tiempo de entrega de 39 días hábiles.",
  "* Te enviamos avances semanales de tu apartamento por Whatsapp.",
  "* Se realiza esta cotización con precio de enchape de 40 mil pesos el metro cuadrado.",
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
  const [itemsPlanEstado, setItemsPlanEstado] = useState<Record<string, EstadoItemPlan>>({});

  // carga catálogos y leads al montar
  useEffect(() => {
    const cargar = async () => {
      const [{ data: catData }, { data: leadsData }] = await Promise.all([
        supabase.from("catalogos_precios").select("id, nombre").eq("activo", true).order("nombre"),
        supabase.from("leads")
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

  // recalcula precioBase cuando cambia plan o conjunto
  useEffect(() => {
    if (!planBase) { setPrecioBase(null); return; }
    const precios = PRECIOS_PLAN[conjunto] || PRECIOS_PLAN["default"];
    if (planBase === "Plan Básico") setPrecioBase(precios.basico);
    else if (planBase === "Plan Intermedio Plus") setPrecioBase(precios.intermedio);
    else setPrecioBase(null);
  }, [planBase, conjunto]);

  // inicializa estado de ítems del plan cuando cambia planBase
  useEffect(() => {
    const listaItems = planBase === "Plan Básico"
      ? ITEMS_PLAN_BASICO
      : planBase === "Plan Intermedio Plus"
      ? ITEMS_PLAN_INTERMEDIO
      : [];
    const estadoInicial: Record<string, EstadoItemPlan> = {};
    listaItems.forEach((nombre) => {
      estadoInicial[nombre] = { aplica: true, cantidad: 1, descuento: 0 };
    });
    setItemsPlanEstado(estadoInicial);
  }, [planBase]);

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const toggleItemPlan = (nombre: string) => {
    setItemsPlanEstado((prev) => ({
      ...prev,
      [nombre]: {
        ...(prev[nombre] ?? { aplica: true, cantidad: 1, descuento: 0 }),
        aplica: !prev[nombre]?.aplica,
        descuento: 0,
      },
    }));
  };

  const setCantidadPlan = (nombre: string, val: string) => {
    const n = Number(val);
    if (n >= 1) setItemsPlanEstado((prev) => ({
      ...prev,
      [nombre]: { ...(prev[nombre] ?? { aplica: true, cantidad: 1, descuento: 0 }), cantidad: n },
    }));
  };

  const setDescuentoPlan = (nombre: string, val: string) => {
    const n = Number(val);
    setItemsPlanEstado((prev) => ({
      ...prev,
      [nombre]: { ...(prev[nombre] ?? { aplica: false, cantidad: 1, descuento: 0 }), descuento: n },
    }));
  };

  // paso 1 → 2: cargar ítems del catálogo
  const continuar = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("catalogo_items")
        .select("id, codigo, categoria, nombre, descripcion, valor_venta")
        .eq("catalogo_id", catalogoId)
        .eq("activo", true)
        .order("categoria");

      const listaPlan = planBase === "Plan Básico" ? ITEMS_PLAN_BASICO
        : planBase === "Plan Intermedio Plus" ? ITEMS_PLAN_INTERMEDIO : [];

      const catalogoItems: CatalogoItem[] = data || [];

      // los ítems del plan se gestionan por itemsPlanEstado — no se preseleccionan en el catálogo
      setItemsPlanIds([]);
      setItems(catalogoItems);
      setSeleccionados({});
      setPaso(2);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: CatalogoItem, checked: boolean) => {
    if (checked) {
      setSeleccionados((prev) => ({ ...prev, [item.id]: 1 }));
    } else {
      setSeleccionados((prev) => { const next = { ...prev }; delete next[item.id]; return next; });
    }
  };

  const setCantidad = (id: string, val: string) => {
    const n = Number(val);
    if (n >= 1) setSeleccionados((prev) => ({ ...prev, [id]: n }));
  };

  // ── cálculos ───────────────────────────────────────────────────────────────
  const itemsSeleccionados = items.filter((i) => seleccionados[i.id] !== undefined);
  const itemsPlanSet = new Set(itemsPlanIds);
  const itemsAdicionales = itemsSeleccionados.filter((i) => !itemsPlanSet.has(i.id));

  const ajusteTotal = Object.values(itemsPlanEstado)
    .filter((e) => !e.aplica)
    .reduce((sum, e) => sum + (e.descuento || 0), 0);
  const precioEfectivo = (precioBase || 0) + ajusteTotal;

  const subtotalAdicionales = itemsAdicionales.reduce(
    (s, i) => s + Math.round(i.valor_venta * 1.20) * (seleccionados[i.id] || 1), 0
  );
  const subtotalSinPlan = itemsSeleccionados.reduce(
    (s, i) => s + Math.round(i.valor_venta * 1.20) * (seleccionados[i.id] || 1), 0
  );
  const baseTotal = precioBase !== null ? precioEfectivo + subtotalAdicionales : subtotalSinPlan;
  const iva = aplicaIva ? Math.round(baseTotal * 0.19) : 0;
  const totalFinal = baseTotal + iva;

  const hayDescuentos = Object.values(itemsPlanEstado).some((e) => !e.aplica);
  const diasEntrega = planBase === "Plan Básico" ? 39 : 59;

  const secciones = planBase === "Plan Básico" ? PLAN_BASICO_SECCIONES
    : planBase === "Plan Intermedio Plus" ? PLAN_INTERMEDIO_SECCIONES : [];

  // ── PDF ────────────────────────────────────────────────────────────────────
  const generarPDFDoc = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Header negro
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

    // Datos cliente
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 42, pageW - 28, 24, 2, 2, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Cliente:", 18, 49);
    doc.text("Conjunto:", 18, 55);
    doc.text("Ciudad:", 18, 61);
    doc.setFont("helvetica", "normal");
    doc.text(cliente.nombre + (cliente.telefono ? `  ·  ${cliente.telefono}` : ""), 35, 49);
    doc.text(cliente.proyecto || conjunto, 35, 55);
    doc.text("Bucaramanga", 35, 61);

    // Título tabla
    doc.setFillColor(20, 20, 20);
    doc.rect(14, 70, pageW - 28, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Constructora Colombia Remodela — ${cliente.proyecto || conjunto}`,
      pageW / 2, 75, { align: "center" }
    );

    let currentTableEndY = 78;

    // ── tabla del plan ────────────────────────────────────────────
    if (precioBase !== null && planBase) {
      const planBody: any[][] = [];
      secciones.forEach(({ seccion, items: planItems }) => {
        planBody.push([{
          content: seccion, colSpan: 3,
          styles: { fillColor: [220, 220, 220], fontStyle: "bold", textColor: [50, 50, 50], fontSize: 7.5 },
        }]);
        planItems.forEach((itemNombre) => {
          const estado = itemsPlanEstado[itemNombre];
          const aplica = estado?.aplica ?? true;
          planBody.push([
            { content: itemNombre, styles: { textColor: aplica ? [30, 30, 30] : [150, 150, 150], fontStyle: aplica ? "normal" : "italic" } },
            { content: aplica ? "SÍ" : "NO", styles: { halign: "center" as const, textColor: aplica ? [21, 128, 61] : [180, 50, 50] } },
            { content: aplica ? String(estado?.cantidad ?? 1) : "—", styles: { halign: "center" as const } },
          ]);
        });
      });

      // filas de descuento por ítems removidos
      Object.entries(itemsPlanEstado)
        .filter(([_, e]) => !e.aplica && e.descuento !== 0)
        .forEach(([nombre, e]) => {
          planBody.push([
            { content: `— Sin ${nombre}`, styles: { textColor: [180, 50, 50], fontStyle: "italic" } },
            { content: "NO", styles: { halign: "center" as const, textColor: [180, 50, 50] } },
            { content: cop(e.descuento), styles: { halign: "right" as const, textColor: [180, 50, 50], fontStyle: "bold" } },
          ]);
        });

      // total plan con precioEfectivo
      const totalPlanLabel = ajusteTotal < 0
        ? `$ ${precioBase.toLocaleString("es-CO")} → $ ${precioEfectivo.toLocaleString("es-CO")}`
        : `$ ${precioEfectivo.toLocaleString("es-CO")}`;
      planBody.push([
        { content: `TOTAL ${planBase}`, colSpan: 2, styles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 } },
        { content: totalPlanLabel, styles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" as const, fontSize: 9 } },
      ]);

      autoTable(doc, {
        startY: 78,
        head: [["Ítem", "¿Aplica?", "Cantidad / Área"]],
        body: planBody,
        foot: [["★ Tendedero abatible en zona húmeda — BONUS GRATIS", "SÍ", "1"]],
        footStyles: { fillColor: [255, 255, 255], textColor: [15, 100, 50], fontStyle: "italic", fontSize: 7.5 },
        theme: "grid",
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
        columnStyles: {
          0: { cellWidth: "auto" as const },
          1: { cellWidth: 20, halign: "center" as const },
          2: { cellWidth: 25, halign: "center" as const },
        },
        margin: { left: 14, right: 14 },
      });
      currentTableEndY = (doc as any).lastAutoTable.finalY;
    }

    // ── tabla adicionales ─────────────────────────────────────────
    const itemsParaPDF = precioBase !== null
      ? itemsSeleccionados.filter((i) => !itemsPlanSet.has(i.id))
      : itemsSeleccionados;

    if (itemsParaPDF.length > 0) {
      const adicStartY = currentTableEndY + 6;

      if (precioBase !== null) {
        doc.setFillColor(60, 60, 60);
        doc.rect(14, adicStartY, pageW - 28, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("ADICIONALES", 18, adicStartY + 5);
      }

      const adicBody: any[][] = itemsParaPDF.map((item) => {
        const precioUtil = Math.round(item.valor_venta * 1.20);
        const cant = seleccionados[item.id] || 1;
        return [
          item.codigo || "—",
          item.nombre + (item.descripcion ? `\n${item.descripcion}` : ""),
          String(cant),
          item.valor_venta > 0 ? cop(precioUtil) : "A convenir",
          item.valor_venta > 0 ? cop(precioUtil * cant) : "A convenir",
        ];
      });
      // subtotal adicionales
      adicBody.push([
        { content: "Subtotal adicionales", colSpan: 4, styles: { fontStyle: "bold", halign: "right" as const, fillColor: [245, 245, 245] } },
        { content: cop(precioBase !== null ? subtotalAdicionales : subtotalSinPlan), styles: { fontStyle: "bold", halign: "right" as const, fillColor: [245, 245, 245] } },
      ]);

      autoTable(doc, {
        startY: precioBase !== null ? adicStartY + 7 : currentTableEndY,
        head: [["Cód.", "Ítem / Descripción", "Cant.", "Vlr. Unit. (+20%)", "Total"]],
        body: adicBody,
        theme: "grid",
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
        columnStyles: {
          0: { cellWidth: 14, halign: "center" as const },
          1: { cellWidth: "auto" as const },
          2: { cellWidth: 12, halign: "center" as const },
          3: { cellWidth: 28, halign: "right" as const },
          4: { cellWidth: 28, halign: "right" as const },
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 14, right: 14 },
      });
      currentTableEndY = (doc as any).lastAutoTable.finalY;
    }

    // ── totales ───────────────────────────────────────────────────
    const finalY = currentTableEndY + 4;
    const colDerX = pageW - 14;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");

    let curY = finalY + 5;
    if (precioBase !== null) {
      doc.text("Plan base:", colDerX - 50, curY, { align: "left" });
      doc.text(cop(precioEfectivo), colDerX, curY, { align: "right" });
      curY += 6;
      if (subtotalAdicionales > 0) {
        doc.text("Adicionales:", colDerX - 50, curY, { align: "left" });
        doc.text(cop(subtotalAdicionales), colDerX, curY, { align: "right" });
        curY += 6;
      }
    } else {
      doc.text("Subtotal:", colDerX - 50, curY, { align: "left" });
      doc.text(cop(subtotalSinPlan), colDerX, curY, { align: "right" });
      curY += 6;
    }

    let totalY: number;
    if (aplicaIva) {
      doc.text("IVA 19%:", colDerX - 50, curY, { align: "left" });
      doc.text(cop(iva), colDerX, curY, { align: "right" });
      totalY = curY + 8;
    } else {
      totalY = curY + 2;
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

    if (notas.trim()) {
      const notasY = totalY + 14;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text("Notas y condiciones:", 14, notasY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(doc.splitTextToSize(notas, pageW - 28), 14, notasY + 5);
    }

    // ── tabla bonus ───────────────────────────────────────────────
    autoTable(doc, {
      startY: totalY + 18,
      head: [["BONUS GRATIS — Te llevas todos estos Bonus con tu remodelación", ""]],
      body: BONUS_ITEMS.map((b) => [b, "GRATIS"]),
      theme: "grid",
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "center" as const },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: "auto" as const },
        1: { cellWidth: 25, halign: "center" as const, fontStyle: "bold", textColor: [30, 120, 60] },
      },
      margin: { left: 14, right: 14 },
    });

    // condiciones con días dinámicos
    const condicionesPDF = [
      `* Tiempo de entrega de ${diasEntrega} días hábiles.`,
      CONDICIONES[1],
      CONDICIONES[2],
    ];
    const condY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    condicionesPDF.forEach((c, i) => { doc.text(c, 14, condY + i * 5); });

    doc.setTextColor(15, 100, 50);
    doc.text("Instagram: @constructoracol.remodela", 14, condY + 18);
    doc.text("Web: constructoracolombia.com/remodelaciones", 14, condY + 23);

    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.text(
      "Más que una constructora, un aliado para llevar a la realidad el hogar o negocio de tus sueños",
      pageW / 2, condY + 32, { align: "center" }
    );

    doc.setTextColor(37, 211, 102);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("WhatsApp: +57 317 5639674", pageW / 2, condY + 40, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.text("Este presupuesto tiene una validez de 30 días.", pageW / 2, pageH - 12, { align: "center" });
    doc.text("Constructora Colombia Remodela · Bucaramanga, Colombia", pageW / 2, pageH - 8, { align: "center" });

    return doc;
  };

  const descargarPDF = async () => {
    const doc = await generarPDFDoc();
    doc.save(`Presupuesto_${(cliente.nombre || "cliente").replace(/\s+/g, "_")}_${numeroCot}.pdf`);
  };

  // ── guardar en BD ──────────────────────────────────────────────────────────
  const guardarCotizacion = async () => {
    setGuardando(true);
    try {
      // 1. Generar PDF una sola vez
      const pdfDoc = await generarPDFDoc();
      const pdfBlob = pdfDoc.output("blob") as Blob;
      const pdfFileName = `presupuesto_${numeroCot}.pdf`;

      // 2. Subir PDF a Supabase Storage
      let pdfUrl = "";
      try {
        await supabase.storage
          .from("presupuestos")
          .upload(`manuales/${pdfFileName}`, pdfBlob, {
            contentType: "application/pdf",
            upsert: true,
          });
        const { data: urlData } = supabase.storage
          .from("presupuestos")
          .getPublicUrl(`manuales/${pdfFileName}`);
        pdfUrl = urlData?.publicUrl || "";
      } catch {
        // storage opcional — no bloquea el guardado
      }

      // 3. Descargar PDF localmente
      pdfDoc.save(`Presupuesto_${(cliente.nombre || "cliente").replace(/\s+/g, "_")}_${numeroCot}.pdf`);

      let toastMsg: string;
      const descActividad = pdfUrl
        ? `📄 Presupuesto manual generado — ${numeroCot}\nTotal: $ ${totalFinal.toLocaleString("es-CO")}\nVer PDF: ${pdfUrl}`
        : `Presupuesto manual generado — ${cliente.proyecto} — Total: $${totalFinal.toLocaleString("es-CO")} — Nro: ${numeroCot}`;

      if (leadId) {
        await Promise.all([
          supabase.from("lead_actividades").insert({
            lead_id: leadId, tipo: "NOTA",
            descripcion: descActividad,
            usuario: "Comercial",
          }),
          supabase.from("leads").update({
            presupuesto_estimado: totalFinal,
            nombre_proyecto: cliente.proyecto || conjunto,
            updated_at: new Date().toISOString(),
          }).eq("id", leadId),
        ]);
        toastMsg = "✅ Cotización guardada y lead actualizado en el CRM";
      } else {
        const { data: nuevoLead } = await supabase.from("leads").insert({
          nombre: cliente.nombre, telefono: cliente.telefono, email: "",
          fecha_contacto: fecha, origen: "OTRO", tipo_proyecto: "VIS",
          nombre_proyecto: cliente.proyecto, presupuesto_estimado: totalFinal,
          observaciones: "ppto manual", etapa: "PROSPECCION",
          probabilidad: 10, fuente: "OTRO", responsable: "Jeisson",
        }).select("id").single();
        if (nuevoLead) {
          await supabase.from("lead_actividades").insert({
            lead_id: nuevoLead.id, tipo: "NOTA",
            descripcion: descActividad,
            usuario: "Comercial",
          });
        }
        toastMsg = "✅ Cotización guardada y lead creado en Prospección del CRM";
      }

      const { error } = await supabase.from("cotizaciones").insert({
        cliente_nombre: cliente.nombre, cliente_telefono: cliente.telefono, cliente_email: "",
        proyecto_id: catalogoId, proyecto_nombre: cliente.proyecto,
        plan_tipo: "manual", plan_nombre: planBase || "Presupuesto Manual",
        precio_plan: precioBase ?? baseTotal, total: totalFinal,
        adicionales: JSON.stringify(itemsAdicionales),
        numero_cotizacion: numeroCot, estado_crm: "NUEVO",
        ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
      });
      if (error) throw error;
      mostrarToast(toastMsg);
    } catch (err: any) {
      mostrarToast(`❌ Error: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const paso1Completo = cliente.nombre.trim() && cliente.telefono.trim() && cliente.proyecto.trim() && fecha && catalogoId;
  const itemsPlanNombres = (planBase === "Plan Básico"
    ? ITEMS_PLAN_BASICO
    : planBase === "Plan Intermedio Plus"
    ? ITEMS_PLAN_INTERMEDIO
    : []
  ).map((n) => n.toLowerCase().trim());

  const itemsFiltrados = items.filter((i) => {
    if (itemsPlanNombres.includes(i.nombre?.toLowerCase().trim() ?? "")) return false;
    if (!busqueda.trim()) return true;
    const t = busqueda.toLowerCase();
    return i.nombre.toLowerCase().includes(t) || (i.descripcion || "").toLowerCase().includes(t);
  });
  const grupos = agruparPorCategoria(itemsFiltrados);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
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
                {paso === 1 ? "Datos del cliente" : paso === 2 ? "Selección de ítems" : "Resumen y PDF"}
              </p>
            </div>
            <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-700">
              ← Volver
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= paso ? "bg-emerald-500" : "bg-gray-200"}`} />
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

              <div className="relative">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Buscar lead existente (opcional)</label>
                <Input
                  value={busquedaLead}
                  onChange={(e) => { setBusquedaLead(e.target.value); setLeadId(null); setMostrarDropdownLead(e.target.value.length >= 2); }}
                  onFocus={() => { if (busquedaLead.length >= 2) setMostrarDropdownLead(true); }}
                  onBlur={() => setTimeout(() => setMostrarDropdownLead(false), 150)}
                  placeholder="Nombre o teléfono del lead…"
                />
                {mostrarDropdownLead && (() => {
                  const t = busquedaLead.toLowerCase();
                  const resultados = leads.filter((l) =>
                    l.nombre?.toLowerCase().includes(t) ||
                    (l.telefono || "").replace(/\s/g, "").includes(t.replace(/\s/g, ""))
                  ).slice(0, 6);
                  return resultados.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      {resultados.map((lead) => (
                        <button key={lead.id} type="button"
                          onMouseDown={() => {
                            setLeadId(lead.id);
                            setCliente({ nombre: lead.nombre, telefono: lead.telefono || "", proyecto: lead.nombre_proyecto || cliente.proyecto });
                            setBusquedaLead(lead.nombre + " — " + (lead.telefono || ""));
                            setMostrarDropdownLead(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{lead.nombre}</p>
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
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Lead vinculado
                    </span>
                  ) : cliente.nombre.trim() && cliente.telefono.trim() ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Se creará un lead nuevo en Prospección
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del cliente *</label>
                  <Input value={cliente.nombre} onChange={(e) => setCliente((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: María García" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono *</label>
                  <Input value={cliente.telefono} onChange={(e) => setCliente((p) => ({ ...p, telefono: e.target.value }))} placeholder="Ej: 310 234 5678" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del proyecto *</label>
                  <Input value={cliente.proyecto} onChange={(e) => setCliente((p) => ({ ...p, proyecto: e.target.value }))} placeholder="Ej: Fiore 2 - Torre A Apto 301" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha *</label>
                  <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Conjunto residencial *</label>
                  <select
                    value={conjunto}
                    onChange={(e) => { setConjunto(e.target.value); if (!cliente.proyecto.trim()) setCliente((p) => ({ ...p, proyecto: e.target.value })); }}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona un conjunto…</option>
                    {CONJUNTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan base (opcional)</label>
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Catálogo de precios *</label>
                <select
                  value={catalogoId}
                  onChange={(e) => setCatalogoId(e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona un catálogo…</option>
                  {catalogos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={continuar} disabled={!paso1Completo || loading} className="bg-emerald-600 hover:bg-emerald-700">
                  {loading ? "Cargando ítems…" : "Continuar →"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══════════════ PASO 2 ═══════════════ */}
        {paso === 2 && (
          <div>
            {/* Banner plan */}
            {precioBase !== null && (
              <div className="mb-3 rounded-xl" style={{ background: "#14532d", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{planBase} — {conjunto}</div>
                  <div style={{ color: "#86efac", fontSize: 12 }}>Precio base del plan incluido</div>
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>
                  {ajusteTotal < 0 ? (
                    <span>
                      <span style={{ textDecoration: "line-through", opacity: 0.55, fontSize: 14, marginRight: 6 }}>{cop(precioBase)}</span>
                      {cop(precioEfectivo)}
                    </span>
                  ) : cop(precioBase)}
                </div>
              </div>
            )}

            {/* ── TABLA ÍTEMS DEL PLAN ─────────────────────────────────── */}
            {planBase !== "" && secciones.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-4 py-2.5">
                  <span className="text-sm font-bold text-gray-900">Incluido en {planBase}</span>
                </div>
                <table className="w-full" style={{ fontSize: 13 }}>
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Ítem</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">¿Aplica?</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Cant.</th>
                      {hayDescuentos && <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Descuento ($)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {secciones.map(({ seccion, items: planItems }) => (
                      <>
                        <tr key={`sec-${seccion}`}>
                          <td colSpan={hayDescuentos ? 4 : 3} className="bg-gray-100 px-4 py-1 text-[11px] font-bold text-gray-700">
                            {seccion}
                          </td>
                        </tr>
                        {planItems.map((itemNombre) => {
                          const estado = itemsPlanEstado[itemNombre];
                          const aplica = estado?.aplica ?? true;
                          return (
                            <tr key={`${seccion}-${itemNombre}`} className="border-b border-gray-100">
                              <td className={`px-4 py-1.5 ${!aplica ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                {itemNombre}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleItemPlan(itemNombre)}
                                  className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${aplica ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                                >
                                  {aplica ? "SÍ" : "NO"}
                                </button>
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {aplica ? (
                                  <input
                                    type="number"
                                    min={1}
                                    value={estado?.cantidad ?? 1}
                                    onChange={(e) => setCantidadPlan(itemNombre, e.target.value)}
                                    className="h-7 w-12 rounded border border-gray-300 text-center text-xs"
                                    style={{ color: "#111827", backgroundColor: "#fff" }}
                                  />
                                ) : <span className="text-gray-400">—</span>}
                              </td>
                              {hayDescuentos && (
                                <td className="px-3 py-1.5 text-right">
                                  {!aplica ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500">$</span>
                                        <input
                                          type="number"
                                          value={estado?.descuento ?? 0}
                                          onChange={(e) => setDescuentoPlan(itemNombre, e.target.value)}
                                          placeholder="ej: -1200000"
                                          className="h-7 w-28 rounded border border-red-300 px-2 text-right text-xs"
                                          style={{ color: "#dc2626", backgroundColor: "#fff5f5" }}
                                        />
                                      </div>
                                      {(estado?.descuento ?? 0) !== 0 && (
                                        <span className="text-[10px] font-semibold text-red-500">
                                          Descuento: $ {Math.abs(estado?.descuento ?? 0).toLocaleString("es-CO")}
                                        </span>
                                      )}
                                    </div>
                                  ) : null}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </>
                    ))}
                    {/* Bonus */}
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-1.5 text-gray-900">
                        Tendedero abatible en zona húmeda
                        <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">BONUS GRATIS</span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">SÍ</span>
                      </td>
                      <td className="px-3 py-1.5 text-center text-xs text-gray-700">1</td>
                      {hayDescuentos && <td />}
                    </tr>
                    {/* Total plan */}
                    <tr className="bg-gray-900">
                      <td colSpan={hayDescuentos ? 4 : 3} className="px-4 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">TOTAL {planBase}</span>
                          <div className="text-right">
                            {ajusteTotal < 0 && (
                              <div style={{ color: "rgba(255,255,255,0.45)", textDecoration: "line-through", fontSize: 11 }}>
                                {cop(precioBase!)}
                              </div>
                            )}
                            <span className="text-sm font-bold text-white">{cop(precioEfectivo)}</span>
                          </div>
                        </div>
                        {ajusteTotal < 0 && (
                          <div className="mt-1 text-right text-[10px] font-semibold text-red-400">
                            Ajuste: - $ {Math.abs(ajusteTotal).toLocaleString("es-CO")}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-6">
              {/* columna ítems del catálogo */}
              <div className="min-w-0 flex-1">
                <div className="mb-4">
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar ítems adicionales por nombre o descripción…"
                    style={{ color: "var(--color-text-primary, #111827)", backgroundColor: "var(--color-background-primary, #ffffff)" }}
                  />
                </div>

                {grupos.length === 0 && (
                  <p className="py-12 text-center text-sm text-gray-500">No se encontraron ítems</p>
                )}

                {grupos.map(({ categoria, items: gItems }) => (
                  <div key={categoria} className="mb-6">
                    <div className="mb-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">{categoria}</div>
                    <div className="space-y-2">
                      {gItems.map((item) => {
                        const sel = seleccionados[item.id] !== undefined;
                        const esDePlan = itemsPlanSet.has(item.id);
                        const precioConUtilidad = Math.round(item.valor_venta * 1.20);
                        return (
                          <div key={item.id} className={`rounded-lg border px-4 py-3 transition-colors ${sel ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"}`}>
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={sel}
                                onChange={(e) => toggleItem(item, e.target.checked)}
                                className="mt-1 h-4 w-4 cursor-pointer accent-emerald-600"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.codigo && <span className="text-xs text-gray-400">{item.codigo} · </span>}
                                  <span className="font-semibold text-gray-900">{item.nombre}</span>
                                  {esDePlan && (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Incluido en plan</span>
                                  )}
                                </div>
                                {item.descripcion && <p className="mt-0.5 text-xs text-gray-500">{item.descripcion}</p>}
                                {item.id.startsWith("extra-") && (
                                  <span className="mt-1 inline-block rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">Sin precio — actualizar en catálogo</span>
                                )}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-0.5">
                                {item.valor_venta > 0 ? (
                                  <>
                                    <span className="text-xs text-gray-400 line-through">{cop(item.valor_venta)}</span>
                                    <span className="text-sm font-bold text-emerald-700">{cop(precioConUtilidad)}</span>
                                    <span className="text-[10px] text-emerald-500">+20% utilidad</span>
                                  </>
                                ) : (
                                  <span className="text-sm font-semibold text-gray-400">A convenir</span>
                                )}
                                {sel && (
                                  <input
                                    type="number" min={1} value={seleccionados[item.id]}
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
                        Ítems: <span className="font-semibold text-gray-900">{itemsSeleccionados.length}</span>
                      </div>
                      <div className="mb-4 space-y-2 border-t border-gray-100 pt-4">
                        {precioBase !== null ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Plan base</span>
                              <span className="font-semibold text-gray-900">{cop(precioEfectivo)}</span>
                            </div>
                            {subtotalAdicionales > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Adicionales</span>
                                <span className="font-semibold text-gray-900">{cop(subtotalAdicionales)}</span>
                              </div>
                            )}
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
                      <button onClick={() => setPaso(1)} className="mt-3 w-full text-center text-xs text-gray-500 hover:text-gray-700">
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
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-mono text-gray-600">{numeroCot}</span>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
                  <div><span className="text-gray-500">Cliente</span><p className="font-semibold text-gray-900">{cliente.nombre}</p></div>
                  <div><span className="text-gray-500">Teléfono</span><p className="font-semibold text-gray-900">{cliente.telefono}</p></div>
                  <div><span className="text-gray-500">Proyecto</span><p className="font-semibold text-gray-900">{cliente.proyecto}</p></div>
                </div>

                {/* ── TABLA DEL PLAN ─────────────────────────────────────── */}
                {precioBase !== null && planBase && secciones.length > 0 && (
                  <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
                    {/* Header negro */}
                    <div className="bg-gray-900 px-4 py-3">
                      <div className="text-xs font-bold text-white">CONSTRUCTORA COLOMBIA REMODELA</div>
                      <div className="text-[11px] text-gray-400">Constructora Colombia Remodela — {conjunto}</div>
                    </div>
                    <table className="w-full" style={{ fontSize: 13 }}>
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Ítem</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">¿Aplica?</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Cantidad / Área</th>
                        </tr>
                      </thead>
                      <tbody>
                        {secciones.map(({ seccion, items: planItems }) => (
                          <>
                            <tr key={`r3-sec-${seccion}`}>
                              <td colSpan={3} className="bg-gray-100 px-4 py-1 text-[11px] font-bold text-gray-700">{seccion}</td>
                            </tr>
                            {planItems.map((itemNombre) => {
                              const estado = itemsPlanEstado[itemNombre];
                              const aplica = estado?.aplica ?? true;
                              return (
                                <tr key={`r3-${seccion}-${itemNombre}`} className="border-b border-gray-100">
                                  <td className="px-4 py-1.5 text-gray-900">{itemNombre}</td>
                                  <td className="px-3 py-1.5 text-center">
                                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${aplica ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                      {aplica ? "SÍ" : "NO"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-1.5 text-center text-gray-700">
                                    {aplica ? (estado?.cantidad ?? 1) : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        ))}
                        {/* Bonus */}
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-1.5 text-gray-900">
                            Tendedero abatible en zona húmeda
                            <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">BONUS GRATIS</span>
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">SÍ</span>
                          </td>
                          <td className="px-3 py-1.5 text-center text-gray-700">1</td>
                        </tr>
                        {/* Filas de descuento por ítems removidos */}
                        {Object.entries(itemsPlanEstado)
                          .filter(([_, e]) => !e.aplica && e.descuento !== 0)
                          .map(([nombre, e]) => (
                            <tr key={`desc-${nombre}`} className="border-b border-red-100 bg-red-50">
                              <td className="px-4 py-1.5 text-xs italic text-red-600" colSpan={2}>
                                — Sin {nombre}
                              </td>
                              <td className="px-3 py-1.5 text-right text-xs font-bold text-red-600">
                                {cop(e.descuento)}
                              </td>
                            </tr>
                          ))}
                        {/* Total plan */}
                        <tr className="bg-gray-900">
                          <td colSpan={3} className="px-4 py-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white">TOTAL {planBase}</span>
                              <div className="text-right">
                                {ajusteTotal < 0 && (
                                  <div style={{ color: "rgba(255,255,255,0.45)", textDecoration: "line-through", fontSize: 11 }}>
                                    {cop(precioBase!)}
                                  </div>
                                )}
                                <span className="text-sm font-bold text-white">{cop(precioEfectivo)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── ADICIONALES ────────────────────────────────────────── */}
                {(() => {
                  const itemsMostrar = precioBase !== null ? itemsAdicionales : itemsSeleccionados;
                  if (itemsMostrar.length === 0) return null;
                  return (
                    <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
                      <div className="border-b border-gray-200 bg-gray-700 px-4 py-2">
                        <span className="text-xs font-bold text-white">
                          {precioBase !== null ? "ADICIONALES" : "ÍTEMS SELECCIONADOS"}
                        </span>
                      </div>
                      <table className="w-full" style={{ fontSize: 13 }}>
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Cód.</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Ítem</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Cant.</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Vlr. Unit. (+20%)</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsMostrar.map((item) => {
                            const precioUtil = Math.round(item.valor_venta * 1.20);
                            const cant = seleccionados[item.id] || 1;
                            return (
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="px-3 py-1.5 text-xs text-gray-400">{item.codigo || "—"}</td>
                                <td className="px-3 py-1.5 text-gray-900">{item.nombre}</td>
                                <td className="px-3 py-1.5 text-center text-gray-700">{cant}</td>
                                <td className="px-3 py-1.5 text-right text-gray-700">
                                  {item.valor_venta > 0 ? cop(precioUtil) : "A convenir"}
                                </td>
                                <td className="px-3 py-1.5 text-right font-semibold text-gray-900">
                                  {item.valor_venta > 0 ? cop(precioUtil * cant) : "A convenir"}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="border-t border-gray-200 bg-gray-50">
                            <td colSpan={4} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                              {precioBase !== null ? "Subtotal adicionales" : "Subtotal"}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">
                              {cop(precioBase !== null ? subtotalAdicionales : subtotalSinPlan)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* totales finales */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex flex-col items-end gap-2">
                    {precioBase !== null ? (
                      <>
                        <div className="flex w-72 justify-between text-sm">
                          <span className="text-gray-600">Plan base</span>
                          <span className="font-semibold text-gray-900">{cop(precioEfectivo)}</span>
                        </div>
                        {subtotalAdicionales > 0 && (
                          <div className="flex w-72 justify-between text-sm">
                            <span className="text-gray-600">Adicionales</span>
                            <span className="font-semibold text-gray-900">{cop(subtotalAdicionales)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex w-72 justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-900">{cop(subtotalSinPlan)}</span>
                      </div>
                    )}

                    <div className="flex w-72 items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={aplicaIva} onChange={(e) => setAplicaIva(e.target.checked)} />
                          <div className={`h-5 w-9 rounded-full transition-colors ${aplicaIva ? "bg-emerald-500" : "bg-gray-300"}`} />
                          <div className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${aplicaIva ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                        Aplicar IVA 19%
                      </label>
                      {aplicaIva && <span className="text-sm font-semibold text-gray-900">{cop(iva)}</span>}
                    </div>

                    <div className="flex w-72 justify-between border-t border-gray-300 pt-2">
                      <span className="text-base font-bold text-gray-900">TOTAL GENERAL</span>
                      <span className="text-base font-bold text-emerald-700">{cop(totalFinal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas y condiciones</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={4}
                    placeholder="Validez de la cotización, forma de pago, exclusiones, etc."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Sección bonus */}
                <div style={{ background: "#111", borderRadius: 8, padding: 16, marginTop: 20 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                    BONUS GRATIS — Te llevas todos estos Bonus con tu remodelación
                  </div>
                  <table style={{ width: "100%", fontSize: 12 }}>
                    <tbody>
                      {BONUS_ITEMS.map((b) => (
                        <tr key={b}>
                          <td style={{ color: "#fff", paddingTop: 4, paddingBottom: 4 }}>{b}</td>
                          <td style={{ textAlign: "right", color: "#86efac", fontWeight: 700 }}>GRATIS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 12, fontSize: 11, color: "#d1d5db" }}>
                    {[`* Tiempo de entrega de ${diasEntrega} días hábiles.`, CONDICIONES[1], CONDICIONES[2]].map((c) => (
                      <p key={c} style={{ marginBottom: 4 }}>{c}</p>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11 }}>
                    <p style={{ color: "#d1d5db" }}>
                      Instagram:{" "}
                      <a href="https://www.instagram.com/constructoracol.remodela" style={{ color: "#86efac" }}>
                        @constructoracol.remodela
                      </a>
                    </p>
                    <p style={{ color: "#d1d5db" }}>
                      Página web:{" "}
                      <a href="https://www.constructoracolombia.com/remodelaciones" style={{ color: "#86efac" }}>
                        constructoracolombia.com/remodelaciones
                      </a>
                    </p>
                  </div>
                  <div style={{ marginTop: 16, textAlign: "center", fontStyle: "italic", fontSize: 12, color: "#9ca3af" }}>
                    "Más que una constructora, un aliado para llevar a la realidad el hogar o negocio de tus sueños"
                  </div>
                </div>

                {/* Botón WhatsApp */}
                <a
                  href={`https://wa.me/573175639674?text=${encodeURIComponent(`Hola, me interesa este presupuesto (${numeroCot}), quiero avanzar`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 10, backgroundColor: "#25D366", color: "white",
                    padding: "14px 24px", borderRadius: 12, textDecoration: "none",
                    fontWeight: 500, fontSize: 15, marginTop: 20,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.847L.057 23.882l6.198-1.625A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.366l-.36-.214-3.68.965.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                  Contactar por WhatsApp — Quiero avanzar
                </a>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setPaso(2)} className="text-sm text-gray-500 hover:text-gray-700">← Volver a ítems</button>
              <div className="flex-1" />
              <Button onClick={descargarPDF} variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">Descargar PDF</Button>
              <Button onClick={guardarCotizacion} disabled={guardando} className="bg-emerald-600 hover:bg-emerald-700">
                {guardando ? "Guardando…" : "Guardar cotización"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")} className="text-gray-600">Ver en Flujo Comercial →</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
