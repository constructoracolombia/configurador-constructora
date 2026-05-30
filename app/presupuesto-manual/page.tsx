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
  const [itemsOcultos, setItemsOcultos] = useState<Set<string>>(new Set());
  const [precioManual, setPrecioManual] = useState<number | null>(null);

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
    setItemsOcultos(new Set());
  }, [planBase]);

  // resetea precio manual al cambiar plan o conjunto
  useEffect(() => { setPrecioManual(null); }, [planBase, conjunto]);

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

  const toggleOcultarItem = (nombre: string) => {
    setItemsOcultos((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre);
      else next.add(nombre);
      return next;
    });
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
  const precioEfectivo = precioManual !== null
    ? precioManual
    : (precioBase || 0) + ajusteTotal;

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
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const rNegro = 15; const gNegro = 15; const bNegro = 15;
    const rVerde = 34; const gVerde = 139; const bVerde = 57;
    const rGrisClaro = 245; const gGrisClaro = 245; const bGrisClaro = 243;
    const rGrisTexto = 100; const gGrisTexto = 100; const bGrisTexto = 100;
    // ── HEADER negro ──────────────────────────────────────────────────────────
    doc.setFillColor(rNegro, gNegro, bNegro);
    doc.rect(0, 0, W, 44, "F");

    // Logo C en círculo verde
    doc.setFillColor(rVerde, gVerde, bVerde);
    doc.circle(18, 22, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("C", 18, 26, { align: "center" });

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("CONSTRUCTORA COLOMBIA REMODELA", 30, 18);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("Su aliado en remodelación · Bucaramanga, Colombia", 30, 25);

    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Nro. ${numeroCot}`, W - 12, 16, { align: "right" });
    doc.text(new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }), W - 12, 22, { align: "right" });
    if (planBase) {
      doc.setTextColor(rVerde, gVerde, bVerde);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(planBase.toUpperCase(), W - 12, 28, { align: "right" });
    }

    // ── DATOS CLIENTE ─────────────────────────────────────────────────────────
    doc.setFillColor(rGrisClaro, gGrisClaro, bGrisClaro);
    doc.roundedRect(12, 50, W - 24, 22, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);
    doc.text("CLIENTE", 18, 58);
    doc.text("CONJUNTO", 75, 58);
    doc.text("CIUDAD", 145, 58);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(rNegro, gNegro, bNegro);
    doc.setFontSize(9);
    doc.text(`${cliente.nombre}  ·  ${cliente.telefono}`, 18, 65);
    doc.text(cliente.proyecto || conjunto, 75, 65);
    doc.text("Bucaramanga", 145, 65);

    // ── TÍTULO TABLA ──────────────────────────────────────────────
    doc.setFillColor(rNegro, gNegro, bNegro);
    doc.rect(12, 78, W - 24, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Constructora Colombia Remodela — ${cliente.proyecto || conjunto}`, W / 2, 83.5, { align: "center" });

    // ── TABLA DEL PLAN ────────────────────────────────────────────
    const seccionesActivas = planBase === "Plan Básico" ? PLAN_BASICO_SECCIONES : PLAN_INTERMEDIO_SECCIONES;
    const bodyPlan: any[][] = [];
    seccionesActivas.forEach((sec) => {
      const itemsVisibles = sec.items.filter((n) => !itemsOcultos.has(n));
      if (itemsVisibles.length === 0) return;
      bodyPlan.push([{
        content: sec.seccion, colSpan: 2,
        styles: { fillColor: [230, 230, 228], textColor: [rNegro, gNegro, bNegro], fontStyle: "bold", fontSize: 7.5 },
      }]);
      itemsVisibles.forEach((nombre) => {
        const estado = itemsPlanEstado[nombre];
        bodyPlan.push([nombre, String(estado?.cantidad || 1)]);
      });
    });

    autoTable(doc, {
      startY: 87,
      head: [["Ítem", "Cant."]],
      body: bodyPlan,
      foot: [[
        { content: "✦  Tendedero abatible en zona húmeda — BONUS GRATIS", styles: { textColor: [rVerde, gVerde, bVerde], fontStyle: "italic" } },
        { content: "1", styles: { textColor: [rVerde, gVerde, bVerde] } },
      ]],
      theme: "grid",
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      footStyles: { fillColor: [255, 255, 255], fontSize: 7.5, lineWidth: 0.1 },
      bodyStyles: { fontSize: 8, textColor: [rNegro, gNegro, bNegro] },
      columnStyles: { 0: { cellWidth: "auto" as const }, 1: { cellWidth: 18, halign: "center" as const } },
      alternateRowStyles: { fillColor: [250, 250, 249] },
      margin: { left: 12, right: 12 },
    });

    let currentY: number = (doc as any).lastAutoTable.finalY + 2;

    // Fila TOTAL plan
    doc.setFillColor(rNegro, gNegro, bNegro);
    doc.rect(12, currentY, W - 24, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`TOTAL ${planBase}`, 16, currentY + 6);
    doc.text(`$ ${precioEfectivo.toLocaleString("es-CO")}`, W - 14, currentY + 6, { align: "right" });
    currentY += 14;

    // ── ADICIONALES ───────────────────────────────────────────────
    const adicsList = items.filter((i) => seleccionados[i.id] && !itemsOcultos.has(i.nombre));
    if (adicsList.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [["Cód.", "Ítem", "Cant.", "Vlr. Unitario", "Total"]],
        body: adicsList.map((item) => {
          const cant = seleccionados[item.id] || 1;
          const precioConUtil = Math.round(item.valor_venta * 1.2);
          return [
            item.codigo || "—",
            item.nombre,
            String(cant),
            `$ ${precioConUtil.toLocaleString("es-CO")}`,
            `$ ${(precioConUtil * cant).toLocaleString("es-CO")}`,
          ];
        }),
        theme: "grid",
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [rNegro, gNegro, bNegro] },
        columnStyles: {
          0: { cellWidth: 14, halign: "center" as const },
          1: { cellWidth: "auto" as const },
          2: { cellWidth: 14, halign: "center" as const },
          3: { cellWidth: 30, halign: "right" as const },
          4: { cellWidth: 30, halign: "right" as const },
        },
        alternateRowStyles: { fillColor: [250, 250, 249] },
        margin: { left: 12, right: 12 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 3;
    }

    // ── TOTALES ───────────────────────────────────────────────────
    const subtotalAdic = adicsList.reduce((sum, item) => {
      const cant = seleccionados[item.id] || 1;
      return sum + Math.round(item.valor_venta * 1.2) * cant;
    }, 0);

    const lineX = W - 12;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);

    if (planBase) {
      doc.text("Plan base:", lineX - 45, currentY + 5);
      doc.text(`$ ${precioEfectivo.toLocaleString("es-CO")}`, lineX, currentY + 5, { align: "right" });
      currentY += 6;
    }
    if (subtotalAdic > 0) {
      doc.text("Adicionales:", lineX - 45, currentY + 5);
      doc.text(`$ ${subtotalAdic.toLocaleString("es-CO")}`, lineX, currentY + 5, { align: "right" });
      currentY += 6;
    }

    doc.setDrawColor(rNegro, gNegro, bNegro);
    doc.setLineWidth(0.4);
    doc.line(lineX - 55, currentY + 2, lineX, currentY + 2);
    currentY += 5;

    doc.setFillColor(rNegro, gNegro, bNegro);
    doc.roundedRect(lineX - 60, currentY, 60, 11, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL", lineX - 55, currentY + 7.5);
    doc.text(`$ ${totalFinal.toLocaleString("es-CO")}`, lineX - 3, currentY + 7.5, { align: "right" });
    currentY += 18;

    // ── BONUS GRATIS ──────────────────────────────────────────────
    autoTable(doc, {
      startY: currentY,
      head: [[{ content: "✦  BONUS GRATIS — Te llevas todos estos beneficios con tu remodelación", colSpan: 2 }]],
      body: BONUS_ITEMS.map((b) => [b, "GRATIS"]),
      theme: "grid",
      headStyles: { fillColor: [rNegro, gNegro, bNegro], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "center" as const },
      bodyStyles: { fontSize: 7.5, textColor: [rNegro, gNegro, bNegro] },
      columnStyles: {
        0: { cellWidth: "auto" as const },
        1: { cellWidth: 22, halign: "center" as const, fontStyle: "bold", textColor: [rVerde, gVerde, bVerde] },
      },
      alternateRowStyles: { fillColor: [250, 250, 249] },
      margin: { left: 12, right: 12 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // ── CONDICIONES ───────────────────────────────────────────────
    const diasEntregaPDF = planBase === "Plan Básico" ? 39 : 59;
    const condsPDF = [
      `• Tiempo de entrega: ${diasEntregaPDF} días hábiles.`,
      "• Te enviamos avances semanales de tu apartamento por WhatsApp.",
      "• Precio de enchape calculado a $ 40.000/m².",
    ];
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);
    condsPDF.forEach((c, i) => { doc.text(c, 14, currentY + i * 5); });
    currentY += condsPDF.length * 5 + 4;

    doc.setTextColor(rVerde, gVerde, bVerde);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Instagram: @constructoracol.remodela", 14, currentY);
    doc.text("Web: constructoracolombia.com/remodelaciones", 14, currentY + 5);
    currentY += 12;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);
    doc.text(
      "Más que una constructora, un aliado para llevar a la realidad el hogar o negocio de tus sueños",
      W / 2, currentY, { align: "center", maxWidth: W - 28 }
    );

    // ── PIE DE PÁGINA ─────────────────────────────────────────────
    doc.setFillColor(rGrisClaro, gGrisClaro, bGrisClaro);
    doc.rect(0, H - 14, W, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);
    doc.text("Este presupuesto tiene validez de 30 días desde la fecha de emisión.", W / 2, H - 8, { align: "center" });
    doc.text(`WhatsApp: +57 317 5639674  ·  ${numeroCot}`, W / 2, H - 4, { align: "center" });

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
      const pdfArrayBuffer = pdfDoc.output("arraybuffer");
      const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const fileName = `manuales/${numeroCot}.pdf`;

      // 2. Subir PDF a Supabase Storage
      let pdfUrl = "";
      try {
        const { error: uploadError } = await supabase.storage
          .from("presupuestos")
          .upload(fileName, pdfBlob, {
            contentType: "application/pdf",
            upsert: true,
            cacheControl: "3600",
          });
        if (uploadError) {
          console.error("Error subiendo PDF:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("presupuestos")
            .getPublicUrl(fileName);
          pdfUrl = urlData?.publicUrl || "";
        }
      } catch (e) {
        console.error("Error storage:", e);
      }

      // 3. Descargar PDF localmente
      pdfDoc.save(`Presupuesto_${(cliente.nombre || "cliente").replace(/\s+/g, "_")}_${numeroCot}.pdf`);

      const mensajeActividad = [
        `📄 Presupuesto manual: ${numeroCot}`,
        `💰 Total: $ ${totalFinal.toLocaleString("es-CO")}`,
        `📋 Plan: ${planBase || "Sin plan"} — ${conjunto || cliente.proyecto}`,
        pdfUrl ? `🔗 Ver PDF: ${pdfUrl}` : "(PDF no disponible)",
      ].join("\n");

      let toastMsg: string;

      if (leadId) {
        await Promise.all([
          supabase.from("lead_actividades").insert({
            lead_id: leadId, tipo: "DOCUMENTO",
            descripcion: mensajeActividad,
            usuario: "Comercial",
          }),
          supabase.from("leads").update({
            presupuesto_estimado: totalFinal,
            nombre_proyecto: cliente.proyecto || conjunto,
            observaciones: mensajeActividad,
            updated_at: new Date().toISOString(),
          }).eq("id", leadId),
        ]);
        toastMsg = "✅ Cotización guardada y lead actualizado en el CRM";
      } else {
        const { data: nuevoLead } = await supabase.from("leads").insert({
          nombre: cliente.nombre, telefono: cliente.telefono, email: "",
          fecha_contacto: fecha, origen: "OTRO", tipo_proyecto: "VIS",
          nombre_proyecto: cliente.proyecto, presupuesto_estimado: totalFinal,
          observaciones: mensajeActividad, etapa: "PROSPECCION",
          probabilidad: 10, fuente: "OTRO", responsable: "Jeisson",
        }).select("id").single();
        if (nuevoLead) {
          await supabase.from("lead_actividades").insert({
            lead_id: nuevoLead.id, tipo: "DOCUMENTO",
            descripcion: mensajeActividad,
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
                  {precioManual !== null && precioManual !== precioBase && (
                    <div style={{ color: "#86efac", fontSize: 11, marginTop: 2 }}>Precio ajustado manualmente</div>
                  )}
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>
                  {precioManual !== null ? (
                    cop(precioManual)
                  ) : ajusteTotal < 0 ? (
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
                      <th className="py-2 pl-2 pr-0" style={{ width: 24 }} />
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
                          <td colSpan={hayDescuentos ? 5 : 4} className="bg-gray-100 px-4 py-1 text-[11px] font-bold text-gray-700">
                            {seccion}
                          </td>
                        </tr>
                        {planItems.map((itemNombre) => {
                          const estado = itemsPlanEstado[itemNombre];
                          const aplica = estado?.aplica ?? true;
                          const oculto = itemsOcultos.has(itemNombre);
                          return (
                            <tr
                              key={`${seccion}-${itemNombre}`}
                              className="border-b border-gray-100"
                              style={{ opacity: oculto ? 0.3 : 1, transition: "opacity 0.15s" }}
                            >
                              <td className={`py-1.5 pl-2 pr-0 text-center`} style={{ width: 24 }}>
                                <button
                                  type="button"
                                  onClick={() => toggleOcultarItem(itemNombre)}
                                  title={oculto ? "Mostrar en presupuesto" : "Ocultar del presupuesto"}
                                  style={{
                                    fontSize: 13, lineHeight: 1, background: "none", border: "none",
                                    cursor: "pointer", color: oculto ? "#dc2626" : "#9ca3af",
                                    textDecoration: oculto ? "line-through" : "none",
                                    padding: "2px 4px",
                                  }}
                                >
                                  👁
                                </button>
                              </td>
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
                      <td />
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
                      <td colSpan={hayDescuentos ? 5 : 4} className="px-4 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">TOTAL {planBase}</span>
                          <div className="flex items-center gap-2">
                            {precioManual === null && ajusteTotal < 0 && (
                              <span style={{ color: "rgba(255,255,255,0.45)", textDecoration: "line-through", fontSize: 11 }}>
                                {cop(precioBase!)}
                              </span>
                            )}
                            <input
                              type="text"
                              value={precioEfectivo.toLocaleString("es-CO")}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\./g, "").replace(/[^0-9-]/g, "");
                                const num = parseInt(raw, 10);
                                if (!isNaN(num)) setPrecioManual(num);
                              }}
                              style={{
                                background: "transparent", border: "none",
                                borderBottom: "1px solid rgba(255,255,255,0.4)",
                                color: "white", fontWeight: "bold", fontSize: 15,
                                textAlign: "right", width: 160, outline: "none",
                              }}
                            />
                          </div>
                        </div>
                        {precioManual !== null && precioManual !== precioBase && (
                          <div className="mt-0.5 text-right text-[10px] text-emerald-400">editado manualmente</div>
                        )}
                        {precioManual === null && ajusteTotal < 0 && (
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
                        {secciones.map(({ seccion, items: planItems }) => {
                          const visibles = planItems.filter((n) => !itemsOcultos.has(n));
                          if (visibles.length === 0) return null;
                          return (
                            <>
                              <tr key={`r3-sec-${seccion}`}>
                                <td colSpan={3} className="bg-gray-100 px-4 py-1 text-[11px] font-bold text-gray-700">{seccion}</td>
                              </tr>
                              {visibles.map((itemNombre) => {
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
                          );
                        })}
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
                  href={`https://wa.me/573175639674?text=${encodeURIComponent(`Hola, me interesa el presupuesto ${numeroCot} por $ ${totalFinal.toLocaleString("es-CO")}. Quiero avanzar.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 12, backgroundColor: "#25D366", color: "white",
                    padding: "16px 32px", borderRadius: 14, textDecoration: "none",
                    fontWeight: 600, fontSize: 16, marginTop: 24, letterSpacing: "0.01em",
                    boxShadow: "0 4px 14px rgba(37,211,102,0.35)", transition: "opacity 0.2s",
                  }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.92"; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.306A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.898 13.87c-.207.583-1.215 1.114-1.656 1.15-.44.038-.854.207-2.876-.598-2.432-.983-3.99-3.47-4.11-3.63-.12-.16-.976-1.298-.976-2.476 0-1.178.617-1.757.835-1.994.22-.237.478-.297.638-.297l.459.009c.148.006.346-.056.541.413.2.48.68 1.658.74 1.778.06.12.1.26.02.418-.08.158-.12.257-.238.396-.12.14-.252.312-.36.42-.12.116-.245.242-.105.474.14.233.62.965 1.329 1.563.913.786 1.683 1.03 1.917 1.144.233.115.368.096.503-.058.136-.154.583-.68.738-.913.154-.234.308-.194.518-.116.21.077 1.333.628 1.562.743.228.115.38.173.437.27.057.096.057.554-.15 1.137z"/>
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
