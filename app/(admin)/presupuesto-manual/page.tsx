"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── tipos ───────────────────────────────────────────────────────────────────

type Catalogo = { id: string; nombre: string };
type CatalogoItem = {
  id: string;
  codigo: string | null;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  valor_venta: number;
  subcategoria_manual: string | null;
};
type Cliente = { nombre: string; telefono: string; proyecto: string };
type PlanSeccion = { seccion: string; items: string[] };
type EstadoItemPlan = { aplica: boolean; cantidad: number; descuento: number };
type PresupuestoVersion = {
  id: string;
  lead_id: string;
  version_num: number;
  estado: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA';
  total_final: number;
  precio_base: number | null;
  nombre_cliente: string;
  telefono_cliente: string;
  nombre_proyecto: string;
  catalogo_id: string | null;
  plan_base: string;
  conjunto: string;
  precio_manual: number | null;
  seleccionados: Record<string, number>;
  items_plan_estado: Record<string, EstadoItemPlan>;
  items_ocultos: string[];
  items_manuales: Array<{ id: string; nombre: string; precio: number; cantidad: number }>;
  aplica_iva: boolean;
  notas: string;
  pdf_url: string | null;
  precios_snapshot: Record<string, number>;
  token_publico: string | null;
  created_at: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const cop = (n: number) => "$ " + Math.round(n).toLocaleString("es-CO");
const randomSuffix = () => Math.random().toString(36).substring(2, 5).toUpperCase();
const numeroCotizacion = (fecha: string) =>
  "MAN-" + fecha.replace(/-/g, "") + "-" + randomSuffix();

// ─── subcategorías de "Adicionales" — mismo criterio que
// app.constructoracolombia.com/alcance/catalogo/[catalogoId] (Finance), para
// que el orden y las etiquetas coincidan entre las dos apps. Si el mapa de
// Finance cambia, actualízalo también acá (lib/utils/planes-presupuesto.ts
// en constructor-finance-app) — no hay tabla en Supabase que lo centralice.

const normalizar = (s: string) => s.toLowerCase().trim();

const SUBCATEGORIAS_ORDEN = [
  "Preliminares", "Enchapes", "Estuco y pintura", "Drywall", "Baños",
  "Cocina", "Carpintería", "Vidrios y espejos", "Piedras y granitos",
  "Eléctrico", "Otros",
] as const;

const SUBCATEGORIA_POR_CATEGORIA: Record<string, (typeof SUBCATEGORIAS_ORDEN)[number]> = {
  "demolición": "Preliminares", "ampliación": "Preliminares", "aseo": "Preliminares",
  "general": "Preliminares", "mortero": "Preliminares",
  "enchape": "Enchapes", "zona húmeda": "Enchapes",
  "estucar": "Estuco y pintura", "pintura": "Estuco y pintura",
  "drywall/pvc": "Drywall",
  "baños": "Baños",
  "cocina": "Cocina",
  "carpintería": "Carpintería",
  "vidrios y espejos": "Vidrios y espejos",
  "granitos y piedras": "Piedras y granitos",
  "iluminación": "Eléctrico", "puntos gas, eléctrico, agua": "Eléctrico", "seguridad": "Eléctrico",
};

function resolverSubcategoria(
  categoria: string | null | undefined,
  subcategoriaManual?: string | null
): (typeof SUBCATEGORIAS_ORDEN)[number] {
  if (subcategoriaManual && (SUBCATEGORIAS_ORDEN as readonly string[]).includes(subcategoriaManual)) {
    return subcategoriaManual as (typeof SUBCATEGORIAS_ORDEN)[number];
  }
  if (categoria) return SUBCATEGORIA_POR_CATEGORIA[normalizar(categoria)] ?? "Otros";
  return "Otros";
}

const agruparPorSubcategoria = (items: CatalogoItem[]) => {
  const mapa = new Map<string, CatalogoItem[]>();
  for (const item of items) {
    const sub = resolverSubcategoria(item.categoria, item.subcategoria_manual);
    if (!mapa.has(sub)) mapa.set(sub, []);
    mapa.get(sub)!.push(item);
  }
  return SUBCATEGORIAS_ORDEN
    .map((sub) => ({ categoria: sub as string, items: mapa.get(sub) ?? [] }))
    .filter((g) => g.items.length > 0);
};

// ─── precios por plan y conjunto ─────────────────────────────────────────────

const PRECIOS_PLAN: Record<string, { basico: number; intermedio: number }> = {
  "Ciudadela Verde": { basico: 15900000, intermedio: 31900000 },
  default: { basico: 16900000, intermedio: 32900000 },
};

// ─── secciones de planes ─────────────────────────────────────────────────────

const PLAN_BASICO_SECCIONES: PlanSeccion[] = [
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

const PLAN_INTERMEDIO_SECCIONES: PlanSeccion[] = [
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

// ─── conjuntos y listas planas de ítems (para preselección en catálogo) ───────

const CONJUNTOS = [
  "Ciudadela Verde", "Beltramonto", "Fiore", "Azafrán", "Parque Oriente",
  "Montebello", "Alto Tramonti", "Morada del Viento", "Fontana de la Sierra",
  "San Juan de la Cuesta", "Otro",
];

const ITEMS_PLAN_BASICO = [
  "Estuco muros + techo", "Pintura 3 manos muros y techo",
  "Mortero de nivelación del piso impermeabilizado", "Enchape piso cerámica + guardaescobas",
  "Drywall cocina y baños", "Enchape baño completo",
  "Combo Básico: Sanitario, lavamanos, grifería", "Nicho iluminado",
  "Enchape salpicadero", "Enchape zona húmeda", "Luminarias LED", "Aseo final",
];

const ITEMS_PLAN_INTERMEDIO = [
  "Estuco muros + techo", "Pintura 3 manos muros y techo",
  "Mortero de nivelación del piso impermeabilizado", "Enchape piso cerámica + guardaescobas",
  "Drywall cocina y baños", "Enchape baño completo",
  "Combo Básico: Sanitario, lavamanos, grifería", "Nicho iluminado",
  "División de baño, vidrio de seguridad 8 mm", "Demolición enchape existente",
  "Enchape salpicadero", "Mesón granito negro o quartzone blanco",
  "Barra granito negro o quartzone blanco con soporte", "Enchape zona húmeda",
  "Puerta RH", "Mueble cocina superior e inferior una tonalidad RH",
  "Closet principal RH", "Closet secundario RH", "Luminarias LED", "Aseo final",
];

// Cantidad con la que arranca cada ítem del plan al seleccionarlo — la
// mayoría parte en 1, pero algunos (como las puertas) traen más de una
// unidad de fábrica en el plan. Si un ítem no está acá, arranca en 1.
const CANTIDAD_DEFECTO_ITEM_PLAN: Record<string, number> = {
  "Puerta RH": 3,
};

// ─── bonus y condiciones ─────────────────────────────────────────────────────

const BONUS_ITEMS = [
  "Ducha elegante cuadrada métalica + mezclador monocontrol baño principal",
  "Asesoría arquitectónica en selección de enchape y carpintería.",
  "Recorrido virtual 360° del apartamento una vez remodelado.",
  "Trabajo supervisado por profesionales (Ing. civiles y arquitectos).",
  "Atención al cliente, tranquilidad y cero sobrecostos.",
  "Garantía de calidad materiales y mano de obra.",
];

const CONDICIONES = [
  "* Tiempo de entrega de 39 días hábiles.",
  "* Te enviamos avances semanales de tu apartamento por Whatsapp.",
  "* Se realiza esta cotización con precio de enchape de 40 mil pesos el metro cuadrado.",
];

// ─── componente principal ────────────────────────────────────────────────────

export default function PresupuestoManual() {
  const router = useRouter();

  const [paso, setPaso] = useState(1);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [catalogoId, setCatalogoId] = useState("");
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [seleccionados, setSeleccionados] = useState<Record<string, number>>({});
  const [busqueda, setBusqueda] = useState("");
  const [cliente, setCliente] = useState<Cliente>({ nombre: "", telefono: "", proyecto: "" });
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [aplicaIva, setAplicaIva] = useState(false);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numeroCot] = useState(() => numeroCotizacion(new Date().toISOString().split("T")[0]));
  const [toast, setToast] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [busquedaLead, setBusquedaLead] = useState("");
  const [mostrarDropdownLead, setMostrarDropdownLead] = useState(false);
  const [conjunto, setConjunto] = useState("");
  const [conjuntoPersonalizado, setConjuntoPersonalizado] = useState("");
  const [planBase, setPlanBase] = useState("");
  const [precioBase, setPrecioBase] = useState<number | null>(null);
  // Precio de venta real del catálogo seleccionado (catalogos_precios.precio_venta_{basico,intermedio}),
  // editable desde app.constructoracolombia.com/alcance/catalogo/[catalogoId]/presupuesto — es la
  // fuente de verdad para el precio del plan, PRECIOS_PLAN solo es un respaldo si el catálogo no lo trae.
  const [precioVentaCatalogo, setPrecioVentaCatalogo] = useState<{ basico: number | null; intermedio: number | null }>({
    basico: null,
    intermedio: null,
  });
  const [itemsPlanIds, setItemsPlanIds] = useState<string[]>([]);
  const [itemsPlanEstado, setItemsPlanEstado] = useState<Record<string, EstadoItemPlan>>({});
  const [itemsOcultos, setItemsOcultos] = useState<Set<string>>(new Set());
  const [precioManual, setPrecioManual] = useState<number | null>(null);
  const [itemsManuales, setItemsManuales] = useState<Array<{
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
  }>>([]);
  const [formularioManual, setFormularioManual] = useState({ nombre: '', precio: '', cantidad: '1' });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarGuardar, setMostrarGuardar] = useState(false);
  const [mostrarListado, setMostrarListado] = useState(false);
  const [nombrePresupuesto, setNombrePresupuesto] = useState('');
  const [presupuestosGuardados, setPresupuestosGuardados] = useState<any[]>([]);
  const [cargandoPresupuesto, setCargandoPresupuesto] = useState(false);
  const pendingSeleccionadosRef = useRef<Record<string, number> | null>(null);
  const [versionesLead, setVersionesLead] = useState<PresupuestoVersion[]>([]);
  const [guardandoVersion, setGuardandoVersion] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [datosDesplegados, setDatosDesplegados] = useState(true);
  // Para auto-selección desde ?lead_id y auto-carga de versión específica
  const [paramLeadId, setParamLeadId] = useState<string | null>(null);
  const [paramVersion, setParamVersion] = useState<number | null>(null);
  const autoLoadedRef = useRef(false);
  const [categoriasColapsadas, setCategoriasColapsadas] = useState<Set<string>>(new Set());
  const hasInitCategoriasRef = useRef(false);
  const itemsManualesRef = useRef<HTMLDivElement>(null);
  const [utilidadPct, setUtilidadPct] = useState(20);

  // carga catálogos, leads y config de precios al montar
  useEffect(() => {
    const cargar = async () => {
      const [{ data: catData }, { data: leadsData }, { data: configData }] = await Promise.all([
        supabase.from("catalogos_precios").select("id, nombre").eq("activo", true).order("nombre"),
        supabase.from("leads")
          .select("id, nombre, telefono, nombre_proyecto, etapa, tipo_proyecto")
          .not("etapa", "in", '("PERDIDO","DESCALIFICADO")')
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase.from("config_precios").select("utilidad_pct").single(),
      ]);
      setCatalogos(catData || []);
      setLeads(leadsData || []);
      if (configData) setUtilidadPct(Number(configData.utilidad_pct));
    };
    void cargar();
  }, []);

  // recalcula precioBase cuando cambia plan, conjunto o el precio real del catálogo
  useEffect(() => {
    if (!planBase) { setPrecioBase(null); return; }
    const precios = PRECIOS_PLAN[conjunto] || PRECIOS_PLAN["default"];
    if (planBase === "Plan Básico") setPrecioBase(precioVentaCatalogo.basico ?? precios.basico);
    else if (planBase === "Plan Intermedio Plus") setPrecioBase(precioVentaCatalogo.intermedio ?? precios.intermedio);
    else setPrecioBase(null);
  }, [planBase, conjunto, precioVentaCatalogo]);

  // inicializa estado de ítems del plan cuando cambia planBase
  useEffect(() => {
    const listaItems = planBase === "Plan Básico"
      ? ITEMS_PLAN_BASICO
      : planBase === "Plan Intermedio Plus"
      ? ITEMS_PLAN_INTERMEDIO
      : [];
    const estadoInicial: Record<string, EstadoItemPlan> = {};
    listaItems.forEach((nombre) => {
      estadoInicial[nombre] = { aplica: true, cantidad: CANTIDAD_DEFECTO_ITEM_PLAN[nombre] ?? 1, descuento: 0 };
    });
    setItemsPlanEstado(estadoInicial);
    setItemsOcultos(new Set());
  }, [planBase]);

  // resetea precio manual al cambiar plan o conjunto
  useEffect(() => { setPrecioManual(null); }, [planBase, conjunto]);

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const toggleItemPlan = (nombre: string) => {
    setItemsPlanEstado((prev) => ({
      ...prev,
      [nombre]: {
        ...(prev[nombre] ?? { aplica: true, cantidad: 1, descuento: 0 }),
        aplica: !prev[nombre]?.aplica,
        descuento: 0,
      },
    }));
  };

  const setCantidadPlan = (nombre: string, val: string) => {
    const n = Number(val);
    if (n >= 1) setItemsPlanEstado((prev) => ({
      ...prev,
      [nombre]: { ...(prev[nombre] ?? { aplica: true, cantidad: 1, descuento: 0 }), cantidad: n },
    }));
  };

  const setDescuentoPlan = (nombre: string, val: string) => {
    const n = Number(val);
    setItemsPlanEstado((prev) => ({
      ...prev,
      [nombre]: { ...(prev[nombre] ?? { aplica: false, cantidad: 1, descuento: 0 }), descuento: n },
    }));
  };

  const toggleOcultarItem = (seccion: string, nombre: string) => {
    const key = `${seccion}_${nombre}`;
    setItemsOcultos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // cargar items manuales del localStorage al montar — solo si coincide con el lead de la URL
  useEffect(() => {
    const urlLeadId = new URLSearchParams(window.location.search).get('lead_id');
    const raw = localStorage.getItem('items_manuales_presupuesto');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const storedLeadId = Array.isArray(parsed) ? null : (parsed?.lead_id ?? null);
      if (urlLeadId && storedLeadId === urlLeadId) {
        setItemsManuales(Array.isArray(parsed) ? parsed : parsed.items);
      } else {
        localStorage.removeItem('items_manuales_presupuesto');
      }
    } catch {
      localStorage.removeItem('items_manuales_presupuesto');
    }
  }, []);

  // cargar presupuestos guardados al montar
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('presupuestos_manuales_guardados')
        .select('*')
        .order('updated_at', { ascending: false });
      setPresupuestosGuardados(data || []);
    })();
  }, []);

  // leer ?lead_id y ?version del query param al montar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('lead_id');
    if (id) setParamLeadId(id);
    const v = params.get('version');
    if (v) setParamVersion(parseInt(v, 10));
  }, []);

  // auto-seleccionar lead cuando leads ya están cargados y hay paramLeadId
  useEffect(() => {
    if (!paramLeadId || leads.length === 0 || leadId) return;
    const lead = leads.find((l) => l.id === paramLeadId);
    if (!lead) return;
    setLeadId(lead.id);
    setCliente({ nombre: lead.nombre, telefono: lead.telefono || '', proyecto: lead.nombre_proyecto || '' });
    setBusquedaLead(`${lead.nombre} — ${lead.telefono || ''}`);
    setDatosDesplegados(false); // datos ya vienen del lead — aterrizar en la selección de ítems
  }, [paramLeadId, leads, leadId]);

  // cargar versiones del lead seleccionado
  useEffect(() => {
    if (!leadId) { setVersionesLead([]); return; }
    void (async () => {
      const { data } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('lead_id', leadId)
        .order('version_num', { ascending: false });
      setVersionesLead((data || []) as PresupuestoVersion[]);
    })();
  }, [leadId]);

  // auto-cargar versión específica (o la última) cuando viene de ?lead_id
  useEffect(() => {
    if (!paramLeadId || autoLoadedRef.current || versionesLead.length === 0) return;
    autoLoadedRef.current = true;
    const target = paramVersion !== null
      ? (versionesLead.find((v) => v.version_num === paramVersion) ?? versionesLead[0])
      : versionesLead[0];
    cargarDesdeVersion(target);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramLeadId, versionesLead]);

  const guardarPresupuesto = async () => {
    if (!nombrePresupuesto.trim()) { alert('Escribe un nombre para el presupuesto'); return; }
    if (!cliente.nombre || !cliente.telefono) { alert('Completa al menos nombre y teléfono del cliente'); return; }
    setCargandoPresupuesto(true);
    try {
      const { error } = await supabase.from('presupuestos_manuales_guardados').insert([{
        nombre_presupuesto: nombrePresupuesto.trim(),
        cliente_nombre: cliente.nombre,
        cliente_telefono: cliente.telefono,
        cliente_proyecto: cliente.proyecto,
        plan_base: planBase,
        conjunto,
        catalogo_id: catalogoId,
        precio_manual: precioManual,
        seleccionados: seleccionados,
        items_plan_estado: itemsPlanEstado,
        items_ocultos: Array.from(itemsOcultos),
        items_manuales: itemsManuales,
      }]);
      if (error) throw error;
      mostrarToast(`✅ Presupuesto guardado: "${nombrePresupuesto}"`);
      setNombrePresupuesto('');
      setMostrarGuardar(false);
      const { data } = await supabase.from('presupuestos_manuales_guardados').select('*').order('updated_at', { ascending: false });
      setPresupuestosGuardados(data || []);
    } catch (err: any) {
      mostrarToast(`❌ Error al guardar: ${err.message}`);
    } finally {
      setCargandoPresupuesto(false);
    }
  };

  const cargarPresupuestoGuardado = async (ppto: any) => {
    setCliente({ nombre: ppto.cliente_nombre, telefono: ppto.cliente_telefono, proyecto: ppto.cliente_proyecto || '' });
    setPlanBase(ppto.plan_base || '');
    setConjunto(ppto.conjunto || '');
    setCatalogoId(ppto.catalogo_id || '');
    setPrecioManual(ppto.precio_manual ?? null);
    setItemsPlanEstado(ppto.items_plan_estado || {});
    setItemsOcultos(new Set(ppto.items_ocultos || []));
    const manuales = ppto.items_manuales || [];
    setItemsManuales(manuales);
    localStorage.setItem('items_manuales_presupuesto', JSON.stringify({ lead_id: leadId ?? null, items: manuales }));
    pendingSeleccionadosRef.current = ppto.seleccionados || {};
    setMostrarListado(false);
    mostrarToast(`✅ Presupuesto cargado: "${ppto.nombre_presupuesto}"`);
  };

  const eliminarPresupuestoGuardado = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    setCargandoPresupuesto(true);
    try {
      const { error } = await supabase.from('presupuestos_manuales_guardados').delete().eq('id', id);
      if (error) throw error;
      mostrarToast('✅ Presupuesto eliminado');
      const { data } = await supabase.from('presupuestos_manuales_guardados').select('*').order('updated_at', { ascending: false });
      setPresupuestosGuardados(data || []);
    } catch (err: any) {
      mostrarToast(`❌ Error al eliminar: ${err.message}`);
    } finally {
      setCargandoPresupuesto(false);
    }
  };

  const agregarItemManual = () => {
    if (!formularioManual.nombre.trim() || !formularioManual.precio) return;
    const nuevoItem = {
      id: `manual_${Date.now()}`,
      nombre: formularioManual.nombre.trim(),
      precio: parseFloat(formularioManual.precio),
      cantidad: parseInt(formularioManual.cantidad) || 1,
    };
    const nuevosItems = [...itemsManuales, nuevoItem];
    setItemsManuales(nuevosItems);
    localStorage.setItem('items_manuales_presupuesto', JSON.stringify({ lead_id: leadId ?? null, items: nuevosItems }));
    setFormularioManual({ nombre: '', precio: '', cantidad: '1' });
    setMostrarFormulario(false);
  };

  const eliminarItemManual = (id: string) => {
    const nuevosItems = itemsManuales.filter((item) => item.id !== id);
    setItemsManuales(nuevosItems);
    localStorage.setItem('items_manuales_presupuesto', JSON.stringify({ lead_id: leadId ?? null, items: nuevosItems }));
  };

  const guardarVersionPresupuesto = async () => {
    if (!leadId) { mostrarToast('⚠️ Selecciona un lead para guardar versión'); return; }
    const errores = validarParaResumen();
    if (errores.length > 0) {
      mostrarToast(`⚠️ Completa antes de guardar: ${errores.join(', ')}`);
      setDatosDesplegados(true);
      return;
    }
    setGuardandoVersion(true);
    try {
      const precios_snapshot: Record<string, number> = {};
      for (const item of items) { precios_snapshot[item.id] = Math.round(item.valor_venta * (1 + utilidadPct / 100)); }

      const { data: versionData, error } = await supabase
        .from('presupuestos')
        .insert([{
          lead_id: leadId,
          estado: 'BORRADOR',
          total_final: totalFinal,
          precio_base: precioBase,
          nombre_cliente: cliente.nombre,
          telefono_cliente: cliente.telefono,
          nombre_proyecto: cliente.proyecto,
          catalogo_id: catalogoId || null,
          plan_base: planBase,
          conjunto,
          precio_manual: precioManual,
          seleccionados,
          items_plan_estado: itemsPlanEstado,
          items_ocultos: Array.from(itemsOcultos),
          items_manuales: itemsManuales,
          aplica_iva: aplicaIva,
          notas,
          pdf_url: null,
          precios_snapshot,
          token_publico: crypto.randomUUID(),
        }])
        .select('*')
        .single();

      if (error) throw error;
      setVersionesLead((prev) => [versionData as PresupuestoVersion, ...prev]);
      mostrarToast(`✅ Versión ${(versionData as PresupuestoVersion).version_num} guardada`);
    } catch (err: any) {
      mostrarToast(`❌ Error al guardar versión: ${err.message}`);
    } finally {
      setGuardandoVersion(false);
    }
  };

  const cargarDesdeVersion = (version: PresupuestoVersion) => {
    setCliente({ nombre: version.nombre_cliente, telefono: version.telefono_cliente, proyecto: version.nombre_proyecto });
    setPlanBase(version.plan_base);
    setConjunto(version.conjunto);
    setCatalogoId(version.catalogo_id || '');
    setPrecioManual(version.precio_manual);
    setItemsPlanEstado(version.items_plan_estado);
    setItemsOcultos(new Set(version.items_ocultos));
    setItemsManuales(version.items_manuales);
    localStorage.setItem('items_manuales_presupuesto', JSON.stringify({ lead_id: version.lead_id, items: version.items_manuales }));
    pendingSeleccionadosRef.current = version.seleccionados;
    setAplicaIva(version.aplica_iva);
    setNotas(version.notas);
    setMostrarHistorial(false);
    setPaso(1);
    mostrarToast(`✅ Versión ${version.version_num} cargada — modifica y guarda como nueva versión`);
  };

  // auto-cargar ítems cuando cambia el catálogo seleccionado
  useEffect(() => {
    if (!catalogoId) {
      setItems([]);
      setSeleccionados({});
      setPrecioVentaCatalogo({ basico: null, intermedio: null });
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const [{ data }, { data: precios }] = await Promise.all([
          supabase
            .from("catalogo_items")
            .select("id, codigo, categoria, nombre, descripcion, valor_venta, subcategoria_manual")
            .eq("catalogo_id", catalogoId)
            .eq("activo", true)
            .order("categoria"),
          supabase
            .from("catalogos_precios")
            .select("precio_venta_basico, precio_venta_intermedio")
            .eq("id", catalogoId)
            .maybeSingle(),
        ]);
        setPrecioVentaCatalogo({
          basico: precios?.precio_venta_basico ?? null,
          intermedio: precios?.precio_venta_intermedio ?? null,
        });
        setItemsPlanIds([]);
        setItems(data || []);
        if (pendingSeleccionadosRef.current !== null) {
          setSeleccionados(pendingSeleccionadosRef.current);
          pendingSeleccionadosRef.current = null;
        } else {
          setSeleccionados({});
        }
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogoId]);

  // inicializar acordeón cuando se cargan ítems; reset cuando se limpian (cambio de catálogo)
  useEffect(() => {
    if (items.length === 0) {
      hasInitCategoriasRef.current = false;
      return;
    }
    if (hasInitCategoriasRef.current) return;
    hasInitCategoriasRef.current = true;
    const catMap = new Map<string, boolean>();
    for (const item of items) {
      const sub = resolverSubcategoria(item.categoria, item.subcategoria_manual);
      catMap.set(sub, (catMap.get(sub) ?? false) || seleccionados[item.id] !== undefined);
    }
    const colapsadas = new Set([...catMap.entries()].filter(([, hasSel]) => !hasSel).map(([cat]) => cat));
    setCategoriasColapsadas(colapsadas);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const validarParaResumen = (): string[] => {
    const errores: string[] = [];
    if (!cliente.nombre.trim()) errores.push('nombre del cliente');
    if (!cliente.telefono.trim()) errores.push('teléfono');
    if (!cliente.proyecto.trim()) errores.push('nombre del proyecto');
    if (!conjunto) errores.push('conjunto residencial');
    if (!catalogoId) errores.push('catálogo de precios');
    return errores;
  };

  const toggleItem = (item: CatalogoItem, checked: boolean) => {
    if (checked) {
      setSeleccionados((prev) => ({ ...prev, [item.id]: 1 }));
    } else {
      setSeleccionados((prev) => { const next = { ...prev }; delete next[item.id]; return next; });
    }
  };

  const setCantidad = (id: string, val: string) => {
    const n = Number(val);
    if (n >= 1) setSeleccionados((prev) => ({ ...prev, [id]: n }));
  };

  // ── acordeón de categorías ─────────────────────────────────────────────────
  const toggleCategoria = (cat: string) => {
    setCategoriasColapsadas((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  // ── cálculos ───────────────────────────────────────────────────────────────
  const itemsSeleccionados = items.filter((i) => seleccionados[i.id] !== undefined);
  const itemsPlanSet = new Set(itemsPlanIds);
  const itemsAdicionales = itemsSeleccionados.filter((i) => !itemsPlanSet.has(i.id));

  const ajusteTotal = Object.values(itemsPlanEstado)
    .filter((e) => !e.aplica)
    .reduce((sum, e) => sum + (e.descuento || 0), 0);
  const precioEfectivo = precioManual !== null
    ? precioManual
    : (precioBase || 0) + ajusteTotal;

  const subtotalAdicionales = itemsAdicionales.reduce(
    (s, i) => s + Math.round(i.valor_venta * (1 + utilidadPct / 100)) * (seleccionados[i.id] || 1), 0
  );
  const subtotalSinPlan = itemsSeleccionados.reduce(
    (s, i) => s + Math.round(i.valor_venta * (1 + utilidadPct / 100)) * (seleccionados[i.id] || 1), 0
  );
  const baseTotal = precioBase !== null ? precioEfectivo + subtotalAdicionales : subtotalSinPlan;
  const iva = aplicaIva ? Math.round(baseTotal * 0.19) : 0;
  const subtotalManuales = itemsManuales.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const totalFinal = Math.round((baseTotal + iva + subtotalManuales) / 100000) * 100000;

  const hayDescuentos = Object.values(itemsPlanEstado).some((e) => !e.aplica);
  const diasEntrega = planBase === "Plan Básico" ? 39 : 59;
  const nombreConjuntoFinal = conjunto === "Otro" ? (conjuntoPersonalizado || "Otro") : conjunto;

  const secciones = planBase === "Plan Básico" ? PLAN_BASICO_SECCIONES
    : planBase === "Plan Intermedio Plus" ? PLAN_INTERMEDIO_SECCIONES : [];

  // ── PDF ────────────────────────────────────────────────────────────────────
  const generarPDFDoc = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const rNegro = 15; const gNegro = 15; const bNegro = 15;
    const rVerde = 34; const gVerde = 139; const bVerde = 57;
    const rGrisClaro = 245; const gGrisClaro = 245; const bGrisClaro = 243;
    const rGrisTexto = 100; const gGrisTexto = 100; const bGrisTexto = 100;
    // ── HEADER negro ──────────────────────────────────────────────────────────
    doc.setFillColor(rNegro, gNegro, bNegro);
    doc.rect(0, 0, W, 44, "F");

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("CONSTRUCTORA COLOMBIA REMODELA", 14, 18);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("Su aliado en remodelación · Bucaramanga, Colombia", 14, 25);

    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Nro. ${numeroCot}`, W - 12, 16, { align: "right" });
    doc.text(new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }), W - 12, 22, { align: "right" });

    // ── DATOS CLIENTE ─────────────────────────────────────────────────────────
    doc.setFillColor(rGrisClaro, gGrisClaro, bGrisClaro);
    doc.roundedRect(12, 50, W - 24, 22, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);
    doc.text("CLIENTE", 18, 58);
    doc.text("CONJUNTO", 75, 58);
    doc.text("CIUDAD", 145, 58);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(rNegro, gNegro, bNegro);
    doc.setFontSize(9);
    doc.text(`${cliente.nombre}  ·  ${cliente.telefono}`, 18, 65);
    doc.text(cliente.proyecto || nombreConjuntoFinal, 75, 65);
    doc.text("Bucaramanga", 145, 65);

    // ── TÍTULO TABLA ──────────────────────────────────────────────
    doc.setFillColor(rNegro, gNegro, bNegro);
    doc.rect(12, 78, W - 24, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Constructora Colombia Remodela — ${cliente.proyecto || nombreConjuntoFinal}`, W / 2, 83.5, { align: "center" });

    // ── TABLA DEL PLAN ────────────────────────────────────────────
    const seccionesActivas = planBase === "Plan Básico" ? PLAN_BASICO_SECCIONES : PLAN_INTERMEDIO_SECCIONES;
    const bodyPlan: any[][] = [];
    seccionesActivas.forEach((sec) => {
      const itemsVisibles = sec.items.filter(
        (n) => !itemsOcultos.has(`${sec.seccion}_${n}`) && n !== "Tendedero abatible en zona húmeda"
      );
      if (itemsVisibles.length === 0) return;
      bodyPlan.push([{
        content: sec.seccion, colSpan: 2,
        styles: { fillColor: [230, 230, 228], textColor: [rNegro, gNegro, bNegro], fontStyle: "bold", fontSize: 7.5 },
      }]);
      itemsVisibles.forEach((nombre) => {
        const estado = itemsPlanEstado[nombre];
        bodyPlan.push([nombre, String(estado?.cantidad || 1)]);
      });
    });

    autoTable(doc, {
      startY: 87,
      head: [["Ítem", "Cant."]],
      body: bodyPlan,
      theme: "grid",
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [rNegro, gNegro, bNegro] },
      columnStyles: { 0: { cellWidth: "auto" as const }, 1: { cellWidth: 18, halign: "center" as const } },
      alternateRowStyles: { fillColor: [250, 250, 249] },
      margin: { left: 12, right: 12 },
    });

    let currentY: number = (doc as any).lastAutoTable.finalY + 2;

    // Fila TOTAL plan
    doc.setFillColor(rNegro, gNegro, bNegro);
    doc.rect(12, currentY, W - 24, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`TOTAL ${planBase}`, 16, currentY + 6);
    doc.text(`$ ${precioEfectivo.toLocaleString("es-CO")}`, W - 14, currentY + 6, { align: "right" });
    currentY += 14;

    // ── ADICIONALES ───────────────────────────────────────────────
    if (itemsAdicionales.length > 0) {
      const bodyAdicionales: any[][] = itemsAdicionales.map((item) => [
        item.codigo ? String(item.codigo) : "",
        item.nombre,
        String(seleccionados[item.id] || 1),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [
          [{ content: "ADICIONALES", colSpan: 3, styles: { halign: "left" as const, fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 } }],
          ["Cód.", "Ítem", "Cant."],
        ],
        body: bodyAdicionales,
        theme: "grid",
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
        bodyStyles: { fontSize: 8, textColor: [rNegro, gNegro, bNegro] },
        columnStyles: {
          0: { cellWidth: 14, halign: "center" as const },
          1: { cellWidth: "auto" as const },
          2: { cellWidth: 14, halign: "center" as const },
        },
        alternateRowStyles: { fillColor: [250, 250, 249] },
        margin: { left: 12, right: 12 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;
    }

    // ── ITEMS PERSONALIZADOS ──────────────────────────────────────
    const personalizadosParaPDF = itemsManuales.filter((item) => item.nombre?.trim() !== "");
    if (personalizadosParaPDF.length > 0) {
      const bodyPersonalizados: any[][] = personalizadosParaPDF.map((item) => [
        item.nombre,
        String(item.cantidad || 1),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [
          [{ content: "ITEMS PERSONALIZADOS", colSpan: 2, styles: { halign: "left" as const, fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 } }],
          ["Ítem", "Cant."],
        ],
        body: bodyPersonalizados,
        theme: "grid",
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
        bodyStyles: { fontSize: 8, textColor: [rNegro, gNegro, bNegro] },
        columnStyles: {
          0: { cellWidth: "auto" as const },
          1: { cellWidth: 14, halign: "center" as const },
        },
        alternateRowStyles: { fillColor: [250, 250, 249] },
        margin: { left: 12, right: 12 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;
    }

    // ── TOTAL ─────────────────────────────────────────────────────
    const lineX = W - 12;
    currentY += 4;

    doc.setFillColor(rNegro, gNegro, bNegro);
    doc.roundedRect(lineX - 60, currentY, 60, 11, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL", lineX - 55, currentY + 7.5);
    doc.text(`$ ${totalFinal.toLocaleString("es-CO")}`, lineX - 3, currentY + 7.5, { align: "right" });
    currentY += 18;

    // ── BONUS GRATIS ──────────────────────────────────────────────
    autoTable(doc, {
      startY: currentY,
      head: [[{ content: "✦  BONUS GRATIS — Te llevas todos estos beneficios con tu remodelación", colSpan: 2 }]],
      body: BONUS_ITEMS.map((b) => [b, "GRATIS"]),
      theme: "grid",
      headStyles: { fillColor: [rNegro, gNegro, bNegro], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "center" as const },
      bodyStyles: { fontSize: 7.5, textColor: [rNegro, gNegro, bNegro] },
      columnStyles: {
        0: { cellWidth: "auto" as const },
        1: { cellWidth: 22, halign: "center" as const, fontStyle: "bold", textColor: [rVerde, gVerde, bVerde] },
      },
      alternateRowStyles: { fillColor: [250, 250, 249] },
      margin: { left: 12, right: 12 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // ── CONDICIONES ───────────────────────────────────────────────
    const diasEntregaPDF = planBase === "Plan Básico" ? 39 : 59;
    const condsPDF = [
      `• Tiempo de entrega: ${diasEntregaPDF} días hábiles.`,
      "• Te enviamos avances semanales de tu apartamento por WhatsApp.",
      "• Precio de enchape calculado a $ 40.000/m².",
    ];
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);
    condsPDF.forEach((c, i) => { doc.text(c, 14, currentY + i * 5); });
    currentY += condsPDF.length * 5 + 4;

    doc.setTextColor(rVerde, gVerde, bVerde);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Instagram: @constructoracol.remodela", 14, currentY);
    doc.text("Web: constructoracolombia.com/remodelaciones", 14, currentY + 5);
    currentY += 12;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);
    doc.text(
      "Más que una constructora, un aliado para llevar a la realidad el hogar o negocio de tus sueños",
      W / 2, currentY, { align: "center", maxWidth: W - 28 }
    );

    // ── PIE DE PÁGINA ─────────────────────────────────────────────
    doc.setFillColor(rGrisClaro, gGrisClaro, bGrisClaro);
    doc.rect(0, H - 14, W, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(rGrisTexto, gGrisTexto, bGrisTexto);
    doc.text("Este presupuesto tiene validez de 30 días desde la fecha de emisión.", W / 2, H - 8, { align: "center" });
    doc.text(`WhatsApp: +57 317 5639674  ·  ${numeroCot}`, W / 2, H - 4, { align: "center" });

    return doc;
  };

  const descargarPDF = async () => {
    const doc = await generarPDFDoc();
    doc.save(`Presupuesto_${(cliente.nombre || "cliente").replace(/\s+/g, "_")}_${numeroCot}.pdf`);
  };

  // ── guardar en BD ──────────────────────────────────────────────────────────
  const guardarCotizacion = async () => {
    setGuardando(true);
    try {
      // 1. Generar PDF una sola vez
      const pdfDoc = await generarPDFDoc();
      const pdfArrayBuffer = pdfDoc.output("arraybuffer");
      const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const fileName = `manuales/${numeroCot}.pdf`;

      // 2. Subir PDF a Supabase Storage
      let pdfUrl = "";
      try {
        const { error: uploadError } = await supabase.storage
          .from("presupuestos")
          .upload(fileName, pdfBlob, {
            contentType: "application/pdf",
            upsert: true,
            cacheControl: "3600",
          });
        if (uploadError) {
          console.error("Error subiendo PDF:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("presupuestos")
            .getPublicUrl(fileName);
          pdfUrl = urlData?.publicUrl || "";
        }
      } catch (e) {
        console.error("Error storage:", e);
      }

      // 3. Descargar PDF localmente
      pdfDoc.save(`Presupuesto_${(cliente.nombre || "cliente").replace(/\s+/g, "_")}_${numeroCot}.pdf`);

      const mensajeActividad = [
        `📄 Presupuesto manual: ${numeroCot}`,
        `💰 Total: $ ${totalFinal.toLocaleString("es-CO")}`,
        `📋 Plan: ${planBase || "Sin plan"} — ${nombreConjuntoFinal || cliente.proyecto}`,
        pdfUrl ? `🔗 Ver PDF: ${pdfUrl}` : "(PDF no disponible)",
      ].join("\n");

      let toastMsg: string;

      if (leadId) {
        await Promise.all([
          supabase.from("lead_actividades").insert({
            lead_id: leadId, tipo: "NOTA",
            descripcion: mensajeActividad,
            usuario: "Comercial",
          }),
          supabase.from("leads").update({
            presupuesto_estimado: totalFinal,
            nombre_proyecto: cliente.proyecto || nombreConjuntoFinal,
            observaciones: mensajeActividad,
            updated_at: new Date().toISOString(),
          }).eq("id", leadId),
        ]);
        toastMsg = "✅ Cotización guardada y lead actualizado en el CRM";
      } else {
        const { data: nuevoLead } = await supabase.from("leads").insert({
          nombre: cliente.nombre, telefono: cliente.telefono, email: "",
          fecha_contacto: fecha, origen: "OTRO", tipo_proyecto: "VIS",
          nombre_proyecto: cliente.proyecto, presupuesto_estimado: totalFinal,
          observaciones: mensajeActividad, etapa: "PROSPECCION",
          probabilidad: 10, fuente: "OTRO", responsable: "Jeisson",
        }).select("id").single();
        if (nuevoLead) {
          await supabase.from("lead_actividades").insert({
            lead_id: nuevoLead.id, tipo: "NOTA",
            descripcion: mensajeActividad,
            usuario: "Comercial",
          });
        }
        toastMsg = "✅ Cotización guardada y lead creado en Prospección del CRM";
      }

      const { error } = await supabase.from("cotizaciones").insert({
        cliente_nombre: cliente.nombre, cliente_telefono: cliente.telefono, cliente_email: "",
        proyecto_id: catalogoId, proyecto_nombre: cliente.proyecto,
        plan_tipo: "manual", plan_nombre: planBase || "Presupuesto Manual",
        precio_plan: precioBase ?? baseTotal, total: totalFinal,
        adicionales: JSON.stringify(itemsAdicionales),
        numero_cotizacion: numeroCot, estado_crm: "NUEVO",
        ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
      });
      if (error) throw error;
      mostrarToast(toastMsg);
    } catch (err: any) {
      mostrarToast(`❌ Error: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const itemsPlanNombres = (planBase === "Plan Básico"
    ? ITEMS_PLAN_BASICO
    : planBase === "Plan Intermedio Plus"
    ? ITEMS_PLAN_INTERMEDIO
    : []
  ).map((n) => n.toLowerCase().trim());

  const itemsFiltrados = items.filter((i) => {
    if (itemsPlanNombres.includes(i.nombre?.toLowerCase().trim() ?? "")) return false;
    if (!busqueda.trim()) return true;
    const t = busqueda.toLowerCase();
    return i.nombre.toLowerCase().includes(t) || (i.descripcion || "").toLowerCase().includes(t);
  });
  const grupos = agruparPorSubcategoria(itemsFiltrados);
  const todasColapsadas = grupos.length > 0 && grupos.every(({ categoria }) => categoriasColapsadas.has(categoria));
  const toggleTodas = () => {
    if (todasColapsadas) {
      setCategoriasColapsadas(new Set());
    } else {
      setCategoriasColapsadas(new Set(grupos.map(({ categoria }) => categoria)));
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg bg-[#1a2332] px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Presupuesto Manual</h1>
              <p className="text-sm text-gray-500">
                Paso {paso} de 2 —{" "}
                {paso === 1 ? "Datos y selección" : "Resumen y PDF"}
              </p>
            </div>
            <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-700">
              ← Volver
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {[1, 2].map((n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= paso ? "bg-[#1a2332]" : "bg-gray-200"}`} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setMostrarGuardar(true)}
              className="rounded-lg bg-[#1a2332] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2a3548]"
            >
              Guardar borrador
            </button>
            {presupuestosGuardados.length > 0 && (
              <button
                onClick={() => setMostrarListado(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Mis borradores ({presupuestosGuardados.length})
              </button>
            )}
            {leadId && versionesLead.length > 0 && (
              <button
                onClick={() => setMostrarHistorial(true)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
              >
                Versiones ({versionesLead.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* ═══════════════ PASO 1: Datos + Ítems ═══════════════ */}
        {paso === 1 && (
          <div className="space-y-4">

          {/* ── DATOS DEL CLIENTE — collapsible ───────────────── */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
            {!datosDesplegados ? (
              /* COLAPSADO: resumen en una línea + botón Editar */
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-gray-900">{cliente.nombre}</span>
                  {cliente.telefono && <><span className="mx-2 text-gray-300">·</span><span className="text-gray-600">{cliente.telefono}</span></>}
                  {(cliente.proyecto || nombreConjuntoFinal) && <><span className="mx-2 text-gray-300">·</span><span className="text-gray-600">{cliente.proyecto || nombreConjuntoFinal}</span></>}
                  {planBase && <><span className="mx-2 text-gray-300">·</span><span className="text-gray-500">{planBase}</span></>}
                  {leadId && (
                    <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-[#1a2332]/10 px-2 py-0.5 text-xs font-medium text-[#1a2332]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1a2332]" /> Lead vinculado
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDatosDesplegados(true)}
                  className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-100"
                >
                  Editar datos
                </button>
              </div>
            ) : (
              /* EXPANDIDO: formulario completo */
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Datos del cliente</h2>
                  {cliente.nombre && paramLeadId && (
                    <button onClick={() => setDatosDesplegados(false)} className="text-sm text-gray-400 hover:text-gray-600">
                      Colapsar ↑
                    </button>
                  )}
                </div>
              <div className="relative">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Buscar lead existente (opcional)</label>
                <Input
                  value={busquedaLead}
                  onChange={(e) => { setBusquedaLead(e.target.value); setLeadId(null); setMostrarDropdownLead(e.target.value.length >= 2); }}
                  onFocus={() => { if (busquedaLead.length >= 2) setMostrarDropdownLead(true); }}
                  onBlur={() => setTimeout(() => setMostrarDropdownLead(false), 150)}
                  placeholder="Nombre o teléfono del lead…"
                />
                {mostrarDropdownLead && (() => {
                  const t = busquedaLead.toLowerCase();
                  const resultados = leads.filter((l) =>
                    l.nombre?.toLowerCase().includes(t) ||
                    (l.telefono || "").replace(/\s/g, "").includes(t.replace(/\s/g, ""))
                  ).slice(0, 6);
                  return resultados.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      {resultados.map((lead) => (
                        <button key={lead.id} type="button"
                          onMouseDown={() => {
                            setLeadId(lead.id);
                            setCliente({ nombre: lead.nombre, telefono: lead.telefono || "", proyecto: lead.nombre_proyecto || cliente.proyecto });
                            setBusquedaLead(lead.nombre + " — " + (lead.telefono || ""));
                            setMostrarDropdownLead(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{lead.nombre}</p>
                            <p className="text-xs text-gray-500">{lead.telefono || "Sin teléfono"}</p>
                          </div>
                          <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {lead.etapa?.replace(/_/g, " ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
                      <p className="text-sm text-gray-500">Sin resultados — llena los datos manualmente</p>
                    </div>
                  );
                })()}
                <div className="mt-2">
                  {leadId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a2332]/10 px-3 py-1 text-xs font-medium text-[#1a2332]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1a2332]" /> Lead vinculado
                    </span>
                  ) : cliente.nombre.trim() && cliente.telefono.trim() ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Se creará un lead nuevo en Prospección
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del cliente *</label>
                  <Input value={cliente.nombre} onChange={(e) => setCliente((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: María García" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono *</label>
                  <Input value={cliente.telefono} onChange={(e) => setCliente((p) => ({ ...p, telefono: e.target.value }))} placeholder="Ej: 310 234 5678" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del proyecto *</label>
                  <Input value={cliente.proyecto} onChange={(e) => setCliente((p) => ({ ...p, proyecto: e.target.value }))} placeholder="Ej: Fiore 2 - Torre A Apto 301" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha *</label>
                  <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Conjunto residencial *</label>
                  <select
                    value={conjunto}
                    onChange={(e) => {
                      setConjunto(e.target.value);
                      if (e.target.value !== "Otro") setConjuntoPersonalizado("");
                      if (!cliente.proyecto.trim() && e.target.value !== "Otro") setCliente((p) => ({ ...p, proyecto: e.target.value }));
                    }}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b08d4f]"
                  >
                    <option value="">Selecciona un conjunto…</option>
                    {CONJUNTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {conjunto === "Otro" && (
                    <input
                      type="text"
                      value={conjuntoPersonalizado}
                      onChange={(e) => setConjuntoPersonalizado(e.target.value)}
                      placeholder="Escribe el nombre del conjunto…"
                      className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b08d4f]"
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan base (opcional)</label>
                  <select
                    value={planBase}
                    onChange={(e) => setPlanBase(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b08d4f]"
                  >
                    <option value="">(ninguno)</option>
                    <option value="Plan Básico">Plan Básico</option>
                    <option value="Plan Intermedio Plus">Plan Intermedio Plus</option>
                  </select>
                  {planBase && precioBase !== null && (
                    <p className="mt-1 text-xs text-[#96773f]">
                      Precio: {cop(precioBase)} — {nombreConjuntoFinal || "precio estándar"}
                    </p>
                  )}
                </div>
              </div>

              </div>
            )}
            </CardContent>
          </Card>

          {/* ── CATÁLOGO + SELECCIÓN DE ÍTEMS ─────────────────── */}
          <div>
            <div className="mb-4 rounded-lg border border-gray-200 bg-white px-5 py-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Catálogo de precios *</label>
              <select
                value={catalogoId}
                onChange={(e) => setCatalogoId(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b08d4f]"
              >
                <option value="">Selecciona un catálogo…</option>
                {catalogos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            {!catalogoId ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-14 text-center text-sm text-gray-400">
                Selecciona un catálogo para ver los ítems disponibles
              </div>
            ) : loading ? (
              <div className="rounded-lg border border-gray-200 bg-white py-14 text-center text-sm text-gray-500">
                Cargando ítems…
              </div>
            ) : (
          <div>
            {/* Banner plan */}
            {precioBase !== null && (
              <div className="mb-3 rounded-xl" style={{ background: "#14532d", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{planBase} — {nombreConjuntoFinal}</div>
                  <div style={{ color: "#86efac", fontSize: 12 }}>Precio base del plan incluido</div>
                  {precioManual !== null && precioManual !== precioBase && (
                    <div style={{ color: "#86efac", fontSize: 11, marginTop: 2 }}>Precio ajustado manualmente</div>
                  )}
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>
                  {precioManual !== null ? (
                    cop(precioManual)
                  ) : ajusteTotal < 0 ? (
                    <span>
                      <span style={{ textDecoration: "line-through", opacity: 0.55, fontSize: 14, marginRight: 6 }}>{cop(precioBase)}</span>
                      {cop(precioEfectivo)}
                    </span>
                  ) : cop(precioBase)}
                </div>
              </div>
            )}

            {/* ── TABLA ÍTEMS DEL PLAN ─────────────────────────────────── */}
            {planBase !== "" && secciones.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-4 py-2.5">
                  <span className="text-sm font-bold text-gray-900">Incluido en {planBase}</span>
                </div>
                <table className="w-full" style={{ fontSize: 13 }}>
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-2 pl-2 pr-0" style={{ width: 24 }} />
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Ítem</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">¿Aplica?</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Cant.</th>
                      {hayDescuentos && <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Descuento ($)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {secciones.map(({ seccion, items: planItems }) => (
                      <>
                        <tr key={`sec-${seccion}`}>
                          <td colSpan={hayDescuentos ? 5 : 4} className="bg-gray-100 px-4 py-1 text-[11px] font-bold text-gray-700">
                            {seccion}
                          </td>
                        </tr>
                        {planItems.map((itemNombre) => {
                          const estado = itemsPlanEstado[itemNombre];
                          const aplica = estado?.aplica ?? true;
                          const oculto = itemsOcultos.has(`${seccion}_${itemNombre}`);
                          return (
                            <tr
                              key={`${seccion}-${itemNombre}`}
                              className="border-b border-gray-100"
                              style={{ opacity: oculto ? 0.3 : 1, transition: "opacity 0.15s" }}
                            >
                              <td className={`py-1.5 pl-2 pr-0 text-center`} style={{ width: 24 }}>
                                <button
                                  type="button"
                                  onClick={() => toggleOcultarItem(seccion, itemNombre)}
                                  title={oculto ? "Mostrar en presupuesto" : "Ocultar del presupuesto"}
                                  style={{
                                    fontSize: 13, lineHeight: 1, background: "none", border: "none",
                                    cursor: "pointer", color: oculto ? "#dc2626" : "#9ca3af",
                                    textDecoration: oculto ? "line-through" : "none",
                                    padding: "2px 4px",
                                  }}
                                >
                                  👁
                                </button>
                              </td>
                              <td className={`px-4 py-1.5 ${!aplica ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                {itemNombre}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleItemPlan(itemNombre)}
                                  className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${aplica ? "bg-[#b08d4f]/15 text-[#96773f] hover:bg-[#b08d4f]/25" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                                >
                                  {aplica ? "SÍ" : "NO"}
                                </button>
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {aplica ? (
                                  <input
                                    type="number"
                                    min={1}
                                    value={estado?.cantidad ?? 1}
                                    onChange={(e) => setCantidadPlan(itemNombre, e.target.value)}
                                    className="h-7 w-12 rounded border border-gray-300 text-center text-xs"
                                    style={{ color: "#111827", backgroundColor: "#fff" }}
                                  />
                                ) : <span className="text-gray-400">—</span>}
                              </td>
                              {hayDescuentos && (
                                <td className="px-3 py-1.5 text-right">
                                  {!aplica ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500">$</span>
                                        <input
                                          type="number"
                                          value={estado?.descuento ?? 0}
                                          onChange={(e) => setDescuentoPlan(itemNombre, e.target.value)}
                                          placeholder="ej: -1200000"
                                          className="h-7 w-28 rounded border border-red-300 px-2 text-right text-xs"
                                          style={{ color: "#dc2626", backgroundColor: "#fff5f5" }}
                                        />
                                      </div>
                                      {(estado?.descuento ?? 0) !== 0 && (
                                        <span className="text-[10px] font-semibold text-red-500">
                                          Descuento: $ {Math.abs(estado?.descuento ?? 0).toLocaleString("es-CO")}
                                        </span>
                                      )}
                                    </div>
                                  ) : null}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </>
                    ))}
                    {/* Bonus */}
                    <tr className="border-b border-gray-100">
                      <td />
                      <td className="px-4 py-1.5 text-gray-900">
                        Tendedero abatible en zona húmeda
                        <span className="ml-2 rounded bg-[#b08d4f]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#96773f]">BONUS GRATIS</span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className="rounded bg-[#b08d4f]/15 px-2 py-0.5 text-xs font-bold text-[#96773f]">SÍ</span>
                      </td>
                      <td className="px-3 py-1.5 text-center text-xs text-gray-700">1</td>
                      {hayDescuentos && <td />}
                    </tr>
                    {/* Total plan */}
                    <tr className="bg-[#1a2332]">
                      <td colSpan={hayDescuentos ? 5 : 4} className="px-4 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">TOTAL {planBase}</span>
                          <div className="flex items-center gap-2">
                            {precioManual === null && ajusteTotal < 0 && (
                              <span style={{ color: "rgba(255,255,255,0.45)", textDecoration: "line-through", fontSize: 11 }}>
                                {cop(precioBase!)}
                              </span>
                            )}
                            <input
                              type="text"
                              value={precioEfectivo.toLocaleString("es-CO")}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\./g, "").replace(/[^0-9-]/g, "");
                                const num = parseInt(raw, 10);
                                if (!isNaN(num)) setPrecioManual(num);
                              }}
                              style={{
                                background: "transparent", border: "none",
                                borderBottom: "1px solid rgba(255,255,255,0.4)",
                                color: "white", fontWeight: "bold", fontSize: 15,
                                textAlign: "right", width: 160, outline: "none",
                              }}
                            />
                          </div>
                        </div>
                        {precioManual !== null && precioManual !== precioBase && (
                          <div className="mt-0.5 text-right text-[10px] text-[#b08d4f]">editado manualmente</div>
                        )}
                        {precioManual === null && ajusteTotal < 0 && (
                          <div className="mt-1 text-right text-[10px] font-semibold text-red-400">
                            Ajuste: - $ {Math.abs(ajusteTotal).toLocaleString("es-CO")}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="min-w-0">
                <div className="mb-4">
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar ítems adicionales por nombre o descripción…"
                    style={{ color: "var(--color-text-primary, #111827)", backgroundColor: "var(--color-background-primary, #ffffff)" }}
                  />
                </div>

                {grupos.length === 0 && (
                  <p className="py-12 text-center text-sm text-gray-500">No se encontraron ítems</p>
                )}

                {grupos.length > 0 && (
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      onClick={toggleTodas}
                      className="text-xs text-gray-500 underline hover:text-gray-700"
                    >
                      {todasColapsadas ? 'Expandir todo' : 'Colapsar todo'}
                    </button>
                    <button
                      onClick={() => itemsManualesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      + Ítem personalizado ↓
                    </button>
                  </div>
                )}

                {grupos.map(({ categoria, items: gItems }) => {
                  const colapsada = categoriasColapsadas.has(categoria);
                  const selCount = gItems.filter((i) => seleccionados[i.id] !== undefined).length;
                  return (
                  <div key={categoria} className="mb-3">
                    <button
                      onClick={() => toggleCategoria(categoria)}
                      className="mb-2 flex w-full items-center justify-between rounded-lg bg-[#b08d4f]/10 px-4 py-2 text-sm font-bold text-[#8a6d3b] transition-colors hover:bg-[#b08d4f]/20"
                    >
                      <span>{categoria}</span>
                      <span className="flex items-center gap-2">
                        {selCount > 0 && (
                          <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] font-bold text-white">
                            {selCount} sel.
                          </span>
                        )}
                        {colapsada && (
                          <span className="font-normal text-[#96773f] text-xs">({gItems.length} disponibles)</span>
                        )}
                        <span className="text-[#96773f] text-xs">{colapsada ? '▶' : '▼'}</span>
                      </span>
                    </button>
                    {!colapsada && (
                    <div className="space-y-2">
                      {gItems.map((item) => {
                        const sel = seleccionados[item.id] !== undefined;
                        const esDePlan = itemsPlanSet.has(item.id);
                        const precioConUtilidad = Math.round(item.valor_venta * (1 + utilidadPct / 100));
                        return (
                          <div key={item.id} className={`rounded-lg border px-4 py-3 transition-colors ${sel ? "border-[#b08d4f]/40 bg-[#b08d4f]/5" : "border-gray-200 bg-white"}`}>
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={sel}
                                onChange={(e) => toggleItem(item, e.target.checked)}
                                className="mt-1 h-4 w-4 cursor-pointer accent-[#1a2332]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.codigo && <span className="text-xs text-gray-400">{item.codigo} · </span>}
                                  <span className="font-semibold text-gray-900">{item.nombre}</span>
                                  {esDePlan && (
                                    <span className="rounded bg-[#b08d4f]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#96773f]">Incluido en plan</span>
                                  )}
                                </div>
                                {item.descripcion && <p className="mt-0.5 text-xs text-gray-500">{item.descripcion}</p>}
                                {item.id.startsWith("extra-") && (
                                  <span className="mt-1 inline-block rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">Sin precio — actualizar en catálogo</span>
                                )}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-0.5">
                                {item.valor_venta > 0 ? (
                                  <>
                                    <span className="text-xs text-gray-400 line-through">{cop(item.valor_venta)}</span>
                                    <span className="text-sm font-bold text-[#b08d4f]">{cop(precioConUtilidad)}</span>
                                    <span className="text-[10px] text-[#96773f]">+{utilidadPct}% utilidad</span>
                                  </>
                                ) : (
                                  <span className="text-sm font-semibold text-gray-400">A convenir</span>
                                )}
                                {sel && (
                                  <input
                                    type="number" min={1} value={seleccionados[item.id]}
                                    onChange={(e) => setCantidad(item.id, e.target.value)}
                                    className="mt-1 h-8 w-16 rounded border border-gray-300 px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#b08d4f]"
                                    style={{ color: "#111827", backgroundColor: "#fff" }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                  );
                })}
              </div>

            {/* ITEMS MANUALES */}
            <div ref={itemsManualesRef} className="mt-6 border-t-2 border-gray-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Items Adicionales Personalizados</h3>
                {!mostrarFormulario && (
                  <button
                    onClick={() => setMostrarFormulario(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    + Agregar Item Manual
                  </button>
                )}
              </div>

              {mostrarFormulario && (
                <div className="mb-4 rounded-lg border border-blue-300 bg-white p-4">
                  <h4 className="mb-3 font-bold text-gray-900">Nuevo Item Personalizado</h4>
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Nombre del Item</label>
                      <input
                        type="text"
                        value={formularioManual.nombre}
                        onChange={(e) => setFormularioManual({ ...formularioManual, nombre: e.target.value })}
                        placeholder="Ej: Obra extra, Cambios, etc."
                        className="h-10 w-full rounded-lg border-2 border-gray-300 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Precio Unitario</label>
                      <input
                        type="number"
                        value={formularioManual.precio}
                        onChange={(e) => setFormularioManual({ ...formularioManual, precio: e.target.value })}
                        placeholder="Ej: 500000"
                        className="h-10 w-full rounded-lg border-2 border-gray-300 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={formularioManual.cantidad}
                        onChange={(e) => setFormularioManual({ ...formularioManual, cantidad: e.target.value })}
                        className="h-10 w-full rounded-lg border-2 border-gray-300 px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={agregarItemManual}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      Agregar Item
                    </button>
                    <button
                      onClick={() => { setMostrarFormulario(false); setFormularioManual({ nombre: '', precio: '', cantidad: '1' }); }}
                      className="flex-1 rounded-lg bg-gray-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {itemsManuales.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-blue-200 bg-blue-50">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-blue-300 bg-blue-100">
                        <th className="px-3 py-2 text-left font-bold text-gray-700">Item</th>
                        <th className="px-3 py-2 text-center font-bold text-gray-700">Cant.</th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700">Precio Unit.</th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700">Total</th>
                        <th className="px-3 py-2 text-center font-bold text-gray-700">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsManuales.map((item) => (
                        <tr key={item.id} className="border-b border-blue-100 hover:bg-blue-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{item.nombre}</td>
                          <td className="px-3 py-2 text-center text-gray-900">{item.cantidad}</td>
                          <td className="px-3 py-2 text-right text-gray-900">$ {item.precio.toLocaleString('es-CO')}</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900">$ {(item.precio * item.cantidad).toLocaleString('es-CO')}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => eliminarItemManual(item.id)}
                              className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-3 py-2 text-right text-sm text-gray-700">
                    Subtotal personalizados: <span className="font-bold text-blue-600">$ {subtotalManuales.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* RESUMEN — al final de la página, no en un panel lateral */}
            <div className="mt-6 rounded-xl bg-[#1a2332] p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-white">Resumen</h3>
                  <p className="mt-0.5 text-sm text-white/60">
                    Ítems: <span className="font-semibold text-white">{itemsSeleccionados.length}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/70">
                  {precioBase !== null ? (
                    <>
                      <span>Plan base <span className="font-semibold text-white">{cop(precioEfectivo)}</span></span>
                      {subtotalAdicionales > 0 && (
                        <span>Adicionales <span className="font-semibold text-white">{cop(subtotalAdicionales)}</span></span>
                      )}
                      {subtotalManuales > 0 && (
                        <span>Personalizados <span className="font-semibold text-white">{cop(subtotalManuales)}</span></span>
                      )}
                    </>
                  ) : (
                    <span>Total (+20%)</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-white/50">Total</div>
                    <div className="text-xl font-bold text-[#b08d4f]">{cop(totalFinal)}</div>
                  </div>
                  <Button
                    className="shrink-0 bg-[#b08d4f] text-white hover:bg-[#96773f]"
                    onClick={() => {
                      const errores = validarParaResumen();
                      if (errores.length > 0) {
                        mostrarToast(`⚠️ Completa: ${errores.join(', ')}`);
                        setDatosDesplegados(true);
                        return;
                      }
                      setPaso(2);
                    }}
                  >
                    Ver resumen →
                  </Button>
                </div>
              </div>
            </div>
          </div>
            )}
          </div>
          </div>
        )}

        {/* ═══════════════ PASO 2: Resumen ═══════════════ */}
        {paso === 2 && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Resumen del presupuesto</h2>
                  <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-mono text-gray-600">{numeroCot}</span>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
                  <div><span className="text-gray-500">Cliente</span><p className="font-semibold text-gray-900">{cliente.nombre}</p></div>
                  <div><span className="text-gray-500">Teléfono</span><p className="font-semibold text-gray-900">{cliente.telefono}</p></div>
                  <div><span className="text-gray-500">Proyecto</span><p className="font-semibold text-gray-900">{cliente.proyecto}</p></div>
                </div>

                {/* ── TABLA DEL PLAN ─────────────────────────────────────── */}
                {precioBase !== null && planBase && secciones.length > 0 && (
                  <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
                    {/* Header negro */}
                    <div className="bg-[#1a2332] px-4 py-3">
                      <div className="text-xs font-bold text-white">CONSTRUCTORA COLOMBIA REMODELA</div>
                      <div className="text-[11px] text-gray-400">Constructora Colombia Remodela — {nombreConjuntoFinal}</div>
                    </div>
                    <table className="w-full" style={{ fontSize: 13 }}>
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Ítem</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">¿Aplica?</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Cantidad / Área</th>
                        </tr>
                      </thead>
                      <tbody>
                        {secciones.map(({ seccion, items: planItems }) => {
                          const visibles = planItems.filter((n) => !itemsOcultos.has(`${seccion}_${n}`));
                          if (visibles.length === 0) return null;
                          return (
                            <>
                              <tr key={`r3-sec-${seccion}`}>
                                <td colSpan={3} className="bg-gray-100 px-4 py-1 text-[11px] font-bold text-gray-700">{seccion}</td>
                              </tr>
                              {visibles.map((itemNombre) => {
                                const estado = itemsPlanEstado[itemNombre];
                                const aplica = estado?.aplica ?? true;
                                return (
                                  <tr key={`r3-${seccion}-${itemNombre}`} className="border-b border-gray-100">
                                    <td className="px-4 py-1.5 text-gray-900">{itemNombre}</td>
                                    <td className="px-3 py-1.5 text-center">
                                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${aplica ? "bg-[#b08d4f]/15 text-[#96773f]" : "bg-gray-100 text-gray-500"}`}>
                                        {aplica ? "SÍ" : "NO"}
                                      </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-center text-gray-700">
                                      {aplica ? (estado?.cantidad ?? 1) : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          );
                        })}
                        {/* Bonus */}
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-1.5 text-gray-900">
                            Tendedero abatible en zona húmeda
                            <span className="ml-2 rounded bg-[#b08d4f]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#96773f]">BONUS GRATIS</span>
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <span className="rounded bg-[#b08d4f]/15 px-2 py-0.5 text-xs font-bold text-[#96773f]">SÍ</span>
                          </td>
                          <td className="px-3 py-1.5 text-center text-gray-700">1</td>
                        </tr>
                        {/* Filas de descuento por ítems removidos */}
                        {Object.entries(itemsPlanEstado)
                          .filter(([_, e]) => !e.aplica && e.descuento !== 0)
                          .map(([nombre, e]) => (
                            <tr key={`desc-${nombre}`} className="border-b border-red-100 bg-red-50">
                              <td className="px-4 py-1.5 text-xs italic text-red-600" colSpan={2}>
                                — Sin {nombre}
                              </td>
                              <td className="px-3 py-1.5 text-right text-xs font-bold text-red-600">
                                {cop(e.descuento)}
                              </td>
                            </tr>
                          ))}
                        {/* Total plan */}
                        <tr className="bg-[#1a2332]">
                          <td colSpan={3} className="px-4 py-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white">TOTAL {planBase}</span>
                              <div className="text-right">
                                {ajusteTotal < 0 && (
                                  <div style={{ color: "rgba(255,255,255,0.45)", textDecoration: "line-through", fontSize: 11 }}>
                                    {cop(precioBase!)}
                                  </div>
                                )}
                                <span className="text-sm font-bold text-white">{cop(precioEfectivo)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── ADICIONALES ────────────────────────────────────────── */}
                {(() => {
                  const itemsMostrar = precioBase !== null ? itemsAdicionales : itemsSeleccionados;
                  if (itemsMostrar.length === 0) return null;
                  return (
                    <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
                      <div className="border-b border-gray-200 bg-gray-700 px-4 py-2">
                        <span className="text-xs font-bold text-white">
                          {precioBase !== null ? "ADICIONALES" : "ÍTEMS SELECCIONADOS"}
                        </span>
                      </div>
                      <table className="w-full" style={{ fontSize: 13 }}>
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Cód.</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Ítem</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Cant.</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Vlr. Unit. (+{utilidadPct}%)</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsMostrar.map((item) => {
                            const precioUtil = Math.round(item.valor_venta * (1 + utilidadPct / 100));
                            const cant = seleccionados[item.id] || 1;
                            return (
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="px-3 py-1.5 text-xs text-gray-400">{item.codigo || "—"}</td>
                                <td className="px-3 py-1.5 text-gray-900">{item.nombre}</td>
                                <td className="px-3 py-1.5 text-center text-gray-700">{cant}</td>
                                <td className="px-3 py-1.5 text-right text-gray-700">
                                  {item.valor_venta > 0 ? cop(precioUtil) : "A convenir"}
                                </td>
                                <td className="px-3 py-1.5 text-right font-semibold text-gray-900">
                                  {item.valor_venta > 0 ? cop(precioUtil * cant) : "A convenir"}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="border-t border-gray-200 bg-gray-50">
                            <td colSpan={4} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                              {precioBase !== null ? "Subtotal adicionales" : "Subtotal"}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">
                              {cop(precioBase !== null ? subtotalAdicionales : subtotalSinPlan)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* ── PERSONALIZADOS ─────────────────────────────────── */}
                {itemsManuales.length > 0 && (
                  <div className="mb-6 overflow-hidden rounded-lg border border-blue-200">
                    <div className="border-b border-blue-200 bg-blue-700 px-4 py-2">
                      <span className="text-xs font-bold text-white">ITEMS PERSONALIZADOS</span>
                    </div>
                    <table className="w-full" style={{ fontSize: 13 }}>
                      <thead>
                        <tr className="border-b border-blue-100 bg-blue-50">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Ítem</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Cant.</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Vlr. Unit.</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsManuales.map((item) => (
                          <tr key={item.id} className="border-b border-blue-50">
                            <td className="px-3 py-1.5 text-gray-900">{item.nombre}</td>
                            <td className="px-3 py-1.5 text-center text-gray-700">{item.cantidad}</td>
                            <td className="px-3 py-1.5 text-right text-gray-700">{cop(item.precio)}</td>
                            <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{cop(item.precio * item.cantidad)}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-blue-200 bg-blue-50">
                          <td colSpan={3} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">Subtotal personalizados</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900">{cop(subtotalManuales)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* totales finales */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex flex-col items-end gap-2">
                    {precioBase !== null ? (
                      <>
                        <div className="flex w-72 justify-between text-sm">
                          <span className="text-gray-600">Plan base</span>
                          <span className="font-semibold text-gray-900">{cop(precioEfectivo)}</span>
                        </div>
                        {subtotalAdicionales > 0 && (
                          <div className="flex w-72 justify-between text-sm">
                            <span className="text-gray-600">Adicionales</span>
                            <span className="font-semibold text-gray-900">{cop(subtotalAdicionales)}</span>
                          </div>
                        )}
                        {subtotalManuales > 0 && (
                          <div className="flex w-72 justify-between text-sm">
                            <span className="text-gray-600">Personalizados</span>
                            <span className="font-semibold text-gray-900">{cop(subtotalManuales)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex w-72 justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-900">{cop(subtotalSinPlan)}</span>
                      </div>
                    )}

                    <div className="flex w-72 items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={aplicaIva} onChange={(e) => setAplicaIva(e.target.checked)} />
                          <div className={`h-5 w-9 rounded-full transition-colors ${aplicaIva ? "bg-[#1a2332]" : "bg-gray-300"}`} />
                          <div className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${aplicaIva ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                        Aplicar IVA 19%
                      </label>
                      {aplicaIva && <span className="text-sm font-semibold text-gray-900">{cop(iva)}</span>}
                    </div>

                    <div className="flex w-72 justify-between border-t border-gray-300 pt-2">
                      <span className="text-base font-bold text-gray-900">TOTAL GENERAL</span>
                      <span className="text-base font-bold text-[#b08d4f]">{cop(totalFinal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas y condiciones</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={4}
                    placeholder="Validez de la cotización, forma de pago, exclusiones, etc."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b08d4f]"
                  />
                </div>

                {/* Sección bonus */}
                <div style={{ background: "#111", borderRadius: 8, padding: 16, marginTop: 20 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                    BONUS GRATIS — Te llevas todos estos Bonus con tu remodelación
                  </div>
                  <table style={{ width: "100%", fontSize: 12 }}>
                    <tbody>
                      {BONUS_ITEMS.map((b) => (
                        <tr key={b}>
                          <td style={{ color: "#fff", paddingTop: 4, paddingBottom: 4 }}>{b}</td>
                          <td style={{ textAlign: "right", color: "#86efac", fontWeight: 700 }}>GRATIS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 12, fontSize: 11, color: "#d1d5db" }}>
                    {[`* Tiempo de entrega de ${diasEntrega} días hábiles.`, CONDICIONES[1], CONDICIONES[2]].map((c) => (
                      <p key={c} style={{ marginBottom: 4 }}>{c}</p>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11 }}>
                    <p style={{ color: "#d1d5db" }}>
                      Instagram:{" "}
                      <a href="https://www.instagram.com/constructoracol.remodela" style={{ color: "#86efac" }}>
                        @constructoracol.remodela
                      </a>
                    </p>
                    <p style={{ color: "#d1d5db" }}>
                      Página web:{" "}
                      <a href="https://www.constructoracolombia.com/remodelaciones" style={{ color: "#86efac" }}>
                        constructoracolombia.com/remodelaciones
                      </a>
                    </p>
                  </div>
                  <div style={{ marginTop: 16, textAlign: "center", fontStyle: "italic", fontSize: 12, color: "#9ca3af" }}>
                    "Más que una constructora, un aliado para llevar a la realidad el hogar o negocio de tus sueños"
                  </div>
                </div>

                {/* Botón WhatsApp */}
                <a
                  href={`https://wa.me/573175639674?text=${encodeURIComponent(`Hola, me interesa el presupuesto ${numeroCot} por $ ${totalFinal.toLocaleString("es-CO")}. Quiero avanzar.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 12, backgroundColor: "#25D366", color: "white",
                    padding: "16px 32px", borderRadius: 14, textDecoration: "none",
                    fontWeight: 600, fontSize: 16, marginTop: 24, letterSpacing: "0.01em",
                    boxShadow: "0 4px 14px rgba(37,211,102,0.35)", transition: "opacity 0.2s",
                  }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.92"; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.306A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.898 13.87c-.207.583-1.215 1.114-1.656 1.15-.44.038-.854.207-2.876-.598-2.432-.983-3.99-3.47-4.11-3.63-.12-.16-.976-1.298-.976-2.476 0-1.178.617-1.757.835-1.994.22-.237.478-.297.638-.297l.459.009c.148.006.346-.056.541.413.2.48.68 1.658.74 1.778.06.12.1.26.02.418-.08.158-.12.257-.238.396-.12.14-.252.312-.36.42-.12.116-.245.242-.105.474.14.233.62.965 1.329 1.563.913.786 1.683 1.03 1.917 1.144.233.115.368.096.503-.058.136-.154.583-.68.738-.913.154-.234.308-.194.518-.116.21.077 1.333.628 1.562.743.228.115.38.173.437.27.057.096.057.554-.15 1.137z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.847L.057 23.882l6.198-1.625A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.366l-.36-.214-3.68.965.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                  Contactar por WhatsApp — Quiero avanzar
                </a>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setPaso(1)} className="text-sm text-gray-500 hover:text-gray-700">← Volver a ítems</button>
              <div className="flex-1" />
              <Button onClick={descargarPDF} variant="outline" className="border-[#1a2332] text-[#1a2332] hover:bg-[#1a2332]/5">Descargar PDF</Button>
              {leadId && (
                <Button onClick={guardarVersionPresupuesto} disabled={guardandoVersion} className="bg-violet-600 hover:bg-violet-700">
                  {guardandoVersion ? "Guardando…" : "Guardar como versión"}
                </Button>
              )}
              <Button onClick={guardarCotizacion} disabled={guardando} className="bg-[#1a2332] hover:bg-[#2a3548]">
                {guardando ? "Guardando…" : "Guardar cotización"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")} className="text-gray-600">Ver en Flujo Comercial →</Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL GUARDAR BORRADOR */}
      {mostrarGuardar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-gray-900">Guardar borrador</h3>
            <p className="mb-4 text-sm text-gray-500">Guarda el presupuesto para retomarlo después</p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre del borrador</label>
              <input
                type="text"
                autoFocus
                value={nombrePresupuesto}
                onChange={(e) => setNombrePresupuesto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void guardarPresupuesto()}
                placeholder="Ej: Apto 301 Ciudadela Verde"
                className="h-10 w-full rounded-lg border-2 border-gray-300 px-3 text-gray-900 focus:border-[#b08d4f] focus:outline-none focus:ring-2 focus:ring-[#b08d4f]"
              />
            </div>
            <div className="mb-4 rounded-lg border-l-4 border-[#b08d4f] bg-[#b08d4f]/10 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Se guardará:</p>
              <p className="text-xs">• Cliente: {cliente.nombre || '(sin nombre)'}</p>
              <p className="text-xs">• Plan: {planBase || '(no seleccionado)'}</p>
              <p className="text-xs">• Items catálogo: {Object.keys(seleccionados).length}</p>
              <p className="text-xs">• Items manuales: {itemsManuales.length}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void guardarPresupuesto()}
                disabled={cargandoPresupuesto || !nombrePresupuesto.trim()}
                className="flex-1 rounded-lg bg-[#1a2332] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2a3548] disabled:bg-gray-300"
              >
                {cargandoPresupuesto ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={() => { setMostrarGuardar(false); setNombrePresupuesto(''); }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE VERSIONES */}
      {mostrarHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-gray-900">Historial de versiones</h3>
            <p className="mb-4 text-sm text-gray-500">
              Lead seleccionado — {versionesLead.length} versión{versionesLead.length !== 1 ? 'es' : ''} guardada{versionesLead.length !== 1 ? 's' : ''}
            </p>
            {versionesLead.length === 0 ? (
              <p className="py-8 text-center text-gray-400">Sin versiones guardadas para este lead</p>
            ) : (
              <div className="space-y-3">
                {versionesLead.map((v) => {
                  const estadoColor: Record<string, string> = {
                    BORRADOR: 'bg-gray-100 text-gray-600',
                    ENVIADA: 'bg-blue-100 text-blue-700',
                    APROBADA: 'bg-emerald-100 text-emerald-700',
                    RECHAZADA: 'bg-red-100 text-red-600',
                  };
                  return (
                    <div key={v.id} className="rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-violet-300 hover:bg-violet-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-gray-900">V{v.version_num}</span>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${estadoColor[v.estado] || estadoColor.BORRADOR}`}>
                              {v.estado}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-700 font-semibold">
                            $ {Math.round(v.total_final).toLocaleString('es-CO')}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">
                            {v.plan_base || 'Sin plan'} · {v.nombre_proyecto || v.conjunto || '—'}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {new Date(v.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => cargarDesdeVersion(v)}
                          className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-700"
                        >
                          Nueva versión desde esta
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setMostrarHistorial(false)}
                className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTADO DE BORRADORES */}
      {mostrarListado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-xl font-bold text-gray-900">Mis borradores</h3>
            <p className="mb-4 text-sm text-gray-500">Selecciona uno para retomar donde lo dejaste</p>
            {presupuestosGuardados.length === 0 ? (
              <p className="py-8 text-center text-gray-400">No hay borradores guardados</p>
            ) : (
              <div className="space-y-3">
                {presupuestosGuardados.map((ppto) => (
                  <div key={ppto.id} className="rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-blue-400 hover:bg-blue-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-gray-900">{ppto.nombre_presupuesto}</p>
                        <p className="mt-0.5 text-sm text-gray-600">{ppto.cliente_nombre} · {ppto.cliente_telefono}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Plan: {ppto.plan_base || 'N/A'} · {Object.keys(ppto.seleccionados || {}).length} catálogo · {(ppto.items_manuales || []).length} manuales
                        </p>
                        <p className="mt-1 text-xs text-gray-400">{new Date(ppto.updated_at).toLocaleString('es-CO')}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => cargarPresupuestoGuardado(ppto)}
                          disabled={cargandoPresupuesto}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => void eliminarPresupuestoGuardado(ppto.id, ppto.nombre_presupuesto)}
                          disabled={cargandoPresupuesto}
                          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:bg-gray-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setMostrarListado(false)}
                className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
