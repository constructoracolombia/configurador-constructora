"use client";

import {
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent as ReactSyntheticEvent,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Calculator,
  Users,
  FileSpreadsheet,
  BarChart3,
  Target,
  ArrowRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";
import CalendarioAnual from "@/components/CalendarioAnual";
import GraficaSeguimiento from "@/components/GraficaSeguimiento";
import { ContratoModal } from "@/components/ContratoModal";

type Lead = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  etapa: string;
  presupuesto_estimado: number | null;
  tipo_proyecto: string | null;
  nombre_proyecto: string | null;
  origen: string | null;
  fecha_contacto: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  observaciones: string | null;
  responsable: string | null;
  prioridad: string | null;
  es_caliente: boolean | null;
  proximo_paso?: string | null;
  proximo_paso_fecha_limite?: string | null;
  proximo_paso_completado?: boolean | null;
  proximo_paso_completado_fecha?: string | null;
  fecha_entrega_apartamento?: string | null;
};

type EtapaVisual = {
  nombre: string;
  key: string;
  color: string;
  dias: string;
  permiteCrear: boolean;
};

type EtapaConDatos = EtapaVisual & {
  cantidad: number;
  leads: Lead[];
};

type NuevoLeadForm = {
  fecha_contacto: string;
  origen: string;
  nombre: string;
  telefono: string;
  email: string;
  tipo_proyecto: string;
  nombre_proyecto: string;
  presupuesto_estimado: string;
  observaciones: string;
  responsable: string;
};

type EditarLeadForm = {
  id: string;
  etapa: string;
  fecha_contacto: string;
  origen: string;
  nombre: string;
  telefono: string;
  email: string;
  tipo_proyecto: string;
  nombre_proyecto: string;
  presupuesto_estimado: string;
  observaciones: string;
  responsable: string;
  es_caliente: boolean;
  prioridad: string;
  proximo_paso: string | null;
  proximo_paso_fecha_limite: string | null;
  proximo_paso_completado: boolean;
  fecha_entrega_apartamento: string;
};

type Kpis = {
  total_leads: number;
  en_prospeccion: number;
  en_negociacion: number;
  cerrados: number;
  perdidos: number;
  conversion: number;
  tasa_cierre: number;
  pipeline_total: number;
};

function renderDescripcion(texto: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const partes = texto.split(urlRegex);
  return partes.map((parte, i) =>
    urlRegex.test(parte) ? (
      <a key={i} href={parte} target="_blank" rel="noopener noreferrer"
        style={{ color: "#2563eb", textDecoration: "underline" }}>
        📎 Ver presupuesto PDF
      </a>
    ) : (
      <span key={i}>{parte}</span>
    )
  );
}

/** Alinea valores de etapa en BD con las claves del Kanban (6 columnas). */
const normalizarEtapa = (etapa: string) => {
  const valor = (etapa || "").toUpperCase();
  if (valor === "REUNION") return "PRESENTACION";
  if (valor === "COTIZACION_ENVIADA") return "COTIZACION";
  return valor;
};

const ETAPAS_VISUALES: EtapaVisual[] = [
  {
    nombre: "Prospección",
    key: "PROSPECCION",
    color: "blue",
    dias: "1-3",
    permiteCrear: true,
  },
  {
    nombre: "Primer Contacto",
    key: "PRIMER_CONTACTO",
    color: "purple",
    dias: "3-7",
    permiteCrear: false,
  },
  {
    nombre: "Reunión Virtual/Presencial",
    key: "PRESENTACION",
    color: "orange",
    dias: "10-14",
    permiteCrear: false,
  },
  {
    nombre: "Cotización Enviada",
    key: "COTIZACION",
    color: "yellow",
    dias: "7-10",
    permiteCrear: false,
  },
  {
    nombre: "Negociación",
    key: "NEGOCIACION",
    color: "teal",
    dias: "14-21",
    permiteCrear: false,
  },
  {
    nombre: "Cierre",
    key: "CIERRE",
    color: "green",
    dias: "21-30",
    permiteCrear: false,
  },
];

const crearFormularioVacio = (): NuevoLeadForm => ({
  fecha_contacto: new Date().toISOString().split("T")[0],
  origen: "PAUTA_META",
  nombre: "",
  telefono: "",
  email: "",
  tipo_proyecto: "VIS",
  nombre_proyecto: "",
  presupuesto_estimado: "",
  observaciones: "",
  responsable: "Jeisson",
});

