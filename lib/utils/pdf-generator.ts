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
// PALETA DE COLORES DEFINITIVA
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  gold: [212, 175, 55] as [number, number, number],
  darkNavy: [26, 26, 46] as [number, number, number],
  textPrimary: [31, 41, 55] as [number, number, number],
  textSecondary: [75, 85, 99] as [number, number, number],
  textTertiary: [107, 114, 128] as [number, number, number],
  textLight: [148, 163, 184] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  warning: [253, 185, 19] as [number, number, number],
  whatsapp: [37, 211, 102] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  backgroundLight: [243, 244, 246] as [number, number, number],
  backgroundLighter: [249, 250, 251] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
};

const formatPrice = (price: number): string => `$${price.toLocaleString("es-CO")}`;

// ═══════════════════════════════════════════════════════════════
// ACTIVIDADES POR PLAN
// ═══════════════════════════════════════════════════════════════

interface ActividadCategoria {
  categoria: string;
  items: string[];
}

const getActividadesPorPlan = (planNombre: string): ActividadCategoria[] => {
  const esIntermedio = planNombre.toLowerCase().includes("intermedio");

  if (esIntermedio) {
    return [
      { categoria: "GENERAL", items: ["Estuco muros + techo", "Pintura 3 manos muros y techo", "Mortero nivelación piso impermeabilizado", "Enchape piso cerámica + guardaescobas", "Drywall cocina y baño"] },
      { categoria: "BAÑO PRINCIPAL", items: ["Enchape baño completo", "Combo Básico: Sanitario, lavamanos, grifería", "Nicho iluminado", "División vidrio seguridad 8 mm"] },
      { categoria: "BAÑO AUXILIAR", items: ["Demolición enchape existente", "Enchape baño completo", "Nicho iluminado", "División vidrio seguridad 8 mm"] },
      { categoria: "COCINA", items: ["Enchape salpicadero y muro", "Mesón granito o quartzone", "Barra granito con soporte"] },
      { categoria: "ZONA HÚMEDA", items: ["Enchape zona húmeda"] },
      { categoria: "CARPINTERÍA", items: ["Puerta RH (3 unidades)", "Mueble cocina superior e inferior RH", "Closet principal RH", "Closet secundario RH"] },
      { categoria: "OTROS", items: ["Luminarias LED apartamento", "Aseo final"] },
    ];
  }
  return [
    { categoria: "GENERAL", items: ["Estuco muros + techo", "Pintura 3 manos muros y techo", "Mortero nivelación piso impermeabilizado", "Enchape piso cerámica + guardaescobas", "Drywall cocina y baños"] },
    { categoria: "BAÑO PRINCIPAL", items: ["Enchape baño completo", "Combo Básico: Sanitario, lavamanos, grifería", "Nicho iluminado"] },
    { categoria: "COCINA", items: ["Enchape salpicadero"] },
    { categoria: "ZONA HÚMEDA", items: ["Enchape zona húmeda"] },
    { categoria: "OTROS", items: ["Luminarias LED", "Aseo final"] },
  ];
};

// Bonos gratis
const BONOS_GRATIS = ["nicho iluminado", "tendedero", "ducha elegante"];
const esBonoGratis = (nombre: string): boolean => BONOS_GRATIS.some((b) => nombre.toLowerCase().includes(b));
const filtrarAdicionales = (adicionales: Array<{ nombre: string; precio: number }>) => adicionales.filter((a) => !esBonoGratis(a.nombre));
const calcularTotal = (precioPlan: number, adicionales: Array<{ nombre: string; precio: number }>) => precioPlan + filtrarAdicionales(adicionales).reduce((sum, a) => sum + a.precio, 0);
const calcularAlturaCategoria = (categoria: ActividadCategoria): number => 8 + 4 + categoria.items.length * 6 + 4;

