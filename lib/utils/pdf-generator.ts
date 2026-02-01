import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { formatoPrecio } from "./format";

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
    incluye: readonly string[];
    bonus: readonly string[];
  };
  adicionales: Array<{
    nombre: string;
    precio: number;
  }>;
  total: number;
}

export async function generarCotizacionPDF(
  data: CotizacionData
): Promise<Blob> {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const colorDorado: [number, number, number] = [255, 184, 0];
  const colorNegro: [number, number, number] = [12, 12, 12];
  const colorGris: [number, number, number] = [176, 176, 176];

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 1: TODO EL CONTENIDO PRINCIPAL
  // ═══════════════════════════════════════════════════════════

  doc.setFillColor(...colorNegro);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...colorDorado);
  doc.rect(0, 0, pageWidth, 10, "F");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 7, { align: "center" });

  doc.setFontSize(24);
  doc.setTextColor(...colorDorado);
  doc.text("COTIZACIÓN DE REMODELACIÓN", pageWidth / 2, 22, {
    align: "center"
  });

  doc.setFillColor(26, 26, 26);
  doc.setDrawColor(...colorDorado);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 28, pageWidth - 30, 28, 2, 2, "FD");

  doc.setFontSize(10);
  let yPos = 34;

  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("Proyecto:", 20, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, 45, yPos);

  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", 110, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre || "Por definir", 130, yPos);

  yPos += 7;

  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("Plan:", 20, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.plan.nombre, 45, yPos);

  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 110, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.fecha, 130, yPos);

  yPos += 7;

  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("Cotización #:", 20, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, 45, yPos);

  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("Tiempo:", 110, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.plan.tiempoEntrega} días hábiles`, 130, yPos);

  yPos = 62;

  doc.setFillColor(26, 26, 26);
  doc.setDrawColor(...colorDorado);
  doc.roundedRect(15, yPos, pageWidth - 30, 12, 2, 2, "FD");

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Plan Base:", 20, yPos + 8);
  doc.text(data.plan.nombre, 50, yPos + 8);

  doc.setTextColor(...colorDorado);
  doc.setFontSize(14);
  doc.text(formatoPrecio(data.plan.precio), pageWidth - 20, yPos + 8, {
    align: "right"
  });

  if (data.adicionales.length > 0) {
    yPos += 17;

    doc.setFontSize(11);
    doc.setTextColor(...colorDorado);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS:", 15, yPos);

    yPos += 5;

    const tableData = data.adicionales.map((item) => [
      item.nombre,
      formatoPrecio(item.precio)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Descripción", "Precio"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: colorDorado,
        textColor: colorNegro,
        fontSize: 9,
        fontStyle: "bold"
      },
      bodyStyles: {
        textColor: [255, 255, 255],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [26, 26, 26]
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: "auto", halign: "right", textColor: colorDorado }
      }
    });

    yPos =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? yPos;
    yPos += 5;
  } else {
    yPos += 17;
  }

  doc.setFillColor(...colorDorado);
  doc.roundedRect(15, yPos, pageWidth - 30, 18, 2, 2, "F");

  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("INVERSIÓN TOTAL:", 20, yPos + 8);

  doc.setFontSize(18);
  doc.text(formatoPrecio(data.total), pageWidth - 20, yPos + 11, {
    align: "right"
  });

  yPos += 23;

  doc.setFontSize(12);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("LO QUE INCLUYE TU PLAN:", 15, yPos);

  yPos += 6;
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");

  const columnWidth = (pageWidth - 30) / 2;
  let leftY = yPos;
  let rightY = yPos;
  const maxItemsPerColumn = 12;

  data.plan.incluye.forEach((item, index) => {
    const isLeftColumn = index < maxItemsPerColumn;
    const currentY = isLeftColumn ? leftY : rightY;
    const xPos = isLeftColumn ? 17 : 17 + columnWidth;

    if (currentY < 240) {
      doc.setTextColor(...colorDorado);
      doc.text("✓", xPos, currentY);
      doc.setTextColor(255, 255, 255);
      const lines = doc.splitTextToSize(item, columnWidth - 15);
      doc.text(lines, xPos + 5, currentY);

      const lineHeight = lines.length * 3.5;
      if (isLeftColumn) {
        leftY += lineHeight;
      } else {
        rightY += lineHeight;
      }
    }
  });

  const bonusY = Math.max(leftY, rightY) + 5;

  if (bonusY < 250) {
    doc.setFontSize(10);
    doc.setTextColor(...colorDorado);
    doc.setFont("helvetica", "bold");
    doc.text("BONUS GRATIS:", 15, bonusY);

    let bonusItemY = bonusY + 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");

    data.plan.bonus.slice(0, 3).forEach((bonus) => {
      if (bonusItemY < 265) {
        doc.setTextColor(...colorDorado);
        doc.text("⭐", 17, bonusItemY);
        doc.setTextColor(255, 255, 255);
        doc.text(bonus, 22, bonusItemY);
        bonusItemY += 4;
      }
    });
  }

  doc.setDrawColor(...colorDorado);
  doc.line(15, 272, pageWidth - 15, 272);

  doc.setFontSize(8);
  doc.setTextColor(...colorGris);
  doc.text(
    "📱 +57 317 563 9674  |  🌐 www.constructoracolombia.com",
    pageWidth / 2,
    278,
    { align: "center" }
  );
  doc.setFont("helvetica", "italic");
  doc.text(
    "Más que una constructora, un aliado para llevar a la realidad el hogar de tus sueños",
    pageWidth / 2,
    283,
    { align: "center" }
  );

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 2: QR Y CONTACTO
  // ═══════════════════════════════════════════════════════════

  doc.addPage();

  doc.setFillColor(...colorNegro);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...colorDorado);
  doc.rect(0, 0, pageWidth, 10, "F");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 7, { align: "center" });

  doc.setFontSize(22);
  doc.setTextColor(...colorDorado);
  doc.text("SIGUIENTE PASO", pageWidth / 2, 30, { align: "center" });

  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(`Hola, quiero confirmar la cotización ${data.numeroConsecutivo} para ${data.proyecto.nombre}`)}`;
  const qrDataUrl = await QRCode.toDataURL(whatsappUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#FFB800", light: "#0C0C0C" }
  });

  doc.addImage(qrDataUrl, "PNG", pageWidth / 2 - 35, 45, 70, 70);

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "Escanea para confirmar por WhatsApp",
    pageWidth / 2,
    125,
    { align: "center" }
  );

  doc.setFontSize(14);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("CONTACTO", pageWidth / 2, 145, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text("📱 +57 317 563 9674", pageWidth / 2, 155, { align: "center" });
  doc.text(
    "📧 contacto@constructoracolombia.com",
    pageWidth / 2,
    163,
    { align: "center" }
  );
  doc.text(
    "🌐 www.constructoracolombia.com",
    pageWidth / 2,
    171,
    { align: "center" }
  );
  doc.text("📍 Bucaramanga, Santander", pageWidth / 2, 179, {
    align: "center"
  });

  doc.setFontSize(11);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("TÉRMINOS Y CONDICIONES", pageWidth / 2, 195, {
    align: "center"
  });

  doc.setFontSize(8);
  doc.setTextColor(...colorGris);
  doc.setFont("helvetica", "normal");
  const terminos = [
    "• Validez: 15 días  • Anticipo: 30%  • Garantía: 1 año",
    "• No incluye mobiliario, electrodomésticos ni decoración",
    "• Precios sujetos a cambio sin previo aviso"
  ];

  let terminosY = 203;
  terminos.forEach((t) => {
    doc.text(t, pageWidth / 2, terminosY, { align: "center" });
    terminosY += 5;
  });

  doc.setDrawColor(...colorDorado);
  doc.line(30, 260, pageWidth - 30, 260);

  doc.setFontSize(11);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "italic");
  doc.text(
    "¡Gracias por confiar en Constructora Colombia!",
    pageWidth / 2,
    270,
    { align: "center" }
  );
  doc.text(
    "Estamos listos para hacer realidad tu proyecto",
    pageWidth / 2,
    277,
    { align: "center" }
  );

  return doc.output("blob");
}
