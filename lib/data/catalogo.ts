// PROYECTOS DISPONIBLES
export const proyectos = [
  { nombre: "Ciudadela Verde", precioIntermedioEspecial: true },
  { nombre: "Beltramonto" },
  { nombre: "Fiore" },
  { nombre: "Azafrán" },
  { nombre: "Parque Oriente" },
  { nombre: "Montebello" },
  { nombre: "Alto Tramonti" },
  { nombre: "Morada del Viento" },
  { nombre: "Fontana de la Sierra" },
  { nombre: "Paseo Bulevar" }
] as const;

// PLANES BASE
export const planesBase = {
  basico: {
    id: "basico",
    nombre: "Básico Esencial",
    precio: 14_900_000,
    tiempoEntrega: 39,
    incluye: [
      "Estuco muros + techo",
      "Pintura a 3 manos (blanco)",
      "Mortero de nivelación impermeabilizado",
      "Enchape piso cerámica (40 mil/m²) con guardaescobas + balcón",
      "Drywall cocina y baños",
      "Enchape salpicadero cerámica",
      "Instalación eléctrica básica",
      "Puertas interiores estándar",
      "Ventanas con vidrio",
      "Cielo raso en áreas sociales",
      "Piso cerámica zonas húmedas",
      "Aseo final previo entrega"
    ],
    bonus: [
      "Garantía 1 año en acabados",
      "Soporte post-entrega 30 días",
      "Visita de supervisión incluida",
      "Manual de mantenimiento",
      "Certificado de entrega",
      "Asesoría en decoración básica"
    ]
  },
  intermedio: {
    id: "intermedio",
    nombre: "Intermedio Plus",
    precio: 30_900_000,
    precioCiudadelaVerde: 29_900_000,
    tiempoEntrega: 59,
    incluye: [
      "Todo lo del Plan Básico",
      "Enchape piso porcelanato (60 mil/m²) en lugar de cerámica",
      "Carpintería RH: Mueble cocina superior e inferior",
      "Carpintería RH: Closet habitación principal",
      "Carpintería RH: Closet habitación secundaria",
      "Mesón granito San Gabriel o Quartzone",
      "Barra desayunador con soporte o sobre mueble",
      "2 Baños completos terminados",
      "Nicho iluminado en duchas",
      "División de vidrio en baños",
      "Luminarias LED en áreas sociales",
      "Enchape muro cocina completo",
      "Tubería agua caliente a duchas"
    ],
    bonus: [
      "Garantía 2 años en acabados",
      "Soporte post-entrega 60 días",
      "2 visitas de supervisión incluidas",
      "Manual de mantenimiento premium",
      "Certificado de entrega",
      "Asesoría en decoración completa"
    ]
  }
} as const;

// CATEGORÍAS (14 categorías)
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
  "Zona húmeda",
  "Ampliación",
  "Drywall/PVC",
  "Acabados generales",
  "Aseo"
] as const;

export type Categoria = (typeof categorias)[number];

// INTERFACE PRODUCTO
export interface Producto {
  codigo: number;
  categoria: Categoria;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
}

// PRODUCTOS (20 productos)
export const productos: Producto[] = [
  // CARPINTERÍA
  {
    codigo: 59,
    categoria: "Carpintería",
    nombre: "Puerta con marco en melamina mate RH",
    descripcion: "Puerta melamina RH con marco",
    precio: 880_000
  },
  {
    codigo: 60,
    categoria: "Carpintería",
    nombre: "Puerta corredera melamina RH",
    descripcion: "Puerta corredera melamina",
    precio: 1_300_000
  },
  {
    codigo: 61,
    categoria: "Carpintería",
    nombre: "Mueble cocina melamina RH arriba y abajo",
    descripcion: "Mueble cocina completo una tonalidad",
    precio: 2_750_000
  },
  {
    codigo: 64,
    categoria: "Carpintería",
    nombre: "Closet habitación principal melamina RH",
    descripcion: "Closet principal melamina RH",
    precio: 3_190_000
  },
  {
    codigo: 66,
    categoria: "Carpintería",
    nombre: "Closet habitación secundaria melamina RH",
    descripcion: "Closet secundaria melamina RH",
    precio: 2_090_000
  },
  // GRANITOS Y PIEDRAS
  {
    codigo: 40,
    categoria: "Granitos y piedras",
    nombre: "Mesón Granito San Gabriel/Quartzone blanco cocina",
    descripcion: "Mesón granito/quartzone blanco",
    precio: 950_400
  },
  {
    codigo: 41,
    categoria: "Granitos y piedras",
    nombre: "Barra Granito San Gabriel/Quartzone blanco",
    descripcion: "Barra con soporte o sobre mueble",
    precio: 844_800
  },
  {
    codigo: 46,
    categoria: "Granitos y piedras",
    nombre: "Mesón negro absoluto cocina",
    descripcion: "Mesón granito negro absoluto",
    precio: 1_664_000
  },
  // BAÑOS
  {
    codigo: 12,
    categoria: "Baños",
    nombre: "Nicho iluminado",
    descripcion: "Nicho iluminado en ducha",
    precio: 228_800
  },
  {
    codigo: 13,
    categoria: "Baños",
    nombre: "Instalación Combo básico",
    descripcion: "Sanitario, lavamanos, grifería, accesorios, sifón",
    precio: 730_400
  },
  {
    codigo: 14,
    categoria: "Baños",
    nombre: "Instalación Combo Premium",
    descripcion: "Sanitario, lavamanos, grifería premium",
    precio: 1_643_200
  },
  {
    codigo: 20,
    categoria: "Baños",
    nombre: "Tubería agua caliente (con calentador)",
    descripcion: "Acometida + calentador + instalación",
    precio: 2_665_000
  },
  {
    codigo: 36,
    categoria: "Baños",
    nombre: "Torre ducha negra instalada",
    descripcion: "Torre ducha moderna",
    precio: 715_000
  },
  // COCINA
  {
    codigo: 24,
    categoria: "Cocina",
    nombre: "Estufa plateada Challenger/Haceb/Mabe instalada",
    descripcion: "Estufa con instalación",
    precio: 520_000
  },
  {
    codigo: 25,
    categoria: "Cocina",
    nombre: "Campana Challenger/Haceb/Mabe instalada",
    descripcion: "Campana con instalación",
    precio: 455_000
  },
  {
    codigo: 26,
    categoria: "Cocina",
    nombre: "Horno Challenger/Haceb/Mabe instalado",
    descripcion: "Horno con instalación",
    precio: 1_170_000
  },
  {
    codigo: 27,
    categoria: "Cocina",
    nombre: "Lavaplatos acero inoxidable instalado",
    descripcion: "Lavaplatos con instalación + desagüe",
    precio: 299_000
  },
  {
    codigo: 35,
    categoria: "Cocina",
    nombre: "Estufa de vidrio instalada",
    descripcion: "Estufa vidrio templado 4 puestos",
    precio: 1_300_000
  },
  {
    codigo: 68,
    categoria: "Carpintería",
    nombre: "Mueble alacena cocina vertical",
    descripcion: "Alacena vertical cocina",
    precio: 1_040_000
  }
];