function CentroOperacionesDashboard() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  // Estados para modal de nuevo lead
  const [mostrarModalLead, setMostrarModalLead] = useState(false);
  const [etapaSeleccionada, setEtapaSeleccionada] = useState("PROSPECCION");
  const [guardandoLead, setGuardandoLead] = useState(false);
  const [nuevoLead, setNuevoLead] = useState<NuevoLeadForm>(
    crearFormularioVacio()
  );
  // Estados para edición de lead
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [leadEditando, setLeadEditando] = useState<EditarLeadForm | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  type VersionResumen = { id: string; version_num: number; estado: string; total_final: number; created_at: string; token_publico: string | null; veces_visto: number; visto_primera_vez: string | null };
  const [versionesLeadEdit, setVersionesLeadEdit] = useState<VersionResumen[]>([]);
  const [copiandoToken, setCopiandoToken] = useState<number | null>(null);
  const [cargandoPresupuestosLeadEdit, setCargandoPresupuestosLeadEdit] = useState(false);

  const [mostrarContratoModal, setMostrarContratoModal] = useState(false);
  const [contratoPresupuestoId, setContratoPresupuestoId] = useState<string | null>(null);

  const [mostrarModalProximoPaso, setMostrarModalProximoPaso] = useState(false);
  const [leadProximoPaso, setLeadProximoPaso] = useState<Lead | null>(null);
  const [editandoProximoPaso, setEditandoProximoPaso] = useState({
    texto: "",
    fecha_limite: "",
  });

  // Estados para modal de observaciones con fecha
  const [mostrarModalObservaciones, setMostrarModalObservaciones] = useState(false);
  const [leadParaObservacion, setLeadParaObservacion] = useState<any>(null);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [fechaObservacion, setFechaObservacion] = useState('');
  const [horaObservacion, setHoraObservacion] = useState('');
  const [guardandoObservacion, setGuardandoObservacion] = useState(false);

  const [kpis, setKpis] = useState<Kpis>({
    total_leads: 0,
    en_prospeccion: 0,
    en_negociacion: 0,
    cerrados: 0,
    perdidos: 0,
    conversion: 0,
    tasa_cierre: 0,
    pipeline_total: 0,
  });

  const [leadsPorEtapa, setLeadsPorEtapa] = useState<EtapaConDatos[]>(
    ETAPAS_VISUALES.map((etapa) => ({
      ...etapa,
      cantidad: 0,
      leads: [],
    }))
  );
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [calendarioRefresh, setCalendarioRefresh] = useState(0);

  useEffect(() => {
    void cargarDatos();
  }, []);

  // Atajo: Ctrl/Cmd+K enfoca búsqueda, Esc limpia.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>('input[type="text"][placeholder*="Buscar"]')
          ?.focus();
      }

      if (e.key === "Escape" && busqueda) {
        setBusqueda("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busqueda]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      console.log("🔄 Cargando datos del dashboard...");

      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (leadsError) {
        console.error("❌ Error cargando leads:", leadsError);
        alert(
          `Error de Supabase: ${leadsError.message}\nCódigo: ${leadsError.code ?? "—"}`
        );
        throw leadsError;
      }

      console.log("✅ Leads cargados (raw):", leadsData?.length || 0);

      const leadsNormalizados = ((leadsData || []) as Lead[]).map((lead) => ({
        ...lead,
        presupuesto_estimado: lead.presupuesto_estimado ?? 0,
      }));

      setLeads(leadsNormalizados);

      const leadsEnFlujoPrincipal = leadsNormalizados.filter(
        (l) => !["PERDIDO", "DESCALIFICADO"].includes(normalizarEtapa(l.etapa))
      );

      const etapasConDatos = ETAPAS_VISUALES.map((etapa) => {
        const leadsEtapa = leadsEnFlujoPrincipal.filter(
          (l) => normalizarEtapa(l.etapa) === etapa.key
        );
        return {
          ...etapa,
          cantidad: leadsEtapa.length,
          leads: leadsEtapa,
        };
      });

      console.log(
        "📊 Leads por etapa:",
        etapasConDatos.map((e) => `${e.nombre}: ${e.cantidad}`)
      );
      setLeadsPorEtapa(etapasConDatos);

      const totalLeads = leadsNormalizados.length;
      const enProspeccion = leadsEnFlujoPrincipal.filter(
        (l) => normalizarEtapa(l.etapa) === "PROSPECCION"
      ).length;
      const enNegociacion = leadsEnFlujoPrincipal.filter(
        (l) => normalizarEtapa(l.etapa) === "NEGOCIACION"
      ).length;
      const cerrados = leadsNormalizados.filter(
        (l) => normalizarEtapa(l.etapa) === "CIERRE"
      ).length;
      const perdidos = leadsNormalizados.filter((l) =>
        ["PERDIDO", "DESCALIFICADO"].includes(normalizarEtapa(l.etapa))
      ).length;

      const leadsFinalizados = cerrados + perdidos;
      const tasaCierre =
        leadsFinalizados > 0 ? (cerrados / leadsFinalizados) * 100 : 0;

      const conversionPromedio =
        totalLeads > 0 ? (cerrados / totalLeads) * 100 : 0;
      const pipelineTotal = leadsNormalizados
        .filter((l) =>
          !["PERDIDO", "DESCALIFICADO", "ELIMINADO"].includes(
            normalizarEtapa(l.etapa)
          )
        )
        .reduce((sum, l) => sum + (l.presupuesto_estimado || 0), 0);

      setKpis({
        total_leads: totalLeads,
        en_prospeccion: enProspeccion,
        en_negociacion: enNegociacion,
        cerrados,
        perdidos,
        conversion: conversionPromedio,
        tasa_cierre: tasaCierre,
        pipeline_total: pipelineTotal,
      });

      console.log("✅ Dashboard cargado correctamente");
      setCalendarioRefresh((n) => n + 1);
    } catch (error: unknown) {
      console.error("❌ Error completo en cargarDatos:", error);
      const err = error as { message?: string; stack?: string };
      console.error("Stack trace:", err?.stack);
      const msg =
        err?.message ??
        (typeof error === "object" && error !== null && "toString" in error
          ? String((error as { toString(): string }).toString())
          : String(error));
      alert(
        `Error cargando datos del dashboard:\n\n${msg}\n\nRevisa la consola para más detalles.`
      );
    } finally {
      setCargando(false);
    }
  };

  const resetFormulario = () => {
    setNuevoLead(crearFormularioVacio());
  };

  const abrirModalLead = (_etapa: string) => {
    // El flujo manual inicia siempre desde Prospección
    setEtapaSeleccionada("PROSPECCION");
    resetFormulario();
    setMostrarModalLead(true);
  };

  const guardarNuevoLead = async () => {
    if (!nuevoLead.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    if (!nuevoLead.telefono.trim()) {
      alert("El teléfono es obligatorio");
      return;
    }

    setGuardandoLead(true);
    try {
      const probabilidades: Record<string, number> = {
        PROSPECCION: 10,
        PRIMER_CONTACTO: 25,
        PRESENTACION: 50,
        COTIZACION: 40,
        NEGOCIACION: 75,
        CIERRE: 95,
      };

      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          nombre: nuevoLead.nombre,
          telefono: nuevoLead.telefono,
          email: nuevoLead.email || null,
          fecha_contacto: nuevoLead.fecha_contacto,
          origen: nuevoLead.origen,
          tipo_proyecto: nuevoLead.tipo_proyecto,
          nombre_proyecto: nuevoLead.nombre_proyecto || null,
          presupuesto_estimado: nuevoLead.presupuesto_estimado
            ? Number.parseFloat(nuevoLead.presupuesto_estimado)
            : null,
          observaciones: nuevoLead.observaciones || null,
          etapa: "PROSPECCION",
          probabilidad: probabilidades["PROSPECCION"] || 10,
          fuente:
            nuevoLead.origen === "WEB"
              ? "WEB"
              : nuevoLead.origen === "WHATSAPP"
                ? "WHATSAPP"
                : "OTRO",
          responsable: nuevoLead.responsable,
        })
        .select("id")
        .single();

      if (leadError) throw leadError;

      await supabase.from("lead_actividades").insert({
        lead_id: lead.id,
        tipo: "NOTA",
        descripcion: "Lead creado manualmente en etapa PROSPECCION",
        usuario: "Admin",
      });

      alert("✅ Lead creado exitosamente");
      setMostrarModalLead(false);
      resetFormulario();
      await cargarDatos();
    } catch (error) {
      console.error("Error guardando lead:", error);
      alert("❌ Error al crear lead");
    } finally {
      setGuardandoLead(false);
    }
  };

  const abrirModalEditar = (lead: Lead) => {
    console.log("📝 Abriendo modal para lead:", lead);

    setLeadEditando({
      id: lead.id,
      etapa: lead.etapa || "",
      fecha_contacto: lead.fecha_contacto || new Date().toISOString().split("T")[0],
      origen: lead.origen || "PAUTA_META",
      nombre: lead.nombre || "",
      telefono: lead.telefono || "",
      email: lead.email || "",
      tipo_proyecto: lead.tipo_proyecto || "VIS",
      nombre_proyecto: lead.nombre_proyecto || "",
      presupuesto_estimado: lead.presupuesto_estimado
        ? String(lead.presupuesto_estimado)
        : "",
      observaciones: lead.observaciones || "",
      responsable: lead.responsable || "Jeisson",
      es_caliente: lead.es_caliente === true,
      prioridad: lead.prioridad || "MEDIA",
      proximo_paso: lead.proximo_paso ?? null,
      proximo_paso_fecha_limite: lead.proximo_paso_fecha_limite ?? null,
      proximo_paso_completado: lead.proximo_paso_completado === true,
      fecha_entrega_apartamento: lead.fecha_entrega_apartamento
        ? String(lead.fecha_entrega_apartamento).slice(0, 10)
        : "",
    });
    setMostrarModalEditar(true);
  };

  const abrirModalProximoPaso = (lead: Lead, e?: ReactSyntheticEvent) => {
    e?.stopPropagation();
    setLeadProximoPaso(lead);
    setEditandoProximoPaso({
      texto: lead.proximo_paso || "",
      fecha_limite: lead.proximo_paso_fecha_limite
        ? String(lead.proximo_paso_fecha_limite).slice(0, 10)
        : "",
    });
    setMostrarModalProximoPaso(true);
  };

  const guardarProximoPaso = async () => {
    if (!leadProximoPaso) return;
    if (!editandoProximoPaso.texto.trim()) {
      alert("Escribe el próximo paso");
      return;
    }

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          proximo_paso: editandoProximoPaso.texto.trim(),
          proximo_paso_fecha_limite: editandoProximoPaso.fecha_limite || null,
          proximo_paso_completado: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadProximoPaso.id);

      if (error) throw error;

      await supabase.from("lead_actividades").insert({
        lead_id: leadProximoPaso.id,
        tipo: "NOTA",
        descripcion: `Próximo paso: ${editandoProximoPaso.texto.trim()}`,
        usuario: "Admin",
      });

      setMostrarModalProximoPaso(false);
      setLeadProximoPaso(null);
      await cargarDatos();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const toggleProximoPasoCompletado = async (
    lead: Lead,
    e: ReactSyntheticEvent
  ) => {
    e.stopPropagation();

    if (!lead.proximo_paso) {
      abrirModalProximoPaso(lead);
      return;
    }

    try {
      const nuevoEstado = !lead.proximo_paso_completado;

      const { error } = await supabase
        .from("leads")
        .update({
          proximo_paso_completado: nuevoEstado,
          proximo_paso_completado_fecha: nuevoEstado
            ? new Date().toISOString()
            : null,
        })
        .eq("id", lead.id);

      if (error) throw error;

      await supabase.from("lead_actividades").insert({
        lead_id: lead.id,
        tipo: "NOTA",
        descripcion: nuevoEstado
          ? `✅ Completado: ${lead.proximo_paso}`
          : `⏳ Reabierto: ${lead.proximo_paso}`,
        usuario: "Admin",
      });

      await cargarDatos();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const eliminarProximoPaso = async (lead: Lead) => {
    if (!confirm("¿Eliminar el próximo paso?")) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          proximo_paso: null,
          proximo_paso_completado: false,
          proximo_paso_fecha_limite: null,
          proximo_paso_completado_fecha: null,
        })
        .eq("id", lead.id);

      if (error) throw error;

      setMostrarModalProximoPaso(false);
      setLeadProximoPaso(null);
      await cargarDatos();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Consulta versiones de presupuesto al abrir el modal de edición
  useEffect(() => {
    if (!leadEditando) { setVersionesLeadEdit([]); return; }
    setCargandoPresupuestosLeadEdit(true);
    void (async () => {
      const { data } = await supabase
        .from('presupuestos')
        .select('id, version_num, estado, total_final, created_at, token_publico, veces_visto, visto_primera_vez')
        .eq('lead_id', leadEditando.id)
        .order('version_num', { ascending: false });
      setVersionesLeadEdit((data || []) as VersionResumen[]);
      setCargandoPresupuestosLeadEdit(false);
    })();
  }, [leadEditando?.id]);

  const guardarEdicionLead = async () => {
    if (!leadEditando) return;

    if (!leadEditando.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    if (!leadEditando.telefono.trim()) {
      alert("El teléfono es obligatorio");
      return;
    }

    setGuardandoEdicion(true);

    try {
      console.log("💾 Guardando lead:", leadEditando);

      const datosActualizar = {
        nombre: leadEditando.nombre.trim(),
        telefono: leadEditando.telefono.trim(),
        email: leadEditando.email?.trim() || null,
        fecha_contacto: leadEditando.fecha_contacto,
        origen: leadEditando.origen,
        tipo_proyecto: leadEditando.tipo_proyecto,
        nombre_proyecto: leadEditando.nombre_proyecto?.trim() || null,
        presupuesto_estimado: leadEditando.presupuesto_estimado
          ? Number.parseFloat(leadEditando.presupuesto_estimado.toString())
          : null,
        observaciones: leadEditando.observaciones?.trim() || null,
        responsable: leadEditando.responsable,
        es_caliente: leadEditando.es_caliente === true,
        prioridad: leadEditando.prioridad,
        fecha_entrega_apartamento: leadEditando.fecha_entrega_apartamento.trim()
          ? leadEditando.fecha_entrega_apartamento.trim()
          : null,
        updated_at: new Date().toISOString(),
      };

      console.log("📝 Datos a actualizar:", datosActualizar);

      const { data, error } = await supabase
        .from("leads")
        .update(datosActualizar)
        .eq("id", leadEditando.id)
        .select();

      if (error) {
        console.error("❌ Error de Supabase:", error);
        throw new Error(`Error de Supabase: ${error.message} (${error.code})`);
      }

      console.log("✅ Lead actualizado:", data);

      const { error: actividadError } = await supabase
        .from("lead_actividades")
        .insert({
          lead_id: leadEditando.id,
          tipo: "NOTA",
          descripcion: leadEditando.es_caliente
            ? "Lead actualizado y marcado como caliente 🔥"
            : "Lead actualizado",
          usuario: "Admin",
        });

      if (actividadError) {
        console.warn("⚠️ Error registrando actividad:", actividadError);
      }

      alert("✅ Lead actualizado exitosamente");
      setMostrarModalEditar(false);
      setLeadEditando(null);
      await cargarDatos();
    } catch (error: any) {
      console.error("❌ Error completo:", error);
      alert(`❌ Error al actualizar lead: ${error.message || "Error desconocido"}`);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const toggleLeadCaliente = async (_lead: Lead, e: ReactMouseEvent) => {
    e.stopPropagation();

    alert("⚠️ Funcionalidad de Lead Caliente temporalmente deshabilitada");
    return;

    // TODO: Habilitar cuando la columna es_caliente exista en Supabase
  };

  const eliminarLead = async (lead: any, e: ReactMouseEvent) => {
    e.stopPropagation();

    const confirmacion = confirm(
      `⚠️ ¿Estás seguro de eliminar este lead?\n\n` +
        `Nombre: ${lead.nombre}\n` +
        `Teléfono: ${lead.telefono}\n` +
        `Proyecto: ${lead.nombre_proyecto || "Sin proyecto"}\n` +
        `Presupuesto: ${
          lead.presupuesto_estimado ? formatoPrecio(lead.presupuesto_estimado) : "Sin presupuesto"
        }\n\n` +
        `El lead se archivará y podrá recuperarse si es necesario.`
    );

    if (!confirmacion) {
      return;
    }

    try {
      console.log("🗑️ Archivando lead:", lead.id);

      await supabase.from("lead_actividades").insert({
        lead_id: lead.id,
        tipo: "NOTA",
        descripcion: `Lead archivado: ${lead.nombre} - ${lead.telefono}`,
        usuario: "Admin",
      });

      const { error } = await supabase
        .from("leads")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (error) {
        console.error("Error de Supabase:", error);
        throw new Error(`Error de Supabase: ${error.message}`);
      }

      alert(`✅ Lead "${lead.nombre}" eliminado exitosamente`);
      await cargarDatos();
    } catch (error: any) {
      console.error("❌ Error completo:", error);
      alert(`❌ Error al eliminar: ${error.message}`);
    }
  };

  const enviarANoCerrados = async (lead: Lead, e: ReactMouseEvent) => {
    e.stopPropagation();

    const confirmacion = confirm(
      `¿Marcar este lead como No Cerrado?\n\n` +
        `Lead: ${lead.nombre}\n` +
        `Proyecto: ${lead.nombre_proyecto || "Sin proyecto"}\n\n` +
        `El lead se archivará pero podrás verlo en "Ver No Cerrados".`
    );

    if (!confirmacion) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          etapa: "PERDIDO",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (error) throw error;

      await supabase.from("lead_actividades").insert({
        lead_id: lead.id,
        tipo: "CAMBIO_ETAPA",
        descripcion: "Lead marcado como No Cerrado",
        usuario: "Admin",
      });

      await cargarDatos();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const getColorClasses = (color: string) => {
    const colores: Record<string, string> = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      teal: "bg-teal-50 border-teal-200 text-teal-700",
      green: "bg-green-50 border-green-200 text-green-700",
      red: "bg-red-50 border-red-200 text-red-700",
    };
    return colores[color] || colores.blue;
  };

  const filtrarLeads = (leadsEtapa: Lead[]) => {
    if (!busqueda.trim()) {
      return leadsEtapa;
    }

    const termino = busqueda.toLowerCase().trim();
    return leadsEtapa.filter((lead) => {
      if (lead.nombre?.toLowerCase().includes(termino)) return true;

      const telefonoLimpio = lead.telefono?.replace(/[\s-]/g, "");
      const terminoLimpio = termino.replace(/[\s-]/g, "");
      if (telefonoLimpio?.includes(terminoLimpio)) return true;

      if (lead.email?.toLowerCase().includes(termino)) return true;
      if (lead.nombre_proyecto?.toLowerCase().includes(termino)) return true;
      if (lead.tipo_proyecto?.toLowerCase().includes(termino)) return true;
      if (lead.utm_campaign?.toLowerCase().includes(termino)) return true;
      if (lead.utm_content?.toLowerCase().includes(termino)) return true;
      if (lead.responsable?.toLowerCase().includes(termino)) return true;
      if (lead.observaciones?.toLowerCase().includes(termino)) return true;

      return false;
    });
  };

  const resaltarTexto = (texto: string, terminoBusqueda: string) => {
    if (!terminoBusqueda.trim() || !texto) return texto;

    try {
      const term = terminoBusqueda.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      const partes = texto.split(regex);

      return partes.map((parte, i) =>
        parte.toLowerCase() === term.toLowerCase() ? (
          <mark
            key={i}
            className="rounded bg-yellow-200 px-0.5 font-semibold text-gray-900"
          >
            {parte}
          </mark>
        ) : (
          parte
        )
      );
    } catch {
      return texto;
    }
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const etapaAnterior = source.droppableId;
    const etapaNueva = destination.droppableId;
    const leadId = draggableId;

    if (etapaNueva === "CIERRE") {
      const nombreEtapa = leadsPorEtapa.find((e) => e.key === etapaNueva)?.nombre;
      const confirmacion = confirm(
        `¿Confirmas mover este lead a ${nombreEtapa || etapaNueva}?`
      );

      if (!confirmacion) {
        return;
      }
    }

    console.log(`Moviendo lead ${leadId} de ${etapaAnterior} a ${etapaNueva}`);

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          etapa: etapaNueva,
          ultima_interaccion: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) {
        console.error("Error actualizando lead:", error);
        alert("❌ Error al mover el lead");
        return;
      }

      await supabase.from("lead_actividades").insert({
        lead_id: leadId,
        tipo: "CAMBIO_ETAPA",
        descripcion: `Lead movido de ${etapaAnterior} a ${etapaNueva}`,
        usuario: "Admin",
      });

      await cargarDatos();

      const nombreEtapa = leadsPorEtapa.find((e) => e.key === etapaNueva)?.nombre;
      console.log(`✅ Lead movido a ${nombreEtapa || etapaNueva}`);
    } catch (error) {
      console.error("Error en drag & drop:", error);
      alert("❌ Error al mover el lead");
    }
  };

  const abrirModalObservaciones = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadParaObservacion(lead);
    setNuevaObservacion('');
    const ahora = new Date();
    setFechaObservacion(ahora.toISOString().split('T')[0]);
    setHoraObservacion(ahora.toTimeString().slice(0, 5));
    setMostrarModalObservaciones(true);
  };

  const guardarObservacion = async () => {
    if (!leadParaObservacion || !nuevaObservacion.trim() || !fechaObservacion || !horaObservacion) {
      alert('Por favor completa todos los campos');
      return;
    }
    setGuardandoObservacion(true);
    try {
      const fechaTimestamp = new Date(`${fechaObservacion}T${horaObservacion}:00`).toISOString();

      const { data: leadActual } = await supabase
        .from('leads')
        .select('historial_seguimiento, observaciones')
        .eq('id', leadParaObservacion.id)
        .single();

      const historialActual = leadActual?.historial_seguimiento || [];
      const nuevaEntrada = {
        fecha: fechaTimestamp,
        observacion: nuevaObservacion.trim(),
        usuario: 'Admin',
        timestamp_registro: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('leads')
        .update({
          historial_seguimiento: [...historialActual, nuevaEntrada],
          ultima_actividad_fecha: fechaTimestamp,
          observaciones:
            (leadActual?.observaciones || '') +
            `\n\n[${new Date(fechaTimestamp).toLocaleString('es-CO')}]\n${nuevaObservacion.trim()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadParaObservacion.id);

      if (error) throw error;

      await supabase.from('lead_actividades').insert({
        lead_id: leadParaObservacion.id,
        tipo: 'NOTA',
        descripcion: `Seguimiento registrado: ${nuevaObservacion.substring(0, 100)}`,
        usuario: 'Admin',
      });

      alert('✅ Observación guardada correctamente');
      setMostrarModalObservaciones(false);
      await cargarDatos();
    } catch (error: any) {
      console.error('Error guardando observación:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setGuardandoObservacion(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Centro de Operaciones
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString("es-CO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => void cargarDatos()}
                variant="ghost"
                className="text-gray-600"
                disabled={cargando}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${cargando ? "animate-spin" : ""}`}
                />
                {cargando ? "Actualizando..." : "Actualizar"}
              </Button>
              <Button
                onClick={() => void supabase.auth.signOut().then(() => router.push("/login"))}
                variant="ghost"
                className="text-gray-600"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-blue-900">Debug Dashboard</div>
              <div className="text-sm text-blue-700">
                Leads en estado: {leads.length} | Por etapa:{" "}
                {leadsPorEtapa.map((e) => e.cantidad).join(", ")}
              </div>
            </div>
            <button
              onClick={() => {
                console.log("📊 Estado actual:", { leads, leadsPorEtapa, kpis });
                void cargarDatos();
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              🔄 Recargar Datos
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {kpis.total_leads}
                  </div>
                  <div className="text-sm text-gray-600">Leads Totales</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Leads activos en base
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {kpis.en_negociacion}
                  </div>
                  <div className="text-sm text-gray-600">En Negociación</div>
                  <div className="mt-1 text-xs text-gray-500">
                    En etapa de negociación
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {kpis.cerrados}
                  </div>
                  <div className="text-sm text-gray-600">Cerrados</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {kpis.conversion.toFixed(1)}% del total de leads
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold leading-tight text-gray-900">
                    {formatoPrecio(kpis.pipeline_total)}
                  </div>
                  <div className="text-sm text-gray-600">Pipeline Total</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Suma presupuestos (sin perdidos)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI: Tasa de Cierre */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-100">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {kpis.tasa_cierre?.toFixed(1) ?? 0}%
                  </div>
                  <div className="text-sm text-gray-600">Tasa de Cierre</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {kpis.cerrados || 0} cerrados de{" "}
                    {(kpis.cerrados || 0) + (kpis.perdidos || 0)} finalizados
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          <Card
            className="group cursor-pointer border-0 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => router.push("/presupuestos")}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Calculator className="h-7 w-7 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Cotizador Automático
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Genera presupuestos personalizados al instante
              </p>
              <div className="text-xs text-gray-500">
                Configurador web de proyectos
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-0 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => router.push("/presupuesto-manual")}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <FileSpreadsheet className="h-7 w-7 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-emerald-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Presupuesto Manual</h3>
              <p className="mb-4 text-sm text-gray-600">Arma presupuestos desde el catálogo de precios</p>
              <div className="text-xs text-gray-500">Selección de ítems + PDF profesional</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 text-right">
          <a
            href="/admin/exportar-leads"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Exportar audiencia Meta Ads →
          </a>
        </div>

        {/* Buscador de Leads */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-lg text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, teléfono, email, proyecto, campaña... (Ctrl+K)"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                )}
              </div>

              {busqueda && (
                <div className="whitespace-nowrap text-sm text-gray-600">
                  {(() => {
                    const totalFiltrados = leadsPorEtapa.reduce(
                      (sum, etapa) => sum + filtrarLeads(etapa.leads).length,
                      0
                    );
                    return (
                      <span>
                        <span className="font-semibold text-blue-600">{totalFiltrados}</span> de{" "}
                        <span className="font-semibold">{leads.length}</span> leads
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            {!busqueda && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="text-gray-400">💡 Busca por:</span>
                <span className="rounded bg-gray-100 px-2 py-1">Nombre</span>
                <span className="rounded bg-gray-100 px-2 py-1">Teléfono</span>
                <span className="rounded bg-gray-100 px-2 py-1">Email</span>
                <span className="rounded bg-gray-100 px-2 py-1">Proyecto</span>
                <span className="rounded bg-gray-100 px-2 py-1">Campaña</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección To-Do - Tareas Pendientes */}
        {(() => {
          const tareasPendientes = leads.filter(
            (l) =>
              l.proximo_paso &&
              !l.proximo_paso_completado &&
              !["PERDIDO", "DESCALIFICADO"].includes(normalizarEtapa(l.etapa))
          );

          const tareasVencidas = tareasPendientes.filter((l) => {
            if (!l.proximo_paso_fecha_limite) return false;
            return new Date(l.proximo_paso_fecha_limite) < new Date();
          });

          const tareasHoy = tareasPendientes.filter((l) => {
            if (!l.proximo_paso_fecha_limite) return false;
            const hoy = new Date().toISOString().split("T")[0];
            return l.proximo_paso_fecha_limite === hoy;
          });

          const tareasProximas = tareasPendientes.filter((l) => {
            if (!l.proximo_paso_fecha_limite) return false;
            const fecha = new Date(l.proximo_paso_fecha_limite);
            const hoy = new Date();
            const enTresDias = new Date();
            enTresDias.setDate(enTresDias.getDate() + 3);
            return fecha > hoy && fecha <= enTresDias;
          });

          if (tareasPendientes.length === 0) return null;

          return (
            <Card className="mb-4 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <CardTitle className="text-lg">To-Do: Próximos Pasos</CardTitle>
                      <p className="mt-1 text-sm text-gray-600">
                        {tareasPendientes.length} tarea(s) pendiente(s)
                        {tareasVencidas.length > 0 && (
                          <span className="ml-2 font-semibold text-red-600">
                            · {tareasVencidas.length} vencida(s)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {tareasVencidas.length > 0 && (
                      <div className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        🚨 {tareasVencidas.length} vencidas
                      </div>
                    )}
                    {tareasHoy.length > 0 && (
                      <div className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        ⏰ {tareasHoy.length} hoy
                      </div>
                    )}
                    {tareasProximas.length > 0 && (
                      <div className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        📅 {tareasProximas.length} próximas
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {tareasVencidas.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold text-red-600">
                        🚨 VENCIDAS
                      </div>
                      {tareasVencidas.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border-l-4 border-red-500 bg-red-50 p-3 transition-colors hover:bg-red-100"
                          onClick={() => abrirModalEditar(lead)}
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={(e) => {
                              e.stopPropagation();
                              void toggleProximoPasoCompletado(lead, e);
                            }}
                            className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {lead.nombre}
                              </span>
                              {lead.tipo_proyecto && (
                                <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                  {lead.tipo_proyecto}
                                </span>
                              )}
                              <span className="rounded bg-red-200 px-2 py-0.5 text-xs font-semibold text-red-800">
                                Vencida{" "}
                                {Math.abs(
                                  Math.floor(
                                    (new Date().getTime() -
                                      new Date(
                                        lead.proximo_paso_fecha_limite!
                                      ).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                )}{" "}
                                día(s)
                              </span>
                            </div>
                            {lead.nombre_proyecto && (
                              <div className="mb-1 text-xs text-gray-600">
                                📍 {lead.nombre_proyecto}
                              </div>
                            )}
                            <div className="text-sm text-gray-700">
                              {lead.proximo_paso}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {tareasHoy.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold text-orange-600">
                        ⏰ HOY
                      </div>
                      {tareasHoy.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border-l-4 border-orange-500 bg-orange-50 p-3 transition-colors hover:bg-orange-100"
                          onClick={() => abrirModalEditar(lead)}
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={(e) => {
                              e.stopPropagation();
                              void toggleProximoPasoCompletado(lead, e);
                            }}
                            className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {lead.nombre}
                              </span>
                              {lead.tipo_proyecto && (
                                <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                  {lead.tipo_proyecto}
                                </span>
                              )}
                              <span className="rounded bg-orange-200 px-2 py-0.5 text-xs font-semibold text-orange-800">
                                Hoy
                              </span>
                            </div>
                            {lead.nombre_proyecto && (
                              <div className="mb-1 text-xs text-gray-600">
                                📍 {lead.nombre_proyecto}
                              </div>
                            )}
                            <div className="text-sm text-gray-700">
                              {lead.proximo_paso}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {tareasPendientes
                    .filter(
                      (l) =>
                        !tareasVencidas.includes(l) && !tareasHoy.includes(l)
                    )
                    .sort((a, b) => {
                      if (!a.proximo_paso_fecha_limite) return 1;
                      if (!b.proximo_paso_fecha_limite) return -1;
                      return (
                        new Date(a.proximo_paso_fecha_limite).getTime() -
                        new Date(b.proximo_paso_fecha_limite).getTime()
                      );
                    })
                    .map((lead) => {
                      const esProxima = tareasProximas.includes(lead);
                      return (
                        <div
                          key={lead.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-100 ${
                            esProxima
                              ? "border-l-4 border-blue-500 bg-blue-50"
                              : "border-l-4 border-gray-300 bg-gray-50"
                          }`}
                          onClick={() => abrirModalEditar(lead)}
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={(e) => {
                              e.stopPropagation();
                              void toggleProximoPasoCompletado(lead, e);
                            }}
                            className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {lead.nombre}
                              </span>
                              {lead.tipo_proyecto && (
                                <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                  {lead.tipo_proyecto}
                                </span>
                              )}
                              {lead.proximo_paso_fecha_limite && (
                                <span
                                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                    esProxima
                                      ? "bg-blue-200 text-blue-800"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {new Date(
                                    lead.proximo_paso_fecha_limite
                                  ).toLocaleDateString("es-CO")}
                                </span>
                              )}
                            </div>
                            {lead.nombre_proyecto && (
                              <div className="mb-1 text-xs text-gray-600">
                                📍 {lead.nombre_proyecto}
                              </div>
                            )}
                            <div className="text-sm text-gray-700">
                              {lead.proximo_paso}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Flujo Comercial - Drag & Drop Kanban */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Flujo Comercial</h2>
                <div className="mt-1 text-xs text-gray-500">
                  💡 Arrastra las tarjetas para mover leads entre etapas
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/no-cerrados")}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-red-700 transition-colors hover:bg-red-100"
              >
                <span className="text-lg">📁</span>
                <div className="text-left">
                  <div className="text-sm font-semibold">Ver No Cerrados</div>
                  <div className="text-xs text-red-600">
                    {
                      leads.filter((l) =>
                        ["PERDIDO", "DESCALIFICADO"].includes(
                          normalizarEtapa(l.etapa)
                        )
                      ).length
                    }{" "}
                    archivados
                  </div>
                </div>
              </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {leadsPorEtapa.map((etapa) => {
                  const leadsFiltrados = filtrarLeads(etapa.leads);
                  const cantidadFiltrada = leadsFiltrados.length;
                  return (
                  <Droppable key={etapa.key} droppableId={etapa.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] rounded-xl border-2 p-4 transition-colors ${
                          snapshot.isDraggingOver
                            ? "border-blue-500 bg-blue-50"
                            : getColorClasses(etapa.color)
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold">
                              {cantidadFiltrada}
                              {busqueda && cantidadFiltrada !== etapa.cantidad && (
                                <span className="ml-1 text-xs font-normal text-gray-500">
                                  de {etapa.cantidad}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-medium">{etapa.nombre}</div>
                          </div>
                          <div className="rounded bg-white/50 px-2 py-1 text-xs">
                            {etapa.dias ? `${etapa.dias} días` : "—"}
                          </div>
                        </div>

                        {/* Botón agregar lead - SOLO en Prospección */}
                        {etapa.permiteCrear && (
                          <button
                            onClick={() => abrirModalLead(etapa.key)}
                            className="mb-3 flex h-9 w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-current bg-white/60 text-xs font-semibold transition-all hover:bg-white/90"
                          >
                            <span className="text-lg">+</span> Nuevo Lead
                          </button>
                        )}

                        <div className="space-y-2">
                          {leadsFiltrados.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => abrirModalEditar(lead)}
                                  className={`group cursor-pointer rounded-lg border-2 bg-white p-3 text-xs transition-all ${
                                    dragSnapshot.isDragging
                                      ? "rotate-2 border-blue-500 shadow-lg"
                                      : lead.es_caliente
                                        ? "border-red-300 bg-red-50 hover:shadow-md"
                                        : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                                  }`}
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                      <span className="cursor-move flex-shrink-0 text-gray-400">⋮⋮</span>
                                      <div className="min-w-0 flex-1 truncate font-bold text-gray-900">
                                        {busqueda
                                          ? resaltarTexto(lead.nombre, busqueda)
                                          : lead.nombre}
                                      </div>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-1">
                                      <button
                                        onClick={(e) => void toggleLeadCaliente(lead, e)}
                                        className={`text-lg transition-all hover:scale-110 ${
                                          lead.es_caliente
                                            ? "animate-pulse"
                                            : "opacity-30 hover:opacity-100"
                                        }`}
                                        title={
                                          lead.es_caliente
                                            ? "Lead caliente - Click para desmarcar"
                                            : "Marcar como lead caliente"
                                        }
                                      >
                                        🔥
                                      </button>
                                      <button
                                        onClick={(e) => void eliminarLead(lead, e)}
                                        className="text-base text-red-500 opacity-0 transition-opacity hover:scale-110 hover:text-red-700 group-hover:opacity-100"
                                        title="Eliminar lead"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>

                                  {lead.prioridad === "ALTA" && (
                                    <div className="mb-2">
                                      <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                                        ⚡ PRIORIDAD ALTA
                                      </span>
                                    </div>
                                  )}

                                  <div className="mb-1 flex items-center gap-1 text-gray-600">
                                    <span className="text-[10px]">📱</span>
                                    {lead.telefono || "Sin teléfono"}
                                  </div>

                                  {lead.email && (
                                    <div className="mb-1 flex items-center gap-1 truncate text-gray-600">
                                      <span className="text-[10px]">📧</span>
                                      {lead.email}
                                    </div>
                                  )}

                                  {lead.tipo_proyecto && (
                                    <div className="mb-1 text-[10px] text-gray-500">
                                      🏗️ {lead.tipo_proyecto}
                                    </div>
                                  )}

                                  {lead.nombre_proyecto && (
                                    <div className="mb-1 truncate text-[10px] text-gray-500">
                                      📍 {lead.nombre_proyecto}
                                    </div>
                                  )}

                                  {lead.fecha_entrega_apartamento && (
                                    <div className="mt-2 border-t border-gray-200 pt-2">
                                      <div className="flex items-center gap-2 text-xs">
                                        <span>📅</span>
                                        <div>
                                          <div className="text-gray-500">Entrega apartamento</div>
                                          <div className="font-semibold text-gray-900">
                                            {new Date(
                                              lead.fecha_entrega_apartamento + "T12:00:00"
                                            ).toLocaleDateString("es-CO", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {lead.presupuesto_estimado && (
                                    <div className="mb-1 text-[11px] font-semibold text-gray-900">
                                      💰 {formatoPrecio(lead.presupuesto_estimado)}
                                    </div>
                                  )}

                                  {(() => {
                                    const base = (lead as any).ultima_actividad_fecha || lead.fecha_contacto;
                                    if (!base) return null;
                                    const dias = Math.floor(
                                      (new Date().getTime() - new Date(base).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    );
                                    const [colorBg, emoji] =
                                      dias > 14
                                        ? ['bg-red-100 text-red-700', '🚨']
                                        : dias > 7
                                          ? ['bg-orange-100 text-orange-700', '⚠️']
                                          : dias > 3
                                            ? ['bg-yellow-100 text-yellow-700', '⏰']
                                            : ['bg-green-100 text-green-700', '✅'];
                                    return (
                                      <div className={`mb-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${colorBg}`}>
                                        <span>{emoji}</span>
                                        <span>Hace {dias}d</span>
                                      </div>
                                    );
                                  })()}

                                  {lead.responsable && (
                                    <div className="mb-1 text-[10px] text-gray-500">
                                      👤 {lead.responsable}
                                    </div>
                                  )}

                                  {lead.origen && (
                                    <div className="mb-1 inline-block rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-600">
                                      {lead.origen.replace(/_/g, " ")}
                                    </div>
                                  )}

                                  {lead.utm_campaign && (
                                    <div className="mb-1 truncate rounded bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
                                      📢 {lead.utm_campaign}
                                    </div>
                                  )}

                                  {lead.utm_content && (
                                    <div className="truncate text-[10px] text-gray-500">
                                      🎯 {lead.utm_content}
                                    </div>
                                  )}

                                  {lead.observaciones && (
                                    <div className="mt-2 border-l-2 border-gray-300 bg-gray-50 p-2 text-[10px] italic text-gray-500">
                                      {renderDescripcion(lead.observaciones)}
                                    </div>
                                  )}

                                  <button
                                    onClick={(e) => abrirModalObservaciones(lead, e)}
                                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-[10px] font-medium text-purple-700 transition-colors hover:bg-purple-100"
                                  >
                                    <span>📝</span>
                                    Registrar Seguimiento
                                  </button>

                                  {lead.proximo_paso && (
                                    <div className="mt-2 border-t border-gray-200 pt-2">
                                      <div className="flex items-start gap-2">
                                        <input
                                          type="checkbox"
                                          checked={lead.proximo_paso_completado === true}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            void toggleProximoPasoCompletado(lead, e);
                                          }}
                                          className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="mb-0.5 text-[10px] text-gray-500">
                                            Próximo paso:
                                          </div>
                                          <div
                                            className={`text-[11px] ${
                                              lead.proximo_paso_completado
                                                ? "text-gray-400 line-through"
                                                : "font-medium text-gray-700"
                                            }`}
                                          >
                                            {lead.proximo_paso}
                                          </div>
                                          {lead.proximo_paso_fecha_limite &&
                                            !lead.proximo_paso_completado && (
                                              <div
                                                className={`mt-1 text-[10px] ${
                                                  new Date(
                                                    lead.proximo_paso_fecha_limite
                                                  ) < new Date()
                                                    ? "font-semibold text-red-600"
                                                    : new Date(
                                                          lead.proximo_paso_fecha_limite
                                                        )
                                                          .toISOString()
                                                          .split("T")[0] ===
                                                        new Date()
                                                          .toISOString()
                                                          .split("T")[0]
                                                      ? "font-semibold text-orange-600"
                                                      : "text-gray-500"
                                                }`}
                                              >
                                                📅{" "}
                                                {new Date(
                                                  lead.proximo_paso_fecha_limite
                                                ).toLocaleDateString("es-CO")}
                                              </div>
                                            )}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => abrirModalProximoPaso(lead, e)}
                                          className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          ✏️
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {!lead.proximo_paso && (
                                    <button
                                      type="button"
                                      onClick={(e) => abrirModalProximoPaso(lead, e)}
                                      className="mt-2 w-full border-t border-gray-200 pt-2 text-left text-[10px] font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      + Agregar próximo paso
                                    </button>
                                  )}

                                  {normalizarEtapa(lead.etapa) !== "CIERRE" && (
                                    <button
                                      type="button"
                                      onClick={(e) => void enviarANoCerrados(lead, e)}
                                      className="mt-2 w-full border-t border-gray-200 pt-2 text-center text-[10px] text-gray-400 transition-colors hover:text-red-600"
                                    >
                                      ❌ Enviar a No Cerrados
                                    </button>
                                  )}

                                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                                    <span>
                                      {lead.fecha_contacto
                                        ? new Date(lead.fecha_contacto).toLocaleDateString("es-CO")
                                        : "-"}
                                    </span>
                                    <span className="text-gray-300">Click para editar →</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>

                        {etapa.cantidad > 3 && (
                          <div className="mt-2 py-2 text-center text-xs text-gray-600">
                            +{etapa.cantidad - 3} más
                          </div>
                        )}

                        {leadsFiltrados.length === 0 && (
                          <div className="mt-2 rounded-lg bg-white/30 py-6 text-center text-xs text-gray-500">
                            {busqueda ? "Sin resultados" : "Sin leads"}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          </CardContent>
        </Card>

        <div className="mt-8">
          <CalendarioAnual refreshKey={calendarioRefresh} />
        </div>

        {/* Gráfica de Seguimiento */}
        <div className="mt-8">
          <GraficaSeguimiento />
        </div>
      </div>

      {/* Modal de Nuevo Lead */}
      {mostrarModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Nuevo Lead</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Etapa: <span className="font-semibold">Prospección</span>
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModalLead(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-gray-600 transition-colors hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {/* Fecha de contacto */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha de Contacto *
                </label>
                <input
                  type="date"
                  value={nuevoLead.fecha_contacto}
                  onChange={(e) =>
                    setNuevoLead({ ...nuevoLead, fecha_contacto: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Origen */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ¿De dónde viene? *
                </label>
                <select
                  value={nuevoLead.origen}
                  onChange={(e) =>
                    setNuevoLead({ ...nuevoLead, origen: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PAUTA_META">Pauta Meta (Facebook/Instagram)</option>
                  <option value="PAUTA_GOOGLE">Pauta Google Ads</option>
                  <option value="REFERIDO">Referido</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="LLAMADA_DIRECTA">Llamada Directa</option>
                  <option value="WEB">Sitio Web</option>
                  <option value="INSTAGRAM">Instagram Orgánico</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              {/* Datos del cliente */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={nuevoLead.nombre}
                    onChange={(e) =>
                      setNuevoLead({ ...nuevoLead, nombre: e.target.value })
                    }
                    placeholder="Juan Pérez"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={nuevoLead.telefono}
                    onChange={(e) =>
                      setNuevoLead({ ...nuevoLead, telefono: e.target.value })
                    }
                    placeholder="3001234567"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={nuevoLead.email}
                  onChange={(e) =>
                    setNuevoLead({ ...nuevoLead, email: e.target.value })
                  }
                  placeholder="juan@ejemplo.com"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tipo de proyecto */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tipo de Proyecto *
                </label>
                <select
                  value={nuevoLead.tipo_proyecto}
                  onChange={(e) =>
                    setNuevoLead({ ...nuevoLead, tipo_proyecto: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VIS">VIS (Vivienda de Interés Social)</option>
                  <option value="REFORMA">Reforma</option>
                  <option value="DISENO">Diseño</option>
                  <option value="CONSTRUCCION">Construcción</option>
                  <option value="ACABADOS">Acabados</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              {/* Nombre del proyecto */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nombre del Proyecto/Conjunto
                </label>
                <input
                  type="text"
                  value={nuevoLead.nombre_proyecto}
                  onChange={(e) =>
                    setNuevoLead({ ...nuevoLead, nombre_proyecto: e.target.value })
                  }
                  placeholder="Ej: Ciudadela Verde, Parque Oriente..."
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Presupuesto estimado */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Presupuesto Estimado (opcional)
                </label>
                <input
                  type="number"
                  value={nuevoLead.presupuesto_estimado}
                  onChange={(e) =>
                    setNuevoLead({
                      ...nuevoLead,
                      presupuesto_estimado: e.target.value,
                    })
                  }
                  placeholder="25000000"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">En pesos colombianos</p>
              </div>

              {/* Responsable */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Responsable
                </label>
                <select
                  value={nuevoLead.responsable}
                  onChange={(e) =>
                    setNuevoLead({ ...nuevoLead, responsable: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Jeisson">Jeisson</option>
                  <option value="Javier">Javier</option>
                  <option value="Equipo">Equipo</option>
                </select>
              </div>

              {/* Observaciones */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <textarea
                  value={nuevoLead.observaciones}
                  onChange={(e) =>
                    setNuevoLead({ ...nuevoLead, observaciones: e.target.value })
                  }
                  placeholder="Notas adicionales sobre el lead..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Footer con botones */}
            <div className="sticky bottom-0 z-10 flex gap-3 border-t border-gray-200 bg-white p-6">
              <button
                onClick={() => setMostrarModalLead(false)}
                className="h-11 flex-1 rounded-lg border border-gray-300 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                disabled={guardandoLead}
              >
                Cancelar
              </button>
              <button
                onClick={() => void guardarNuevoLead()}
                disabled={guardandoLead}
                className="h-11 flex-1 rounded-lg bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardandoLead ? "Guardando..." : "Crear Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Lead */}
      {mostrarModalEditar && leadEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Editar Lead</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    ID: {leadEditando.id.substring(0, 8)}...
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModalEditar(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-gray-600 transition-colors hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-lg border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={leadEditando?.es_caliente === true}
                    onChange={(e) => {
                      console.log("🔥 Checkbox cambiado a:", e.target.checked);
                      setLeadEditando((prev) =>
                        prev
                          ? {
                              ...prev,
                              es_caliente: e.target.checked,
                              prioridad: e.target.checked ? "ALTA" : prev.prioridad,
                            }
                          : prev
                      );
                    }}
                    className="h-5 w-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <span className="text-2xl">🔥</span>
                      Lead Caliente
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Marca este lead como prioritario (prioridad alta)
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Prioridad
                </label>
                <select
                  value={leadEditando.prioridad}
                  onChange={(e) =>
                    setLeadEditando({ ...leadEditando, prioridad: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={leadEditando.es_caliente}
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </select>
                {leadEditando.es_caliente && (
                  <p className="mt-1 text-xs text-gray-500">
                    La prioridad se establece automáticamente en ALTA para leads calientes
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha de Contacto *
                </label>
                <input
                  type="date"
                  value={leadEditando.fecha_contacto}
                  onChange={(e) =>
                    setLeadEditando({ ...leadEditando, fecha_contacto: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ¿De dónde viene? *
                </label>
                <select
                  value={leadEditando.origen}
                  onChange={(e) =>
                    setLeadEditando({ ...leadEditando, origen: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PAUTA_META">Pauta Meta (Facebook/Instagram)</option>
                  <option value="PAUTA_GOOGLE">Pauta Google Ads</option>
                  <option value="REFERIDO">Referido</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="LLAMADA_DIRECTA">Llamada Directa</option>
                  <option value="WEB">Sitio Web</option>
                  <option value="INSTAGRAM">Instagram Orgánico</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={leadEditando.nombre}
                    onChange={(e) =>
                      setLeadEditando({ ...leadEditando, nombre: e.target.value })
                    }
                    placeholder="Juan Pérez"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={leadEditando.telefono}
                    onChange={(e) =>
                      setLeadEditando({ ...leadEditando, telefono: e.target.value })
                    }
                    placeholder="3001234567"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={leadEditando.email}
                  onChange={(e) =>
                    setLeadEditando({ ...leadEditando, email: e.target.value })
                  }
                  placeholder="juan@ejemplo.com"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tipo de Proyecto *
                </label>
                <select
                  value={leadEditando.tipo_proyecto}
                  onChange={(e) =>
                    setLeadEditando({ ...leadEditando, tipo_proyecto: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VIS">VIS (Vivienda de Interés Social)</option>
                  <option value="REFORMA">Reforma</option>
                  <option value="DISENO">Diseño</option>
                  <option value="CONSTRUCCION">Construcción</option>
                  <option value="ACABADOS">Acabados</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nombre del Proyecto/Conjunto
                </label>
                <input
                  type="text"
                  value={leadEditando.nombre_proyecto}
                  onChange={(e) =>
                    setLeadEditando({ ...leadEditando, nombre_proyecto: e.target.value })
                  }
                  placeholder="Ej: Ciudadela Verde, Parque Oriente..."
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Presupuesto Estimado
                </label>
                <input
                  type="number"
                  value={leadEditando.presupuesto_estimado}
                  onChange={(e) =>
                    setLeadEditando({
                      ...leadEditando,
                      presupuesto_estimado: e.target.value,
                    })
                  }
                  placeholder="25000000"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">En pesos colombianos</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  📅 Fecha de Entrega del Apartamento
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fecha = new Date();
                      fecha.setMonth(fecha.getMonth() + 3);
                      setLeadEditando({
                        ...leadEditando,
                        fecha_entrega_apartamento: fecha.toISOString().split("T")[0],
                      });
                    }}
                    className="rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200"
                  >
                    +3 meses
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const fecha = new Date();
                      fecha.setMonth(fecha.getMonth() + 6);
                      setLeadEditando({
                        ...leadEditando,
                        fecha_entrega_apartamento: fecha.toISOString().split("T")[0],
                      });
                    }}
                    className="rounded-lg bg-purple-100 px-3 py-1 text-xs text-purple-700 transition-colors hover:bg-purple-200"
                  >
                    +6 meses
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const fecha = new Date();
                      fecha.setFullYear(fecha.getFullYear() + 1);
                      setLeadEditando({
                        ...leadEditando,
                        fecha_entrega_apartamento: fecha.toISOString().split("T")[0],
                      });
                    }}
                    className="rounded-lg bg-green-100 px-3 py-1 text-xs text-green-700 transition-colors hover:bg-green-200"
                  >
                    +1 año
                  </button>
                </div>
                <input
                  type="date"
                  value={leadEditando.fecha_entrega_apartamento || ""}
                  onChange={(e) =>
                    setLeadEditando({
                      ...leadEditando,
                      fecha_entrega_apartamento: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Fecha estimada de entrega del apartamento al cliente
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Responsable
                </label>
                <select
                  value={leadEditando.responsable}
                  onChange={(e) =>
                    setLeadEditando({ ...leadEditando, responsable: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Jeisson">Jeisson</option>
                  <option value="Javier">Javier</option>
                  <option value="Equipo">Equipo</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Próximo Paso
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const id = leadEditando.id;
                      setMostrarModalEditar(false);
                      setTimeout(() => {
                        const L = leads.find((l) => l.id === id);
                        if (L) abrirModalProximoPaso(L);
                      }, 100);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    ✏️ Editar
                  </button>
                </div>
                {leadEditando.proximo_paso ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={leadEditando.proximo_paso_completado === true}
                        readOnly
                        className="mt-0.5 h-4 w-4"
                      />
                      <div className="flex-1">
                        <div
                          className={`text-sm ${
                            leadEditando.proximo_paso_completado
                              ? "text-gray-400 line-through"
                              : "text-gray-700"
                          }`}
                        >
                          {leadEditando.proximo_paso}
                        </div>
                        {leadEditando.proximo_paso_fecha_limite && (
                          <div className="mt-1 text-xs text-gray-500">
                            📅{" "}
                            {new Date(
                              leadEditando.proximo_paso_fecha_limite
                            ).toLocaleDateString("es-CO")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const id = leadEditando.id;
                      setMostrarModalEditar(false);
                      setTimeout(() => {
                        const L = leads.find((l) => l.id === id);
                        if (L) abrirModalProximoPaso(L);
                      }, 100);
                    }}
                    className="h-11 w-full rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600"
                  >
                    + Agregar próximo paso
                  </button>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <textarea
                  value={leadEditando.observaciones}
                  onChange={(e) =>
                    setLeadEditando({
                      ...leadEditando,
                      observaciones: e.target.value,
                    })
                  }
                  placeholder="Notas adicionales sobre el lead..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white p-6">
              <button
                onClick={() => {
                  if (!leadEditando) return;
                  const ok = window.confirm(
                    "Los cambios sin guardar del formulario se perderán. ¿Ir al presupuesto?"
                  );
                  if (!ok) return;
                  setMostrarModalEditar(false);
                  router.push(`/presupuesto-manual?lead_id=${leadEditando.id}`);
                }}
                disabled={cargandoPresupuestosLeadEdit}
                className="mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
              >
                {cargandoPresupuestosLeadEdit
                  ? "Cargando…"
                  : versionesLeadEdit.length > 0
                  ? `Ajustar presupuesto (V${versionesLeadEdit[0].version_num})`
                  : "Hacer presupuesto"}
              </button>

              {/* Historial de versiones del lead */}
              {versionesLeadEdit.length > 0 && (
                <div className="mb-3 overflow-hidden rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Historial — {versionesLeadEdit.length} versión{versionesLeadEdit.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    {versionesLeadEdit.map((v) => {
                      const badgeColor: Record<string, string> = {
                        BORRADOR: 'bg-gray-100 text-gray-600',
                        ENVIADA:  'bg-blue-100 text-blue-700',
                        APROBADA: 'bg-emerald-100 text-emerald-700',
                        RECHAZADA: 'bg-red-100 text-red-600',
                      };
                      const publicUrl = v.token_publico ? `${window.location.origin}/p/${v.token_publico}` : null;
                      const waMsg = publicUrl
                        ? encodeURIComponent(`Hola ${leadEditando?.nombre ?? ''}, te comparto tu presupuesto de remodelación (V${v.version_num}) por $ ${v.total_final.toLocaleString('es-CO')}:\n${publicUrl}`)
                        : null;
                      return (
                        <div key={v.version_num} className="border-b border-gray-100 last:border-0">
                          <button
                            onClick={() => {
                              if (!leadEditando) return;
                              const ok = window.confirm('Los cambios sin guardar se perderán. ¿Ir a esta versión?');
                              if (!ok) return;
                              setMostrarModalEditar(false);
                              router.push(`/presupuesto-manual?lead_id=${leadEditando.id}&version=${v.version_num}`);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-violet-50"
                          >
                            <span className="w-8 font-bold text-gray-900">V{v.version_num}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeColor[v.estado] ?? badgeColor.BORRADOR}`}>
                              {v.estado}
                            </span>
                            <span className="flex-1 text-xs text-gray-500">
                              {new Date(v.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </span>
                            <span className="font-semibold text-gray-900">
                              $ {v.total_final.toLocaleString('es-CO')}
                            </span>
                            {/* tracking badge */}
                            {v.veces_visto > 0 && (
                              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700" title={`Visto por primera vez: ${new Date(v.visto_primera_vez!).toLocaleDateString('es-CO')}`}>
                                👁 {v.veces_visto}
                              </span>
                            )}
                          </button>
                          {publicUrl && (
                            <div className="flex gap-2 border-t border-gray-50 bg-gray-50 px-3 py-1.5">
                              <button
                                onClick={() => {
                                  void navigator.clipboard.writeText(publicUrl);
                                  setCopiandoToken(v.version_num);
                                  setTimeout(() => setCopiandoToken(null), 2000);
                                }}
                                className="flex items-center gap-1 rounded bg-white border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                {copiandoToken === v.version_num ? '✓ Copiado' : '🔗 Copiar link'}
                              </button>
                              <a
                                href={`https://wa.me/573175639674?text=${waMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 rounded bg-[#25D366] px-2 py-0.5 text-[10px] font-medium text-white hover:bg-[#20bd5a] transition-colors"
                              >
                                WhatsApp
                              </a>
                            </div>
                          )}
                          {leadEditando?.etapa === 'NEGOCIACION' && (
                            <div className="border-t border-amber-100 bg-amber-50 px-3 py-1.5">
                              <button
                                onClick={() => {
                                  setContratoPresupuestoId(v.id);
                                  setMostrarContratoModal(true);
                                }}
                                className="flex items-center gap-1 rounded bg-[#B0894F] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#9a7642] transition-colors"
                              >
                                📄 Crear contrato V{v.version_num}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-3 flex gap-3">
                <button
                  onClick={() => setMostrarModalEditar(false)}
                  className="h-11 flex-1 rounded-lg border border-gray-300 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={guardandoEdicion}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void guardarEdicionLead()}
                  disabled={guardandoEdicion}
                  className="h-11 flex-1 rounded-lg bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>

              <button
                onClick={(e) => {
                  if (!leadEditando) return;
                  setMostrarModalEditar(false);
                  void eliminarLead(leadEditando as any, e);
                }}
                disabled={guardandoEdicion}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-red-300 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>🗑️</span>
                Eliminar Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalProximoPaso && leadProximoPaso && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Próximo Paso</h2>
                  <p className="mt-1 text-sm text-gray-600">{leadProximoPaso.nombre}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalProximoPaso(false);
                    setLeadProximoPaso(null);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-gray-600 transition-colors hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ¿Qué sigue? *
                </label>
                <textarea
                  value={editandoProximoPaso.texto}
                  onChange={(e) =>
                    setEditandoProximoPaso({
                      ...editandoProximoPaso,
                      texto: e.target.value,
                    })
                  }
                  placeholder="Ej: Enviar cotización por WhatsApp, Agendar reunión virtual, Hacer seguimiento..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha límite (opcional)
                </label>
                <input
                  type="date"
                  value={editandoProximoPaso.fecha_limite}
                  onChange={(e) =>
                    setEditandoProximoPaso({
                      ...editandoProximoPaso,
                      fecha_limite: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-gray-700">
                  Sugerencias rápidas:
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Enviar cotización",
                    "Hacer seguimiento",
                    "Agendar reunión",
                    "Visita a obra",
                    "Revisar presupuesto",
                    "Firma de contrato",
                  ].map((sugerencia) => (
                    <button
                      key={sugerencia}
                      type="button"
                      onClick={() =>
                        setEditandoProximoPaso({
                          ...editandoProximoPaso,
                          texto: sugerencia,
                        })
                      }
                      className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      {sugerencia}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-200 p-6">
              {leadProximoPaso.proximo_paso && (
                <button
                  type="button"
                  onClick={() => void eliminarProximoPaso(leadProximoPaso)}
                  className="h-11 rounded-lg border border-red-300 px-4 font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Eliminar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMostrarModalProximoPaso(false);
                  setLeadProximoPaso(null);
                }}
                className="h-11 flex-1 rounded-lg border border-gray-300 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardarProximoPaso()}
                className="h-11 flex-1 rounded-lg bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarContratoModal && contratoPresupuestoId && leadEditando && (
        <ContratoModal
          leadId={leadEditando.id}
          leadNombre={leadEditando.nombre}
          presupuestoId={contratoPresupuestoId}
          onClose={() => { setMostrarContratoModal(false); setContratoPresupuestoId(null); }}
        />
      )}

      {/* Modal de Observaciones con Fecha */}
      {mostrarModalObservaciones && leadParaObservacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="text-2xl">📝</span>
              Registrar Seguimiento
            </h3>

            <div className="space-y-4">
              {/* Info del lead */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="font-semibold text-gray-900">{leadParaObservacion.nombre}</div>
                <div className="mt-1 text-sm text-gray-600">📱 {leadParaObservacion.telefono}</div>
                <div className="text-sm text-gray-600">
                  📍 {leadParaObservacion.nombre_proyecto || 'Sin proyecto'}
                </div>
              </div>

              {/* Fecha y hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-900">
                    📅 Fecha del Seguimiento
                  </label>
                  <input
                    type="date"
                    value={fechaObservacion}
                    onChange={(e) => setFechaObservacion(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 font-medium text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-900">🕐 Hora</label>
                  <input
                    type="time"
                    value={horaObservacion}
                    onChange={(e) => setHoraObservacion(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 font-medium text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Atajos rápidos */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '✅ Ahora', days: 0, hour: null },
                  { label: '📅 Ayer', days: 1, hour: '10:00' },
                  { label: '📆 Hace 3 días', days: 3, hour: '10:00' },
                  { label: '📅 Hace 1 semana', days: 7, hour: '10:00' },
                ].map(({ label, days, hour }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - days);
                      setFechaObservacion(d.toISOString().split('T')[0]);
                      setHoraObservacion(hour ?? d.toTimeString().slice(0, 5));
                    }}
                    className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Observación */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  📋 Descripción del Seguimiento
                </label>
                <textarea
                  value={nuevaObservacion}
                  onChange={(e) => setNuevaObservacion(e.target.value)}
                  placeholder="Ej: Llamada realizada. Cliente interesado en visita al proyecto. Agendar para próxima semana."
                  rows={5}
                  className="w-full resize-none rounded-lg border-2 border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="mt-1 text-xs text-gray-500">{nuevaObservacion.length} caracteres</div>
              </div>

              {/* Historial previo */}
              {leadParaObservacion.historial_seguimiento &&
                Array.isArray(leadParaObservacion.historial_seguimiento) &&
                leadParaObservacion.historial_seguimiento.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm font-medium text-gray-700">📜 Últimos Seguimientos</div>
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-4">
                      {[...leadParaObservacion.historial_seguimiento]
                        .reverse()
                        .slice(0, 3)
                        .map((item: any, index: number) => (
                          <div key={index} className="border-l-2 border-purple-300 py-1 pl-3 text-xs">
                            <div className="font-medium text-gray-900">
                              {new Date(item.fecha).toLocaleDateString('es-CO', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="mt-1 text-gray-600">{item.observacion}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMostrarModalObservaciones(false)}
                  disabled={guardandoObservacion}
                  className="h-11 flex-1 rounded-lg bg-gray-200 font-medium transition-colors hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void guardarObservacion()}
                  disabled={
                    guardandoObservacion ||
                    !nuevaObservacion.trim() ||
                    !fechaObservacion ||
                    !horaObservacion
                  }
                  className="h-11 flex-1 rounded-lg bg-purple-600 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardandoObservacion ? 'Guardando...' : '💾 Guardar Seguimiento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CentroOperacionesPage() {
  return <CentroOperacionesDashboard />;
}
