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
    incluye: string[];
    bonus: string[];
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

  // Colores Black & Gold
  const colorDorado: [number, number, number] = [255, 184, 0]; // #FFB800
  const colorNegro: [number, number, number] = [12, 12, 12]; // #0C0C0C
  const colorGris: [number, number, number] = [176, 176, 176]; // #B0B0B0

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 1: PORTADA
  // ═══════════════════════════════════════════════════════════

  // Fondo negro
  doc.setFillColor(...colorNegro);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Borde dorado superior
  doc.setFillColor(...colorDorado);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Logo (texto por ahora - puedes reemplazar con imagen)
  doc.setTextColor(...colorDorado);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 30, { align: "center" });

  // Línea dorada decorativa
  doc.setDrawColor(...colorDorado);
  doc.setLineWidth(0.5);
  doc.line(40, 35, pageWidth - 40, 35);

  // Título principal
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text("COTIZACIÓN DE", pageWidth / 2, 60, { align: "center" });
  doc.text("REMODELACIÓN", pageWidth / 2, 75, { align: "center" });

  // Info del proyecto - Caja dorada
  doc.setFillColor(26, 26, 26); // Gris oscuro
  doc.setDrawColor(...colorDorado);
  doc.setLineWidth(1);
  doc.roundedRect(30, 95, pageWidth - 60, 70, 3, 3, "FD");

  doc.setFontSize(14);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");

  let yPos = 110;
  doc.text("PROYECTO:", 40, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, 100, yPos);

  yPos += 12;
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", 40, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre || "Por definir", 100, yPos);

  yPos += 12;
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("FECHA:", 40, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.fecha, 100, yPos);

  yPos += 12;
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN #:", 40, yPos);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, 100, yPos);

  // Mensaje motivacional
  doc.setFontSize(16);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Tu hogar soñado está a un paso de ser realidad",
    pageWidth / 2,
    190,
    { align: "center" }
  );

  // Footer portada
  doc.setFontSize(10);
  doc.setTextColor(...colorGris);
  doc.setFont("helvetica", "normal");
  doc.text("📱 +57 317 563 9674", pageWidth / 2, 270, { align: "center" });
  doc.text(
    "🌐 www.constructoracolombia.com",
    pageWidth / 2,
    277,
    { align: "center" }
  );

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 2: DESGLOSE FINANCIERO
  // ═══════════════════════════════════════════════════════════

  doc.addPage();

  // Fondo negro
  doc.setFillColor(...colorNegro);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Header dorado
  doc.setFillColor(...colorDorado);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Título
  doc.setFontSize(22);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("DESGLOSE DE INVERSIÓN", pageWidth / 2, 25, { align: "center" });

  // Plan base
  doc.setFillColor(26, 26, 26);
  doc.setDrawColor(...colorDorado);
  doc.roundedRect(20, 35, pageWidth - 40, 25, 3, 3, "FD");

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("Plan Base:", 30, 45);
  doc.setFont("helvetica", "bold");
  doc.text(data.plan.nombre, 30, 52);

  doc.setTextColor(...colorDorado);
  doc.setFontSize(18);
  doc.text(formatoPrecio(data.plan.precio), pageWidth - 30, 48, {
    align: "right"
  });

  // Tabla de adicionales
  let finalY = 70;
  if (data.adicionales.length > 0) {
    const tableData = data.adicionales.map((item) => [
      item.nombre,
      formatoPrecio(item.precio)
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["ADICIONALES SELECCIONADOS", "PRECIO"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: colorDorado,
        textColor: colorNegro,
        fontSize: 12,
        fontStyle: "bold",
        halign: "left"
      },
      bodyStyles: {
        textColor: [255, 255, 255],
        fontSize: 11
      },
      alternateRowStyles: {
        fillColor: [26, 26, 26]
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: "auto", halign: "right", textColor: colorDorado }
      }
    });

    finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY ?? 70;
  }

  // Total final
  const totalBoxY = finalY + 15;

  doc.setFillColor(...colorDorado);
  doc.roundedRect(20, totalBoxY, pageWidth - 40, 30, 3, 3, "F");

  doc.setFontSize(16);
  doc.setTextColor(...colorNegro);
  doc.setFont("helvetica", "bold");
  doc.text("INVERSIÓN TOTAL:", 30, totalBoxY + 12);

  doc.setFontSize(24);
  doc.text(formatoPrecio(data.total), pageWidth - 30, totalBoxY + 20, {
    align: "right"
  });

  // Tiempo de entrega
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(
    `⏱️ Tiempo estimado de ejecución: ${data.plan.tiempoEntrega} días hábiles`,
    pageWidth / 2,
    totalBoxY + 45,
    { align: "center" }
  );

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 3: QUÉ INCLUYE
  // ═══════════════════════════════════════════════════════════

  doc.addPage();

  doc.setFillColor(...colorNegro);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...colorDorado);
  doc.rect(0, 0, pageWidth, 8, "F");

  doc.setFontSize(22);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("LO QUE INCLUYE TU PLAN", pageWidth / 2, 25, { align: "center" });

  // Items incluidos
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");

  let includeY = 45;
  data.plan.incluye.forEach((item) => {
    if (includeY > 220) {
      doc.addPage();
      doc.setFillColor(...colorNegro);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      includeY = 30;
    }

    doc.setTextColor(...colorDorado);
    doc.text("✓", 25, includeY);
    doc.setTextColor(255, 255, 255);
    doc.text(item, 35, includeY);
    includeY += 8;
  });

  // Bonus
  includeY += 15;
  doc.setFontSize(16);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("BONUS GRATIS INCLUIDOS:", 25, includeY);

  includeY += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  data.plan.bonus.forEach((bonus) => {
    if (includeY > 270) return;
    doc.setTextColor(...colorDorado);
    doc.text("⭐", 25, includeY);
    doc.setTextColor(255, 255, 255);
    doc.text(bonus, 35, includeY);
    includeY += 8;
  });

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 4: CONTACTO Y TÉRMINOS
  // ═══════════════════════════════════════════════════════════

  doc.addPage();

  doc.setFillColor(...colorNegro);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...colorDorado);
  doc.rect(0, 0, pageWidth, 8, "F");

  doc.setFontSize(22);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("SIGUIENTE PASO", pageWidth / 2, 25, { align: "center" });

  // Generar QR code
  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(`Hola, quiero confirmar la cotización ${data.numeroConsecutivo} para el proyecto ${data.proyecto.nombre}`)}`;
  const qrDataUrl = await QRCode.toDataURL(whatsappUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: "#FFB800",
      light: "#0C0C0C"
    }
  });

  // QR Code
  doc.addImage(qrDataUrl, "PNG", pageWidth / 2 - 30, 40, 60, 60);

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Escanea para confirmar por WhatsApp",
    pageWidth / 2,
    110,
    { align: "center" }
  );

  // Contacto
  doc.setFontSize(14);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text(
    "INFORMACIÓN DE CONTACTO",
    pageWidth / 2,
    130,
    { align: "center" }
  );

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text("📱 +57 317 563 9674", pageWidth / 2, 142, { align: "center" });
  doc.text(
    "📧 contacto@constructoracolombia.com",
    pageWidth / 2,
    150,
    { align: "center" }
  );
  doc.text(
    "🌐 www.constructoracolombia.com",
    pageWidth / 2,
    158,
    { align: "center" }
  );
  doc.text(
    "📍 Bucaramanga, Santander, Colombia",
    pageWidth / 2,
    166,
    { align: "center" }
  );

  // Términos y condiciones
  doc.setFontSize(12);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "bold");
  doc.text("TÉRMINOS Y CONDICIONES", pageWidth / 2, 185, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(...colorGris);
  doc.setFont("helvetica", "normal");
  const terminos = [
    "• Validez de cotización: 15 días calendario",
    "• Anticipo requerido: 30% del valor total",
    "• Forma de pago: Efectivo, transferencia o consignación",
    "• Garantía: 1 año en mano de obra",
    "• No incluye: Mobiliario, electrodomésticos, decoración",
    "• Precios sujetos a cambio sin previo aviso"
  ];

  let terminosY = 195;
  terminos.forEach((termino) => {
    doc.text(termino, pageWidth / 2, terminosY, { align: "center" });
    terminosY += 6;
  });

  // Footer final
  doc.setDrawColor(...colorDorado);
  doc.line(30, 260, pageWidth - 30, 260);

  doc.setFontSize(10);
  doc.setTextColor(...colorDorado);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Gracias por confiar en Constructora Colombia",
    pageWidth / 2,
    270,
    { align: "center" }
  );
  doc.text(
    "¡Estamos listos para hacer realidad tu proyecto!",
    pageWidth / 2,
    277,
    { align: "center" }
  );

  // Retornar el PDF como Blob
  return doc.output("blob");
}
