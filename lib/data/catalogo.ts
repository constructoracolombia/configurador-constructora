import { supabase } from "@/lib/supabase/client";

// ═══════════════════════════════════════
// PROYECTOS (para landing y flujo)
// ═══════════════════════════════════════
export const proyectos = [
  {
    id: "ciudadela-verde",
    nombre: "Ciudadela Verde",
    ubicacion: "Bucaramanga",
    precioIntermedioEspecial: true,
    imagen: "/proyectos/ciudadela-verde.jpg",
    tipo: "vis_remodelacion",
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
    id: "solei",
    nombre: "Parque Oriente Solei",
    ubicacion: "Floridablanca",
    imagen: "/proyectos/solei.jpg",
  },
  {
    id: "fontana-de-la-sierra",
    nombre: "Fontana de la Sierra",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/fontana-de-la-sierra.jpg.jpeg",
  },
] as const;

// Helper: buscar proyecto de forma robusta (por ID exacto, slug normalizado, o nombre)
export function findProyecto(proyectoId: string | null) {
  if (!proyectoId) return undefined;
  // 1. Match exacto por ID
  const exacto = proyectos.find((p) => p.id === proyectoId);
  if (exacto) return exacto;
  // 2. Normalizar a slug y buscar
  const normalizado = proyectoId.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e')
    .replace(/[íì]/g, 'i').replace(/[óò]/g, 'o').replace(/[úù]/g, 'u');
  const porSlug = proyectos.find((p) => p.id === normalizado);
  if (porSlug) return porSlug;
  // 3. Match por nombre (case insensitive)
  return proyectos.find((p) => p.nombre.toLowerCase() === proyectoId.toLowerCase().trim());
}

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

/**
 * Obtiene los precios de los planes para un proyecto específico.
 * Maneja variaciones de nombre (tildes, guiones, espacios).
 */
export function getPreciosPlanPorProyecto(proyectoId: string | null): {
  basico: number;
  intermedio: number;
} {
  const id = proyectoId?.toLowerCase().trim() || "";

  if (id === "solei") {
    return { basico: 12_900_000, intermedio: 25_900_000 };
  }

  if (id === "ciudadela-verde" || id === "ciudadela verde") {
    return { basico: 15_900_000, intermedio: 31_900_000 };
  }

  return { basico: 16_900_000, intermedio: 32_900_000 };
}

// ═══════════════════════════════════════
// PRECIOS EN VIVO — catálogo de Finanzas (Supabase)
// ═══════════════════════════════════════

// Cada catálogo de Finanzas (app.constructoracolombia.com/alcance/catalogo)
// agrupa varios conjuntos que comparten el mismo precio de plan. Un
// proyecto que no aparezca acá usa el precio hardcodeado de
// getPreciosPlanPorProyecto (fallback).
export const T1_CATALOGO_ID = "0b414ae4-ba21-4591-9c81-b42cc93b2940"; // CV, Fiore, Beltramonto, MDV, Montebello, Alto Tramonti, Fontana Sierra
export const T2_CATALOGO_ID = "f962d869-7fc6-4169-ad13-66ab8a9bb275"; // Parque Oriente, Azafrán
export const T3_CATALOGO_ID = "0bf75cce-ed56-47ad-89c3-6c38cfd99d5c"; // Parque Oriente Solei

export const PROYECTO_A_CATALOGO: Record<string, string> = {
  "ciudadela-verde": T1_CATALOGO_ID,
  "fiore": T1_CATALOGO_ID,
  "beltramonto": T1_CATALOGO_ID,
  "morada-del-viento": T1_CATALOGO_ID,
  "montebello": T1_CATALOGO_ID,
  "alto-tramonti": T1_CATALOGO_ID,
  "fontana-de-la-sierra": T1_CATALOGO_ID,
  "parque-oriente": T2_CATALOGO_ID,
  "azafran": T2_CATALOGO_ID,
  "solei": T3_CATALOGO_ID,
};