// ═══════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function generarCotizacionPDF(data: CotizacionData): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" }) as DocWithAutoTable;

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const maxY = pageHeight - margin - 12;

  const totalReal = calcularTotal(data.plan.precio, data.adicionales);
  let currentY = 0;

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1: COTIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  // HEADER
  doc.setFillColor(...COLORS.darkNavy);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 12, { align: "center" });

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, 19, { align: "center" });

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN KIT ACABADOS", margin + 4, 27);

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, pageWidth - margin - 4, 27, { align: "right" });

  currentY = 40;

  // CLIENTE Y PROYECTO
  const boxWidth = (contentWidth - 8) / 2;

  doc.setFillColor(...COLORS.backgroundLighter);
  doc.roundedRect(margin, currentY, boxWidth, 22, 2, 2, "F");

  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 4, currentY + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre, margin + 4, currentY + 11);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textTertiary);
  if (data.cliente.email) doc.text(data.cliente.email, margin + 4, currentY + 16);
  if (data.cliente.telefono) doc.text(data.cliente.telefono, margin + 4, currentY + 20);

  const rightX = margin + boxWidth + 8;
  doc.setFillColor(...COLORS.backgroundLighter);
  doc.roundedRect(rightX, currentY, boxWidth, 22, 2, 2, "F");

  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO", rightX + 4, currentY + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, rightX + 4, currentY + 11);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textTertiary);
  doc.text(data.proyecto.ubicacion, rightX + 4, currentY + 16);
  doc.text(data.fecha, rightX + 4, currentY + 20);

  currentY += 28;

  // BANNER PLAN
  doc.setFillColor(...COLORS.warning);
  doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, "F");

  doc.setTextColor(...COLORS.darkNavy);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAN: ${data.plan.nombre.toUpperCase()}`, margin + 6, currentY + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Entrega: ${data.plan.tiempoEntrega} días hábiles`, pageWidth - margin - 6, currentY + 8, { align: "right" });

  currentY += 18;

  // TÍTULO ACTIVIDADES
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS EN TU PLAN", margin, currentY);
  currentY += 6;

  // ACTIVIDADES POR CATEGORÍA
  const actividades = getActividadesPorPlan(data.plan.nombre);

  for (const categoria of actividades) {
    const alturaCategoria = calcularAlturaCategoria(categoria);

    if (currentY + alturaCategoria > maxY) {
      renderFooter(doc, margin, pageWidth, pageHeight);
      doc.addPage();
      currentY = margin;
      renderMiniHeader(doc, margin, pageWidth);
      currentY = margin + 20;
    }

    // Título categoría
    doc.setFillColor(...COLORS.backgroundLight);
    doc.rect(margin, currentY, contentWidth, 7, "F");
    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(categoria.categoria, margin + 4, currentY + 5);

    currentY += 7 + 3;

    // Items con line-height 1.4
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    categoria.items.forEach((item, index) => {
      doc.setTextColor(...COLORS.success);
      doc.text("✓", margin + 4, currentY);
      doc.setTextColor(...COLORS.textSecondary);
      doc.text(item, margin + 11, currentY);

      // Línea separadora sutil
      if (index < categoria.items.length - 1) {
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.1);
        doc.line(margin + 11, currentY + 2.5, pageWidth - margin, currentY + 2.5);
      }

      currentY += 6;
    });

    currentY += 4;
  }

  // ADICIONALES
  const adicionalesParaMostrar = filtrarAdicionales(data.adicionales);

  if (adicionalesParaMostrar.length > 0) {
    const alturaTabla = 16 + adicionalesParaMostrar.length * 7;

    if (currentY + alturaTabla > maxY) {
      renderFooter(doc, margin, pageWidth, pageHeight);
      doc.addPage();
      currentY = margin;
      renderMiniHeader(doc, margin, pageWidth);
      currentY = margin + 20;
    }

    currentY += 3;
    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS", margin, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Descripción", "Precio"]],
      body: adicionalesParaMostrar.map((add, idx) => [(idx + 1).toString(), add.nombre, formatPrice(add.precio)]),
      styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.border, lineWidth: 0.1 },
      headStyles: { fillColor: COLORS.darkNavy, textColor: COLORS.white, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: { 0: { cellWidth: 8, halign: "center" }, 1: { cellWidth: contentWidth - 36 }, 2: { cellWidth: 28, halign: "right", fontStyle: "bold" } },
      margin: { left: margin, right: margin },
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 5;
  }

  // INVERSIÓN TOTAL (elegancia Apple - reducido 20%)
  const totalHeight = 42;

  if (currentY + totalHeight > maxY) {
    renderFooter(doc, margin, pageWidth, pageHeight);
    doc.addPage();
    currentY = margin;
    renderMiniHeader(doc, margin, pageWidth);
    currentY = margin + 20;
  }

  currentY += 4;

  doc.setFillColor(...COLORS.darkNavy);
  doc.roundedRect(margin, currentY, contentWidth, totalHeight, 5, 5, "F");

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("INVERSIÓN TOTAL", pageWidth / 2, currentY + 10, { align: "center" });

  doc.setFontSize(24);
  doc.text(formatPrice(totalReal), pageWidth / 2, currentY + 25, { align: "center" });

  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Entrega en ${data.plan.tiempoEntrega} días hábiles`, pageWidth / 2, currentY + 35, { align: "center" });

  currentY += totalHeight + 2;

  // Footer P1
  renderFooter(doc, margin, pageWidth, pageHeight);

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 2: DETALLES DEL CONTRATO
  // ═══════════════════════════════════════════════════════════════

  doc.addPage();
  currentY = 0;

  // Header P2
  doc.setFillColor(...COLORS.darkNavy);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 11, { align: "center" });

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, 17, { align: "center" });

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL CONTRATO", pageWidth / 2, 24, { align: "center" });

  currentY = 36;

  // FORMA DE PAGO
  doc.setFillColor(...COLORS.darkNavy);
  doc.roundedRect(margin, currentY, contentWidth, 50, 4, 4, "F");

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FORMA DE PAGO FLEXIBLE", margin + 8, currentY + 9);

  const cuotas = [
    { porcentaje: 45, descripcion: "Anticipo para iniciar obra" },
    { porcentaje: 20, descripcion: "Tercera semana" },
    { porcentaje: 20, descripcion: "Quinta semana" },
    { porcentaje: 10, descripcion: "Séptima semana" },
    { porcentaje: 5, descripcion: "Con entrega a satisfacción" },
  ];

  let cuotaY = currentY + 16;
  cuotas.forEach((cuota) => {
    const monto = Math.round((totalReal * cuota.porcentaje) / 100);

    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${cuota.porcentaje}%`, margin + 10, cuotaY);

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(cuota.descripcion, margin + 24, cuotaY);

    doc.setTextColor(...COLORS.success);
    doc.setFont("helvetica", "bold");
    doc.text(formatPrice(monto), pageWidth - margin - 10, cuotaY, { align: "right" });

    cuotaY += 6.5;
  });

  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Sin letras pequeñas, sin sorpresas", pageWidth / 2, currentY + 47, { align: "center" });

  currentY += 58;

  // BONOS
  const bonosHeight = 58;

  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin, currentY, contentWidth, bonosHeight, 4, 4, "F");
  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(1);
  doc.roundedRect(margin, currentY, contentWidth, bonosHeight, 4, 4, "S");

  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BONOS REGALO INCLUIDOS", margin + 8, currentY + 8);

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLORS.textTertiary);
  doc.text("(Sin costo adicional)", margin + 68, currentY + 8);

  const bonos = [
    "Bono #1 - Nicho iluminado",
    "Bono #2 - Tendedero abatible",
    "Bono #3 - Ducha elegante + mezclador",
    "Bono #4 - Asesoría arquitectónica",
    "Bono #5 - Recorrido virtual 360°",
    "Bono #6 - Supervisión profesional",
    "Bono #7 - Garantía de calidad",
  ];

  let bonoY = currentY + 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  bonos.forEach((bono) => {
    doc.setTextColor(...COLORS.success);
    doc.text("✓", margin + 8, bonoY);
    doc.setTextColor(...COLORS.textSecondary);
    doc.text(bono, margin + 14, bonoY);
    bonoY += 5.2;
  });

  // Valor estimado
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(margin + 16, currentY + bonosHeight - 10, contentWidth - 32, 7, 3, 3, "F");
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Valor estimado de bonos: $2.500.000", pageWidth / 2, currentY + bonosHeight - 5, { align: "center" });

  currentY += bonosHeight + 8;

  // GARANTÍAS
  const garantiasHeight = 36;

  doc.setFillColor(...COLORS.darkNavy);
  doc.roundedRect(margin, currentY, contentWidth, garantiasHeight, 4, 4, "F");

  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("GARANTÍAS Y CONDICIONES", margin + 8, currentY + 8);

  const garantias = [
    `Tiempo de entrega: ${data.plan.tiempoEntrega} días hábiles`,
    "Libre de sobrecostos",
    "Personal certificado y supervisado",
    "Garantía en materiales y mano de obra",
    "Seguro de responsabilidad civil",
  ];

  let garantiaY = currentY + 14;
  doc.setFontSize(8);

  garantias.forEach((garantia) => {
    doc.setTextColor(...COLORS.success);
    doc.text("✓", margin + 8, garantiaY);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "normal");
    doc.text(garantia, margin + 14, garantiaY);
    garantiaY += 4.5;
  });

  currentY += garantiasHeight + 12;

  // BOTÓN WHATSAPP
  const buttonWidth = 150;
  const buttonHeight = 35;
  const buttonX = (pageWidth - buttonWidth) / 2;

  doc.setFillColor(30, 30, 30);
  doc.roundedRect(buttonX + 1, currentY + 1, buttonWidth, buttonHeight, 5, 5, "F");

  doc.setFillColor(...COLORS.whatsapp);
  doc.roundedRect(buttonX, currentY, buttonWidth, buttonHeight, 5, 5, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Continuar conversación", pageWidth / 2, currentY + 11, { align: "center" });
  doc.text("en WhatsApp", pageWidth / 2, currentY + 19, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("+57 317 563 9674", pageWidth / 2, currentY + 28, { align: "center" });

  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(`Hola, quiero continuar con mi cotización ${data.numeroConsecutivo}`)}`;
  doc.link(buttonX, currentY, buttonWidth, buttonHeight, { url: whatsappUrl });

  doc.setTextColor(...COLORS.textTertiary);
  doc.setFontSize(7);
  doc.text("Horario: Lun-Vie 8am-6pm | Sáb 9am-1pm", pageWidth / 2, currentY + buttonHeight + 5, { align: "center" });
  doc.text("Respuesta promedio: Menos de 5 minutos", pageWidth / 2, currentY + buttonHeight + 9, { align: "center" });

  // FOOTER FINAL
  renderFooter(doc, margin, pageWidth, pageHeight);

  return doc.output("blob");
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function renderMiniHeader(doc: jsPDF, margin: number, pageWidth: number): void {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, margin + 5, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textTertiary);
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, margin + 10, { align: "center" });

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.line(margin, margin + 14, pageWidth - margin, margin + 14);
}

function renderFooter(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number): void {
  const footerY = pageHeight - 10;

  doc.setFillColor(...COLORS.darkNavy);
  doc.rect(0, footerY - 2, pageWidth, 12, "F");

  // Línea dorada sutil
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gold);

  doc.text("Constructora Colombia", margin, footerY + 3);
  doc.text("Bucaramanga, Colombia", pageWidth / 2, footerY + 3, { align: "center" });
  doc.text("contacto@constructoracolombia.com", pageWidth - margin, footerY + 3, { align: "right" });
}
