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
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const colors = {
  primary: [212, 175, 55] as [number, number, number],
  secondary: [253, 185, 19] as [number, number, number],
  dark: [26, 26, 46] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  text: [31, 41, 55] as [number, number, number],
  textLight: [107, 114, 128] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],
  whatsapp: [37, 211, 102] as [number, number, number],
};

const formatPrice = (price: number): string => {
  return `$${price.toLocaleString("es-CO")}`;
};

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
      {
        categoria: "GENERAL",
        items: [
          "Estuco muros + techo",
          "Pintura 3 manos muros y techo",
          "Mortero nivelación piso impermeabilizado",
          "Enchape piso cerámica + guardaescobas",
          "Drywall cocina y baño",
        ],
      },
      {
        categoria: "BAÑO PRINCIPAL",
        items: [
          "Enchape baño completo",
          "Combo Básico: Sanitario, lavamanos, grifería",
          "Nicho iluminado",
          "División vidrio seguridad 8 mm",
        ],
      },
      {
        categoria: "BAÑO AUXILIAR",
        items: [
          "Demolición enchape existente",
          "Enchape baño completo",
          "Nicho iluminado",
          "División vidrio seguridad 8 mm",
        ],
      },
      {
        categoria: "COCINA",
        items: [
          "Enchape salpicadero y muro",
          "Mesón granito o quartzone",
          "Barra granito con soporte",
        ],
      },
      {
        categoria: "ZONA HÚMEDA",
        items: ["Enchape zona húmeda"],
      },
      {
        categoria: "CARPINTERÍA",
        items: [
          "Puerta RH (3 unidades)",
          "Mueble cocina superior e inferior RH",
          "Closet principal RH",
          "Closet secundario RH",
        ],
      },
      {
        categoria: "OTROS",
        items: ["Luminarias LED apartamento", "Aseo final"],
      },
    ];
  } else {
    return [
      {
        categoria: "GENERAL",
        items: [
          "Estuco muros + techo",
          "Pintura 3 manos muros y techo",
          "Mortero nivelación piso impermeabilizado",
          "Enchape piso cerámica + guardaescobas",
          "Drywall cocina y baños",
        ],
      },
      {
        categoria: "BAÑO PRINCIPAL",
        items: [
          "Enchape baño completo",
          "Combo Básico: Sanitario, lavamanos, grifería",
          "Nicho iluminado",
        ],
      },
      {
        categoria: "COCINA",
        items: ["Enchape salpicadero"],
      },
      {
        categoria: "ZONA HÚMEDA",
        items: ["Enchape zona húmeda"],
      },
      {
        categoria: "OTROS",
        items: ["Luminarias LED", "Aseo final"],
      },
    ];
  }
};

// Bonos gratis
const BONOS_GRATIS = ["nicho iluminado", "tendedero", "ducha elegante"];

const esBonoGratis = (nombre: string): boolean => {
  const nombreLower = nombre.toLowerCase();
  return BONOS_GRATIS.some((b) => nombreLower.includes(b));
};

const filtrarAdicionales = (adicionales: Array<{ nombre: string; precio: number }>) => {
  return adicionales.filter((a) => !esBonoGratis(a.nombre));
};

const calcularTotal = (precioPlan: number, adicionales: Array<{ nombre: string; precio: number }>) => {
  const adicionalesQueSeCobran = filtrarAdicionales(adicionales);
  return precioPlan + adicionalesQueSeCobran.reduce((sum, a) => sum + a.precio, 0);
};

// Calcular altura de una categoría
const calcularAlturaCategoria = (categoria: ActividadCategoria): number => {
  return 8 + 4 + categoria.items.length * 5 + 3;
};

// ═══════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL CON PAGINACIÓN INTELIGENTE
// ═══════════════════════════════════════════════════════════════