/**
 * Catálogo de Finanzas (si existe) para un proyecto dado.
 */
export function getCatalogoIdPorProyecto(proyectoId: string | null): string | undefined {
  const proyecto = findProyecto(proyectoId);
  return proyecto ? PROYECTO_A_CATALOGO[proyecto.id] : undefined;
}

/**
 * Precios de plan en vivo desde Supabase (catalogos_precios), para
 * proyectos que ya tienen catálogo asignado en Finanzas. Devuelve null si
 * el proyecto no tiene catálogo, si la consulta falla, o si el catálogo
 * no tiene los precios configurados — en cualquiera de esos casos el
 * llamador debe caer al fallback de getPreciosPlanPorProyecto.
 */
export async function getPreciosPlanLive(
  proyectoId: string | null
): Promise<{ basico: number; intermedio: number } | null> {
  const catalogoId = getCatalogoIdPorProyecto(proyectoId);
  if (!catalogoId) return null;

  const { data, error } = await supabase
    .from("catalogos_precios")
    .select("precio_venta_basico, precio_venta_intermedio")
    .eq("id", catalogoId)
    .single();

  if (error || !data || data.precio_venta_basico == null || data.precio_venta_intermedio == null) {
    return null;
  }
  return { basico: data.precio_venta_basico, intermedio: data.precio_venta_intermedio };
}

/**
 * Precios en vivo de los adicionales, para el catálogo del proyecto
 * actual — vía catalogo_items.adicional_ppto_id, que el admin asigna
 * manualmente desde app.constructoracolombia.com/alcance/catalogo/[catalogoId]
 * (columna "Presup. automático" en la tabla de ítems). Reemplaza el match
 * automático por nombre (frágil: producía falsos positivos como "Horno
 * instalado" calzando con "Punto de gas para horno") por un vínculo
 * explícito por catálogo, resuelto por Finanzas, no adivinado acá.
 *
 * Devuelve solo las entradas vinculadas — el llamador debe caer a
 * getPrecioAdicional() para todo lo demás (adicional no vinculado en este
 * catálogo, o catálogo inexistente para el proyecto).
 */
