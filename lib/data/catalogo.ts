// ═══════════════════════════════════════
// PROYECTOS (para landing y flujo)
// ═══════════════════════════════════════
export const proyectos = [
  {
    id: "ciudadela-verde",
    nombre: "Ciudadela Verde",
    ubicacion: "Bucaramanga",
    precioIntermedioEspecial: true,
    imagen: "/proyectos/ciudadela-verde.jpg.jpeg",
  },
  {
    id: "beltramonto",
    nombre: "Beltramonto",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/beltramonto.jpg.jpeg",
  },
  {
    id: "fiore",
    nombre: "Fiore",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/fiore.jpg.png",
  },
  {
    id: "azafran",
    nombre: "Azafrán",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/azafran.jpg.jpeg",
  },
  {
    id: "parque-oriente",
    nombre: "Parque Oriente",
    ubicacion: "Floridablanca",
    imagen: "/proyectos/parque-oriente.jpg.jpeg",
  },
  {
    id: "montebello",
    nombre: "Montebello",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/montebello.jpg.jpeg",
  },
  {
    id: "alto-tramonti",
    nombre: "Alto Tramonti",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/alto-tramonti.jpg.jpeg",
  },
  {
    id: "morada-del-viento",
    nombre: "Morada del Viento",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/morada-del-viento.jpg.jpeg",
  },
  {
    id: "fontana-de-la-sierra",
    nombre: "Fontana de la Sierra",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/fontana-de-la-sierra.jpg.jpeg",
  },
] as const;

// ═══════════════════════════════════════
// PLANES BASE
// ═══════════════════════════════════════
export const planesBase = {
  basico: {
    id: "basico",
    nombre: "Básico Esencial",
    precio: 14_900_000,
    subtitulo: "Solución funcional para habitar inmediatamente",
    tiempoEntrega: 39,
    incluye: [
      "Estuco muros + techo",
      "Pintura 3 manos",
      "Mortero impermeabilizado",
      "Enchape cerámica + guardaescobas",
      "Drywall cocina y baños",
      "Enchape baño completo",
      "Combo Básico baño",
      "Nicho iluminado",
      "Enchape salpicadero",
      "Enchape zona húmeda",
      "Luminarias LED",
      "Aseo final",
    ],
    bonus: [
      "Nicho iluminado en ducha",
      "Tendedero abatible",
      "Ducha elegante + mezclador",
      "Asesoría arquitectónica",
      "Recorrido virtual 360°",
      "Supervisión profesional",
      "Garantía de calidad",
    ],
    notas: [
      "Se envían avances semanales de tu apartamento por WhatsApp",
      "Cotización con precio de enchape de 40 mil pesos el metro cuadrado",
    ],
  },
  intermedio: {
    id: "intermedio",
    nombre: "Intermedio Plus",
    precio: 30_900_000,
    precioCiudadelaVerde: 29_900_000,
    ahorroTexto: "Ahorra $1.000.000",
    subtitulo: "Apartamento completamente terminado",
    tiempoEntrega: 59,
    incluye: [
      "✅ Todo del Plan Básico",
      "2 Divisiones vidrio (baño principal + auxiliar)",
      "Enchape completo baño auxiliar (con demolición)",
      "Nicho iluminado baño auxiliar",
      "Mesón granito/quartzone",
      "Barra con soporte",
      "3 Puertas RH",
      "Mueble cocina RH superior e inferior",
      "Closet principal RH",
      "Closet secundario RH",
    ],
    bonus: [
      "Nicho iluminado en ducha",
      "Tendedero abatible",
      "Ducha elegante + mezclador",
      "Asesoría arquitectónica",
      "Recorrido virtual 360°",
      "Supervisión profesional",
      "Garantía de calidad",
    ],
    noIncluye: "estufa, lavaplatos, grifería de cocina ni extractor",
    notas: [
      "Se envían avances semanales de tu apartamento por WhatsApp",
      "Cotización con precio de enchape de 40 mil pesos el metro cuadrado",
    ],
  },
} as const;

