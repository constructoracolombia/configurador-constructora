export type PlanSeccion = { seccion: string; items: string[] };

export const PLAN_BASICO_SECCIONES: PlanSeccion[] = [
  { seccion: "GENERAL", items: [
    "Estuco muros + techo",
    "Pintura 3 manos muros y techo",
    "Mortero de nivelación del piso impermeabilizado",
    "Enchape piso cerámica + guardaescobas",
    "Drywall cocina y baños",
  ]},
  { seccion: "BAÑO PRINCIPAL", items: [
    "Enchape baño completo",
    "Combo Básico: Sanitario, lavamanos, grifería",
    "Nicho iluminado",
  ]},
  { seccion: "COCINA", items: ["Enchape salpicadero"] },
  { seccion: "ZONA HÚMEDA", items: ["Enchape zona húmeda"] },
  { seccion: "OTROS", items: ["Luminarias LED", "Aseo final"] },
];

export const PLAN_INTERMEDIO_SECCIONES: PlanSeccion[] = [
  { seccion: "GENERAL", items: [
    "Estuco muros + techo",
    "Pintura 3 manos muros y techo",
    "Mortero de nivelación del piso impermeabilizado",
    "Enchape piso cerámica + guardaescobas",
    "Drywall cocina y baños",
  ]},
  { seccion: "BAÑO PRINCIPAL", items: [
    "Enchape baño completo",
    "Combo Básico: Sanitario, lavamanos, grifería",
    "Nicho iluminado",
    "División de baño, vidrio de seguridad 8 mm",
  ]},
  { seccion: "BAÑO AUXILIAR", items: [
    "Demolición enchape existente",
    "Enchape baño completo",
    "Nicho iluminado",
    "División de baño, vidrio de seguridad 8 mm",
  ]},
  { seccion: "COCINA", items: [
    "Enchape salpicadero",
    "Mesón granito negro o quartzone blanco",
    "Barra granito negro o quartzone blanco con soporte",
  ]},
  { seccion: "ZONA HÚMEDA", items: ["Enchape zona húmeda"] },
  { seccion: "CARPINTERÍA (Toda en melamina RH Alta calidad)", items: [
    "Puerta RH",
    "Mueble cocina superior e inferior una tonalidad RH",
    "Closet principal RH",
    "Closet secundario RH",
  ]},
  { seccion: "OTROS", items: ["Luminarias LED", "Aseo final"] },
];

export const SECCIONES_POR_PLAN: Record<string, PlanSeccion[]> = {
  "Plan Básico": PLAN_BASICO_SECCIONES,
  "Plan Intermedio": PLAN_INTERMEDIO_SECCIONES,
  "Plan Intermedio Plus": PLAN_INTERMEDIO_SECCIONES,
};

export const BONUS_ITEMS = [
  "Ducha elegante cuadrada métalica + mezclador monocontrol baño principal",
  "Asesoría arquitectónica en selección de enchape y carpintería.",
  "Recorrido virtual 360° del apartamento una vez remodelado.",
  "Trabajo supervisado por profesionales (Ing. civiles y arquitectos).",
  "Atención al cliente, tranquilidad y cero sobrecostos.",
  "Garantía de calidad materiales y mano de obra.",
];

export const CONDICIONES = [
  "Tiempo de entrega: 39 días hábiles.",
  "Avances semanales de tu apartamento por WhatsApp.",
  "Precio de enchape estimado: $40.000 el m².",
];

export const WA_EMPRESA = "573175639674";
