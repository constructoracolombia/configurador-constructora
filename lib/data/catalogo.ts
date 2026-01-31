// PROYECTOS DISPONIBLES
export const proyectos = [
  { id: "ciudadela-verde", nombre: "Ciudadela Verde", ubicacion: "Bucaramanga", precioIntermedioEspecial: true },
  { id: "beltramonto", nombre: "Beltramonto", ubicacion: "Bucaramanga" },
  { id: "fiore", nombre: "Fiore", ubicacion: "Bucaramanga" },
  { id: "azafran", nombre: "Azafrán", ubicacion: "Bucaramanga" },
  { id: "parque-oriente", nombre: "Parque Oriente", ubicacion: "Floridablanca" },
  { id: "montebello", nombre: "Montebello", ubicacion: "Bucaramanga" },
  { id: "alto-tramonti", nombre: "Alto Tramonti", ubicacion: "Bucaramanga" },
  { id: "morada-del-viento", nombre: "Morada del Viento", ubicacion: "Bucaramanga" },
  { id: "fontana-de-la-sierra", nombre: "Fontana de la Sierra", ubicacion: "Bucaramanga" },
  { id: "paseo-bulevar", nombre: "Paseo Bulevar", ubicacion: "Bucaramanga" }
] as const;

export interface Producto {
  codigo: number;
  categoria: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
}

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
      "Aseo final"
    ],
    bonus: [
      "Tendedero abatible",
      "Ducha elegante + mezclador",
      "Asesoría arquitectónica",
      "Recorrido virtual 360°",
      "Supervisión profesional",
      "Garantía de calidad"
    ]
  },
  intermedio: {
    id: "intermedio",
    nombre: "Intermedio Plus",
    precio: 30_900_000,
    precioCiudadelaVerde: 29_900_000,
    subtitulo: "Apartamento completamente terminado",
    tiempoEntrega: 59,
    incluye: [
      "✅ Todo del Plan Básico",
      "Piso PORCELANATO",
      "2 Baños completos",
      "2 Nichos iluminados",
      "2 Divisiones vidrio",
      "Muro cocina completo",
      "Mesón granito/quartzone",
      "Barra con soporte",
      "3 Puertas RH",
      "Mueble cocina RH",
      "Closet principal RH",
      "Closet secundario RH"
    ],
    bonus: [
      "Tendedero abatible",
      "Ducha elegante + mezclador",
      "Asesoría arquitectónica",
      "Recorrido virtual 360°",
      "Supervisión profesional",
      "Garantía de calidad"
    ]
  }
} as const;

export const categorias = [
  "Carpintería",
  "Granitos y piedras",
  "Baños",
  "Cocina",
  "Vidrios y espejos",
  "Enchape",
  "Iluminación",
  "Puntos gas, eléctrico, agua",
  "Seguridad",
  "Zona húmeda"
] as const;

export const productos: Producto[] = [
  { codigo: 64, categoria: "Carpintería", nombre: "Closet habitación principal melamina RH", descripcion: "Closet principal", precio: 3_190_000 },
  { codigo: 61, categoria: "Carpintería", nombre: "Mueble cocina RH completo", descripcion: "Mueble cocina superior e inferior", precio: 2_750_000 },
  { codigo: 66, categoria: "Carpintería", nombre: "Closet secundario RH", descripcion: "Closet habitación secundaria", precio: 2_090_000 },
  { codigo: 40, categoria: "Granitos y piedras", nombre: "Mesón Granito/Quartzone blanco", descripcion: "Mesón cocina", precio: 950_400 },
  { codigo: 41, categoria: "Granitos y piedras", nombre: "Barra Granito con soporte", descripcion: "Barra desayunador", precio: 844_800 },
  { codigo: 12, categoria: "Baños", nombre: "Nicho iluminado", descripcion: "Nicho LED en ducha", precio: 228_800 },
  { codigo: 13, categoria: "Baños", nombre: "Combo básico baño", descripcion: "Sanitario, lavamanos, grifería", precio: 730_400 },
  { codigo: 57, categoria: "Vidrios y espejos", nombre: "División de vidrio", descripcion: "División vidrio 8mm", precio: 715_000 },
  { codigo: 24, categoria: "Cocina", nombre: "Estufa instalada", descripcion: "Estufa con instalación", precio: 520_000 },
  { codigo: 21, categoria: "Seguridad", nombre: "Cerradura inteligente", descripcion: "Cerradura + forrado madera", precio: 1_755_000 },
  { codigo: 18, categoria: "Iluminación", nombre: "Luminarias LED", descripcion: "Cambio plafones LED", precio: 128_700 },
  { codigo: 7, categoria: "Enchape", nombre: "Porcelanato piso completo", descripcion: "Enchape porcelanato 60mil/m²", precio: 5_298_800 }
];
