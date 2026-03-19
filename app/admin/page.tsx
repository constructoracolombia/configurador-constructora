"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  Users,
  ExternalLink,
  Search,
  Lock,
  LayoutDashboard,
  RefreshCw,
  Radio,
  MessageSquare,
} from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Cotizacion {
  id: string;
  created_at: string;
  cliente_nombre: string;
  cliente_email: string;
  proyecto_nombre: string;
  plan_tipo: string;
  plan_nombre: string;
  total: number;
  pdf_url: string | null;
  numero_cotizacion: string;
  adicionales: unknown[];
}

interface Estadisticas {
  totalCotizaciones: number;
  totalValor: number;
  promedioValor: number;
  cotizacionesHoy: number;
  proyectoMasPopular: string;
  planMasPopular: string;
}

interface ConversacionWhatsapp {
  id: string;
  created_at: string;
  telefono: string;
  nombre: string | null;
  mensaje_cliente: string | null;
  mensaje_bot: string | null;
  leido: boolean | null;
  respondido_at: string | null;
  atendido_por?: string | null;
  notas?: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [conversaciones, setConversaciones] = useState<ConversacionWhatsapp[]>(
    []
  );
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [vistaActual, setVistaActual] = useState<"cotizaciones" | "whatsapp">(
    "cotizaciones"
  );
  const [busqueda, setBusqueda] = useState("");
  const [filtroProyecto, setFiltroProyecto] = useState("todos");
  const [cargando, setCargando] = useState(false);
  const [realtimeConectado, setRealtimeConectado] = useState(false);

  const PASSWORD_ADMIN = "admin2026"; // Cambiar en producción

