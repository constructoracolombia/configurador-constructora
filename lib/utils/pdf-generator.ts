import jsPDF from "jspdf";
import { BONUS_ITEMS } from "@/lib/plan-constants";

interface CotizacionData {
  numeroConsecutivo: string;
  fecha: string;
  cliente: {
    nombre: string;
    telefono: string;
    email?: string;
  };
  proyecto: {
    nombre: string;
    ubicacion: string;
  };
  plan: {
    nombre: string;
    precio: number;
    tiempoEntrega: number;
    incluye: string[];
    bonus: string[];
  };
  adicionales: Array<{
    nombre: string;
    precio: number;
    cantidad?: number;
  }>;
  itemsManuales?: Array<{
    nombre: string;
    precio: number;
    cantidad?: number;
  }>;
  total: number;
}

// ═══════════════════════════════════════════════════════════════
// COLORES
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  gold: [212, 175, 55] as [number, number, number],
  darkNavy: [26, 26, 46] as [number, number, number],
  textPrimary: [31, 41, 55] as [number, number, number],
  textSecondary: [75, 85, 99] as [number, number, number],
  textTertiary: [107, 114, 128] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  emerald: [4, 120, 87] as [number, number, number],
  warning: [253, 185, 19] as [number, number, number],
  whatsapp: [37, 211, 102] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  backgroundLight: [249, 249, 249] as [number, number, number],
};

const formatPrice = (price: number): string => `$${price.toLocaleString("es-CO")}`;

// Check vectorial en vez de texto "✓" — la fuente estándar de jsPDF
// (helvetica, WinAnsiEncoding) no tiene el glifo U+2713 y lo renderiza como
// un caracter roto (una comilla suelta en el PDF). Dibujar el check con
// líneas evita depender de la fuente por completo.
function drawCheck(doc: jsPDF, x: number, yBaseline: number, color: [number, number, number]) {
  doc.setDrawColor(...color);
  doc.setLineCap("round");
  doc.setLineJoin("round");
  doc.setLineWidth(0.5);
  const y0 = yBaseline - 0.8;
  const y1 = yBaseline;
  const y2 = yBaseline - 2.6;
  doc.line(x, y0, x + 1.1, y1);
  doc.line(x + 1.1, y1, x + 3, y2);
}

// ═══════════════════════════════════════════════════════════════
// ACTIVIDADES POR PLAN
// ═══════════════════════════════════════════════════════════════

const getActividadesPorPlan = (planNombre: string): string[] => {
  const esIntermedio = planNombre.toLowerCase().includes("intermedio");

  if (esIntermedio) {
    return [
      "Estuco muros + techo",
      "Pintura 3 manos",
      "Mortero nivelación piso",
      "Enchape piso cerámica",
      "Drywall cocina y baño",
      "Enchape baño principal",
      "Combo sanitario y grifería",
      "Nicho iluminado",
      "División vidrio 8mm",
      "Demolición baño aux",
      "Enchape baño auxiliar",
      "Enchape salpicadero",
      "Mesón granito cocina",
      "Barra granito soporte",
      "Enchape zona húmeda",
      "Puerta RH (3 uds)",
      "Mueble cocina RH",
      "Closet principal RH",
      "Closet secundario RH",
      "Luminarias LED",
      "Aseo final",
    ];
  }
  return [
    "Estuco muros + techo",
    "Pintura 3 manos",
    "Mortero nivelación piso",
    "Enchape piso cerámica",
    "Drywall cocina y baños",
    "Enchape baño principal",
    "Combo sanitario y grifería",
    "Nicho iluminado",
    "Enchape salpicadero",
    "Enchape zona húmeda",
    "Luminarias LED",
    "Aseo final",
  ];
};

// Bonos gratis
const BONOS_GRATIS = ["nicho iluminado", "tendedero", "ducha elegante"];
const esBonoGratis = (nombre: string): boolean => BONOS_GRATIS.some((b) => nombre.toLowerCase().includes(b));
const filtrarAdicionales = (adicionales: Array<{ nombre: string; precio: number; cantidad?: number }>) => adicionales.filter((a) => !esBonoGratis(a.nombre));
const calcularTotal = (precioPlan: number, adicionales: Array<{ nombre: string; precio: number; cantidad?: number }>) =>
  precioPlan + filtrarAdicionales(adicionales).reduce((sum, a) => sum + a.precio * (a.cantidad || 1), 0);

// ═══════════════════════════════════════════════════════════════
// MINI HEADER PARA PÁGINAS DE CONTINUACIÓN
// ═══════════════════════════════════════════════════════════════