// ═══════════════════════════════════════
// PRECIOS POR PROYECTO
// ═══════════════════════════════════════
// Proyectos con precios diferentes al estándar.
// Si un proyecto no está aquí, usa los precios por defecto de planesBase.
export const preciosPorProyecto: Record<string, { basico: number; intermedio: number }> = {
  "ciudadela-verde":      { basico: 14_900_000, intermedio: 29_900_000 },
  "parque-oriente":       { basico: 15_900_000, intermedio: 31_900_000 },
};

/**
 * Obtiene los precios de los planes para un proyecto específico.
 * Si el proyecto tiene precios especiales, los usa; sino, usa los estándar.
 */
export function getPreciosPlanPorProyecto(proyectoId: string | null): {
  basico: number;
  intermedio: number;
} {
  if (proyectoId && preciosPorProyecto[proyectoId]) {
    return preciosPorProyecto[proyectoId];
  }
  return {
    basico: planesBase.basico.precio,
    intermedio: planesBase.intermedio.precio,
  };
}

// ═══════════════════════════════════════
// PRODUCTO Y ADICIONALES (54 ítems)
// ═══════════════════════════════════════
export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  codigo?: string;
  permiteMultiples?: boolean;
  maxCantidad?: number;
  // Precios y nombres dinámicos por plan
  nombrePorPlan?: {
    basico?: string;
    intermedio?: string;
  };
  precioPorPlan?: {
    basico?: number;
    intermedio?: number;
  };
}