export async function getPreciosAdicionalesLive(
  proyectoId: string | null
): Promise<Record<string, number>> {
  const catalogoId = getCatalogoIdPorProyecto(proyectoId);
  if (!catalogoId) return {};

  const { data, error } = await supabase
    .from("catalogo_items")
    .select("adicional_ppto_id, valor_venta")
    .eq("catalogo_id", catalogoId)
    .eq("activo", true)
    .not("adicional_ppto_id", "is", null);

  if (error || !data) return {};

  const resultado: Record<string, number> = {};
  for (const it of data) {
    if (it.adicional_ppto_id) resultado[it.adicional_ppto_id] = it.valor_venta;
  }
  return resultado;
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
  unidad?: string;
  disponible?: boolean;
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

// Helper para generar placeholders SVG embebidos (sin depender de que exista el archivo en `public/`).
const generarPlaceholder = (nombre: string) => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23111827' width='400' height='300'/%3E%3Crect fill='%23EAB308' x='0' y='280' width='400' height='20'/%3E%3Ctext fill='%23FFFFFF' font-size='14' font-family='Arial' x='50%25' y='45%25' text-anchor='middle'%3E${encodeURIComponent(nombre)}%3C/text%3E%3Ctext fill='%23EAB308' font-size='12' font-family='Arial' x='50%25' y='60%25' text-anchor='middle'%3EImagen pr%C3%B3ximamente%3C/text%3E%3C/svg%3E`;
};

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
    id: "mueble-lavamanos",
    codigo: "73",
    nombre: "Mueble bajo lavamanos",
    descripcion: "Mueble completo bajo lavamanos",
    precio: 480_000,
    categoria: "Carpintería",
    imagen: "/productos/73. Mueble bajo lavamanos.jpg",
  },
  // NUEVOS PRODUCTOS (Plan Básico / San Juan)
  {
    id: "demolicion-enchape-bano-aux",
    nombre: "Demolición + Enchape baño aux",
    descripcion:
      "Demolición de enchapes existentes e instalación de nuevos enchapes en baño auxiliar",
    categoria: "Baños",
    precio: 1_800_000,
    imagen: generarPlaceholder("Demolición + Enchape baño aux"),
    unidad: "servicio",
    disponible: true,
  },
  {
    id: "complementar-enchape-bano-aux",
    nombre: "Complementar enchape baño Aux",
    descripcion: "Complemento de enchapes en baño auxiliar hasta techo",
    categoria: "Baños",
    precio: 950_000,
    imagen: generarPlaceholder("Complementar enchape baño Aux"),
    unidad: "servicio",
    disponible: true,
  },
  {
    id: "meson-granito-cocina",
    nombre: "Mesón granito cocina",
    descripcion: "Mesón en granito natural para cocina",
    categoria: "Granitos",
    precio: 1_200_000,
    imagen: generarPlaceholder("Mesón granito cocina"),
    unidad: "metro lineal",
    disponible: true,
  },
  {
    id: "barra-granito-soporte",
    nombre: "Barra granito con soporte",
    descripcion: "Barra desayunador en granito con soporte metálico",
    categoria: "Granitos",
    precio: 850_000,
    imagen: generarPlaceholder("Barra granito con soporte"),
    unidad: "unidad",
    disponible: true,
  },
  {
    id: "mueble-bajo-barra",
    nombre: "Mueble bajo barra",
    descripcion: "Mueble bajo barra desayunador en melamina",
    categoria: "Carpintería",
    precio: 1_200_000,
    imagen: generarPlaceholder("Mueble bajo barra"),
    unidad: "unidad",
    disponible: true,
  },
  {
    id: "mejorar-barra-patera-doble",
    nombre: "Mejorar a Barra con patera doble",
    descripcion: "Upgrade de barra con patera doble para 2 sillas",
    categoria: "Granitos",
    precio: 450_000,
    imagen: generarPlaceholder("Barra con patera doble"),
    unidad: "unidad",
    disponible: true,
  },
  {
    id: "mejorar-barra-patera-mueble",
    nombre: "Mejorar a Barra con patera + mueble",
    descripcion: "Upgrade de barra con patera y mueble integrado",
    categoria: "Granitos",
    precio: 1_350_000,
    imagen: generarPlaceholder("Barra patera + mueble"),
    unidad: "unidad",
    disponible: true,
  },
  {
    id: "meson-bajo-lavamanos",
    nombre: "Mesón bajo lavamanos",
    descripcion: "Mesón en granito para lavamanos de baño",
    categoria: "Granitos",
    precio: 580_000,
    imagen: generarPlaceholder("Mesón bajo lavamanos"),
    unidad: "unidad",
    disponible: true,
  },
  {
    id: "meson-tipo-guitarra",
    nombre: "Mesón tipo guitarra",
    descripcion: "Mesón en granito con diseño tipo guitarra para baño",
    categoria: "Granitos",
    precio: 720_000,
    imagen: generarPlaceholder("Mesón tipo guitarra"),
    unidad: "unidad",
    disponible: true,
  },
  {
    id: "division-vidrio-bano",
    nombre: "División vidrio baño",
    descripcion: "División en vidrio templado para zona de ducha",
    categoria: "Baños",
    precio: 850_000,
    imagen: generarPlaceholder("División vidrio baño"),
    unidad: "unidad",
    disponible: true,
  },
  {
    id: "espejo-cuadrado-led",
    nombre: "Espejo cuadrado LED",
    descripcion: "Espejo cuadrado con iluminación LED integrada",
    categoria: "Baños",
    precio: 380_000,
    imagen: generarPlaceholder("Espejo cuadrado LED"),
    unidad: "unidad",
    disponible: true,
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
