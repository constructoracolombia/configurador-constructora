"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  Mail,
  ExternalLink,
  FileText,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import { ClienteGroupCard } from "@/components/crm/ClienteGroupCard";
import { agruparPorCliente } from "@/lib/utils/crm-groups";
import type { Lead, Nota, Estado, ClienteGroup } from "@/lib/types/crm";

const ESTADOS: Estado[] = [
  { id: "NUEVO", nombre: "Nuevos", color: "bg-blue-500", icon: "📨" },
  {
    id: "CORREO_ENVIADO",
    nombre: "Correo Enviado",
    color: "bg-purple-500",
    icon: "✉️",
  },
  {
    id: "CITA_AGENDADA",
    nombre: "Cita Agendada",
    color: "bg-yellow-500",
    icon: "📅",
  },
  { id: "EN_SEGUIMIENTO", nombre: "En Seguimiento", color: "bg-orange-500", icon: "🔥" },
  {
    id: "CONTRATO_FIRMADO",
    nombre: "Ganado",
    color: "bg-green-500",
    icon: "✅",
  },
  { id: "PERDIDO", nombre: "Perdido", color: "bg-red-500", icon: "❌" },
];

export default function CRMPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsAgrupados, setLeadsAgrupados] = useState<
    Record<string, ClienteGroup[]>
  >({});
  const [gruposIndex, setGruposIndex] = useState<Map<string, ClienteGroup>>(new Map());
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => { void cargarLeads(); }, []);

  const cargarLeads = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .order("posicion_kanban", { ascending: true });

      if (error) throw error;

      console.log('fetch filas:', data?.length, data);
      const leadsData = (data || []) as Lead[];
      setLeads(leadsData);
    } catch (error) {
      console.error("Error cargando leads:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const filtrados = busqueda
      ? leads.filter(
          (lead) =>
            lead.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            lead.cliente_email.toLowerCase().includes(busqueda.toLowerCase()) ||
            lead.numero_cotizacion.toLowerCase().includes(busqueda.toLowerCase())
        )
      : leads;

    const todosGrupos = agruparPorCliente(filtrados);
    console.log('grupos:', todosGrupos);

    const idx = new Map<string, ClienteGroup>();
    todosGrupos.forEach((g) => idx.set(g.key, g));
    setGruposIndex(idx);

    const agrupados: Record<string, ClienteGroup[]> = {};
    ESTADOS.forEach((estado) => {
      agrupados[estado.id] = todosGrupos.filter(
        (g) => g.etapaMasAvanzada === estado.id
      );
    });
    setLeadsAgrupados(agrupados);
  }, [busqueda, leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const groupKey = active.id as string;
    let nuevoEstado: string;

    const esEstadoId = ESTADOS.some((e) => e.id === over.id);
    if (esEstadoId) {
      nuevoEstado = over.id as string;
    } else {
      const groupOver = gruposIndex.get(over.id as string);
      if (!groupOver) {
        setActiveId(null);
        return;
      }
      nuevoEstado = groupOver.etapaMasAvanzada;
    }

    const group = gruposIndex.get(groupKey);
    if (!group || group.etapaMasAvanzada === nuevoEstado) {
      setActiveId(null);
      return;
    }

    try {
      const ids = group.cotizaciones.map((c) => c.id);
      const { error } = await supabase
        .from("cotizaciones")
        .update({
          estado_crm: nuevoEstado,
          ultima_interaccion: new Date().toISOString(),
        })
        .in("id", ids);

      if (error) throw error;

      await cargarLeads();
    } catch (error) {
      console.error("Error actualizando estado:", error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ Error al mover el cliente a "${nuevoEstado}":\n\n${msg}\n\nRevisa la consola para más detalles.`);
      await cargarLeads();
    }

    setActiveId(null);
  };

  const cargarNotas = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from("notas_seguimiento")
        .select("*")
        .eq("cotizacion_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotas((data as Nota[]) || []);
    } catch (error) {
      console.error("Error cargando notas:", error);
    }
  };

  const agregarNota = async () => {
    if (!nuevaNota.trim() || !leadSeleccionado) return;

    setGuardandoNota(true);
    try {
      const { error } = await supabase.from("notas_seguimiento").insert({
        cotizacion_id: leadSeleccionado.id,
        nota: nuevaNota,
        tipo: "nota",
        autor: "admin",
      });

      if (error) throw error;

      setNuevaNota("");
      await cargarNotas(leadSeleccionado.id);
    } catch (error) {
      console.error("Error guardando nota:", error);
    } finally {
      setGuardandoNota(false);
    }
  };

  const abrirDetalles = async (lead: Lead) => {
    setLeadSeleccionado(lead);
    setMostrarDetalles(true);
    await cargarNotas(lead.id);
  };

  const reenviarEmail = async (lead: Lead) => {
    try {
      const response = await fetch("/api/enviar-presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNombre: lead.cliente_nombre,
          clienteEmail: lead.cliente_email,
          numeroCotizacion: lead.numero_cotizacion,
          proyecto: lead.proyecto_nombre,
          total: formatoPrecio(lead.total),
          pdfUrl: lead.pdf_url,
        }),
      });

      if (response.ok) {
        alert("✅ Email reenviado exitosamente");
      } else {
        alert("❌ Error enviando email");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error enviando email");
    }
  };

  const abrirWhatsAppGrupo = (group: ClienteGroup) => {
    const rep = group.cotizaciones[0];
    const telefono = group.telefono || "573175639674";
    if (!group.telefono) {
      alert("Cliente no registró teléfono. Usando número de la empresa.");
    }
    const mensaje = `Hola ${group.nombre}!\n\nTe contacto desde Constructora Colombia. Vi que generaste tu presupuesto para *${rep.proyecto_nombre}* (${rep.numero_cotizacion}).\n\nTu presupuesto: ${rep.pdf_url || ""}\n\nQuieres asegurar tu precio actual antes de que suban los insumos? Sigue disponible el cupo de reserva por $500.000 para este mes.`;
    window.open(
      `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
  };

  const abrirWhatsApp = (lead: Lead) => {
    const telefono = lead.cliente_telefono?.replace(/\D/g, "") || "573175639674";
    if (!lead.cliente_telefono) {
      alert("Cliente no registró teléfono. Usando número de la empresa.");
    }
    const mensaje = `Hola ${lead.cliente_nombre}!

Te contacto desde Constructora Colombia. Vi que generaste tu presupuesto para *${lead.proyecto_nombre}* (${lead.numero_cotizacion}).

Tu presupuesto: ${lead.pdf_url || ""}

Quieres asegurar tu precio actual antes de que suban los insumos? Sigue disponible el cupo de reserva por $500.000 para este mes.`;

    window.open(
      `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
  };

  const eliminarLead = async (lead: Lead) => {
    const confirmacion = window.confirm(
      `⚠️ ¿ELIMINAR DEFINITIVAMENTE?\n\n` +
        `Lead: ${lead.cliente_nombre}\n` +
        `Cotización: ${lead.numero_cotizacion}\n\n` +
        `Se eliminará:\n` +
        `• La cotización\n` +
        `• Todas las notas\n` +
        `• Todo el historial\n\n` +
        `Esta acción NO se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      setEliminando(lead.id);
      console.log("🗑️ INICIANDO ELIMINACIÓN:", lead.id, lead.numero_cotizacion);

      // PASO 1: Eliminar notas de seguimiento
      console.log("📝 Eliminando notas...");
      const { error: notasError } = await supabase
        .from("notas_seguimiento")
        .delete()
        .eq("cotizacion_id", lead.id);

      if (notasError) {
        console.error("❌ Error eliminando notas:", notasError);
      } else {
        console.log("✅ Notas eliminadas");
      }

      // PASO 2: Eliminar historial de estados
      console.log("📜 Eliminando historial...");
      const { error: historialError } = await supabase
        .from("historial_estados")
        .delete()
        .eq("cotizacion_id", lead.id);

      if (historialError) {
        console.error("❌ Error eliminando historial:", historialError);
      } else {
        console.log("✅ Historial eliminado");
      }

      // PASO 3: Eliminar cotización
      console.log("💰 Eliminando cotización...");
      const { error: cotizacionError } = await supabase
        .from("cotizaciones")
        .delete()
        .eq("id", lead.id);

      if (cotizacionError) {
        console.error("❌ Error eliminando cotización:", cotizacionError);
        throw new Error("Error eliminando cotización: " + cotizacionError.message);
      }
      console.log("✅ Cotización eliminada de BD");

      // PASO 4: Actualizar estado local INMEDIATAMENTE
      setLeads((prevLeads) => {
        const nuevaLista = prevLeads.filter((l) => l.id !== lead.id);
        console.log(
          "🔄 Estado actualizado. Antes:",
          prevLeads.length,
          "Después:",
          nuevaLista.length
        );
        return nuevaLista;
      });

      // PASO 5: Recargar desde BD para confirmar sincronización
      console.log("🔄 Recargando desde BD...");
      await cargarLeads();

      console.log("✅ ELIMINACIÓN COMPLETA");
      alert("✅ Lead eliminado exitosamente");
    } catch (error: unknown) {
      console.error("❌ ERROR CRÍTICO:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      alert(
        `❌ Error al eliminar:\n\n${errorMessage}\n\nRevisa la consola para más detalles.`
      );

      // Recargar en caso de error para mostrar estado real
      await cargarLeads();
    } finally {
      setEliminando(null);
    }
  };

  // KPIs: un cliente = una vez, usando su cotización más alta (coherente con las tarjetas)
  const allGroups = useMemo(() => agruparPorCliente(leads), [leads]);

  const totalPipeline = allGroups
    .filter((g) => g.etapaMasAvanzada !== "PERDIDO")
    .reduce((sum, g) => sum + g.valorMax, 0);

  const enNegociacion = allGroups
    .filter((g) =>
      ["CITA_AGENDADA", "EN_SEGUIMIENTO"].includes(g.etapaMasAvanzada)
    )
    .reduce((sum, g) => sum + g.valorMax, 0);

  const ganados = allGroups.filter(
    (g) => g.etapaMasAvanzada === "CONTRATO_FIRMADO"
  ).length;

  const tasaConversion =
    allGroups.length > 0
      ? ((ganados / allGroups.length) * 100).toFixed(1)
      : "0";

  const activeGroup = activeId ? (gruposIndex.get(activeId) ?? null) : null;

  return (
    <div className="min-h-screen bg-brand-dark p-4">
      <div className="mx-auto max-w-[1800px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-text">
              🏗️ CRM Constructor Master
            </h1>
            <p className="text-brand-textSecondary">
              Sistema de Gestión de Ventas
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-white font-semibold text-black hover:bg-gray-200"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={() => router.push("/admin")}
              className="bg-white font-semibold text-black hover:bg-gray-200"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Panel Admin
            </Button>
            <Button
              onClick={() => void cargarLeads()}
              disabled={cargando}
              className="bg-brand-primary font-semibold text-black hover:bg-brand-secondary"
            >
              {cargando ? "Cargando..." : "Actualizar"}
            </Button>
            <Button
              onClick={() => void supabase.auth.signOut().then(() => router.push("/login"))}
              className="bg-red-600 font-semibold text-white hover:bg-red-700"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border-blue-500 bg-gradient-to-br from-blue-900/30 to-blue-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-textSecondary">
                    Pipeline Total
                  </p>
                  <p className="text-2xl font-bold text-brand-text">
                    {formatoPrecio(totalPipeline)}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500 bg-gradient-to-br from-orange-900/30 to-orange-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-textSecondary">
                    En Negociación
                  </p>
                  <p className="text-2xl font-bold text-brand-text">
                    {formatoPrecio(enNegociacion)}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500 bg-gradient-to-br from-green-900/30 to-green-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-textSecondary">
                    Contratos Ganados
                  </p>
                  <p className="text-3xl font-bold text-brand-text">
                    {ganados}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500 bg-gradient-to-br from-purple-900/30 to-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-textSecondary">
                    Tasa de Conversión
                  </p>
                  <p className="text-3xl font-bold text-brand-text">
                    {tasaConversion}%
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card className="border-brand-border bg-brand-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-textSecondary" />
              <Input
                placeholder="Buscar por nombre, email o número de cotización..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="border-brand-border bg-brand-dark pl-10 text-brand-text"
              />
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {ESTADOS.map((estado) => (
              <KanbanColumn
                key={estado.id}
                estado={estado}
                groups={leadsAgrupados[estado.id] || []}
                onCotizacionClick={abrirDetalles}
                onWhatsApp={abrirWhatsAppGrupo}
                onEliminar={eliminarLead}
                eliminandoId={eliminando}
              />
            ))}
          </div>

          <DragOverlay>
            {activeGroup ? (
              <div className="opacity-90">
                <ClienteGroupCard
                  group={activeGroup}
                  onCotizacionClick={() => {}}
                  onWhatsApp={() => {}}
                  onEliminar={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Modal de Detalles */}
        <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-brand-primary bg-brand-card">
            {leadSeleccionado && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl text-brand-text">
                    <FileText className="h-6 w-6 text-brand-primary" />
                    {leadSeleccionado.cliente_nombre}
                  </DialogTitle>
                  <DialogDescription className="text-brand-textSecondary">
                    {leadSeleccionado.numero_cotizacion} •{" "}
                    {new Date(
                      leadSeleccionado.created_at
                    ).toLocaleDateString("es-CO")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-sm text-brand-textSecondary">
                        Email
                      </p>
                      <p className="font-medium text-brand-text">
                        {leadSeleccionado.cliente_email}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-brand-textSecondary">
                        Teléfono
                      </p>
                      <p className="font-medium text-brand-text">
                        {leadSeleccionado.cliente_telefono || "No registrado"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-brand-textSecondary">
                        Proyecto
                      </p>
                      <p className="font-medium text-brand-text">
                        {leadSeleccionado.proyecto_nombre}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-brand-textSecondary">
                        Plan
                      </p>
                      <Badge className="bg-brand-primary text-black">
                        {leadSeleccionado.plan_nombre}
                      </Badge>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-brand-textSecondary">
                        Valor Total
                      </p>
                      <p className="text-2xl font-bold text-brand-primary">
                        {formatoPrecio(leadSeleccionado.total)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-brand-textSecondary">
                        PDF Abierto
                      </p>
                      <Badge
                        className={
                          leadSeleccionado.pdf_abierto
                            ? "bg-green-600"
                            : "bg-gray-600"
                        }
                      >
                        {leadSeleccionado.pdf_abierto ? "Sí" : "No"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => abrirWhatsApp(leadSeleccionado)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      onClick={() => reenviarEmail(leadSeleccionado)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Re-enviar Email
                    </Button>
                    {leadSeleccionado.pdf_url && (
                      <Button
                        onClick={() =>
                          window.open(leadSeleccionado.pdf_url!, "_blank")
                        }
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver PDF
                      </Button>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-bold text-brand-text">
                      <FileText className="h-5 w-5 text-brand-primary" />
                      Notas de Seguimiento
                    </h3>

                    <div className="mb-4">
                      <Textarea
                        placeholder="Escribe una nota sobre este cliente..."
                        value={nuevaNota}
                        onChange={(e) => setNuevaNota(e.target.value)}
                        className="mb-2 border-brand-border bg-brand-dark text-brand-text"
                        rows={3}
                      />
                      <Button
                        onClick={() => void agregarNota()}
                        disabled={guardandoNota || !nuevaNota.trim()}
                        className="text-black hover:bg-brand-secondary"
                      >
                        {guardandoNota ? "Guardando..." : "Agregar Nota"}
                      </Button>
                    </div>

                    <div className="max-h-60 space-y-3 overflow-y-auto">
                      {notas.length === 0 ? (
                        <p className="py-4 text-center text-sm text-brand-textSecondary">
                          No hay notas todavía
                        </p>
                      ) : (
                        notas.map((nota) => (
                          <div
                            key={nota.id}
                            className="rounded-lg border border-brand-border bg-brand-dark p-3"
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <Badge className="bg-blue-600 text-xs">
                                {nota.tipo}
                              </Badge>
                              <span className="text-xs text-brand-textSecondary">
                                {new Date(
                                  nota.created_at
                                ).toLocaleString("es-CO")}
                              </span>
                            </div>
                            <p className="text-sm text-brand-text">
                              {nota.nota}
                            </p>
                            <p className="mt-1 text-xs text-brand-textSecondary">
                              Por: {nota.autor}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