export const adicionales: Producto[] = [
  // PRELIMINARES
  {
    id: "estuco",
    codigo: "3",
    nombre: "Estuco muros y techo",
    descripcion: "Superficies lisas y perfectas en todo el apartamento",
    precio: 1_624_800,
    categoria: "Preliminares",
    imagen: "/productos/3.Estuco.jpg",
  },
  {
    id: "pintura",
    codigo: "4",
    nombre: "Pintura 3 manos",
    descripcion: "Pintura blanca profesional tipo 1 y 2",
    precio: 1_660_800,
    categoria: "Preliminares",
    imagen: "/productos/4.Pintura.jpg",
  },
  {
    id: "mortero",
    codigo: "5",
    nombre: "Mortero nivelación",
    descripcion: "Nivelación de piso impermeabilizado",
    precio: 1_766_400,
    categoria: "Preliminares",
    imagen: "/productos/5.Mortero.jpg",
  },
  {
    id: "drywall",
    codigo: "8",
    nombre: "Drywall baños y cocina",
    descripcion: "Descolgado para cubrir tubería expuesta",
    precio: 720_000,
    categoria: "Preliminares",
    imagen: "/productos/8.Drywall.jpg",
  },
  {
    id: "tuberia-aire",
    codigo: "32",
    nombre: "Tubería aire acondicionado",
    descripcion: "Instalación certificada habitación principal",
    precio: 1_920_000,
    categoria: "Preliminares",
    imagen: "/productos/32.Tubería-aire.jpg",
  },
  // ENCHAPES
  {
    id: "ceramica-piso",
    codigo: "6",
    nombre: "Enchape cerámica piso",
    descripcion: "Piso general con guardaescobas + balcón",
    precio: 4_567_200,
    categoria: "Enchapes",
    imagen: "/productos/6.Ceramica.jpg",
  },
  {
    id: "porcelanato",
    codigo: "7",
    nombre: "Mejorar a porcelanato",
    descripcion: "Upgrade a porcelanato 60x60 con guardaescobas",
    precio: 1_428_000,
    categoria: "Enchapes",
    imagen: "/productos/7.Mejorar-Porcelanato.jpg",
  },
  {
    id: "enchape-bano-principal",
    codigo: "9",
    nombre: "Enchape baño principal",
    descripcion: "Pisos y muros completos con cerámica",
    precio: 2_140_800,
    categoria: "Enchapes",
    imagen: "/productos/13.Baño-basico.jpg",
  },
  {
    id: "enchape-bano-aux",
    codigo: "10",
    nombre: "Demolición + Enchape baño aux",
    descripcion: "Demoler y enchapar pisos y muros",
    precio: 2_380_800,
    categoria: "Enchapes",
    imagen: "/productos/10.Enchape-baño-aux-con-demolición.jpg",
  },
  {
    id: "complementar-enchape",
    codigo: "11",
    nombre: "Complementar enchape baño Aux",
    descripcion: "Sin demoler el existente",
    precio: 860_400,
    categoria: "Enchapes",
    imagen: "/productos/11.Completar-enchape-baño.jpg",
    precioPorPlan: {
      basico: 1_100_000,
      intermedio: 860_400,
    },
  },
  {
    id: "salpicadero",
    codigo: "15",
    nombre: "Enchape salpicadero",
    descripcion: "60 cm por encima del mesón de cocina",
    precio: 522_000,
    categoria: "Enchapes",
    imagen: "/productos/15.Salpicadero.jpg",
  },
  {
    id: "zona-humeda",
    codigo: "16",
    nombre: "Enchapar zona húmeda",
    descripcion: "Zona húmeda con cerámica",
    precio: 1_371_600,
    categoria: "Enchapes",
    imagen: "/productos/16.Enchape zona húmeda.jpg",
  },
  // BAÑOS Y ACCESORIOS
  {
    id: "nicho",
    codigo: "12",
    nombre: "Nicho iluminado",
    descripcion: "Nicho LED en ducha",
    precio: 273_600,
    categoria: "Baños",
    imagen: "/productos/12.nicho.JPG",
  },
  {
    id: "combo-basico",
    codigo: "13",
    nombre: "Combo básico baño",
    descripcion: "Sanitario, lavamanos, grifería completa",
    precio: 1_036_800,
    categoria: "Baños",
    imagen: "/productos/13.Baño-basico.jpg",
  },
  {
    id: "combo-premium",
    codigo: "14",
    nombre: "Combo Premium baño",
    descripcion: "Sanitario premium, lavamanos, accesorios lujo",
    precio: 1_696_800,
    categoria: "Baños",
    imagen: "/productos/14.Baño-premium.jpg",
    permiteMultiples: true,
    maxCantidad: 2,
    nombrePorPlan: {
      basico: "Combo Premium baño",
      intermedio: "Mejorar a Combo Premium baño",
    },
    precioPorPlan: {
      basico: 1_696_800,
      intermedio: 1_500_000,
    },
  },
  {
    id: "tuberia-agua-caliente",
    codigo: "19",
    nombre: "Tubería agua caliente",
    descripcion: "Acometida a 2 duchas + punto calentador",
    precio: 1_800_000,
    categoria: "Baños",
    imagen: "/productos/19.Tubería-agua-caliente-2-duchas.jpg",
  },
  {
    id: "calentador",
    codigo: "20",
    nombre: "Calentador Bosch",
    descripcion: "Calentador a batería instalado",
    precio: 1_080_000,
    categoria: "Baños",
    imagen: "/productos/20.Calentador.jpg",
  },
  {
    id: "lavadero-enchapado",
    codigo: "34",
    nombre: "Lavadero enchapado",
    descripcion: "Lavadero completo enchapado",
    precio: 480_000,
    categoria: "Baños",
    imagen: "/productos/34.Lavadero-enchapado.jpg",
  },
  {
    id: "torre-ducha",
    codigo: "36",
    nombre: "Torre ducha negra",
    descripcion: "Torre ducha moderna instalada",
    precio: 720_000,
    categoria: "Baños",
    imagen: "/productos/36.Torre-ducha.jpg",
  },
  {
    id: "ducha-cuadrada",
    codigo: "37",
    nombre: "Ducha cuadrada metálica",
    descripcion: "Ducha monocontrol cuadrada",
    precio: 360_000,
    categoria: "Baños",
    imagen: "/productos/37.Ducha-cuadrada.jpg",
  },
  // GRANITOS Y PIEDRAS
  {
    id: "meson-granito",
    codigo: "40",
    nombre: "Mesón granito cocina",
    descripcion: "San Gabriel/Quarztone blanco",
    precio: 1_080_000,
    categoria: "Granitos",
    imagen: "/productos/40.Mesón.JPG",
  },
  {
    id: "barra-soporte",
    codigo: "41",
    nombre: "Barra granito con soporte",
    descripcion: "San Gabriel con soporte",
    precio: 960_000,
    categoria: "Granitos",
    imagen: "/productos/41.Barra-soporte.JPG",
  },
  {
    id: "barra-mueble",
    codigo: "42",
    nombre: "Barra sobre mueble",
    descripcion: "Granito sobre mueble alistonado",
    precio: 2_484_000,
    categoria: "Granitos",
    imagen: "/productos/42.Barra-con-mueble.jpg",
    nombrePorPlan: {
      basico: "Mueble bajo barra",
      intermedio: "Mueble bajo barra",
    },
    precioPorPlan: {
      basico: 1_300_000,
      intermedio: 1_300_000,
    },
  },
  {
    id: "barra-patera",
    codigo: "43",
    nombre: "Barra con patera doble",
    descripcion: "Patera 1m alto sin mueble",
    precio: 2_205_600,
    categoria: "Granitos",
    imagen: "/productos/43.Barra-patera-sinmueble.jpg",
    nombrePorPlan: {
      basico: "Mejorar a Barra con patera doble",
      intermedio: "Mejorar a Barra con patera doble",
    },
    precioPorPlan: {
      basico: 2_200_000,
      intermedio: 1_300_000,
    },
  },
  {
    id: "barra-patera-mueble",
    codigo: "44",
    nombre: "Barra patera + mueble",
    descripcion: "Patera 1m sobre mueble alistonado",
    precio: 3_168_000,
    categoria: "Granitos",
    imagen: "/productos/44.Barra-patera-mueble-alistonado.jpg",
    nombrePorPlan: {
      basico: "Mejorar a Barra con patera + mueble",
      intermedio: "Mejorar a Barra con patera + mueble",
    },
    precioPorPlan: {
      basico: 3_200_000,
      intermedio: 2_250_000,
    },
  },
  {
    id: "meson-lavamanos-cuadrado",
    codigo: "45",
    nombre: "Mesón bajo lavamanos",
    descripcion: "Mesón cuadrado granito",
    precio: 420_000,
    categoria: "Granitos",
    imagen: "/productos/45.Meson-cuadrado-lavamanos.jpg",
  },
  {
    id: "meson-guitarra",
    codigo: "46",
    nombre: "Mesón tipo guitarra",
    descripcion: "Bajo lavamanos tipo guitarra",
    precio: 780_000,
    categoria: "Granitos",
    imagen: "/productos/46.Meson-guitarra-bajolavamanos.jpg",
  },
  {
    id: "meson-sinterizado",
    codigo: "51",
    nombre: "Mesón sinterizado cocina",
    descripcion: "Mesón sinterizado premium",
    precio: 1_680_000,
    categoria: "Granitos",
    imagen: "/productos/51.Meson-sinterizado.jpg",
    nombrePorPlan: {
      basico: "Mejorar a mesón sinterizado cocina",
      intermedio: "Mejorar a mesón sinterizado cocina",
    },
    precioPorPlan: {
      basico: 1_700_000,
      intermedio: 700_000,
    },
  },
  {
    id: "barra-sinterizado",
    codigo: "53",
    nombre: "Barra sinterizado",
    descripcion: "Con patera y mueble",
    precio: 3_588_000,
    categoria: "Granitos",
    imagen: "/productos/53.Barra-sinterizado-conmueble.jpg",
    nombrePorPlan: {
      basico: "Mejorar a Barra sinterizado con patera y con mueble",
      intermedio: "Mejorar a Barra sinterizado con patera y con mueble",
    },
    precioPorPlan: {
      basico: 3_840_000,
      intermedio: 2_900_000,
    },
  },
  {
    id: "salpicadero-sinterizado",
    codigo: "55",
    nombre: "Salpicadero sinterizado",
    descripcion: "Salpicadero premium",
    precio: 1_920_000,
    categoria: "Granitos",
    imagen: "/productos/55.Salpicadero-sinterizado.jpg",
  },
  // COCINA
  {
    id: "estufa",
    codigo: "24",
    nombre: "Estufa instalada",
    descripcion: "Challenger/Haceb/Mabe instalada",
    precio: 600_000,
    categoria: "Cocina",
    imagen: "/productos/24.Estufa.jpg",
  },
  {
    id: "estufa-vidrio",
    codigo: "25",
    nombre: "Estufa de vidrio",
    descripcion: "Vidrio templado 4 puestos",
    precio: 1_200_000,
    categoria: "Cocina",
    imagen: "/productos/25.Estufa-vidrio.jpg",
  },
  {
    id: "horno",
    codigo: "26",
    nombre: "Horno instalado",
    descripcion: "Con punto de gas incluido",
    precio: 1_800_000,
    categoria: "Cocina",
    imagen: "/productos/26.Horno.jpg",
  },
  {
    id: "lavaplatos",
    codigo: "27",
    nombre: "Lavaplatos acero inoxidable",
    descripcion: "Con desagüe instalado",
    precio: 360_000,
    categoria: "Cocina",
    imagen: "/productos/27.Lavaplatos acero inoxidable.jpg",
  },
  {
    id: "griferia-cocina",
    codigo: "28",
    nombre: "Grifería cocina",
    descripcion: "Grifería tradicional instalada",
    precio: 240_000,
    categoria: "Cocina",
    imagen: "/productos/28.Griferia-cocina.jpg",
  },
  // CARPINTERÍA
  {
    id: "puerta-melamina",
    codigo: "61",
    nombre: "Puerta melamina RH",
    descripcion: "Puerta con marco melamina mate",
    precio: 960_000,
    categoria: "Carpintería",
    imagen: "/productos/61. Puerta.jpg",
    permiteMultiples: true,
    maxCantidad: 4,
  },
  {
    id: "puerta-corredera",
    codigo: "62",
    nombre: "Puerta corredera",
    descripcion: "Melamina RH corredera",
    precio: 1_320_000,
    categoria: "Carpintería",
    imagen: "/productos/62.puerta-corredera.jpg",
  },
  {
    id: "mueble-cocina",
    codigo: "63",
    nombre: "Mueble cocina RH completo",
    descripcion: "Arriba y abajo una tonalidad",
    precio: 3_000_000,
    categoria: "Carpintería",
    imagen: "/productos/63-mueble-cocina.jpg.JPG",
  },
  {
    id: "closet-principal",
    codigo: "66",
    nombre: "Closet habitación principal",
    descripcion: "Melamina RH completo",
    precio: 3_480_000,
    categoria: "Carpintería",
    imagen: "/productos/66-closet-principal.jpg.JPG",
  },
  {
    id: "closet-espaldar",
    codigo: "67",
    nombre: "Closet espaldar cama",
    descripcion: "Habitación principal espaldar",
    precio: 3_600_000,
    categoria: "Carpintería",
    imagen: "/productos/67.Closet-espaldar-cama.jpg",
  },
  {
    id: "closet-secundario",
    codigo: "68",
    nombre: "Closet habitación secundaria",
    descripcion: "Melamina RH",
    precio: 2_280_000,
    categoria: "Carpintería",
    imagen: "/productos/68-closet-secundario.jpg.JPG",
  },
  {
    id: "mueble-barra-lamparas",
    codigo: "69",
    nombre: "Mueble sobre barra",
    descripcion: "Pared-techo con lámparas LED",
    precio: 1_800_000,
    categoria: "Carpintería",
    imagen: "/productos/69. Mueble-sobre-barra.jpg",
  },
  {
    id: "mueble-barra-vinera",
    codigo: "76",
    nombre: "Mueble barra con vinera",
    descripcion: "Superior con vinera incluida",
    precio: 2_160_000,
    categoria: "Carpintería",
    imagen: "/productos/76.Mueble-barra-vinera.jpg",
    nombrePorPlan: {
      basico: "Mueble sobre barra con vinera",
      intermedio: "Mueble sobre barra con vinera",
    },
  },
  {
    id: "mueble-alacena",
    codigo: "70",
    nombre: "Mueble alacena vertical",
    descripcion: "Alacena cocina vertical",
    precio: 1_320_000,
    categoria: "Carpintería",
    imagen: "/productos/70.Mueble-alacena-barra.jpg",
  },
  {
    id: "mueble-lavamanos",
    codigo: "73",
    nombre: "Mueble bajo lavamanos",
    descripcion: "Mueble completo bajo lavamanos",
    precio: 480_000,
    categoria: "Carpintería",
    imagen: "/productos/73. Mueble bajo lavamanos.jpg",
  },
  {
    id: "mueble-lavadero",
    codigo: "74",
    nombre: "Mueble bajo lavadero",
    descripcion: "Mueble para lavadero",
    precio: 540_000,
    categoria: "Carpintería",
    imagen: "/productos/74.Mueble-lavadero.jpg",
  },
  {
    id: "mueble-nevera",
    codigo: "75",
    nombre: "Mueble sobre nevera",
    descripcion: "Aprovecha espacio superior",
    precio: 600_000,
    categoria: "Carpintería",
    imagen: "/productos/75.Mueble-nevera.jpg",
  },
  // VIDRIOS Y ESPEJOS
  {
    id: "espejo-iluminado",
    codigo: "56",
    nombre: "Espejo cuadrado LED",
    descripcion: "Espejo iluminado moderno",
    precio: 420_000,
    categoria: "Vidrios",
    imagen: "/productos/56.Espejo.jpg",
    permiteMultiples: true,
    maxCantidad: 3,
  },
  {
    id: "division-vidrio",
    codigo: "59",
    nombre: "División vidrio baño",
    descripcion: "División vidrio templado 8mm",
    precio: 840_000,
    categoria: "Vidrios",
    imagen: "/productos/59. Division-vidrio-baño.jpg",
  },
  // OTROS
  {
    id: "luminarias",
    codigo: "17",
    nombre: "Luminarias LED",
    descripcion: "Cambio de 10 plafones por LED",
    precio: 144_000,
    categoria: "Otros",
    imagen: "/productos/17.Luminarias.jpg",
  },
  {
    id: "cerradura-inteligente",
    codigo: "21",
    nombre: "Cerradura inteligente",
    descripcion: "Con enchape madera interno",
    precio: 1_020_000,
    categoria: "Otros",
    imagen: "/productos/21.Cerradura-inteligente.jpg",
  },
  {
    id: "malla-seguridad",
    codigo: "29",
    nombre: "Malla seguridad",
    descripcion: "Balcón y habitaciones",
    precio: 540_000,
    categoria: "Otros",
    imagen: "/productos/29.Malla-seguridad-ventanasybalcon.jpg",
  },
  {
    id: "ampliacion-balcon",
    codigo: "30",
    nombre: "Ampliación balcón",
    descripcion: "Ampliar espacio balcón",
    precio: 1_560_000,
    categoria: "Otros",
    imagen: "/productos/30.Ampliacion-balcon.jpg",
  },
  {
    id: "tendedero",
    codigo: "31",
    nombre: "Tendedero abatible",
    descripcion: "Zona húmeda abatible",
    precio: 240_000,
    categoria: "Otros",
    imagen: "/productos/31.Tendedero.jpg",
  },
];