function renderMiniHeader(doc: jsPDF, margin: number, pageWidth: number): number {
  let y = margin;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textTertiary);
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, y, { align: "center" });

  y += 4;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  return y + 6;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVIDADES EN GRID 3 COLUMNAS (REUTILIZABLE)
// ═══════════════════════════════════════════════════════════════

function renderActividadesEnGrid(doc: jsPDF, actividades: string[], margin: number, contentWidth: number, startY: number): number {
  const columnas = 3;
  const columnWidth = contentWidth / columnas;
  const itemHeight = 6;
  const fontSize = 9;

  let x = margin;
  let y = startY;
  let itemsEnColumna = 0;
  const maxItemsPorColumna = Math.ceil(actividades.length / columnas);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);

  actividades.forEach((actividad, index) => {
    // Check dorado
    drawCheck(doc, x, y, COLORS.gold);

    // Texto actividad
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);

    const maxTextWidth = columnWidth - 8;
    const texto = doc.splitTextToSize(actividad, maxTextWidth)[0];
    doc.text(texto, x + 5, y);

    itemsEnColumna++;

    if (itemsEnColumna >= maxItemsPorColumna && index < actividades.length - 1) {
      x += columnWidth;
      y = startY;
      itemsEnColumna = 0;
    } else {
      y += itemHeight;
    }
  });

  return startY + maxItemsPorColumna * itemHeight + 5;
}

// ═══════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════

function renderFooter(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number): void {
  const footerY = pageHeight - 10;

  doc.setFillColor(...COLORS.darkNavy);
  doc.rect(0, footerY - 2, pageWidth, 12, "F");

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gold);

  doc.text("Constructora Colombia", margin, footerY + 3);
  doc.text("Bucaramanga, Colombia", pageWidth / 2, footerY + 3, { align: "center" });
  doc.text("contacto@constructoracolombia.com", pageWidth - margin, footerY + 3, { align: "right" });
}