export async function generarCotizacionPDF(data: CotizacionData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  }) as DocWithAutoTable;

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const maxY = pageHeight - margin - 12; // Límite inferior (espacio para footer)

  const totalReal = calcularTotal(data.plan.precio, data.adicionales);

  let currentY = 0;

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1: COTIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  // HEADER
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 12, { align: "center" });

  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, 19, { align: "center" });

  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN KIT ACABADOS", margin + 4, 27);

  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, pageWidth - margin - 4, 27, { align: "right" });

  currentY = 40;

  // CLIENTE Y PROYECTO
  const boxWidth = (contentWidth - 8) / 2;

  doc.setFillColor(...colors.background);
  doc.roundedRect(margin, currentY, boxWidth, 22, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 4, currentY + 6);

  doc.setTextColor(...colors.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre, margin + 4, currentY + 11);

  doc.setFontSize(7);
  doc.setTextColor(...colors.textLight);
  if (data.cliente.email) doc.text(data.cliente.email, margin + 4, currentY + 16);
  if (data.cliente.telefono) doc.text(data.cliente.telefono, margin + 4, currentY + 20);

  const rightX = margin + boxWidth + 8;
  doc.setFillColor(...colors.background);
  doc.roundedRect(rightX, currentY, boxWidth, 22, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO", rightX + 4, currentY + 6);

  doc.setTextColor(...colors.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, rightX + 4, currentY + 11);

  doc.setFontSize(7);
  doc.setTextColor(...colors.textLight);
  doc.text(data.proyecto.ubicacion, rightX + 4, currentY + 16);
  doc.text(data.fecha, rightX + 4, currentY + 20);

  currentY += 28;

  // BANNER PLAN
  doc.setFillColor(...colors.secondary);
  doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAN: ${data.plan.nombre.toUpperCase()}`, margin + 6, currentY + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Entrega: ${data.plan.tiempoEntrega} días hábiles`, pageWidth - margin - 6, currentY + 8, { align: "right" });

  currentY += 18;

  // TÍTULO ACTIVIDADES
  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS EN TU PLAN", margin, currentY);
  currentY += 6;

  // ACTIVIDADES POR CATEGORÍA - CON CONTROL DE PAGINACIÓN
  const actividades = getActividadesPorPlan(data.plan.nombre);

  for (const categoria of actividades) {
    const alturaCategoria = calcularAlturaCategoria(categoria);

    // Si no cabe la categoría completa, saltar a nueva página
    if (currentY + alturaCategoria > maxY) {
      // Footer antes de saltar
      renderFooterSimple(doc, margin, pageWidth, pageHeight);
      
      doc.addPage();
      currentY = margin;
      renderMiniHeader(doc, margin, pageWidth);
      currentY = margin + 20;
    }

    // Título categoría
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, currentY, contentWidth, 6, "F");
    doc.setTextColor(...colors.dark);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(categoria.categoria, margin + 4, currentY + 4);

    currentY += 6 + 3; // +3mm separación

    // Items
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    for (const item of categoria.items) {
      doc.setTextColor(...colors.success);
      doc.text("✓", margin + 4, currentY);
      doc.setTextColor(75, 85, 99);
      doc.text(item, margin + 10, currentY);
      currentY += 5;
    }

    currentY += 3;
  }

  // ADICIONALES
  const adicionalesParaMostrar = filtrarAdicionales(data.adicionales);

  if (adicionalesParaMostrar.length > 0) {
    const alturaTabla = 18 + adicionalesParaMostrar.length * 7;

    if (currentY + alturaTabla > maxY) {
      renderFooterSimple(doc, margin, pageWidth, pageHeight);
      doc.addPage();
      currentY = margin;
      renderMiniHeader(doc, margin, pageWidth);
      currentY = margin + 20;
    }

    currentY += 4;
    doc.setTextColor(...colors.dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS", margin, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Descripción", "Precio"]],
      body: adicionalesParaMostrar.map((add, idx) => [
        (idx + 1).toString(),
        add.nombre,
        formatPrice(add.precio),
      ]),
      styles: { fontSize: 8, cellPadding: 2, lineColor: [230, 230, 230], lineWidth: 0.1 },
      headStyles: { fillColor: colors.dark, textColor: colors.white, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: contentWidth - 38 },
        2: { cellWidth: 30, halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc.lastAutoTable?.finalY ?? currentY) + 6;
  }

  // TOTAL
  const totalHeight = 42;

  if (currentY + totalHeight > maxY) {
    renderFooterSimple(doc, margin, pageWidth, pageHeight);
    doc.addPage();
    currentY = margin;
    renderMiniHeader(doc, margin, pageWidth);
    currentY = margin + 20;
  }

  currentY += 6;

  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin + 12, currentY, contentWidth - 24, totalHeight, 5, 5, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INVERSIÓN TOTAL", pageWidth / 2, currentY + 10, { align: "center" });

  doc.setFontSize(26);
  doc.text(formatPrice(totalReal), pageWidth / 2, currentY + 25, { align: "center" });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Entrega en ${data.plan.tiempoEntrega} días hábiles`, pageWidth / 2, currentY + 35, { align: "center" });

  currentY += totalHeight + 8;

  // Footer página cotización
  renderFooterSimple(doc, margin, pageWidth, pageHeight);

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 2: DETALLES DEL CONTRATO
  // ═══════════════════════════════════════════════════════════════

  doc.addPage();
  currentY = 0;

  // Header P2
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 11, { align: "center" });

  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, 17, { align: "center" });

  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL CONTRATO", pageWidth / 2, 24, { align: "center" });

  currentY = 36;

  // FORMA DE PAGO
  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, currentY, contentWidth, 50, 4, 4, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
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

    doc.setTextColor(...colors.primary);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${cuota.porcentaje}%`, margin + 10, cuotaY);

    doc.setTextColor(...colors.white);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(cuota.descripcion, margin + 24, cuotaY);

    doc.setTextColor(...colors.success);
    doc.setFont("helvetica", "bold");
    doc.text(formatPrice(monto), pageWidth - margin - 10, cuotaY, { align: "right" });

    cuotaY += 6.5;
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Sin letras pequeñas, sin sorpresas", pageWidth / 2, currentY + 47, { align: "center" });

  currentY += 58;

  // BONOS (reducidos 15%)
  const bonosHeight = 60;

  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin, currentY, contentWidth, bonosHeight, 4, 4, "F");
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(1);
  doc.roundedRect(margin, currentY, contentWidth, bonosHeight, 4, 4, "S");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BONOS REGALO INCLUIDOS", margin + 8, currentY + 8);

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.textLight);
  doc.text("(Sin costo adicional)", margin + 72, currentY + 8);

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
    doc.setTextColor(...colors.success);
    doc.text("✓", margin + 8, bonoY);
    doc.setTextColor(...colors.text);
    doc.text(bono, margin + 14, bonoY);
    bonoY += 5.5;
  });

  // Valor estimado
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(margin + 18, currentY + bonosHeight - 10, contentWidth - 36, 7, 3, 3, "F");
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Valor estimado de bonos: $2.500.000", pageWidth / 2, currentY + bonosHeight - 5, { align: "center" });

  currentY += bonosHeight + 8;

  // GARANTÍAS
  const garantiasHeight = 38;

  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, currentY, contentWidth, garantiasHeight, 4, 4, "F");

  doc.setTextColor(...colors.primary);
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
    doc.setTextColor(...colors.success);
    doc.text("✓", margin + 8, garantiaY);
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "normal");
    doc.text(garantia, margin + 14, garantiaY);
    garantiaY += 5;
  });

  currentY += garantiasHeight + 12;

  // BOTÓN WHATSAPP
  const buttonWidth = 150;
  const buttonHeight = 36;
  const buttonX = (pageWidth - buttonWidth) / 2;

  // Sombra
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(buttonX + 1, currentY + 1, buttonWidth, buttonHeight, 5, 5, "F");

  // Botón
  doc.setFillColor(...colors.whatsapp);
  doc.roundedRect(buttonX, currentY, buttonWidth, buttonHeight, 5, 5, "F");

  // Texto
  doc.setTextColor(...colors.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Continuar conversación", pageWidth / 2, currentY + 12, { align: "center" });
  doc.text("en WhatsApp", pageWidth / 2, currentY + 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("+57 317 563 9674", pageWidth / 2, currentY + 29, { align: "center" });

  // Link
  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(`Hola, quiero continuar con mi cotización ${data.numeroConsecutivo}`)}`;
  doc.link(buttonX, currentY, buttonWidth, buttonHeight, { url: whatsappUrl });

  // Subtexto
  doc.setTextColor(...colors.textLight);
  doc.setFontSize(7);
  doc.text("Horario: Lun-Vie 8am-6pm | Sáb 9am-1pm", pageWidth / 2, currentY + buttonHeight + 5, { align: "center" });
  doc.text("Respuesta promedio: Menos de 5 minutos", pageWidth / 2, currentY + buttonHeight + 9, { align: "center" });

  // FOOTER FINAL
  doc.setFillColor(...colors.dark);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Constructora Colombia", margin, pageHeight - 3);

  doc.setTextColor(...colors.white);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Bucaramanga, Colombia", pageWidth / 2, pageHeight - 3, { align: "center" });
  doc.text("hola@constructoracolombia.com", pageWidth - margin, pageHeight - 3, { align: "right" });

  return doc.output("blob");
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function renderMiniHeader(doc: jsPDF, margin: number, pageWidth: number): void {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, margin + 5, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textLight);
  doc.text("Más que una constructora, un aliado para tu hogar", pageWidth / 2, margin + 10, { align: "center" });

  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.3);
  doc.line(margin, margin + 14, pageWidth - margin, margin + 14);
}

function renderFooterSimple(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number): void {
  doc.setFillColor(...colors.dark);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Constructora Colombia", margin, pageHeight - 3);

  doc.setTextColor(...colors.white);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("+57 317 563 9674 | www.constructoracolombia.com", pageWidth - margin, pageHeight - 3, { align: "right" });
}
