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
  primary: [212, 175, 55] as [number, number, number],      // Dorado
  secondary: [253, 185, 19] as [number, number, number],    // Amarillo
  dark: [26, 26, 46] as [number, number, number],           // Azul oscuro
  success: [16, 185, 129] as [number, number, number],      // Verde
  text: [31, 41, 55] as [number, number, number],           // Gris oscuro
  textLight: [107, 114, 128] as [number, number, number],   // Gris claro
  white: [255, 255, 255] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],
  whatsapp: [37, 211, 102] as [number, number, number],
};

// Formatear precio colombiano
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
        items: ["Luminarias LED para el apartamento", "Aseo final"],
      },
    ];
  } else {
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

// Filtrar adicionales que son bonos gratis
const filtrarAdicionalesBonos = (
  adicionales: Array<{ nombre: string; precio: number }>
): Array<{ nombre: string; precio: number }> => {
  const bonusGratis = [
    "nicho iluminado",
    "tendedero",
    "ducha elegante",
    "mezclador",
  ];

  return adicionales.filter((adicional) => {
    const nombreLower = adicional.nombre.toLowerCase();
    return !bonusGratis.some((bono) => nombreLower.includes(bono));
  });
};

// ═══════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function generarCotizacionPDF(
  data: CotizacionData
): Promise<Blob> {
  // Formato carta con márgenes optimizados
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  }) as DocWithAutoTable;

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1: COTIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  let yPos = 0;

  // ─────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 36, "F");

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
    21,
    { align: "center" }
  );

  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN KIT ACABADOS", margin + 5, 30);

  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.numeroConsecutivo, pageWidth - margin - 5, 30, {
    align: "right",
  });

  yPos = 44;

  // ─────────────────────────────────────
  // CLIENTE Y PROYECTO
  // ─────────────────────────────────────
  const boxWidth = (contentWidth - 10) / 2;

  // Cliente
  doc.setFillColor(...colors.background);
  doc.roundedRect(margin, yPos, boxWidth, 26, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 5, yPos + 7);

  doc.setTextColor(...colors.text);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente.nombre, margin + 5, yPos + 13);

  doc.setFontSize(8);
  doc.setTextColor(...colors.textLight);
  if (data.cliente.email) {
    doc.text(data.cliente.email, margin + 5, yPos + 18);
  }
  if (data.cliente.telefono) {
    doc.text(data.cliente.telefono, margin + 5, yPos + 23);
  }

  // Proyecto
  const rightX = margin + boxWidth + 10;
  doc.setFillColor(...colors.background);
  doc.roundedRect(rightX, yPos, boxWidth, 26, 2, 2, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PROYECTO", rightX + 5, yPos + 7);

  doc.setTextColor(...colors.text);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.proyecto.nombre, rightX + 5, yPos + 13);

  doc.setFontSize(8);
  doc.setTextColor(...colors.textLight);
  doc.text(data.proyecto.ubicacion, rightX + 5, yPos + 18);
  doc.text(data.fecha, rightX + 5, yPos + 23);

  yPos += 34;

  // ─────────────────────────────────────
  // BANNER PLAN
  // ─────────────────────────────────────
  doc.setFillColor(...colors.secondary);
  doc.roundedRect(margin, yPos, contentWidth, 14, 3, 3, "F");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAN: ${data.plan.nombre.toUpperCase()}`, margin + 8, yPos + 9);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Entrega: ${data.plan.tiempoEntrega} días hábiles`,
    pageWidth - margin - 8,
    yPos + 9,
    { align: "right" }
  );

  yPos += 24; // +10mm espacio adicional

  // ─────────────────────────────────────
  // ACTIVIDADES INCLUIDAS
  // ─────────────────────────────────────
  doc.setTextColor(...colors.dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ACTIVIDADES INCLUIDAS EN TU PLAN", margin, yPos);

  yPos += 8; // Espacio antes de categorías

  const actividades = getActividadesPorPlan(data.plan.nombre);

  actividades.forEach((categoria) => {
    // Verificar espacio
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    // Categoría
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, yPos, contentWidth, 5, 1, 1, "F");
    doc.setTextColor(...colors.dark);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(categoria.categoria, margin + 3, yPos + 3.5);

    yPos += 7;

    // Items
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    categoria.items.forEach((item) => {
      doc.setTextColor(...colors.success);
      doc.text("✓", margin + 3, yPos);
      doc.setTextColor(...colors.text);
      doc.text(item, margin + 9, yPos);
      yPos += 5;
    });

    yPos += 2;
  });

  yPos += 5;

  // ─────────────────────────────────────
  // ADICIONALES (filtrados, sin bonos)
  // ─────────────────────────────────────
  const adicionalesParaMostrar = filtrarAdicionalesBonos(data.adicionales);

  if (adicionalesParaMostrar.length > 0) {
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(...colors.dark);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ADICIONALES SELECCIONADOS", margin, yPos);

    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Descripción", "Precio"]],
      body: adicionalesParaMostrar.map((add, idx) => [
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
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: contentWidth - 45 },
        2: { cellWidth: 35, halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 8;
  }

  // ─────────────────────────────────────
  // TOTAL - Siempre visible
  // ─────────────────────────────────────
  const totalHeight = 40;

  // Si no cabe, nueva página
  if (yPos + totalHeight + 15 > pageHeight - margin) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin + 15, yPos, contentWidth - 30, totalHeight, 4, 4, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INVERSIÓN TOTAL", pageWidth / 2, yPos + 10, { align: "center" });

  doc.setFontSize(28);
  doc.text(formatPrice(data.total), pageWidth / 2, yPos + 26, {
    align: "center",
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Entrega en ${data.plan.tiempoEntrega} días hábiles`,
    pageWidth / 2,
    yPos + 35,
    { align: "center" }
  );

  // ─────────────────────────────────────
  // FOOTER P1
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
  // PÁGINA 2: DETALLES
  // ═══════════════════════════════════════════════════════════════

  doc.addPage();
  yPos = 0;

  // Header P2
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(...colors.primary);
  doc.setFontSize(22);
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
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL CONTRATO", pageWidth / 2, 26, { align: "center" });

  yPos = 40;

  // ─────────────────────────────────────
  // FORMA DE PAGO
  // ─────────────────────────────────────
  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, yPos, contentWidth, 58, 4, 4, "F");

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

  let cuotaY = yPos + 18;
  cuotas.forEach((cuota) => {
    const monto = Math.round((data.total * cuota.porcentaje) / 100);

    doc.setTextColor(...colors.primary);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${cuota.porcentaje}%`, margin + 12, cuotaY);

    doc.setTextColor(...colors.white);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(cuota.descripcion, margin + 28, cuotaY);

    doc.setTextColor(...colors.success);
    doc.setFont("helvetica", "bold");
    doc.text(formatPrice(monto), pageWidth - margin - 12, cuotaY, {
      align: "right",
    });

    cuotaY += 7;
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Sin letras pequeñas, sin sorpresas", pageWidth / 2, yPos + 54, {
    align: "center",
  });

  yPos += 68;

  // ─────────────────────────────────────
  // BONOS REGALO (sin emojis rotos)
  // ─────────────────────────────────────
  const bonosHeight = 72;

  // Fondo amarillo claro
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin, yPos, contentWidth, bonosHeight, 4, 4, "F");

  // Borde amarillo
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, yPos, contentWidth, bonosHeight, 4, 4, "S");

  doc.setTextColor(...colors.dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BONOS REGALO INCLUIDOS", margin + 10, yPos + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.textLight);
  doc.text("(Sin costo adicional para ti)", margin + 82, yPos + 10);

  // Lista de bonos con checkmarks simples
  const bonos = [
    "Bono #1 - Nicho iluminado",
    "Bono #2 - Tendedero abatible",
    "Bono #3 - Ducha elegante + mezclador",
    "Bono #4 - Asesoría arquitectónica",
    "Bono #5 - Recorrido virtual 360°",
    "Bono #6 - Supervisión profesional",
    "Bono #7 - Garantía de calidad",
  ];

  let bonoY = yPos + 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  bonos.forEach((bono) => {
    doc.setTextColor(...colors.success);
    doc.text("✓", margin + 10, bonoY);
    doc.setTextColor(...colors.text);
    doc.text(bono, margin + 18, bonoY);
    bonoY += 7;
  });

  // Valor estimado
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(margin + 25, yPos + bonosHeight - 12, contentWidth - 50, 9, 3, 3, "F");
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Valor estimado de bonos: $2.500.000",
    pageWidth / 2,
    yPos + bonosHeight - 5,
    { align: "center" }
  );

  yPos += bonosHeight + 10;

  // ─────────────────────────────────────
  // GARANTÍAS (sin "No incluye...")
  // ─────────────────────────────────────
  doc.setFillColor(...colors.dark);
  doc.roundedRect(margin, yPos, contentWidth, 42, 4, 4, "F");

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

  let garantiaY = yPos + 18;
  doc.setFontSize(9);

  garantias.forEach((garantia) => {
    doc.setTextColor(...colors.success);
    doc.text("✓", margin + 10, garantiaY);
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "normal");
    doc.text(garantia, margin + 18, garantiaY);
    garantiaY += 6;
  });

  yPos += 52;

  // ─────────────────────────────────────
  // BOTÓN WHATSAPP (180x45px)
  // ─────────────────────────────────────
  const buttonWidth = 130;
  const buttonHeight = 38;
  const buttonX = (pageWidth - buttonWidth) / 2;
  const buttonY = yPos;

  // Sombra
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(buttonX + 1, buttonY + 1, buttonWidth, buttonHeight, 5, 5, "F");

  // Botón verde
  doc.setFillColor(...colors.whatsapp);
  doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5, 5, "F");

  // Texto
  doc.setTextColor(...colors.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Continuar conversación", pageWidth / 2, buttonY + 12, {
    align: "center",
  });
  doc.text("en WhatsApp", pageWidth / 2, buttonY + 21, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("+57 317 563 9674", pageWidth / 2, buttonY + 31, { align: "center" });

  // Link
  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(
    `Hola, quiero continuar con mi cotización ${data.numeroConsecutivo}`
  )}`;
  doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: whatsappUrl });

  // Subtexto
  doc.setTextColor(...colors.textLight);
  doc.setFontSize(8);
  doc.text(
    "Horario: Lun-Vie 8am-6pm | Sáb 9am-1pm",
    pageWidth / 2,
    buttonY + buttonHeight + 6,
    { align: "center" }
  );
  doc.text(
    "Respuesta promedio: Menos de 5 minutos",
    pageWidth / 2,
    buttonY + buttonHeight + 12,
    { align: "center" }
  );

  // ─────────────────────────────────────
  // FOOTER P2
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
  doc.text("Bucaramanga, Colombia", pageWidth / 2, pageHeight - 4, {
    align: "center",
  });
  doc.text(
    "hola@constructoracolombia.com",
    pageWidth - margin,
    pageHeight - 4,
    { align: "right" }
  );

  return doc.output("blob");
}
