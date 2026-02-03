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

export async function generarCotizacionPDF(
  data: CotizacionData
): Promise<Blob> {
  const doc = new jsPDF("p", "mm", "a4") as DocWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ═══════════════════════════════════════
  // PALETA DE COLORES OPTIMIZADA
  // ═══════════════════════════════════════
  const colors = {
    primary: [255, 184, 0] as [number, number, number], // Dorado
    dark: [12, 12, 12] as [number, number, number], // Negro
    darkGray: [26, 26, 26] as [number, number, number], // Gris oscuro
    gray: [128, 128, 128] as [number, number, number], // Gris medio
    lightGray: [240, 240, 240] as [number, number, number], // Gris claro
    white: [255, 255, 255] as [number, number, number], // Blanco
    accent: [0, 107, 255] as [number, number, number], // Azul Calendly
  };

  // ═══════════════════════════════════════
  // PÁGINA 1: COTIZACIÓN
  // ═══════════════════════════════════════

  let yPos = margin;

  // Header minimalista
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 15, { align: "center" });

  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    22,
    { align: "center" }
  );

  doc.setTextColor(...colors.lightGray);
  doc.setFontSize(8);
  doc.text(data.numeroConsecutivo, pageWidth / 2, 28, { align: "center" });

  yPos = 45;

  // Info del cliente - Diseño tipo tarjeta
  doc.setFillColor(...colors.lightGray);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 5, yPos + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.cliente.nombre, margin + 5, yPos + 13);

  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  if (data.cliente.email) {
    doc.text(`📧 ${data.cliente.email}`, margin + 5, yPos + 18);
  }
  if (data.cliente.telefono) {
    doc.text(`📱 ${data.cliente.telefono}`, margin + 5, yPos + 22);
  }

  // Proyecto y fecha (derecha)
  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO", pageWidth - margin - 60, yPos + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.proyecto.nombre, pageWidth - margin - 60, yPos + 13);

  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text(data.fecha, pageWidth - margin - 60, yPos + 18);

  yPos += 35;

  // Plan seleccionado - Card destacada
  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 3, 3, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAN: ${data.plan.nombre.toUpperCase()}`, margin + 5, yPos + 7);

  doc.setFontSize(9);
  doc.text(
    `⏱ Entrega: ${data.plan.tiempoEntrega} días hábiles`,
    margin + 5,
    yPos + 12
  );

  yPos += 25;

  // Tabla de actividades incluidas - Minimalista
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS", margin, yPos);

  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    head: [["#", "Actividad", "Estado"]],
    body: data.plan.incluye.map((item, idx) => [
      (idx + 1).toString(),
      item,
      "✓",
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: colors.lightGray,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: colors.dark,
      textColor: colors.white,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: colors.lightGray,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 145 },
      2: {
        cellWidth: 15,
        halign: "center",
        textColor: colors.primary,
        fontStyle: "bold",
      },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc.lastAutoTable?.finalY ?? yPos) + 10;

  // Adicionales seleccionados (si hay)
  if (data.adicionales.length > 0) {
    doc.setTextColor(...colors.dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS", margin, yPos);

    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Adicional", "Valor"]],
      body: data.adicionales.map((add) => [
        add.nombre,
        `$ ${add.precio.toLocaleString("es-CO")}`,
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: colors.lightGray,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.dark,
        fontStyle: "bold",
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 40, halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 10;
  }

  // Total - Destacado minimalista
  const totalBoxHeight = 20;
  const totalBoxY = pageHeight - margin - totalBoxHeight - 15;

  doc.setFillColor(...colors.dark);
  doc.roundedRect(
    margin,
    totalBoxY,
    pageWidth - 2 * margin,
    totalBoxHeight,
    3,
    3,
    "F"
  );

  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("INVERSIÓN TOTAL:", margin + 5, totalBoxY + 9);

  doc.setTextColor(...colors.primary);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(
    `$ ${data.total.toLocaleString("es-CO")}`,
    pageWidth - margin - 5,
    totalBoxY + 12,
    { align: "right" }
  );

  // Footer página 1
  doc.setFontSize(7);
  doc.setTextColor(...colors.gray);
  doc.text(
    "Precios sujetos a cambios sin previo aviso • Vigencia 30 días",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  // ═══════════════════════════════════════
  // PÁGINA 2: TÉRMINOS Y CONTACTO
  // ═══════════════════════════════════════

  doc.addPage();
  yPos = margin;

  // Header simple
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 25, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    "INFORMACIÓN IMPORTANTE",
    pageWidth / 2,
    15,
    { align: "center" }
  );

  yPos = 35;

  // Forma de pago - Card
  doc.setFillColor(...colors.lightGray);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FORMA DE PAGO", margin + 5, yPos + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const formaPago = [
    "• 45% Anticipo al firmar el contrato",
    "• 30% Semana 3 (Avance de obra)",
    "• 20% Semana 5 (Pre-entrega)",
    "• 5% Al finalizar y recibir conforme",
  ];

  formaPago.forEach((linea, idx) => {
    doc.text(linea, margin + 5, yPos + 15 + idx * 5);
  });

  yPos += 45;

  // Bonos Regalo - Destacado
  if (data.plan.bonus.length > 0) {
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 3, 3, "F");

    doc.setTextColor(...colors.dark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("🎁 BONOS INCLUIDOS", margin + 5, yPos + 5);

    yPos += 12;

    doc.setFillColor(...colors.lightGray);
    const bonosHeight = data.plan.bonus.length * 5 + 5;
    doc.roundedRect(
      margin,
      yPos,
      pageWidth - 2 * margin,
      bonosHeight,
      3,
      3,
      "F"
    );

    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    data.plan.bonus.forEach((bono, idx) => {
      doc.text(`✓ ${bono}`, margin + 5, yPos + 7 + idx * 5);
    });

    yPos += bonosHeight + 10;
  }

  // Notas importantes
  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("NOTAS IMPORTANTES", margin, yPos);

  yPos += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);

  const notas = [
    "• Los precios incluyen mano de obra y materiales especificados",
    "• Tiempo de entrega aplica desde la firma del contrato",
    "• Garantía de 1 año en acabados y 6 meses en pintura",
    "• Cambios posteriores pueden generar costos adicionales",
    "• Se realiza limpieza final de la obra",
  ];

  notas.forEach((nota, idx) => {
    doc.text(nota, margin + 5, yPos + idx * 5);
  });

  yPos += 35;

  // CTAs - Minimalistas pero claros
  const ctaBoxHeight = 45;
  const ctaY = pageHeight - margin - ctaBoxHeight - 20;

  // Fondo sutil
  doc.setFillColor(...colors.lightGray);
  doc.roundedRect(
    margin,
    ctaY,
    pageWidth - 2 * margin,
    ctaBoxHeight,
    3,
    3,
    "F"
  );

  // Título
  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PRÓXIMOS PASOS", pageWidth / 2, ctaY + 8, { align: "center" });

  // WhatsApp - Destacado
  const halfCtaWidth = (pageWidth - 2 * margin - 25) / 2;
  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin + 10, ctaY + 12, halfCtaWidth, 12, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(
    "💬 CONTINUAR POR WHATSAPP",
    margin + 10 + halfCtaWidth / 2,
    ctaY + 19,
    { align: "center" }
  );

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.gray);
  const whatsappText = "wa.me/573175639674";
  doc.textWithLink(whatsappText, margin + 10 + halfCtaWidth / 2, ctaY + 23, {
    align: "center",
    url: "https://wa.me/573175639674",
  });

  // Calendly - Azul
  doc.setFillColor(...colors.accent);
  doc.roundedRect(
    pageWidth / 2 + 2.5,
    ctaY + 12,
    halfCtaWidth,
    12,
    2,
    2,
    "F"
  );

  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(
    "📅 AGENDAR REUNIÓN GRATIS",
    pageWidth / 2 + 2.5 + halfCtaWidth / 2,
    ctaY + 19,
    { align: "center" }
  );

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.gray);
  const calendlyText = "calendly.com/constructora";
  doc.textWithLink(
    calendlyText,
    pageWidth / 2 + 2.5 + halfCtaWidth / 2,
    ctaY + 23,
    {
      align: "center",
      url: "https://calendly.com/contacto-constructoracolombia/30min",
    }
  );

  // Texto motivacional
  doc.setFontSize(8);
  doc.setTextColor(...colors.dark);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Estamos listos para transformar tu hogar. ¿Comenzamos?",
    pageWidth / 2,
    ctaY + 32,
    { align: "center" }
  );

  // Footer - Información de contacto
  const footerY = pageHeight - 15;

  doc.setFillColor(...colors.dark);
  doc.rect(0, footerY, pageWidth, 15, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, footerY + 5, {
    align: "center",
  });

  doc.setTextColor(...colors.white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "📱 +57 317 563 9674  •  📧 contacto@constructoracolombia.com",
    pageWidth / 2,
    footerY + 10,
    { align: "center" }
  );

  return doc.output("blob");
}
