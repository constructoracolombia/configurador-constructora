"use client";

import { useEffect, useState } from "react";
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
          "id,nombre,telefono,email,etapa,presupuesto_estimado,tipo_proyecto,nombre_proyecto,origen,fecha_contacto,utm_campaign,utm_content,updated_at"
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
                                  className={`cursor-move rounded-lg border-2 bg-white p-3 text-xs transition-all ${
                                    dragSnapshot.isDragging
                                      ? "rotate-2 border-blue-500 shadow-lg"
                                      : "border-gray-200 hover:shadow-md"
                                  }`}
                                >
                                  <div className="mb-1 flex items-center gap-2 truncate font-bold text-gray-900">
                                    <span className="text-gray-400">⋮⋮</span>
                                    {lead.nombre}
                                  </div>

                                  <div className="mb-1 flex items-center gap-1 text-gray-600">
                                    <span className="text-[10px]">📱</span>
                                    {lead.telefono || "Sin teléfono"}
                                  </div>

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

                                  {lead.fecha_contacto && (
                                    <div className="mt-2 text-[10px] text-gray-400">
                                      {new Date(lead.fecha_contacto).toLocaleDateString("es-CO")}
                                    </div>
                                  )}
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
    </div>
  );
}
