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

  // PALETA DE COLORES PROFESIONAL
  const colorDorado: [number, number, number] = [255, 184, 0]; // #FFB800 - Solo para acentos
  const colorAzulOscuro: [number, number, number] = [31, 41, 55]; // #1F2937 - Headers
  const colorGrisOscuro: [number, number, number] = [55, 65, 81]; // #374151 - Texto principal
  const colorGrisClaro: [number, number, number] = [243, 244, 246]; // #F3F4F6 - Fondos alternados
  const colorBlanco: [number, number, number] = [255, 255, 255];
  const colorBorde: [number, number, number] = [229, 231, 235]; // #E5E7EB

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 1: COTIZACIÓN COMPLETA
  // ═══════════════════════════════════════════════════════════

  // Fondo blanco
  doc.setFillColor(...colorBlanco);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // === HEADER CON LOGO Y TÍTULO ===
  doc.setFillColor(...colorAzulOscuro);
  doc.rect(0, 0, pageWidth, 35, "F");

  // Logo/Título empresa
  doc.setTextColor(...colorDorado);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    22,
    { align: "center" }
  );

  // Título del documento
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN KIT ACABADOS", pageWidth / 2, 30, { align: "center" });

  // === INFO DEL CLIENTE ===
  let yPos = 45;

  // Caja de información del cliente
  doc.setDrawColor(...colorBorde);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, pageWidth - 30, 28, "S");

  doc.setFontSize(9);
  doc.setTextColor(...colorGrisOscuro);
  doc.setFont("helvetica", "bold");

  yPos += 7;
  doc.text("CLIENTE:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre || "Cliente", 45, yPos);

  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN #:", 115, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, 150, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, 45, yPos);

  doc.setFont("helvetica", "bold");
  doc.text("FECHA:", 115, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.fecha, 150, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("UBICACIÓN:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.ubicacion, 45, yPos);

  doc.setFont("helvetica", "bold");
  doc.text("REF:", 115, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.plan.nombre, 150, yPos);

  // === TABLA DE ACTIVIDADES ===
  yPos += 15;

  // Construir tabla de actividades del plan
  const tableData: [string, string, string][] = data.plan.incluye.map(
    (item, index) => [(index + 1).toString(), item, "1"]
  );

  // Generar tabla con autoTable
  autoTable(doc, {
    startY: yPos,
    head: [["#", "DESCRIPCIÓN DE ACTIVIDAD", "CANT"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: colorAzulOscuro,
      textColor: colorBlanco,
      fontSize: 9,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      textColor: colorGrisOscuro,
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: colorGrisClaro,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 145 },
      2: { cellWidth: 15, halign: "center" },
    },
    margin: { left: 15, right: 15 },
    didDrawPage: () => {
      // Footer en cada página
      doc.setFontSize(8);
      doc.setTextColor(...colorGrisOscuro);
      doc.text(
        "Constructora Colombia | +57 317 563 9674 | www.constructoracolombia.com",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    },
  });

  // === ADICIONALES (si hay) ===
  const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  const finalY = lastTable ? lastTable.finalY + 10 : yPos + 10;

  if (data.adicionales.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(...colorAzulOscuro);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS:", 15, finalY);

    const adicionalesData = data.adicionales.map((a, i) => [
      (i + 1).toString(),
      a.nombre,
      formatoPrecio(a.precio),
    ]);

    autoTable(doc, {
      startY: finalY + 3,
      head: [["#", "DESCRIPCIÓN", "PRECIO"]],
      body: adicionalesData,
      theme: "grid",
      headStyles: {
        fillColor: colorDorado,
        textColor: colorAzulOscuro,
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: colorGrisOscuro,
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 130 },
        2: {
          cellWidth: 30,
          halign: "right",
          fontStyle: "bold",
          textColor: colorAzulOscuro,
        },
      },
      margin: { left: 15, right: 15 },
    });
  }

  // === TOTAL ===
  const lastTableFinal = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  const totalY = lastTableFinal ? lastTableFinal.finalY + 10 : finalY + 10;

  doc.setFillColor(...colorAzulOscuro);
  doc.roundedRect(15, totalY, pageWidth - 30, 20, 2, 2, "F");

  doc.setFontSize(12);
  doc.setTextColor(...colorBlanco);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL COTIZACIÓN:", 20, totalY + 8);

  doc.setTextColor(...colorDorado);
  doc.setFontSize(18);
  doc.text(formatoPrecio(data.total), pageWidth - 20, totalY + 12, {
    align: "right",
  });

  doc.setFontSize(9);
  doc.setTextColor(...colorBlanco);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tiempo de entrega: ${data.plan.tiempoEntrega} días hábiles`,
    20,
    totalY + 16
  );

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 2: FORMA DE PAGO, BONOS Y TÉRMINOS
  // ═══════════════════════════════════════════════════════════

  doc.addPage();

  // Header igual
  doc.setFillColor(...colorAzulOscuro);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(...colorDorado);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    22,
    { align: "center" }
  );

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL CONTRATO", pageWidth / 2, 30, { align: "center" });

  yPos = 45;

  // === FORMA DE PAGO ===
  doc.setFillColor(...colorAzulOscuro);
  doc.rect(15, yPos, pageWidth - 30, 8, "F");

  doc.setFontSize(11);
  doc.setTextColor(...colorBlanco);
  doc.setFont("helvetica", "bold");
  doc.text("FORMA DE PAGO:", 20, yPos + 5.5);

  yPos += 12;

  const formaPago: [string, string][] = [
    ["45%", "Anticipo para iniciar obra"],
    ["30%", "Semana 3"],
    ["20%", "Semana 5"],
    ["5%", "Un día antes de la entrega final"],
  ];

  autoTable(doc, {
    startY: yPos,
    body: formaPago,
    theme: "plain",
    bodyStyles: {
      textColor: colorGrisOscuro,
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: "bold", textColor: colorAzulOscuro },
      1: { cellWidth: 150 },
    },
    margin: { left: 20 },
  });

  const formaPagoTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  yPos = formaPagoTable ? formaPagoTable.finalY + 10 : yPos + 30;

  // === BONOS REGALO ===
  doc.setFillColor(...colorDorado);
  doc.rect(15, yPos, pageWidth - 30, 8, "F");

  doc.setFontSize(11);
  doc.setTextColor(...colorAzulOscuro);
  doc.setFont("helvetica", "bold");
  doc.text("BONOS REGALO:", 20, yPos + 5.5);

  yPos += 12;

  const bonusData = data.plan.bonus.map((bonus, i) => [
    `Bono #${i + 1}`,
    bonus,
  ]);

  autoTable(doc, {
    startY: yPos,
    body: bonusData,
    theme: "plain",
    bodyStyles: {
      textColor: colorGrisOscuro,
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: "bold", textColor: colorDorado },
      1: { cellWidth: 145 },
    },
    margin: { left: 20 },
  });

  const bonusTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  yPos = bonusTable ? bonusTable.finalY + 10 : yPos + 30;

  // === NOTAS GENERALES ===
  doc.setFillColor(...colorAzulOscuro);
  doc.rect(15, yPos, pageWidth - 30, 8, "F");

  doc.setFontSize(11);
  doc.setTextColor(...colorBlanco);
  doc.setFont("helvetica", "bold");
  doc.text("NOTAS GENERALES:", 20, yPos + 5.5);

  yPos += 12;

  doc.setFontSize(9);
  doc.setTextColor(...colorGrisOscuro);
  doc.setFont("helvetica", "normal");

  const notas = [
    `- Tiempo de entrega ${data.plan.tiempoEntrega} días hábiles`,
    "- Libre de sobrecostos",
    "- Trabajo supervisado por profesionales y realizado con personal capacitado",
    "- Garantía de calidad en materiales y mano de obra",
    "- No incluye mobiliario, electrodomésticos ni decoración",
  ];

  notas.forEach((nota) => {
    doc.text(nota, 20, yPos);
    yPos += 6;
  });

  yPos += 10;

  // === QR CODE ===
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573175639674";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, quiero confirmar la cotización ${data.numeroConsecutivo} para ${data.proyecto.nombre}`)}`;
  const qrDataUrl = await QRCode.toDataURL(whatsappUrl, {
    width: 300,
    margin: 1,
  });

  doc.addImage(qrDataUrl, "PNG", pageWidth / 2 - 25, yPos, 50, 50);

  doc.setFontSize(9);
  doc.setTextColor(...colorGrisOscuro);
  doc.text("Escanea para confirmar por WhatsApp", pageWidth / 2, yPos + 56, {
    align: "center",
  });

  // === CONTACTO ===
  yPos += 70;

  doc.setFontSize(10);
  doc.setTextColor(...colorAzulOscuro);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMACIÓN DE CONTACTO", pageWidth / 2, yPos, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(...colorGrisOscuro);
  doc.setFont("helvetica", "normal");
  doc.text("Tel: +57 317 563 9674", pageWidth / 2, yPos + 7, {
    align: "center",
  });
  doc.text(
    "Email: contacto@constructoracolombia.com",
    pageWidth / 2,
    yPos + 13,
    { align: "center" }
  );
  doc.text("Web: www.constructoracolombia.com", pageWidth / 2, yPos + 19, {
    align: "center",
  });
  doc.text("Bucaramanga, Santander, Colombia", pageWidth / 2, yPos + 25, {
    align: "center",
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...colorGrisOscuro);
  doc.text(
    "Constructora Colombia | +57 317 563 9674 | www.constructoracolombia.com",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return doc.output("blob");
}