// ═══════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function generarCotizacionPDF(data: CotizacionData): Promise<Blob> {
  console.log("🎯 FUNCIÓN LLAMADA - generarCotizacionPDF");
  console.log("   adicionales:", data.adicionales?.length || 0);
  console.log("   itemsManuales:", data.itemsManuales?.length || 0);
  console.log("   total:", (data.adicionales?.length || 0) + (data.itemsManuales?.length || 0));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const maxY = pageHeight - margin - 12; // Espacio para footer

  const totalReal = calcularTotal(data.plan.precio, data.adicionales);
  let currentY = 0;
  let pageNumber = 1;

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1: PROPUESTA DE VALOR COMPLETA
  // ═══════════════════════════════════════════════════════════════

  // HEADER
  doc.setFillColor(...COLORS.darkNavy);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 11, { align: "center" });

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, 18, { align: "center" });

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN KIT ACABADOS", margin + 4, 25);

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, pageWidth - margin - 4, 25, { align: "right" });

  currentY = 38;

  // CLIENTE Y PROYECTO (compacto)
  const boxWidth = (contentWidth - 6) / 2;

  doc.setFillColor(...COLORS.backgroundLight);
  doc.roundedRect(margin, currentY, boxWidth, 20, 2, 2, "F");

  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 3, currentY + 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre, margin + 3, currentY + 10);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textTertiary);
  if (data.cliente.email) doc.text(data.cliente.email, margin + 3, currentY + 15);

  const rightX = margin + boxWidth + 6;
  doc.setFillColor(...COLORS.backgroundLight);
  doc.roundedRect(rightX, currentY, boxWidth, 20, 2, 2, "F");

  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO", rightX + 3, currentY + 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, rightX + 3, currentY + 10);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textTertiary);
  doc.text(data.fecha, rightX + 3, currentY + 15);

  currentY += 26;

  // BANNER PLAN
  doc.setFillColor(...COLORS.warning);
  doc.roundedRect(margin, currentY, contentWidth, 11, 2, 2, "F");

  doc.setTextColor(...COLORS.darkNavy);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAN: ${data.plan.nombre.toUpperCase()}`, margin + 5, currentY + 7);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Entrega: ${data.plan.tiempoEntrega} días hábiles`, pageWidth - margin - 5, currentY + 7, { align: "right" });

  currentY += 17;

  // ════════════════════════════════════════════════════════════
  // SECCIÓN 1: ACTIVIDADES DEL PLAN (Grid 3 columnas)
  // ════════════════════════════════════════════════════════════

  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS EN TU PLAN", margin, currentY);
  currentY += 8;

  const actividades = getActividadesPorPlan(data.plan.nombre);
  currentY = renderActividadesEnGrid(doc, actividades, margin, contentWidth, currentY);

  // ════════════════════════════════════════════════════════════
  // SECCIÓN 1.5: ADICIONALES Y PERSONALIZADOS
  // ════════════════════════════════════════════════════════════

  // RENDERIZAR ADICIONALES - SIN PRECIOS
  if (data.adicionales && data.adicionales.length > 0) {
    currentY += 8;

    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS", margin, currentY);
    currentY += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textPrimary);
    doc.text("Ítem", margin + 2, currentY);
    doc.text("Cant.", pageWidth - margin - 15, currentY);

    currentY += 4;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textSecondary);

    data.adicionales.forEach((item) => {
      const cant = item.cantidad || 1;
      const maxWidth = pageWidth - margin - 25;
      const nombre = doc.splitTextToSize(item.nombre, maxWidth)[0];

      doc.text(nombre, margin + 2, currentY);
      doc.text(String(cant), pageWidth - margin - 15, currentY);
      currentY += 5;
    });

    currentY += 3;
  }

  // RENDERIZAR ITEMS PERSONALIZADOS - SIN PRECIOS
  if (data.itemsManuales && data.itemsManuales.length > 0) {
    currentY += 8;

    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ITEMS PERSONALIZADOS", margin, currentY);
    currentY += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textPrimary);
    doc.text("Ítem", margin + 2, currentY);
    doc.text("Cant.", pageWidth - margin - 15, currentY);

    currentY += 4;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textSecondary);

    data.itemsManuales.forEach((item) => {
      const cant = item.cantidad || 1;
      const maxWidth = pageWidth - margin - 25;
      const nombre = doc.splitTextToSize(item.nombre, maxWidth)[0];

      doc.text(nombre, margin + 2, currentY);
      doc.text(String(cant), pageWidth - margin - 15, currentY);
      currentY += 5;
    });

    currentY += 3;
  }

  // ════════════════════════════════════════════════════════════
  // SECCIÓN 2: INVERSIÓN TOTAL
  // ════════════════════════════════════════════════════════════

  currentY += 10;

  const boxHeight = 30;
  doc.setFillColor(...COLORS.backgroundLight);
  doc.rect(margin, currentY, contentWidth, boxHeight, "F");

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.rect(margin, currentY, contentWidth, boxHeight);

  doc.setTextColor(...COLORS.gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("INVERSIÓN TOTAL", margin + 10, currentY + 8);

  doc.setTextColor(...COLORS.darkNavy);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(formatPrice(totalReal), pageWidth - margin - 10, currentY + 20, { align: "right" });

  currentY += boxHeight;

  // Footer Página 1
  if (pageNumber === 1) {
    renderFooter(doc, margin, pageWidth, pageHeight);
  }

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 2: DETALLES CONTRACTUALES
  // ═══════════════════════════════════════════════════════════════

  // Si ya estamos en página 2 por overflow, continuar; si no, crear nueva
  if (pageNumber === 1) {
    doc.addPage();
    pageNumber++;
  }

  // Header P2
  doc.setFillColor(...COLORS.darkNavy);
  doc.rect(0, 0, pageWidth, 25, "F");

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 10, { align: "center" });

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, 16, { align: "center" });

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL CONTRATO", pageWidth / 2, 22, { align: "center" });

  currentY = 32;

  // BONOS REGALO
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BONOS REGALO INCLUIDOS", margin, currentY);

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLORS.textTertiary);
  doc.text("(Sin costo adicional)", margin + 62, currentY);

  currentY += 6;

  // Contenedor amarillo
  const bonosContainerHeight = 55;
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin, currentY, contentWidth, bonosContainerHeight, 4, 4, "F");
  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, currentY, contentWidth, bonosContainerHeight, 4, 4, "S");

  const bonos = [
    "Bono #1 - Nicho iluminado",
    "Bono #2 - Tendedero abatible",
    "Bono #3 - Ducha elegante + mezclador",
    "Bono #4 - Asesoría arquitectónica",
    "Bono #5 - Recorrido virtual 360°",
    "Bono #6 - Supervisión profesional",
    "Bono #7 - Garantía de calidad",
  ];

  let bonoY = currentY + 7;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  bonos.forEach((bono) => {
    drawCheck(doc, margin + 5, bonoY, COLORS.success);
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFont("helvetica", "normal");
    doc.text(bono, margin + 10, bonoY);
    bonoY += 5.2;
  });

  // Badge verde esmeralda (fit-content)
  bonoY += 2;
  const textoValor = "Valor estimado de bonos: $2.500.000";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const textWidth = doc.getTextWidth(textoValor);
  const badgeWidth = textWidth + 8;
  const badgeX = (pageWidth - badgeWidth) / 2;

  doc.setFillColor(...COLORS.emerald);
  doc.roundedRect(badgeX, bonoY - 4, badgeWidth, 6, 2, 2, "F");

  doc.setTextColor(...COLORS.white);
  doc.text(textoValor, pageWidth / 2, bonoY, { align: "center" });

  currentY += bonosContainerHeight + 10;

  // FORMA DE PAGO
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FORMA DE PAGO FLEXIBLE", margin, currentY);
  currentY += 6;

  doc.setFillColor(...COLORS.darkNavy);
  doc.roundedRect(margin, currentY, contentWidth, 48, 4, 4, "F");

  const cuotas = [
    { porcentaje: 45, descripcion: "Anticipo para iniciar obra" },
    { porcentaje: 20, descripcion: "Tercera semana" },
    { porcentaje: 20, descripcion: "Quinta semana" },
    { porcentaje: 10, descripcion: "Séptima semana" },
    { porcentaje: 5, descripcion: "Con entrega a satisfacción" },
  ];

  let cuotaY = currentY + 8;
  cuotas.forEach((cuota) => {
    const monto = Math.round((totalReal * cuota.porcentaje) / 100);

    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${cuota.porcentaje}%`, margin + 8, cuotaY);

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(cuota.descripcion, margin + 22, cuotaY);

    doc.setTextColor(...COLORS.success);
    doc.setFont("helvetica", "bold");
    doc.text(formatPrice(monto), pageWidth - margin - 8, cuotaY, { align: "right" });

    cuotaY += 7;
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Sin letras pequeñas, sin sorpresas", pageWidth / 2, currentY + 44, { align: "center" });

  currentY += 56;

  // ═══════════════════════════════════════════════════════════════
  // PROTECCIÓN: Verificar si caben Garantías + WhatsApp
  // ═══════════════════════════════════════════════════════════════
  const alturaGarantias = 42;
  const alturaWhatsApp = 30;
  const espacioNecesario = alturaGarantias + alturaWhatsApp + 15;

  if (currentY + espacioNecesario > maxY) {
    // No caben, footer aquí y nueva página
    renderFooter(doc, margin, pageWidth, pageHeight);

    doc.addPage();
    pageNumber++;
    currentY = renderMiniHeader(doc, margin, pageWidth);
    currentY += 8;
  }

  // GARANTÍAS
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("GARANTÍAS Y CONDICIONES", margin, currentY);
  currentY += 6;

  doc.setFillColor(...COLORS.darkNavy);
  doc.roundedRect(margin, currentY, contentWidth, 34, 4, 4, "F");

  const garantias = [
    `Tiempo de entrega: ${data.plan.tiempoEntrega} días hábiles`,
    "Libre de sobrecostos",
    "Personal certificado y supervisado",
    "Garantía en materiales y mano de obra",
    "Seguro de responsabilidad civil",
  ];

  let garantiaY = currentY + 7;
  doc.setFontSize(8);

  garantias.forEach((garantia) => {
    drawCheck(doc, margin + 6, garantiaY, COLORS.success);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "normal");
    doc.text(garantia, margin + 12, garantiaY);
    garantiaY += 5.5;
  });

  currentY += 42;

  // BOTÓN WHATSAPP (45px = 16.9mm)
  const buttonWidth = 150;
  const buttonHeight = 16.9;
  const buttonX = (pageWidth - buttonWidth) / 2;

  doc.setFillColor(30, 30, 30);
  doc.roundedRect(buttonX + 0.5, currentY + 0.5, buttonWidth, buttonHeight, 4, 4, "F");

  doc.setFillColor(...COLORS.whatsapp);
  doc.roundedRect(buttonX, currentY, buttonWidth, buttonHeight, 4, 4, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Continuar conversación en WhatsApp", pageWidth / 2, currentY + 7, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("+57 317 563 9674", pageWidth / 2, currentY + 12.5, { align: "center" });

  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(`Hola, quiero continuar con mi cotización ${data.numeroConsecutivo}`)}`;
  doc.link(buttonX, currentY, buttonWidth, buttonHeight, { url: whatsappUrl });

  doc.setTextColor(...COLORS.textTertiary);
  doc.setFontSize(6.5);
  doc.text("Horario: Lun-Vie 8am-6pm | Sáb 9am-1pm  •  Respuesta: <5 min", pageWidth / 2, currentY + buttonHeight + 4, { align: "center" });

  // FOOTER FINAL
  renderFooter(doc, margin, pageWidth, pageHeight);

  return doc.output("blob");
}

// ═══════════════════════════════════════════════════════════════
// GENERADOR DEL PRESUPUESTO PÚBLICO (/p/[token]) — DIBUJO NATIVO
// ═══════════════════════════════════════════════════════════════
//
// Reemplaza el enfoque anterior de esta página (html2canvas capturando el
// DOM como una imagen larga, cortada en bloques A4 fijos) — corte real
// reportado por Javier el 2026-08-10: las tarjetas quedaban partidas a la
// mitad entre página y página, además de arrastrar el bug de
// html2canvas/oklch. Este generador dibuja cada bloque con jsPDF
// directamente, igual que generarCotizacionPDF() de arriba, verificando el
// espacio restante ANTES de dibujar cada sección — si no cabe, salta de
// página primero, así ninguna tarjeta ni línea queda cortada a la mitad.

export interface PresupuestoPublicoData {
  nombreCliente: string;
  nombreProyecto: string;
  conjunto: string;
  fecha: string; // ya formateada, ej. "10 de agosto de 2026"
  refNum: string; // ej. "V3 · 20260810"
  planBase: string;
  precioEfectivo: number;
  secciones: Array<{
    seccion: string;
    items: Array<{ nombre: string; aplica: boolean; cantidad: number }>;
  }>;
  adicionales: Array<{ nombre: string; qty: number; total: number }>;
  subtotalAdicionales: number;
  itemsManuales: Array<{ nombre: string; precio: number; cantidad: number }>;
  subtotalManuales: number;
  iva: number;
  totalFinal: number;
  condiciones: string[];
  notas: string;
}

function renderHeaderPresupuesto(doc: jsPDF, pageWidth: number): number {
  doc.setFillColor(...COLORS.darkNavy);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 10, { align: "center" });

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("REMODELA", pageWidth / 2, 18, { align: "center" });

  doc.setTextColor(210, 201, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("constructoracolombia.com", pageWidth / 2, 23, { align: "center" });

  return 26;
}

// Verifica si cabe el bloque siguiente antes de dibujarlo — si no cabe,
// cierra la página actual (footer) y abre una nueva con el header mini.
function ensureSpacePresupuesto(
  doc: jsPDF,
  currentY: number,
  neededHeight: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  maxY: number
): number {
  if (currentY + neededHeight <= maxY) return currentY;
  renderFooter(doc, margin, pageWidth, pageHeight);
  doc.addPage();
  return renderHeaderPresupuesto(doc, pageWidth) + 10;
}

// Tarjeta blanca con borde dorado sutil — mismo lenguaje visual que el
// resto del PDF (COLORS.gold al 20% de opacidad simulado con un gris claro
// dorado, jsPDF no soporta alpha en setDrawColor de forma sencilla).
function drawCardBackground(doc: jsPDF, x: number, y: number, width: number, height: number) {
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(230, 220, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");
}

// Dibuja el borde de una tarjeta "envolvente" (startY capturado antes del
// contenido, currentY después de dibujarlo) SOLO si el contenido no cruzó
// de página — cruzar de página produce una altura corrupta (a veces
// negativa) porque startY y currentY quedan en sistemas de coordenadas de
// páginas distintas, y el rectángulo termina siendo una caja suelta mal
// ubicada encima de lo que venga después. Bug real reportado por Javier
// 2026-08-13, confirmado con datos reales: el presupuesto de Silvia
// Badillo (Plan Intermedio Plus, 7 secciones) no cabía completo en una
// página — el borde de esa tarjeta salía con height=-22 en la página 2,
// superpuesto justo encima de la tarjeta de Adicionales ("una caja dentro
// de otra caja"). Sin cruce de página, dibuja el borde normal de siempre;
// con cruce, prefiere quedarse sin borde decorativo antes que dibujar uno
// corrupto — el contenido sigue siendo perfectamente legible sin el marco.
function drawCardBorderSiNoCruzoPagina(
  doc: jsPDF,
  paginaAlEmpezar: number,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (doc.getNumberOfPages() !== paginaAlEmpezar) return;
  doc.setDrawColor(230, 220, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3, "S");
}

export async function generarPresupuestoPublicoPDF(data: PresupuestoPublicoData): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const maxY = pageHeight - margin - 14; // espacio para footer

  let currentY = renderHeaderPresupuesto(doc, pageWidth) + 10;

  // ── CLIENTE / PROYECTO ──
  const clienteBoxHeight = 32;
  drawCardBackground(doc, margin, currentY, contentWidth, clienteBoxHeight);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN DE REMODELACIÓN", margin + 6, currentY + 8);

  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.nombreCliente, margin + 6, currentY + 17);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const proyectoLinea = data.conjunto
    ? `${data.conjunto}${data.nombreProyecto ? ` · ${data.nombreProyecto}` : ""}`
    : data.nombreProyecto;
  if (proyectoLinea) doc.text(proyectoLinea, margin + 6, currentY + 23);

  doc.setTextColor(...COLORS.textTertiary);
  doc.setFontSize(8);
  doc.text(`${data.fecha}  ·  ${data.refNum}`, margin + 6, currentY + 29);

  currentY += clienteBoxHeight + 8;

  // ── INVERSIÓN TOTAL ──
  const totalBoxHeight = 32;
  doc.setFillColor(253, 246, 236);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, currentY, contentWidth, totalBoxHeight, 3, 3, "FD");

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("INVERSIÓN TOTAL", pageWidth / 2, currentY + 9, { align: "center" });

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(formatPrice(data.totalFinal), pageWidth / 2, currentY + 21, { align: "center" });

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Precio fijo · Sin sobrecostos", pageWidth / 2, currentY + 28, { align: "center" });

  currentY += totalBoxHeight + 8;

  // ── PLAN BASE (secciones con checks) ──
  if (data.planBase && data.secciones.length > 0) {
    // Altura estimada: badge + cada sección (título + items) + total
    const alturaEstimadaPlan =
      14 +
      data.secciones.reduce((s, sec) => s + 6 + sec.items.length * 5.5, 0) +
      14;

    currentY = ensureSpacePresupuesto(doc, currentY, Math.min(alturaEstimadaPlan, 60), margin, pageWidth, pageHeight, maxY);

    const planBoxStartY = currentY;
    const paginaAlEmpezarPlan = doc.getNumberOfPages();
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(margin + 4, currentY + 4, doc.getTextWidth(data.planBase.toUpperCase()) + 10, 6.5, 3, 3, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(data.planBase.toUpperCase(), margin + 9, currentY + 8.3);

    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("· Todo lo que incluye tu remodelación", margin + 14 + doc.getTextWidth(data.planBase.toUpperCase()), currentY + 8.3);

    currentY += 14;

    for (const sec of data.secciones) {
      const alturaSeccion = 6 + sec.items.length * 5.5;
      // Si una sección puntual no cabe completa, saltar de página ANTES de
      // empezarla — nunca partir una sección a la mitad.
      currentY = ensureSpacePresupuesto(doc, currentY, alturaSeccion, margin, pageWidth, pageHeight, maxY);

      doc.setTextColor(...COLORS.gold);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(sec.seccion.toUpperCase(), margin + 6, currentY);
      currentY += 5.5;

      for (const item of sec.items) {
        if (item.aplica) {
          drawCheck(doc, margin + 6, currentY, COLORS.success);
          doc.setTextColor(...COLORS.textPrimary);
        } else {
          doc.setDrawColor(...COLORS.textTertiary);
          doc.setLineWidth(0.4);
          doc.line(margin + 6, currentY - 1.3, margin + 9, currentY - 1.3);
          doc.setTextColor(...COLORS.textTertiary);
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const cantTxt = item.aplica && item.cantidad > 1 ? `  ×${item.cantidad}` : "";
        doc.text(`${item.nombre}${cantTxt}`, margin + 12, currentY);
        currentY += 5.5;
      }
    }

    currentY += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.3);
    doc.line(margin + 6, currentY, pageWidth - margin - 6, currentY);
    currentY += 6;

    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Total ${data.planBase}`, margin + 6, currentY);
    doc.setTextColor(...COLORS.gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(formatPrice(data.precioEfectivo), pageWidth - margin - 6, currentY, { align: "right" });

    // Borde de la tarjeta completa del plan (dibujado al final, ya con la
    // altura real conocida) — solo si no cruzó de página, ver
    // drawCardBorderSiNoCruzoPagina.
    const alturaCard = currentY - planBoxStartY + 6;
    drawCardBorderSiNoCruzoPagina(doc, paginaAlEmpezarPlan, margin, planBoxStartY - 4, contentWidth, alturaCard);

    currentY += 12;
  }

  // ── ADICIONALES ──
  if (data.adicionales.length > 0) {
    const altura = 12 + data.adicionales.length * 6 + 10;
    currentY = ensureSpacePresupuesto(doc, currentY, altura, margin, pageWidth, pageHeight, maxY);
    const startY = currentY;
    const paginaAlEmpezarAdicionales = doc.getNumberOfPages();

    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("+ ADICIONALES SELECCIONADOS", margin + 6, currentY + 6);
    currentY += 12;

    for (const a of data.adicionales) {
      doc.setTextColor(...COLORS.textPrimary);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const cantTxt = a.qty > 1 ? `  ×${a.qty}` : "";
      doc.text(`${a.nombre}${cantTxt}`, margin + 6, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(a.total), pageWidth - margin - 6, currentY, { align: "right" });
      currentY += 6;
    }

    currentY += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.3);
    doc.line(margin + 6, currentY, pageWidth - margin - 6, currentY);
    currentY += 6;
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(9);
    doc.text("Subtotal adicionales", margin + 6, currentY);
    doc.setTextColor(...COLORS.gold);
    doc.setFont("helvetica", "bold");
    doc.text(formatPrice(data.subtotalAdicionales), pageWidth - margin - 6, currentY, { align: "right" });

    const alturaCard = currentY - startY + 8;
    drawCardBorderSiNoCruzoPagina(doc, paginaAlEmpezarAdicionales, margin, startY - 6, contentWidth, alturaCard);
    currentY += 12;
  }

  // ── PERSONALIZADOS ──
  if (data.itemsManuales.length > 0) {
    const altura = 12 + data.itemsManuales.length * 6 + 10;
    currentY = ensureSpacePresupuesto(doc, currentY, altura, margin, pageWidth, pageHeight, maxY);
    const startY = currentY;
    const paginaAlEmpezarPersonalizados = doc.getNumberOfPages();

    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("+ PERSONALIZADOS", margin + 6, currentY + 6);
    currentY += 12;

    for (const item of data.itemsManuales) {
      doc.setTextColor(...COLORS.textPrimary);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const cantTxt = item.cantidad > 1 ? `  ×${item.cantidad}` : "";
      doc.text(`${item.nombre}${cantTxt}`, margin + 6, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(item.precio * item.cantidad), pageWidth - margin - 6, currentY, { align: "right" });
      currentY += 6;
    }

    currentY += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.3);
    doc.line(margin + 6, currentY, pageWidth - margin - 6, currentY);
    currentY += 6;
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(9);
    doc.text("Subtotal personalizados", margin + 6, currentY);
    doc.setTextColor(...COLORS.gold);
    doc.setFont("helvetica", "bold");
    doc.text(formatPrice(data.subtotalManuales), pageWidth - margin - 6, currentY, { align: "right" });

    const alturaCard = currentY - startY + 8;
    drawCardBorderSiNoCruzoPagina(doc, paginaAlEmpezarPersonalizados, margin, startY - 6, contentWidth, alturaCard);
    currentY += 12;
  }

  // ── BONUS GRATIS ──
  {
    doc.setFontSize(8.5);
    const bonoTextWidth = contentWidth - 17;
    const bonoLineas = BONUS_ITEMS.map((b) => doc.splitTextToSize(b, bonoTextWidth) as string[]);
    const totalLineas = bonoLineas.reduce((s, l) => s + l.length, 0);
    const altura = 22 + totalLineas * 5.2;

    currentY = ensureSpacePresupuesto(doc, currentY, altura, margin, pageWidth, pageHeight, maxY);
    const startY = currentY;

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(134, 239, 172);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, currentY, contentWidth, altura - 4, 3, 3, "FD");

    doc.setTextColor(21, 128, 61);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    // Sin emoji: la fuente estándar de jsPDF (helvetica, WinAnsiEncoding) no
    // tiene el glifo y lo renderiza como un carácter roto — mismo motivo por
    // el que los checks se dibujan con drawCheck() en vez de usar "✓".
    doc.text("BONUS GRATIS INCLUIDO", margin + 6, currentY + 8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text("Solo por confirmar en este mes", margin + 6, currentY + 13);

    let bonoY = currentY + 20;
    doc.setFontSize(8.5);
    bonoLineas.forEach((lineas) => {
      drawCheck(doc, margin + 6, bonoY, [22, 163, 74]);
      doc.setTextColor(22, 101, 52);
      doc.setFont("helvetica", "normal");
      doc.text(lineas, margin + 11, bonoY);
      bonoY += lineas.length * 5.2;
    });

    currentY = startY + altura + 6;
  }

  // ── DESGLOSE TOTALES ──
  {
    const filas = [
      data.planBase ? 1 : 0,
      data.subtotalAdicionales > 0 ? 1 : 0,
      data.subtotalManuales > 0 ? 1 : 0,
      data.iva > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
    const altura = filas * 7 + 20;
    currentY = ensureSpacePresupuesto(doc, currentY, altura, margin, pageWidth, pageHeight, maxY);
    const startY = currentY;
    const paginaAlEmpezarDesglose = doc.getNumberOfPages();
    currentY += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (data.planBase) {
      doc.setTextColor(...COLORS.textSecondary);
      doc.text(data.planBase, margin + 6, currentY);
      doc.setTextColor(...COLORS.textPrimary);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(data.precioEfectivo), pageWidth - margin - 6, currentY, { align: "right" });
      currentY += 7;
    }
    if (data.subtotalAdicionales > 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textSecondary);
      doc.text("Adicionales", margin + 6, currentY);
      doc.setTextColor(...COLORS.textPrimary);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(data.subtotalAdicionales), pageWidth - margin - 6, currentY, { align: "right" });
      currentY += 7;
    }
    if (data.subtotalManuales > 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textSecondary);
      doc.text("Personalizados", margin + 6, currentY);
      doc.setTextColor(...COLORS.textPrimary);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(data.subtotalManuales), pageWidth - margin - 6, currentY, { align: "right" });
      currentY += 7;
    }
    if (data.iva > 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textSecondary);
      doc.text("IVA (19%)", margin + 6, currentY);
      doc.setTextColor(...COLORS.textPrimary);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrice(data.iva), pageWidth - margin - 6, currentY, { align: "right" });
      currentY += 7;
    }

    currentY += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.6);
    doc.line(margin + 6, currentY, pageWidth - margin - 6, currentY);
    currentY += 8;

    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL GENERAL", margin + 6, currentY);
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(15);
    doc.text(formatPrice(data.totalFinal), pageWidth - margin - 6, currentY, { align: "right" });

    const alturaCard = currentY - startY + 6;
    drawCardBorderSiNoCruzoPagina(doc, paginaAlEmpezarDesglose, margin, startY, contentWidth, alturaCard);
    currentY += 14;
  }

  // ── CONDICIONES ──
  {
    const alturaNotas = data.notas?.trim() ? 8 + doc.splitTextToSize(data.notas, contentWidth - 12).length * 5 : 0;
    const altura = 12 + data.condiciones.length * 6.5 + alturaNotas + 6;
    currentY = ensureSpacePresupuesto(doc, currentY, altura, margin, pageWidth, pageHeight, maxY);
    const startY = currentY;
    const paginaAlEmpezarCondiciones = doc.getNumberOfPages();

    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CONDICIONES", margin + 6, currentY + 6);
    currentY += 12;

    doc.setFontSize(9);
    for (const c of data.condiciones) {
      doc.setTextColor(...COLORS.gold);
      doc.setFont("helvetica", "normal");
      doc.text("·", margin + 6, currentY);
      doc.setTextColor(...COLORS.textSecondary);
      doc.text(c, margin + 11, currentY);
      currentY += 6.5;
    }

    if (data.notas?.trim()) {
      currentY += 2;
      doc.setDrawColor(230, 220, 200);
      doc.setLineWidth(0.3);
      doc.line(margin + 6, currentY, pageWidth - margin - 6, currentY);
      currentY += 6;
      doc.setTextColor(...COLORS.textSecondary);
      doc.setFontSize(8.5);
      const notasLines = doc.splitTextToSize(data.notas, contentWidth - 12);
      doc.text(notasLines, margin + 6, currentY);
      currentY += notasLines.length * 5;
    }

    const alturaCard = currentY - startY + 6;
    drawCardBorderSiNoCruzoPagina(doc, paginaAlEmpezarCondiciones, margin, startY - 6, contentWidth, alturaCard);
    currentY += alturaCard;
  }

  // Bug real corregido 2026-08-10: había un bloque extra de texto de marca
  // aquí ("@constructoraColombia..." / "Bucaramanga...") duplicando lo que
  // renderFooter() YA dibuja en la barra oscura de cada página — en la
  // verificación real con datos de producción, ese bloque sobrante empujaba
  // 2 líneas sueltas a una página 3 casi en blanco. renderFooter() solo
  // basta.
  renderFooter(doc, margin, pageWidth, pageHeight);

  return doc.output("blob");
}
