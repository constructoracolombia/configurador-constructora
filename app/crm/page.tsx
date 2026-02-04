"use client";

import { useState, useEffect } from "react";
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
  Lock,
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
import { LeadCard } from "@/components/crm/LeadCard";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import type { Lead, Nota, Estado } from "@/lib/types/crm";

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
  { id: "RESERVADO", nombre: "Reservado", color: "bg-orange-500", icon: "💰" },
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
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsAgrupados, setLeadsAgrupados] = useState<
    Record<string, Lead[]>
  >({});
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);

  const PASSWORD_ADMIN = "admin2026";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setAutenticado(true);
      void cargarLeads();
    }
  }, []);

  const handleLogin = () => {
    if (password === PASSWORD_ADMIN) {
      setAutenticado(true);
      localStorage.setItem("admin_auth", "true");
      void cargarLeads();
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const cargarLeads = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("comercial.cotizaciones_crm")
        .select("*")
        .order("posicion_kanban", { ascending: true });

      if (error) throw error;

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
            lead.cliente_nombre
              .toLowerCase()
              .includes(busqueda.toLowerCase()) ||
            lead.cliente_email.toLowerCase().includes(busqueda.toLowerCase()) ||
            lead.numero_cotizacion
              .toLowerCase()
              .includes(busqueda.toLowerCase())
        )
      : leads;
    const agrupados: Record<string, Lead[]> = {};
    ESTADOS.forEach((estado) => {
      agrupados[estado.id] = filtrados
        .filter((lead) => (lead.estado_crm || "NUEVO") === estado.id)
        .sort((a, b) => (a.posicion_kanban || 0) - (b.posicion_kanban || 0));
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

    const leadId = active.id as string;
    let nuevoEstado: string;

    const esEstadoId = ESTADOS.some((e) => e.id === over.id);
    if (esEstadoId) {
      nuevoEstado = over.id as string;
    } else {
      const leadOver = leads.find((l) => l.id === over.id);
      if (!leadOver) {
        setActiveId(null);
        return;
      }
      nuevoEstado = leadOver.estado_crm || "NUEVO";
    }

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || (lead.estado_crm || "NUEVO") === nuevoEstado) {
      setActiveId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("comercial.cotizaciones")
        .update({
          estado_crm: nuevoEstado,
          ultima_interaccion: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) throw error;

      await cargarLeads();
    } catch (error) {
      console.error("Error actualizando estado:", error);
    }

    setActiveId(null);
  };

  const cargarNotas = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from("comercial.notas_seguimiento")
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
      const { error } = await supabase.from("comercial.notas_seguimiento").insert({
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

  const totalPipeline = leads.reduce(
    (sum, l) => sum + Number(l.total || 0),
    0
  );
  const enNegociacion = leads
    .filter((l) =>
      ["CITA_AGENDADA", "RESERVADO"].includes(l.estado_crm || "NUEVO")
    )
    .reduce((sum, l) => sum + Number(l.total || 0), 0);
  const ganados = leads.filter(
    (l) => l.estado_crm === "CONTRATO_FIRMADO"
  ).length;
  const tasaConversion =
    leads.length > 0 ? ((ganados / leads.length) * 100).toFixed(1) : "0";

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark p-4">
        <Card className="w-full max-w-md border-brand-primary bg-brand-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-text">
              <Lock className="h-6 w-6 text-brand-primary" />
              CRM Constructor Master
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="border-brand-border bg-brand-dark text-brand-text"
            />
            <Button
              onClick={handleLogin}
              className="w-full font-bold text-black hover:bg-brand-secondary"
            >
              Ingresar al CRM
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              onClick={() => {
                localStorage.removeItem("admin_auth");
                setAutenticado(false);
              }}
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
                leads={leadsAgrupados[estado.id] || []}
                onLeadClick={abrirDetalles}
                onWhatsApp={abrirWhatsApp}
                onReenviarEmail={reenviarEmail}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="opacity-90">
                <LeadCard
                  lead={activeLead}
                  onClick={() => {}}
                  onWhatsApp={() => abrirWhatsApp(activeLead)}
                  onReenviarEmail={() => reenviarEmail(activeLead)}
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
