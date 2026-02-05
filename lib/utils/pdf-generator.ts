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

// Bonos gratis que NO suman al total
const BONOS_GRATIS = ["nicho iluminado", "tendedero", "ducha elegante"];

// Filtrar adicionales para mostrar (excluye bonos)
const filtrarAdicionalesParaMostrar = (
  adicionales: Array<{ nombre: string; precio: number }>
) => {
  return adicionales.filter((a) => {
    const nombreLower = a.nombre.toLowerCase();
    return !BONOS_GRATIS.some((b) => nombreLower.includes(b));
  });
};

// Calcular total real (sin bonos gratis)
const calcularTotalReal = (
  precioPlan: number,
  adicionales: Array<{ nombre: string; precio: number }>
) => {
  const adicionalesQueSeCobran = filtrarAdicionalesParaMostrar(adicionales);
  const totalAdicionales = adicionalesQueSeCobran.reduce(
    (sum, a) => sum + a.precio,
    0
  );
  return precioPlan + totalAdicionales;
};

// ═══════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function generarCotizacionPDF(
  data: CotizacionData
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  }) as DocWithAutoTable;

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Calcular total real (sin bonos gratis)
  const totalReal = calcularTotalReal(data.plan.precio, data.adicionales);

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1
  // ═══════════════════════════════════════════════════════════════

  let yPos = 0;

  // HEADER
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 12, { align: "center" });

  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    19,
    { align: "center" }
  );

  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN KIT ACABADOS", margin + 5, 28);

  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, pageWidth - margin - 5, 28, {
    align: "right",
  });

  yPos = 42;

  // CLIENTE Y PROYECTO
  const boxWidth = (contentWidth - 8) / 2;

  doc.setFillColor(...colors.background);
  doc.roundedRect(margin, yPos, boxWidth, 24, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 4, yPos + 6);

  doc.setTextColor(...colors.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre, margin + 4, yPos + 12);

  doc.setFontSize(7);
  doc.setTextColor(...colors.textLight);
  if (data.cliente.email) doc.text(data.cliente.email, margin + 4, yPos + 17);
  if (data.cliente.telefono) doc.text(data.cliente.telefono, margin + 4, yPos + 21);

  const rightX = margin + boxWidth + 8;
  doc.setFillColor(...colors.background);
  doc.roundedRect(rightX, yPos, boxWidth, 24, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO", rightX + 4, yPos + 6);

  doc.setTextColor(...colors.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, rightX + 4, yPos + 12);

  doc.setFontSize(7);
  doc.setTextColor(...colors.textLight);
  doc.text(data.proyecto.ubicacion, rightX + 4, yPos + 17);
  doc.text(data.fecha, rightX + 4, yPos + 21);

  yPos += 30;

  // BANNER PLAN
  doc.setFillColor(...colors.secondary);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAN: ${data.plan.nombre.toUpperCase()}`, margin + 6, yPos + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Entrega: ${data.plan.tiempoEntrega} días hábiles`,
    pageWidth - margin - 6,
    yPos + 8,
    { align: "right" }
  );

  yPos += 20;

  // ACTIVIDADES INCLUIDAS
  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS EN TU PLAN", margin, yPos);

  yPos += 6;

  const actividades = getActividadesPorPlan(data.plan.nombre);

  actividades.forEach((categoria) => {
    // Título categoría
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, yPos, contentWidth, 6, "F");
    doc.setTextColor(...colors.dark);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(categoria.categoria, margin + 4, yPos + 4);

    yPos += 6 + 3; // +3mm separación crítica

    // Items
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    categoria.items.forEach((item) => {
      doc.setTextColor(...colors.success);
      doc.text("✓", margin + 4, yPos);
      doc.setTextColor(75, 85, 99);
      doc.text(item, margin + 10, yPos);
      yPos += 4.5;
    });

    yPos += 2;
  });

  yPos += 3;

  // ADICIONALES
  const adicionalesParaMostrar = filtrarAdicionalesParaMostrar(data.adicionales);

  if (adicionalesParaMostrar.length > 0) {
    doc.setTextColor(...colors.dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS", margin, yPos);

    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Descripción", "Precio"]],
      body: adicionalesParaMostrar.map((add, idx) => [
        (idx + 1).toString(),
        add.nombre,
        formatPrice(add.precio),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: colors.dark,
        textColor: colors.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: contentWidth - 40 },
        2: { cellWidth: 32, halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 6;
  }

  // TOTAL - Siempre en Página 1
  const totalHeight = 45;

  if (yPos + totalHeight + 12 > pageHeight - margin) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin + 10, yPos, contentWidth - 20, totalHeight, 5, 5, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INVERSIÓN TOTAL", pageWidth / 2, yPos + 11, { align: "center" });

  doc.setFontSize(28);
  doc.text(formatPrice(totalReal), pageWidth / 2, yPos + 28, {
    align: "center",
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Entrega en ${data.plan.tiempoEntrega} días hábiles`,
    pageWidth / 2,
    yPos + 38,
    { align: "center" }
  );

  // FOOTER P1
  doc.setFillColor(...colors.dark);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Constructora Colombia", margin, pageHeight - 3);

  doc.setTextColor(...colors.white);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(
    "+57 317 563 9674 | www.constructoracolombia.com",
    pageWidth - margin,
    pageHeight - 3,
    { align: "right" }
  );

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 2
  // ═══════════════════════════════════════════════════════════════

  doc.addPage();
  yPos = 0;

  // HEADER P2
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 11, { align: "center" });

  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    17,
    { align: "center" }
  );

  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL CONTRATO", pageWidth / 2, 24, { align: "center" });

  yPos = 36;

  // FORMA DE PAGO
  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, yPos, contentWidth, 52, 4, 4, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("FORMA DE PAGO FLEXIBLE", margin + 8, yPos + 9);

  const cuotas = [
    { porcentaje: 45, descripcion: "Anticipo para iniciar obra" },
    { porcentaje: 20, descripcion: "Tercera semana" },
    { porcentaje: 20, descripcion: "Quinta semana" },
    { porcentaje: 10, descripcion: "Séptima semana" },
    { porcentaje: 5, descripcion: "Con entrega a satisfacción" },
  ];

  let cuotaY = yPos + 17;
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
    doc.text(formatPrice(monto), pageWidth - margin - 10, cuotaY, {
      align: "right",
    });

    cuotaY += 6.5;
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Sin letras pequeñas, sin sorpresas", pageWidth / 2, yPos + 49, {
    align: "center",
  });

  yPos += 60;

  // BONOS REGALO
  const bonosHeight = 68;

  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin, yPos, contentWidth, bonosHeight, 4, 4, "F");

  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, contentWidth, bonosHeight, 4, 4, "S");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BONOS REGALO INCLUIDOS", margin + 8, yPos + 9);

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.textLight);
  doc.text("(Sin costo adicional)", margin + 75, yPos + 9);

  const bonos = [
    "Bono #1 - Nicho iluminado",
    "Bono #2 - Tendedero abatible",
    "Bono #3 - Ducha elegante + mezclador",
    "Bono #4 - Asesoría arquitectónica",
    "Bono #5 - Recorrido virtual 360°",
    "Bono #6 - Supervisión profesional",
    "Bono #7 - Garantía de calidad",
  ];

  let bonoY = yPos + 18;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  bonos.forEach((bono) => {
    doc.setTextColor(...colors.success);
    doc.text("✓", margin + 8, bonoY);
    doc.setTextColor(...colors.text);
    doc.text(bono, margin + 14, bonoY);
    bonoY += 6;
  });

  // Valor estimado
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(margin + 20, yPos + bonosHeight - 11, contentWidth - 40, 8, 3, 3, "F");
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Valor estimado de bonos: $2.500.000",
    pageWidth / 2,
    yPos + bonosHeight - 5,
    { align: "center" }
  );

  yPos += bonosHeight + 8;

  // GARANTÍAS
  const garantiasHeight = 40;

  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, yPos, contentWidth, garantiasHeight, 4, 4, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("GARANTÍAS Y CONDICIONES", margin + 8, yPos + 9);

  const garantias = [
    `Tiempo de entrega: ${data.plan.tiempoEntrega} días hábiles`,
    "Libre de sobrecostos",
    "Personal certificado y supervisado",
    "Garantía en materiales y mano de obra",
    "Seguro de responsabilidad civil",
  ];

  let garantiaY = yPos + 16;
  doc.setFontSize(8);

  garantias.forEach((garantia) => {
    doc.setTextColor(...colors.success);
    doc.text("✓", margin + 8, garantiaY);
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "normal");
    doc.text(garantia, margin + 14, garantiaY);
    garantiaY += 5;
  });

  yPos += garantiasHeight + 10;

  // BOTÓN WHATSAPP (160x38mm)
  const buttonWidth = 160;
  const buttonHeight = 38;
  const buttonX = (pageWidth - buttonWidth) / 2;
  const buttonY = yPos;

  // Sombra
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(buttonX + 1, buttonY + 1, buttonWidth, buttonHeight, 6, 6, "F");

  // Botón
  doc.setFillColor(...colors.whatsapp);
  doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 6, 6, "F");

  // Texto
  doc.setTextColor(...colors.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Continuar conversación", pageWidth / 2, buttonY + 12, {
    align: "center",
  });
  doc.text("en WhatsApp", pageWidth / 2, buttonY + 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("+57 317 563 9674", pageWidth / 2, buttonY + 30, { align: "center" });

  // Link
  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(
    `Hola, quiero continuar con mi cotización ${data.numeroConsecutivo}`
  )}`;
  doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: whatsappUrl });

  // Subtexto
  doc.setTextColor(...colors.textLight);
  doc.setFontSize(7);
  doc.text(
    "Horario: Lun-Vie 8am-6pm | Sáb 9am-1pm",
    pageWidth / 2,
    buttonY + buttonHeight + 5,
    { align: "center" }
  );
  doc.text(
    "Respuesta promedio: Menos de 5 minutos",
    pageWidth / 2,
    buttonY + buttonHeight + 9,
    { align: "center" }
  );

  // FOOTER P2
  doc.setFillColor(...colors.dark);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Constructora Colombia", margin, pageHeight - 3);

  doc.setTextColor(...colors.white);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Bucaramanga, Colombia", pageWidth / 2, pageHeight - 3, {
    align: "center",
  });
  doc.text("hola@constructoracolombia.com", pageWidth - margin, pageHeight - 3, {
    align: "right",
  });

  return doc.output("blob");
}