// Alias para compatibilidad: productos = adicionales
export const productos = adicionales;

// Categorías
export const categorias = [
  "Preliminares",
  "Enchapes",
  "Baños",
  "Granitos",
  "Cocina",
  "Carpintería",
  "Vidrios",
  "Otros",
] as const;

export const adicionalesPorCategoria = (categoria: string) => {
  return adicionales.filter((p) => p.categoria === categoria);
};

// ═══════════════════════════════════════════════════════════════════════════
// LÓGICA DE FILTRADO DINÁMICO: Plan vs. Adicionales (evitar duplicidad)
// Lo que ya "viene incluido" en un plan NO debe aparecer como opción de compra.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Adicionales a OCULTAR según el plan seleccionado.
 * - BÁSICO: Oculta 11 items que ya vienen incluidos en el plan básico.
 * - INTERMEDIO: Oculta 18 items (los 11 del básico + 7 adicionales del intermedio).
 */
export const adicionalesOcultosPorPlan = {
  basico: [
    "estuco",              // Estuco muros y techo
    "pintura",             // Pintura 3 manos
    "mortero",             // Mortero nivelación
    "drywall",             // Drywall baños y cocina
    "ceramica-piso",       // Enchape cerámica piso
    "enchape-bano-principal", // Enchape baño principal
    "salpicadero",         // Enchape salpicadero
    "zona-humeda",         // Enchapar zona húmeda
    "nicho",               // Nicho iluminado
    "combo-basico",        // Combo básico baño
    "luminarias",          // Luminarias LED
  ],
  intermedio: [
    // Todo lo del plan básico
    "estuco",
    "pintura",
    "mortero",
    "drywall",
    "ceramica-piso",
    "enchape-bano-principal",
    "salpicadero",
    "zona-humeda",
    "nicho",
    "combo-basico",
    "luminarias",
    // + Adicionales incluidos en el plan intermedio
    "enchape-bano-aux",    // Demolición + Enchape baño aux
    "complementar-enchape", // Complementar enchape baño
    "meson-granito",       // Mesón granito cocina (ya incluido)
    "barra-soporte",       // Barra granito con soporte
    "mueble-cocina",       // Mueble cocina RH completo
    "closet-principal",    // Closet habitación principal
    "closet-secundario",   // Closet habitación secundaria
    "division-vidrio",     // División vidrio baño
  ],
};

