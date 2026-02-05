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

// Formatear precio en formato colombiano
const formatPrice = (price: number): string => {
  return `$${price.toLocaleString("es-CO")}`;
};

export async function generarCotizacionPDF(
  data: CotizacionData
): Promise<Blob> {
  const doc = new jsPDF("p", "mm", "a4") as DocWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ═══════════════════════════════════════
  // PALETA DE COLORES
  // ═══════════════════════════════════════
  const colors = {
    gold: [212, 175, 55] as [number, number, number],       // #D4AF37 - Dorado títulos
    yellow: [253, 185, 19] as [number, number, number],     // #FDB913 - Amarillo fondos
    darkBlue: [44, 62, 80] as [number, number, number],     // #2C3E50 - Azul oscuro
    black: [0, 0, 0] as [number, number, number],           // #000000 - Negro
    white: [255, 255, 255] as [number, number, number],     // #FFFFFF - Blanco
    grayLight: [245, 245, 245] as [number, number, number], // Gris claro filas
    grayMedium: [128, 128, 128] as [number, number, number],// Gris medio
    whatsapp: [37, 211, 102] as [number, number, number],   // #25D366 - Verde WhatsApp
  };

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1: COTIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  let yPos = 0;

  // ─────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────
  doc.setFillColor(...colors.darkBlue);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Título principal
  doc.setTextColor(...colors.gold);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 18, { align: "center" });

  // Subtítulo
  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    26,
    { align: "center" }
  );

  // Título de cotización
  doc.setTextColor(...colors.gold);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN KIT ACABADOS", pageWidth / 2, 36, { align: "center" });

  yPos = 50;

  // ─────────────────────────────────────
  // SECCIÓN CLIENTE Y PROYECTO
  // ─────────────────────────────────────
  const boxWidth = (pageWidth - 2 * margin - 10) / 2;

  // Box Cliente (izquierda)
  doc.setFillColor(...colors.grayLight);
  doc.roundedRect(margin, yPos, boxWidth, 30, 2, 2, "F");

  doc.setTextColor(...colors.darkBlue);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 5, yPos + 8);

  doc.setTextColor(...colors.black);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre, margin + 5, yPos + 15);

  doc.setFontSize(8);
  doc.setTextColor(...colors.grayMedium);
  if (data.cliente.email) {
    doc.text(data.cliente.email, margin + 5, yPos + 21);
  }
  if (data.cliente.telefono) {
    doc.text(data.cliente.telefono, margin + 5, yPos + 26);
  }

  // Box Proyecto (derecha)
  const rightBoxX = margin + boxWidth + 10;
  doc.setFillColor(...colors.grayLight);
  doc.roundedRect(rightBoxX, yPos, boxWidth, 30, 2, 2, "F");

  doc.setTextColor(...colors.darkBlue);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO", rightBoxX + 5, yPos + 8);

  doc.setTextColor(...colors.black);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, rightBoxX + 5, yPos + 15);

  doc.setFontSize(8);
  doc.setTextColor(...colors.grayMedium);
  doc.text(`Fecha: ${data.fecha}`, rightBoxX + 5, yPos + 21);
  doc.text(`No. ${data.numeroConsecutivo}`, rightBoxX + 5, yPos + 26);

  yPos += 40;

  // ─────────────────────────────────────
  // BANNER DEL PLAN
  // ─────────────────────────────────────
  doc.setFillColor(...colors.yellow);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 3, 3, "F");

  doc.setTextColor(...colors.black);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAN: ${data.plan.nombre.toUpperCase()}`, margin + 8, yPos + 8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Entrega: ${data.plan.tiempoEntrega} días hábiles`,
    margin + 8,
    yPos + 14
  );

  yPos += 28;

  // ─────────────────────────────────────
  // TABLA: ACTIVIDADES INCLUIDAS
  // ─────────────────────────────────────
  doc.setTextColor(...colors.darkBlue);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS", margin, yPos);

  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [["#", "Actividad", "Estado"]],
    body: data.plan.incluye.map((item, idx) => [
      (idx + 1).toString(),
      item,
      "Incluido",
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: colors.black,
      textColor: colors.white,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: colors.grayLight,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 138 },
      2: { cellWidth: 20, halign: "center", fontStyle: "bold", textColor: [0, 128, 0] },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;

  // ─────────────────────────────────────
  // TABLA: ADICIONALES SELECCIONADOS
  // ─────────────────────────────────────
  if (data.adicionales.length > 0) {
    doc.setTextColor(...colors.darkBlue);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS", margin, yPos);

    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Descripción", "Precio"]],
      body: data.adicionales.map((add, idx) => [
        (idx + 1).toString(),
        add.nombre,
        formatPrice(add.precio),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: colors.black,
        textColor: colors.white,
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: colors.grayLight,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 115 },
        2: { cellWidth: 43, halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
  }

  // ─────────────────────────────────────
  // TOTAL COTIZACIÓN
  // ─────────────────────────────────────
  const totalBoxY = Math.max(yPos, pageHeight - 55);

  doc.setFillColor(...colors.darkBlue);
  doc.roundedRect(margin, totalBoxY, pageWidth - 2 * margin, 22, 3, 3, "F");

  doc.setTextColor(...colors.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL COTIZACIÓN:", margin + 10, totalBoxY + 10);

  doc.setTextColor(...colors.gold);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(formatPrice(data.total), pageWidth - margin - 10, totalBoxY + 14, {
    align: "right",
  });

  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tiempo de entrega: ${data.plan.tiempoEntrega} días hábiles`,
    margin + 10,
    totalBoxY + 18
  );

  // ─────────────────────────────────────
  // FOOTER PÁGINA 1
  // ─────────────────────────────────────
  doc.setFillColor(...colors.darkBlue);
  doc.rect(0, pageHeight - 12, pageWidth, 12, "F");

  doc.setTextColor(...colors.gold);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Constructora Colombia", margin, pageHeight - 5);

  doc.setTextColor(...colors.white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "+57 317 563 9674  |  www.constructoracolombia.com",
    pageWidth - margin,
    pageHeight - 5,
    { align: "right" }
  );

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 2: DETALLES DEL CONTRATO
  // ═══════════════════════════════════════════════════════════════

  doc.addPage();
  yPos = 0;

  // ─────────────────────────────────────
  // HEADER PÁGINA 2
  // ─────────────────────────────────────
  doc.setFillColor(...colors.darkBlue);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(...colors.gold);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 15, { align: "center" });

  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    23,
    { align: "center" }
  );

  doc.setTextColor(...colors.gold);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL CONTRATO", pageWidth / 2, 31, { align: "center" });

  yPos = 45;

  // ─────────────────────────────────────
  // FORMA DE PAGO
  // ─────────────────────────────────────
  doc.setFillColor(...colors.darkBlue);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 55, 3, 3, "F");

  doc.setTextColor(...colors.gold);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FORMA DE PAGO:", margin + 8, yPos + 10);

  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const formaPago = [
    { porcentaje: "45%", descripcion: "Anticipo para iniciar obra" },
    { porcentaje: "20%", descripcion: "Tercera semana" },
    { porcentaje: "20%", descripcion: "Quinta semana" },
    { porcentaje: "10%", descripcion: "Séptima semana" },
    { porcentaje: "5%", descripcion: "Con entrega a satisfacción" },
  ];

  formaPago.forEach((pago, idx) => {
    const lineY = yPos + 20 + idx * 7;
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.gold);
    doc.text(pago.porcentaje, margin + 12, lineY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.white);
    doc.text(`- ${pago.descripcion}`, margin + 28, lineY);
  });

  yPos += 65;

  // ─────────────────────────────────────
  // BONOS REGALO
  // ─────────────────────────────────────
  doc.setFillColor(...colors.yellow);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 70, 3, 3, "F");

  doc.setTextColor(...colors.black);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BONOS REGALO:", margin + 8, yPos + 10);

  const bonos = [
    "Bono #1 - Nicho iluminado",
    "Bono #2 - Tendedero abatible",
    "Bono #3 - Ducha elegante + mezclador",
    "Bono #4 - Asesoría arquitectónica",
    "Bono #5 - Recorrido virtual 360°",
    "Bono #6 - Supervisión profesional",
    "Bono #7 - Garantía de calidad",
  ];

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  bonos.forEach((bono, idx) => {
    const lineY = yPos + 20 + idx * 7;
    doc.text(`✓ ${bono}`, margin + 12, lineY);
  });

  yPos += 80;

  // ─────────────────────────────────────
  // NOTAS GENERALES
  // ─────────────────────────────────────
  doc.setFillColor(...colors.darkBlue);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, 3, "F");

  doc.setTextColor(...colors.gold);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("NOTAS GENERALES:", margin + 8, yPos + 10);

  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const notas = [
    `• Tiempo de entrega: ${data.plan.tiempoEntrega} días hábiles`,
    "• Libre de sobrecostos",
    "• Trabajo supervisado por profesionales",
    "• Garantía de calidad en materiales y mano de obra",
    "• No incluye mobiliario, electrodomésticos ni decoración",
  ];

  notas.forEach((nota, idx) => {
    doc.text(nota, margin + 12, yPos + 20 + idx * 6);
  });

  yPos += 60;

  // ─────────────────────────────────────
  // BOTÓN WHATSAPP (en lugar de QR)
  // ─────────────────────────────────────
  const whatsappY = yPos + 5;
  const whatsappBoxWidth = pageWidth - 2 * margin;
  const whatsappBoxHeight = 30;

  // Fondo del botón
  doc.setFillColor(...colors.whatsapp);
  doc.roundedRect(margin, whatsappY, whatsappBoxWidth, whatsappBoxHeight, 5, 5, "F");

  // Texto del botón
  doc.setTextColor(...colors.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Continuar conversación en WhatsApp",
    pageWidth / 2,
    whatsappY + 12,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "+57 317 563 9674",
    pageWidth / 2,
    whatsappY + 20,
    { align: "center" }
  );

  // Link clicable sobre el botón
  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(
    `Hola, quiero continuar con mi cotización ${data.numeroConsecutivo}`
  )}`;
  doc.link(margin, whatsappY, whatsappBoxWidth, whatsappBoxHeight, {
    url: whatsappUrl,
  });

  // Texto pequeño debajo
  doc.setTextColor(...colors.grayMedium);
  doc.setFontSize(8);
  doc.text(
    "Haz clic en el botón para abrir WhatsApp directamente",
    pageWidth / 2,
    whatsappY + whatsappBoxHeight + 6,
    { align: "center" }
  );

  // ─────────────────────────────────────
  // FOOTER PÁGINA 2
  // ─────────────────────────────────────
  doc.setFillColor(...colors.darkBlue);
  doc.rect(0, pageHeight - 12, pageWidth, 12, "F");

  doc.setTextColor(...colors.gold);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Constructora Colombia", margin, pageHeight - 5);

  doc.setTextColor(...colors.white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "+57 317 563 9674  |  www.constructoracolombia.com",
    pageWidth - margin,
    pageHeight - 5,
    { align: "right" }
  );

  return doc.output("blob");
}
