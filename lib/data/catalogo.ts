// PROYECTOS DISPONIBLES
export const proyectos = [
  {
    id: "ciudadela-verde",
    nombre: "Ciudadela Verde",
    ubicacion: "Bucaramanga",
    precioIntermedioEspecial: true,
    imagen: "/proyectos/ciudadela-verde.jpg.jpeg"
  },
  {
    id: "beltramonto",
    nombre: "Beltramonto",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/beltramonto.jpg.jpeg"
  },
  {
    id: "fiore",
    nombre: "Fiore",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/fiore.jpg.png"
  },
  {
    id: "azafran",
    nombre: "Azafrán",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/azafran.jpg.jpeg"
  },
  {
    id: "parque-oriente",
    nombre: "Parque Oriente",
    ubicacion: "Floridablanca",
    imagen: "/proyectos/parque-oriente.jpg.jpeg"
  },
  {
    id: "montebello",
    nombre: "Montebello",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/montebello.jpg.jpeg"
  },
  {
    id: "alto-tramonti",
    nombre: "Alto Tramonti",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/alto-tramonti.jpg.jpeg"
  },
  {
    id: "morada-del-viento",
    nombre: "Morada del Viento",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/morada-del-viento.jpg.jpeg"
  },
  {
    id: "fontana-de-la-sierra",
    nombre: "Fontana de la Sierra",
    ubicacion: "Bucaramanga",
    imagen: "/proyectos/fontana-de-la-sierra.jpg.jpeg"
  }
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

// Categorías reorganizadas por áreas
export const categorias = [
  "General",
  "Cocina",
  "Baños",
  "Carpintería",
  "Granitos y piedras",
  "Vidrios y espejos",
  "Iluminación",
  "Seguridad",
  "Otros"
] as const;

// Productos reorganizados por áreas (usando rutas reales de public/productos/)
export const productos: Producto[] = [
  // GENERAL
  {
    codigo: 7,
    categoria: "General",
    nombre: "Porcelanato piso completo",
    descripcion: "Enchape porcelanato 60mil/m²",
    precio: 5_298_800
  },

  // COCINA
  {
    codigo: 61,
    categoria: "Cocina",
    nombre: "Mueble cocina RH completo",
    descripcion: "Mueble cocina superior e inferior",
    precio: 2_750_000,
    imagen: "/productos/61-mueble-cocina.jpg.JPG"
  },
  {
    codigo: 24,
    categoria: "Cocina",
    nombre: "Estufa instalada",
    descripcion: "Estufa con instalación",
    precio: 520_000,
    imagen: "/productos/24. Estufa.jpg"
  },

  // BAÑOS
  {
    codigo: 12,
    categoria: "Baños",
    nombre: "Nicho iluminado",
    descripcion: "Nicho LED en ducha",
    precio: 228_800,
    imagen: "/productos/12.nicho.JPG"
  },
  {
    codigo: 13,
    categoria: "Baños",
    nombre: "Combo básico baño",
    descripcion: "Sanitario, lavamanos, grifería",
    precio: 730_400,
    imagen: "/productos/13.Baño-basico.jpg"
  },

  // CARPINTERÍA
  {
    codigo: 64,
    categoria: "Carpintería",
    nombre: "Closet habitación principal melamina RH",
    descripcion: "Closet principal",
    precio: 3_190_000,
    imagen: "/productos/64-closet-principal.jpg.JPG"
  },
  {
    codigo: 66,
    categoria: "Carpintería",
    nombre: "Closet secundario RH",
    descripcion: "Closet habitación secundaria",
    precio: 2_090_000,
    imagen: "/productos/66-closet-secundario.jpg.JPG"
  },

  // GRANITOS Y PIEDRAS
  {
    codigo: 40,
    categoria: "Granitos y piedras",
    nombre: "Mesón Granito/Quartzone blanco",
    descripcion: "Mesón cocina",
    precio: 950_400,
    imagen: "/productos/40. mesón.JPG"
  },
  {
    codigo: 41,
    categoria: "Granitos y piedras",
    nombre: "Barra Granito con soporte",
    descripcion: "Barra desayunador",
    precio: 844_800,
    imagen: "/productos/41. Barra-soporte.JPG"
  },

  // VIDRIOS Y ESPEJOS
  {
    codigo: 57,
    categoria: "Vidrios y espejos",
    nombre: "División de vidrio",
    descripcion: "División vidrio 8mm",
    precio: 715_000,
    imagen: "/productos/57.division-vidrio.JPG"
  },

  // ILUMINACIÓN
  {
    codigo: 18,
    categoria: "Iluminación",
    nombre: "Luminarias LED",
    descripcion: "Cambio plafones LED",
    precio: 128_700,
    imagen: "/productos/18. Luminarias.jpg"
  },

  // SEGURIDAD
  {
    codigo: 21,
    categoria: "Seguridad",
    nombre: "Cerradura inteligente",
    descripcion: "Cerradura + forrado madera",
    precio: 1_755_000,
    imagen: "/productos/21. Cerradura-inteligente.jpg"
  }
];