/**
 * Lista de adicionales visibles en /personalizar según el plan elegido.
 * Filtra los items que ya vienen incluidos en cada plan.
 * @param planTipo "basico" o "intermedio"
 */
export const adicionalesFiltrados = (planTipo: "basico" | "intermedio") => {
  const ocultos = adicionalesOcultosPorPlan[planTipo] || [];
  return adicionales.filter((item) => !ocultos.includes(item.id));
};

/**
 * Verifica si un adicional debe ocultarse para un plan específico.
 * @param idAdicional ID del adicional
 * @param planTipo "basico" o "intermedio"
 */
export const debeOcultarseAdicional = (
  idAdicional: string,
  planTipo: "basico" | "intermedio"
): boolean => {
  const ocultos = adicionalesOcultosPorPlan[planTipo] || [];
  return ocultos.includes(idAdicional);
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS: Obtener nombre y precio según plan seleccionado
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtiene el nombre del adicional según el plan seleccionado.
 * Si tiene nombrePorPlan definido, usa ese; sino usa el nombre base.
 */
export const getNombreAdicional = (
  adicional: Producto,
  planTipo: "basico" | "intermedio" | null
): string => {
  if (!planTipo) return adicional.nombre;
  return adicional.nombrePorPlan?.[planTipo] || adicional.nombre;
};

/**
 * Obtiene el precio del adicional según el plan seleccionado.
 * Si tiene precioPorPlan definido, usa ese; sino usa el precio base.
 */
export const getPrecioAdicional = (
  adicional: Producto,
  planTipo: "basico" | "intermedio" | null
): number => {
  if (!planTipo) return adicional.precio;
  return adicional.precioPorPlan?.[planTipo] ?? adicional.precio;
};
