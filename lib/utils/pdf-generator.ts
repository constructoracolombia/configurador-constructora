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
// CONFIGURACIÓN DE DISEÑO
// ═══════════════════════════════════════════════════════════════

const colors = {
  primary: [212, 175, 55] as [number, number, number],      // #D4AF37 Dorado elegante
  secondary: [253, 185, 19] as [number, number, number],    // #FDB913 Amarillo energético
  dark: [26, 26, 46] as [number, number, number],           // #1a1a2e Azul oscuro sofisticado
  darkAlt: [22, 33, 62] as [number, number, number],        // #16213e Azul oscuro alt
  success: [16, 185, 129] as [number, number, number],      // #10b981 Verde éxito
  text: [31, 41, 55] as [number, number, number],           // #1f2937 Gris oscuro
  textLight: [107, 114, 128] as [number, number, number],   // #6b7280 Gris claro
  white: [255, 255, 255] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],  // #f9fafb Fondo sutil
  whatsapp: [37, 211, 102] as [number, number, number],     // #25D366 Verde WhatsApp
};

// Formatear precio en formato colombiano
const formatPrice = (price: number): string => {
  return `$${price.toLocaleString("es-CO")}`;
};

// ═══════════════════════════════════════════════════════════════
// ACTIVIDADES POR PLAN - DETALLADAS
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
          "Mortero de nivelación del piso impermeabilizado",
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
          "División de baño, vidrio de seguridad 8 mm",
        ],
      },
      {
        categoria: "BAÑO AUXILIAR",
        items: [
          "Demolición enchape existente",
          "Enchape baño completo",
          "Nicho iluminado",
          "División de baño, vidrio de seguridad 8 mm",
        ],
      },
      {
        categoria: "COCINA",
        items: [
          "Enchape salpicadero y muro cocina",
          "Mesón granito negro o quartzone blanco",
          "Barra granito negro o quartzone blanco con soporte",
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
        items: ["Luminarias LED para el apartamento", "Aseo final"],
      },
    ];
  } else {
    // Plan Básico
    return [
      {
        categoria: "GENERAL",
        items: [
          "Estuco muros + techo",
          "Pintura 3 manos muros y techo",
          "Mortero de nivelación del piso impermeabilizado",
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

// ═══════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function generarCotizacionPDF(
  data: CotizacionData
): Promise<Blob> {
  const doc = new jsPDF("p", "mm", "a4") as DocWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1: COTIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  let yPos = 0;

  // ─────────────────────────────────────
  // HEADER ELEGANTE
  // ─────────────────────────────────────
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 38, "F");

  // Logo/Título principal
  doc.setTextColor(...colors.primary);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 14, { align: "center" });

  // Subtítulo
  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    22,
    { align: "center" }
  );

  // Título documento y número
  doc.setTextColor(...colors.primary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN KIT ACABADOS", margin + 5, 32);

  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, pageWidth - margin - 5, 32, {
    align: "right",
  });

  yPos = 46;

  // ─────────────────────────────────────
  // SECCIÓN CLIENTE Y PROYECTO
  // ─────────────────────────────────────
  const boxWidth = (pageWidth - 2 * margin - 10) / 2;

  // Box Cliente
  doc.setFillColor(...colors.background);
  doc.roundedRect(margin, yPos, boxWidth, 28, 3, 3, "F");
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, boxWidth, 28, 3, 3, "S");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 5, yPos + 7);

  doc.setTextColor(...colors.text);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre, margin + 5, yPos + 14);

  doc.setFontSize(8);
  doc.setTextColor(...colors.textLight);
  if (data.cliente.email) {
    doc.text(data.cliente.email, margin + 5, yPos + 20);
  }
  if (data.cliente.telefono) {
    doc.text(data.cliente.telefono, margin + 5, yPos + 25);
  }

  // Box Proyecto
  const rightBoxX = margin + boxWidth + 10;
  doc.setFillColor(...colors.background);
  doc.roundedRect(rightBoxX, yPos, boxWidth, 28, 3, 3, "F");
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(rightBoxX, yPos, boxWidth, 28, 3, 3, "S");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO", rightBoxX + 5, yPos + 7);

  doc.setTextColor(...colors.text);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, rightBoxX + 5, yPos + 14);

  doc.setFontSize(8);
  doc.setTextColor(...colors.textLight);
  doc.text(data.proyecto.ubicacion, rightBoxX + 5, yPos + 20);
  doc.text(data.fecha, rightBoxX + 5, yPos + 25);

  yPos += 36;

  // ─────────────────────────────────────
  // BANNER DEL PLAN
  // ─────────────────────────────────────
  doc.setFillColor(...colors.secondary);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 16, 3, 3, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAN: ${data.plan.nombre.toUpperCase()}`, margin + 8, yPos + 7);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Entrega: ${data.plan.tiempoEntrega} días hábiles`,
    pageWidth - margin - 8,
    yPos + 7,
    { align: "right" }
  );

  yPos += 24;

  // ─────────────────────────────────────
  // ACTIVIDADES INCLUIDAS (POR CATEGORÍA)
  // ─────────────────────────────────────
  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS EN TU PLAN", margin, yPos);

  yPos += 6;

  const actividades = getActividadesPorPlan(data.plan.nombre);

  actividades.forEach((categoria) => {
    // Verificar si necesitamos nueva página
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Título de categoría
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 6, 1, 1, "F");
    doc.setTextColor(...colors.dark);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(categoria.categoria, margin + 3, yPos + 4.5);

    yPos += 8;

    // Items de la categoría
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.text);

    categoria.items.forEach((item) => {
      doc.setTextColor(...colors.success);
      doc.text("✓", margin + 3, yPos);
      doc.setTextColor(...colors.text);
      doc.text(item, margin + 9, yPos);
      yPos += 5;
    });

    yPos += 2;
  });

  yPos += 4;

  // ─────────────────────────────────────
  // ADICIONALES SELECCIONADOS
  // ─────────────────────────────────────
  if (data.adicionales.length > 0) {
    // Verificar espacio
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(...colors.dark);
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
        fontSize: 9,
        cellPadding: 3,
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: colors.dark,
        textColor: colors.white,
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 120 },
        2: { cellWidth: 38, halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
  }

  // ─────────────────────────────────────
  // TOTAL - DISEÑO DRAMÁTICO
  // ─────────────────────────────────────
  // Calcular posición para que quede bien
  const totalBoxHeight = 35;
  const totalBoxY = Math.max(yPos + 5, pageHeight - margin - totalBoxHeight - 15);

  doc.setFillColor(...colors.dark);
  doc.roundedRect(
    margin + 20,
    totalBoxY,
    pageWidth - 2 * margin - 40,
    totalBoxHeight,
    4,
    4,
    "F"
  );

  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INVERSIÓN TOTAL", pageWidth / 2, totalBoxY + 10, {
    align: "center",
  });

  doc.setFontSize(28);
  doc.text(formatPrice(data.total), pageWidth / 2, totalBoxY + 24, {
    align: "center",
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Entrega en ${data.plan.tiempoEntrega} días hábiles`,
    pageWidth / 2,
    totalBoxY + 31,
    { align: "center" }
  );

  // ─────────────────────────────────────
  // FOOTER PÁGINA 1
  // ─────────────────────────────────────
  doc.setFillColor(...colors.dark);
  doc.rect(0, pageHeight - 10, pageWidth, 10, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Constructora Colombia", margin, pageHeight - 4);

  doc.setTextColor(...colors.white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "+57 317 563 9674  |  www.constructoracolombia.com",
    pageWidth - margin,
    pageHeight - 4,
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
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CONSTRUCTORA COLOMBIA", pageWidth / 2, 13, { align: "center" });

  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Más que una constructora, un aliado para tu hogar",
    pageWidth / 2,
    20,
    { align: "center" }
  );

  doc.setTextColor(...colors.primary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL CONTRATO", pageWidth / 2, 28, { align: "center" });

  yPos = 42;

  // ─────────────────────────────────────
  // FORMA DE PAGO CON MONTOS CALCULADOS
  // ─────────────────────────────────────
  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 62, 4, 4, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FORMA DE PAGO FLEXIBLE", margin + 10, yPos + 10);

  const cuotas = [
    { porcentaje: 45, descripcion: "Anticipo para iniciar obra" },
    { porcentaje: 20, descripcion: "Tercera semana" },
    { porcentaje: 20, descripcion: "Quinta semana" },
    { porcentaje: 10, descripcion: "Séptima semana" },
    { porcentaje: 5, descripcion: "Con entrega a satisfacción" },
  ];

  let cuotaY = yPos + 20;
  cuotas.forEach((cuota) => {
    const monto = Math.round((data.total * cuota.porcentaje) / 100);

    // Porcentaje
    doc.setTextColor(...colors.primary);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${cuota.porcentaje}%`, margin + 12, cuotaY);

    // Descripción
    doc.setTextColor(...colors.white);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(cuota.descripcion, margin + 30, cuotaY);

    // Monto
    doc.setTextColor(...colors.success);
    doc.setFont("helvetica", "bold");
    doc.text(formatPrice(monto), pageWidth - margin - 12, cuotaY, {
      align: "right",
    });

    cuotaY += 8;
  });

  // Mensaje de confianza
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Sin letras pequeñas, sin sorpresas",
    pageWidth / 2,
    yPos + 58,
    { align: "center" }
  );

  yPos += 72;

  // ─────────────────────────────────────
  // BONOS REGALO REDISEÑADOS
  // ─────────────────────────────────────
  const bonosHeight = 75;

  // Fondo amarillo con borde
  doc.setFillColor(253, 249, 235);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, bonosHeight, 4, 4, "F");
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, bonosHeight, 4, 4, "S");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BONOS REGALO INCLUIDOS", margin + 10, yPos + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.textLight);
  doc.text("(Sin costo adicional para ti)", margin + 85, yPos + 10);

  const bonos = [
    { emoji: "✨", texto: "Nicho iluminado" },
    { emoji: "🧺", texto: "Tendedero abatible" },
    { emoji: "🚿", texto: "Ducha elegante + mezclador" },
    { emoji: "📐", texto: "Asesoría arquitectónica" },
    { emoji: "📹", texto: "Recorrido virtual 360°" },
    { emoji: "👷", texto: "Supervisión profesional" },
    { emoji: "✅", texto: "Garantía de calidad" },
  ];

  let bonoY = yPos + 20;
  const bonoCol1X = margin + 12;
  const bonoCol2X = pageWidth / 2 + 5;

  bonos.forEach((bono, index) => {
    const x = index < 4 ? bonoCol1X : bonoCol2X;
    const y = index < 4 ? bonoY + index * 8 : bonoY + (index - 4) * 8;

    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${bono.emoji} Bono #${index + 1} - ${bono.texto}`, x, y);
  });

  // Valor estimado de bonos
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(margin + 30, yPos + bonosHeight - 14, pageWidth - 2 * margin - 60, 10, 3, 3, "F");
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Valor estimado de bonos: $2.500.000",
    pageWidth / 2,
    yPos + bonosHeight - 7,
    { align: "center" }
  );

  yPos += bonosHeight + 10;

  // ─────────────────────────────────────
  // GARANTÍAS Y CONDICIONES
  // ─────────────────────────────────────
  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 48, 4, 4, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("GARANTÍAS Y CONDICIONES", margin + 10, yPos + 10);

  const garantias = [
    `Tiempo de entrega: ${data.plan.tiempoEntrega} días hábiles`,
    "Libre de sobrecostos",
    "Personal certificado y supervisado",
    "Garantía en materiales y mano de obra",
    "Seguro de responsabilidad civil",
  ];

  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  garantias.forEach((garantia, idx) => {
    doc.setTextColor(...colors.success);
    doc.text("✓", margin + 12, yPos + 18 + idx * 6);
    doc.setTextColor(...colors.white);
    doc.text(garantia, margin + 20, yPos + 18 + idx * 6);
  });

  // Nota de exclusiones
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(8);
  doc.text(
    "⚠️ No incluye: mobiliario, electrodomésticos, decoración",
    margin + 12,
    yPos + 44
  );

  yPos += 58;

  // ─────────────────────────────────────
  // BOTÓN WHATSAPP PROFESIONAL
  // ─────────────────────────────────────
  const buttonWidth = 140;
  const buttonHeight = 36;
  const buttonX = (pageWidth - buttonWidth) / 2;
  const buttonY = yPos;

  // Sombra del botón
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(buttonX + 2, buttonY + 2, buttonWidth, buttonHeight, 6, 6, "F");

  // Fondo del botón (verde WhatsApp)
  doc.setFillColor(...colors.whatsapp);
  doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 6, 6, "F");

  // Texto del botón
  doc.setTextColor(...colors.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Continuar conversación", pageWidth / 2, buttonY + 12, {
    align: "center",
  });
  doc.text("en WhatsApp", pageWidth / 2, buttonY + 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("+57 317 563 9674", pageWidth / 2, buttonY + 30, { align: "center" });

  // Link clicable
  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(
    `Hola, quiero continuar con mi cotización ${data.numeroConsecutivo}`
  )}`;
  doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: whatsappUrl });

  // Info adicional bajo el botón
  doc.setTextColor(...colors.textLight);
  doc.setFontSize(8);
  doc.text(
    "Horario: Lun-Vie 8am-6pm | Sáb 9am-1pm",
    pageWidth / 2,
    buttonY + buttonHeight + 8,
    { align: "center" }
  );
  doc.text(
    "Respuesta promedio: Menos de 5 minutos ⚡",
    pageWidth / 2,
    buttonY + buttonHeight + 14,
    { align: "center" }
  );

  // ─────────────────────────────────────
  // FOOTER PÁGINA 2
  // ─────────────────────────────────────
  doc.setFillColor(...colors.dark);
  doc.rect(0, pageHeight - 12, pageWidth, 12, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Constructora Colombia", margin, pageHeight - 5);

  doc.setTextColor(...colors.white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Bucaramanga, Colombia", pageWidth / 2, pageHeight - 5, {
    align: "center",
  });

  doc.text(
    "hola@constructoracolombia.com",
    pageWidth - margin,
    pageHeight - 5,
    { align: "right" }
  );

  return doc.output("blob");
}
