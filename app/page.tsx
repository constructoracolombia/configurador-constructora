"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Calculator,
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";

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

export default function CentroOperacionesPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [mostrarLogin, setMostrarLogin] = useState(true);
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

  const [kpis, setKpis] = useState({
    totalLeads: 0,
    enProspeccion: 0,
    enNegociacion: 0,
    cerrados: 0,
    pipelineTotal: 0,
    tasaConversion: 0,
  });

  const [leadsPorEtapa, setLeadsPorEtapa] = useState<EtapaConDatos[]>(
    ETAPAS_VISUALES.map((etapa) => ({
      ...etapa,
      cantidad: 0,
      leads: [],
    }))
  );

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setMostrarLogin(false);
      void cargarDatos();
    }
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: leadsData, error } = await supabase
        .from("leads")
        .select(
          "id,nombre,telefono,email,etapa,presupuesto_estimado,tipo_proyecto,nombre_proyecto,origen,fecha_contacto,utm_campaign,utm_content,observaciones,responsable,prioridad,es_caliente,updated_at"
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const leads = ((leadsData || []) as Lead[]).map((lead) => ({
        ...lead,
        presupuesto_estimado: lead.presupuesto_estimado ?? 0,
      }));

      const total = leads.length;
      const prospeccion = leads.filter(
        (l) => l.etapa === "PROSPECCION"
      ).length;
      const negociacion = leads.filter(
        (l) => l.etapa === "NEGOCIACION"
      ).length;
      const cerrados = leads.filter((l) => l.etapa === "CIERRE").length;
      const pipeline = leads
        .filter((l) => !["PERDIDO", "DESCALIFICADO"].includes(l.etapa))
        .reduce((sum, l) => sum + (l.presupuesto_estimado || 0), 0);
      const tasa = total > 0 ? (cerrados / total) * 100 : 0;

      setKpis({
        totalLeads: total,
        enProspeccion: prospeccion,
        enNegociacion: negociacion,
        cerrados,
        pipelineTotal: pipeline,
        tasaConversion: tasa,
      });

      const etapasConDatos = ETAPAS_VISUALES.map((etapa) => ({
        ...etapa,
        cantidad: leads.filter((l) => l.etapa === etapa.key).length,
        leads: leads.filter((l) => l.etapa === etapa.key),
      }));
      setLeadsPorEtapa(etapasConDatos);
    } catch (error) {
      console.error("Error cargando datos del Centro de Operaciones:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = () => {
    if (password === "admin2026") {
      localStorage.setItem("admin_auth", "true");
      setMostrarLogin(false);
      void cargarDatos();
    } else {
      alert("Contraseña incorrecta");
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
    setLeadEditando({
      id: lead.id,
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
      es_caliente: lead.es_caliente || false,
      prioridad: lead.prioridad || "MEDIA",
    });
    setMostrarModalEditar(true);
  };

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
      const { error } = await supabase
        .from("leads")
        .update({
          nombre: leadEditando.nombre,
          telefono: leadEditando.telefono,
          email: leadEditando.email || null,
          fecha_contacto: leadEditando.fecha_contacto,
          origen: leadEditando.origen,
          tipo_proyecto: leadEditando.tipo_proyecto,
          nombre_proyecto: leadEditando.nombre_proyecto || null,
          presupuesto_estimado: leadEditando.presupuesto_estimado
            ? Number.parseFloat(leadEditando.presupuesto_estimado)
            : null,
          observaciones: leadEditando.observaciones || null,
          responsable: leadEditando.responsable,
          es_caliente: leadEditando.es_caliente,
          prioridad: leadEditando.prioridad,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadEditando.id);

      if (error) throw error;

      await supabase.from("lead_actividades").insert({
        lead_id: leadEditando.id,
        tipo: "NOTA",
        descripcion: "Lead actualizado",
        usuario: "Admin",
      });

      alert("✅ Lead actualizado exitosamente");
      setMostrarModalEditar(false);
      setLeadEditando(null);
      await cargarDatos();
    } catch (error) {
      console.error("Error actualizando lead:", error);
      alert("❌ Error al actualizar lead");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const toggleLeadCaliente = async (lead: Lead, e: ReactMouseEvent) => {
    e.stopPropagation();

    try {
      const nuevoEstado = !lead.es_caliente;

      const { error } = await supabase
        .from("leads")
        .update({
          es_caliente: nuevoEstado,
          prioridad: nuevoEstado ? "ALTA" : "MEDIA",
        })
        .eq("id", lead.id);

      if (error) throw error;

      await supabase.from("lead_actividades").insert({
        lead_id: lead.id,
        tipo: "NOTA",
        descripcion: nuevoEstado
          ? "Marcado como lead caliente 🔥"
          : "Desmarcado como lead caliente",
        usuario: "Admin",
      });

      await cargarDatos();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getColorClasses = (color: string) => {
    const colores: any = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      teal: "bg-teal-50 border-teal-200 text-teal-700",
      green: "bg-green-50 border-green-200 text-green-700",
    };
    return colores[color] || colores.blue;
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

    if (
      etapaNueva === "CIERRE" ||
      etapaNueva === "PERDIDO" ||
      etapaNueva === "DESCALIFICADO"
    ) {
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
        resultado: "Cambio de etapa manual",
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

  if (mostrarLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Centro de Operaciones
              </h1>
              <p className="text-sm text-gray-600">Constructora Colombia</p>
            </div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="mb-4 h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <Button
              onClick={handleLogin}
              className="h-12 w-full bg-blue-600 hover:bg-blue-700"
            >
              Acceder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                onClick={() => {
                  localStorage.removeItem("admin_auth");
                  setMostrarLogin(true);
                }}
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
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="mb-1 text-3xl font-bold text-gray-900">
                {kpis.totalLeads}
              </div>
              <div className="text-sm text-gray-600">Leads Totales</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="mb-1 text-3xl font-bold text-gray-900">
                {kpis.enNegociacion}
              </div>
              <div className="text-sm text-gray-600">En Negociación</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-sm font-semibold text-green-600">
                  {kpis.tasaConversion.toFixed(1)}%
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold text-gray-900">
                {kpis.cerrados}
              </div>
              <div className="text-sm text-gray-600">Cerrados</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mb-1 text-2xl font-bold text-gray-900">
                {formatoPrecio(kpis.pipelineTotal)}
              </div>
              <div className="text-sm text-gray-600">Pipeline Total</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            onClick={() => router.push("/crm")}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">CRM Kanban</h3>
              <p className="mb-4 text-sm text-gray-600">
                Gestiona el pipeline de ventas visualmente
              </p>
              <div className="text-xs text-gray-500">
                Drag & drop de leads por etapa
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-0 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => router.push("/admin")}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Analytics</h3>
              <p className="mb-4 text-sm text-gray-600">
                Métricas, reportes y análisis detallado
              </p>
              <div className="text-xs text-gray-500">
                Dashboard de cotizaciones
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-0 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => router.push("/pautas")}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Análisis de Pautas
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Rendimiento de campañas Meta Ads y Google
              </p>
              <div className="text-xs text-gray-500">
                ROI, conversión y métricas
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flujo Comercial - Drag & Drop Kanban */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Flujo Comercial</h2>
              <div className="text-xs text-gray-500">
                💡 Arrastra las tarjetas para mover leads entre etapas
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {leadsPorEtapa.map((etapa) => (
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
                            <div className="text-lg font-bold">{etapa.cantidad}</div>
                            <div className="text-xs font-medium">{etapa.nombre}</div>
                          </div>
                          <div className="rounded bg-white/50 px-2 py-1 text-xs">
                            {etapa.dias} días
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
                          {etapa.leads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => abrirModalEditar(lead)}
                                  className={`cursor-pointer rounded-lg border-2 bg-white p-3 text-xs transition-all ${
                                    dragSnapshot.isDragging
                                      ? "rotate-2 border-blue-500 shadow-lg"
                                      : lead.es_caliente
                                        ? "border-red-300 bg-red-50 hover:shadow-md"
                                        : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                                  }`}
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <div className="flex flex-1 items-center gap-2">
                                      <span className="cursor-move text-gray-400">⋮⋮</span>
                                      <div className="flex-1 truncate font-bold text-gray-900">
                                        {lead.nombre}
                                      </div>
                                    </div>
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

                                  {lead.presupuesto_estimado && (
                                    <div className="mb-1 text-[11px] font-semibold text-gray-900">
                                      💰 {formatoPrecio(lead.presupuesto_estimado)}
                                    </div>
                                  )}

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
                                    <div className="mt-2 line-clamp-2 border-l-2 border-gray-300 bg-gray-50 p-2 text-[10px] italic text-gray-500">
                                      {lead.observaciones}
                                    </div>
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

                        {etapa.leads.length === 0 && (
                          <div className="mt-2 rounded-lg bg-white/30 py-6 text-center text-xs text-gray-500">
                            Sin leads
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </CardContent>
        </Card>
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
                    checked={leadEditando.es_caliente}
                    onChange={(e) =>
                      setLeadEditando({
                        ...leadEditando,
                        es_caliente: e.target.checked,
                        prioridad: e.target.checked ? "ALTA" : "MEDIA",
                      })
                    }
                    className="h-5 w-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <span className="text-2xl">🔥</span>
                      Lead Caliente
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Marca este lead como prioritario (alta prioridad)
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

            <div className="sticky bottom-0 z-10 flex gap-3 border-t border-gray-200 bg-white p-6">
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
          </div>
        </div>
      )}
    </div>
  );
}
