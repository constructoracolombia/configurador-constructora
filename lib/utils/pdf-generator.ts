import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  }>;
  total: number;
}

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

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
const filtrarAdicionales = (adicionales: Array<{ nombre: string; precio: number }>) => adicionales.filter((a) => !esBonoGratis(a.nombre));
const calcularTotal = (precioPlan: number, adicionales: Array<{ nombre: string; precio: number }>) => precioPlan + filtrarAdicionales(adicionales).reduce((sum, a) => sum + a.precio, 0);

// ═══════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function generarCotizacionPDF(data: CotizacionData): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" }) as DocWithAutoTable;

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  const totalReal = calcularTotal(data.plan.precio, data.adicionales);
  let currentY = 0;

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1: HEADER + ACTIVIDADES GRID + ADICIONALES + INVERSIÓN
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

  // TÍTULO ACTIVIDADES
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS EN TU PLAN", margin, currentY);
  currentY += 8;

  // ACTIVIDADES EN GRID 3 COLUMNAS
  const actividades = getActividadesPorPlan(data.plan.nombre);
  const columnas = 3;
  const columnWidth = contentWidth / columnas;
  const itemHeight = 5.5;
  const maxItemsPorColumna = Math.ceil(actividades.length / columnas);

  let colX = margin;
  let itemY = currentY;
  let itemsEnColumna = 0;

  doc.setFontSize(8);

  actividades.forEach((actividad, index) => {
    // Check dorado
    doc.setTextColor(...COLORS.gold);
    doc.setFont("helvetica", "bold");
    doc.text("✓", colX, itemY);

    // Texto
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFont("helvetica", "normal");
    const maxTextWidth = columnWidth - 7;
    const texto = actividad.length > 22 ? actividad.substring(0, 20) + "..." : actividad;
    doc.text(texto, colX + 4, itemY);

    itemsEnColumna++;

    if (itemsEnColumna >= maxItemsPorColumna && index < actividades.length - 1) {
      colX += columnWidth;
      itemY = currentY;
      itemsEnColumna = 0;
    } else {
      itemY += itemHeight;
    }
  });

  currentY += maxItemsPorColumna * itemHeight + 8;

  // ADICIONALES
  const adicionalesParaMostrar = filtrarAdicionales(data.adicionales);

  if (adicionalesParaMostrar.length > 0) {
    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS", margin, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Descripción", "Precio"]],
      body: adicionalesParaMostrar.map((add, idx) => [(idx + 1).toString(), add.nombre, formatPrice(add.precio)]),
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: COLORS.darkNavy, textColor: COLORS.white, fontStyle: "bold", fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 8, halign: "center" }, 1: { cellWidth: contentWidth - 38 }, 2: { cellWidth: 30, halign: "right", fontStyle: "bold" } },
      margin: { left: margin, right: margin },
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 6;
  }

  // INVERSIÓN TOTAL (borde dorado, fondo gris)
  currentY += 4;
  const totalHeight = 38;

  doc.setFillColor(...COLORS.backgroundLight);
  doc.rect(margin, currentY, contentWidth, totalHeight, "F");

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.4);
  doc.rect(margin, currentY, contentWidth, totalHeight);

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INVERSIÓN TOTAL", pageWidth / 2, currentY + 11, { align: "center" });

  doc.setTextColor(...COLORS.darkNavy);
  doc.setFontSize(22);
  doc.text(formatPrice(totalReal), pageWidth / 2, currentY + 25, { align: "center" });

  doc.setTextColor(...COLORS.textTertiary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Entrega en ${data.plan.tiempoEntrega} días hábiles`, pageWidth / 2, currentY + 33, { align: "center" });

  // FOOTER P1
  renderFooter(doc, margin, pageWidth, pageHeight);

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 2: BONOS + FORMA DE PAGO
  // ═══════════════════════════════════════════════════════════════

  doc.addPage();
  currentY = 0;

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
    doc.setTextColor(...COLORS.success);
    doc.text("✓", margin + 5, bonoY);
    doc.setTextColor(...COLORS.textSecondary);
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
    doc.setTextColor(...COLORS.success);
    doc.text("✓", margin + 6, garantiaY);
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

  // FOOTER P2
  renderFooter(doc, margin, pageWidth, pageHeight);

  return doc.output("blob");
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