  const enviarLinkConfigurador = async (conversacion: ConversacionWhatsapp) => {
    const mensaje = `Hola ${conversacion.nombre || "Cliente"}! 👋

Gracias por tu interés en Constructora Colombia.

Te comparto el link para que armes tu presupuesto personalizado en 5 minutos:

👉 https://ppto.constructoracolombia.com/presupuestos

Es GRATIS y recibes tu PDF al instante.

¿Tienes alguna duda antes de empezar?`;

    try {
      const response = await fetch("/api/evolution-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefono: conversacion.telefono,
          mensaje,
        }),
      });

      if (response.ok) {
        alert("✅ Link enviado por WhatsApp");

        const { error } = await supabase
          .from("conversaciones_whatsapp")
          .update({
            leido: true,
            atendido_por: "Jeisson",
            notas: "Link al configurador enviado",
          })
          .eq("id", conversacion.id);

        if (error) {
          console.error("Error marcando conversación como atendida:", error);
        }

        await cargarConversaciones();
      } else {
        alert("❌ Error enviando mensaje");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error de conexión");
    }
  };

  const cargarConversaciones = async () => {
    const { data, error } = await supabase
      .from("conversaciones_whatsapp")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error cargando conversaciones WhatsApp:", error);
      return;
    }

    setConversaciones((data as ConversacionWhatsapp[]) || []);
  };

  const handleLogin = () => {
    if (password === PASSWORD_ADMIN) {
      setAutenticado(true);
      localStorage.setItem("admin_auth", "true");
      void cargarDatos();
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: cotizacionesData, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCotizaciones((cotizacionesData as Cotizacion[]) || []);
      await cargarConversaciones();

      if (cotizacionesData && cotizacionesData.length > 0) {
        const totalCotizaciones = cotizacionesData.length;
        const totalValor = cotizacionesData.reduce(
          (sum, c) => sum + Number(c.total),
          0
        );
        const promedioValor = totalValor / totalCotizaciones || 0;

        const hoy = new Date().toISOString().split("T")[0];
        const cotizacionesHoy = cotizacionesData.filter(
          (c) => c.created_at.split("T")[0] === hoy
        ).length;

        const proyectosCounts: Record<string, number> = {};
        cotizacionesData.forEach((c) => {
          proyectosCounts[c.proyecto_nombre] =
            (proyectosCounts[c.proyecto_nombre] || 0) + 1;
        });
        const proyectoMasPopular =
          Object.keys(proyectosCounts).reduce((a, b) =>
            proyectosCounts[a] > proyectosCounts[b] ? a : b
          ) || "";

        const planesCounts: Record<string, number> = {};
        cotizacionesData.forEach((c) => {
          planesCounts[c.plan_tipo] = (planesCounts[c.plan_tipo] || 0) + 1;
        });
        const planMasPopular =
          Object.keys(planesCounts).reduce((a, b) =>
            planesCounts[a] > planesCounts[b] ? a : b
          ) || "";

        setEstadisticas({
          totalCotizaciones,
          totalValor,
          promedioValor,
          cotizacionesHoy,
          proyectoMasPopular,
          planMasPopular,
        });
      } else {
        setEstadisticas({
          totalCotizaciones: 0,
          totalValor: 0,
          promedioValor: 0,
          cotizacionesHoy: 0,
          proyectoMasPopular: "-",
          planMasPopular: "-",
        });
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setEstadisticas(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setAutenticado(true);
      void cargarDatos();
    }
  }, []);

  // SUSCRIPCIÓN EN TIEMPO REAL - Se actualiza automáticamente cuando hay cambios en BD
  useEffect(() => {
    if (!autenticado) return;

    console.log("👂 Admin: Suscribiéndose a cambios en tiempo real...");

    const subscription = supabase
      .channel("admin-cotizaciones-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "cotizaciones",
        },
        (payload) => {
          console.log("⚡ Admin: Cambio detectado en cotizaciones:", payload.eventType);
          // Recargar datos cuando hay cualquier cambio
          void cargarDatos();
        }
      )
      .subscribe((status) => {
        console.log("📡 Admin: Estado de suscripción:", status);
        setRealtimeConectado(status === "SUBSCRIBED");
      });

    return () => {
      console.log("👋 Admin: Desuscribiendo de cambios...");
      void subscription.unsubscribe();
    };
  }, [autenticado]);

  const cotizacionesFiltradas = cotizaciones.filter((c) => {
    const matchBusqueda =
      c.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cliente_email.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.numero_cotizacion.toLowerCase().includes(busqueda.toLowerCase());

    const matchProyecto =
      filtroProyecto === "todos" || c.proyecto_nombre === filtroProyecto;

    return matchBusqueda && matchProyecto;
  });

  const proyectosUnicos = Array.from(
    new Set(cotizaciones.map((c) => c.proyecto_nombre))
  );
  const conversacionesNoLeidas = conversaciones.filter((c) => !c.leido).length;

  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark p-4">
        <Card className="w-full max-w-md border-brand-primary bg-brand-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-text">
              <Lock className="h-6 w-6 text-brand-primary" />
              Panel de Administración
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
              Ingresar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-text">
              Dashboard Admin
            </h1>
            <p className="text-brand-textSecondary">
              Panel de control de cotizaciones
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Indicador de conexión en tiempo real */}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                realtimeConectado
                  ? "bg-green-900/50 text-green-400"
                  : "bg-gray-700 text-gray-400"
              }`}
              title={
                realtimeConectado
                  ? "Conectado - Los cambios se sincronizan automáticamente"
                  : "Desconectado - Los cambios no se sincronizan"
              }
            >
              <Radio
                className={`h-3 w-3 ${realtimeConectado ? "animate-pulse" : ""}`}
              />
              {realtimeConectado ? "Tiempo Real" : "Sin conexión"}
            </div>

            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-white font-semibold text-black hover:bg-gray-200"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={() => router.push("/crm")}
              className="bg-white font-semibold text-black hover:bg-gray-200"
            >
              <Users className="mr-2 h-4 w-4" />
              CRM Kanban
            </Button>
            <Button
              onClick={() => window.open("/presupuestos", "_blank")}
              className="bg-white font-semibold text-black hover:bg-gray-200"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ir al sitio
            </Button>
            <Button
              onClick={() => void cargarDatos()}
              disabled={cargando}
              className="bg-brand-primary font-semibold text-black hover:bg-brand-secondary"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setVistaActual("cotizaciones")}
            className={
              vistaActual === "cotizaciones"
                ? "bg-brand-primary font-semibold text-black hover:bg-brand-secondary"
                : "bg-brand-card text-brand-text hover:bg-brand-border"
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Cotizaciones
          </Button>
          <Button
            onClick={() => setVistaActual("whatsapp")}
            className={
              vistaActual === "whatsapp"
                ? "bg-brand-primary font-semibold text-black hover:bg-brand-secondary"
                : "bg-brand-card text-brand-text hover:bg-brand-border"
            }
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp ({conversacionesNoLeidas})
          </Button>
        </div>

        {vistaActual === "cotizaciones" ? (
          <>
            {/* Estadísticas */}
            {estadisticas && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-blue-500 bg-gradient-to-br from-blue-900/30 to-blue-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-textSecondary">
                        Total Cotizaciones
                      </p>
                      <p className="text-3xl font-bold text-brand-text">
                        {estadisticas.totalCotizaciones}
                      </p>
                    </div>
                    <FileText className="h-10 w-10 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-green-500 bg-gradient-to-br from-green-900/30 to-green-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-textSecondary">
                        Valor Total
                      </p>
                      <p className="text-2xl font-bold text-brand-text">
                        {formatoPrecio(estadisticas.totalValor)}
                      </p>
                    </div>
                    <DollarSign className="h-10 w-10 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-purple-500 bg-gradient-to-br from-purple-900/30 to-purple-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-textSecondary">
                        Promedio
                      </p>
                      <p className="text-2xl font-bold text-brand-text">
                        {formatoPrecio(estadisticas.promedioValor)}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-orange-500 bg-gradient-to-br from-orange-900/30 to-orange-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-textSecondary">Hoy</p>
                      <p className="text-3xl font-bold text-brand-text">
                        {estadisticas.cotizacionesHoy}
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
            )}

            {/* Insights */}
            {estadisticas && estadisticas.totalCotizaciones > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-brand-border bg-brand-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-brand-text">
                  <BarChart3 className="h-5 w-5 text-brand-primary" />
                  Proyecto Más Popular
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-brand-primary">
                  {estadisticas.proyectoMasPopular}
                </p>
              </CardContent>
            </Card>

            <Card className="border-brand-border bg-brand-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-brand-text">
                  <TrendingUp className="h-5 w-5 text-brand-primary" />
                  Plan Más Seleccionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold capitalize text-brand-primary">
                  {estadisticas.planMasPopular}
                </p>
              </CardContent>
            </Card>
          </div>
            )}

            {/* Filtros y Búsqueda */}
            <Card className="border-brand-border bg-brand-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-textSecondary" />
                <Input
                  placeholder="Buscar por nombre, email o número de cotización..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="border-brand-border bg-brand-dark pl-10 text-brand-text"
                />
              </div>
              <select
                value={filtroProyecto}
                onChange={(e) => setFiltroProyecto(e.target.value)}
                className="rounded-md border border-brand-border bg-brand-dark px-4 py-2 text-brand-text"
              >
                <option value="todos">Todos los proyectos</option>
                {proyectosUnicos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => void cargarDatos()}
                disabled={cargando}
                className="text-black hover:bg-brand-secondary"
              >
                {cargando ? "Cargando..." : "Actualizar"}
              </Button>
            </div>
          </CardContent>
            </Card>

            {/* Tabla de Cotizaciones */}
            <Card className="border-brand-border bg-brand-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-text">
              <Users className="h-5 w-5 text-brand-primary" />
              Cotizaciones ({cotizacionesFiltradas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-border">
                    <TableHead className="text-brand-textSecondary">
                      Fecha
                    </TableHead>
                    <TableHead className="text-brand-textSecondary">
                      Cliente
                    </TableHead>
                    <TableHead className="text-brand-textSecondary">
                      Email
                    </TableHead>
                    <TableHead className="text-brand-textSecondary">
                      Proyecto
                    </TableHead>
                    <TableHead className="text-brand-textSecondary">
                      Plan
                    </TableHead>
                    <TableHead className="text-brand-textSecondary">
                      Total
                    </TableHead>
                    <TableHead className="text-brand-textSecondary">
                      Cotización #
                    </TableHead>
                    <TableHead className="text-brand-textSecondary">
                      PDF
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacionesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-brand-textSecondary"
                      >
                        No hay cotizaciones registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    cotizacionesFiltradas.map((cot) => (
                      <TableRow
                        key={cot.id}
                        className="border-brand-border"
                      >
                        <TableCell className="text-brand-textSecondary">
                          {new Date(cot.created_at).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell className="font-medium text-brand-text">
                          {cot.cliente_nombre}
                        </TableCell>
                        <TableCell className="text-brand-textSecondary">
                          {cot.cliente_email}
                        </TableCell>
                        <TableCell className="text-brand-text">
                          {cot.proyecto_nombre}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              cot.plan_tipo === "intermedio"
                                ? "bg-brand-primary text-black"
                                : "bg-gray-600"
                            }
                          >
                            {cot.plan_nombre}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-brand-primary">
                          {formatoPrecio(cot.total)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-brand-textSecondary">
                          {cot.numero_cotizacion}
                        </TableCell>
                        <TableCell>
                          {cot.pdf_url ? (
                            <a
                              href={cot.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver PDF
                            </a>
                          ) : (
                            <span className="text-brand-textSecondary">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-brand-border bg-brand-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-text">
                <MessageSquare className="h-5 w-5 text-brand-primary" />
                Conversaciones WhatsApp ({conversaciones.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-brand-border">
                      <TableHead className="text-brand-textSecondary">Fecha</TableHead>
                      <TableHead className="text-brand-textSecondary">Cliente</TableHead>
                      <TableHead className="text-brand-textSecondary">Teléfono</TableHead>
                      <TableHead className="text-brand-textSecondary">Mensaje Cliente</TableHead>
                      <TableHead className="text-brand-textSecondary">Respuesta Bot</TableHead>
                      <TableHead className="text-brand-textSecondary">Estado</TableHead>
                      <TableHead className="text-brand-textSecondary">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversaciones.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-brand-textSecondary"
                        >
                          No hay conversaciones registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      conversaciones.map((conv) => (
                        <TableRow key={conv.id} className="border-brand-border">
                          <TableCell className="text-brand-textSecondary">
                            {new Date(conv.created_at).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell className="font-medium text-brand-text">
                            {conv.nombre || "Cliente"}
                          </TableCell>
                          <TableCell className="text-brand-textSecondary">
                            {conv.telefono}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-brand-textSecondary">
                            {conv.mensaje_cliente || "-"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-brand-textSecondary">
                            {conv.mensaje_bot || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={conv.leido ? "bg-gray-600" : "bg-green-600"}>
                              {conv.leido ? "Leído" : "No leído"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => void enviarLinkConfigurador(conv)}
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              📊 Enviar Link Presupuesto
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
