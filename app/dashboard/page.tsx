"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calculator,
  Users,
  BarChart3,
  Activity,
  ArrowRight,
  Lock,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { proyectos, adicionales } from "@/lib/data/catalogo";

export default function DashboardPage() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [mostrarLogin, setMostrarLogin] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);

  const cargarStats = async () => {
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("id", { count: "exact" });

      if (!error && data) {
        setTotalLeads(data.length);
      }
    } catch (error) {
      console.error("Error cargando stats:", error);
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setAutenticado(true);
      setMostrarLogin(false);
      void cargarStats();
    }
  }, []);

  const handleLogin = () => {
    if (password === "admin2026") {
      setAutenticado(true);
      setMostrarLogin(false);
      localStorage.setItem("admin_auth", "true");
      void cargarStats();
    } else {
      alert("Contraseña incorrecta");
    }
  };

  // Valores dinámicos
  const numProyectos = proyectos.length;
  const numAdicionales = adicionales.length;
  const numEstados = 6;

  const apps = [
    {
      id: "cotizador",
      titulo: "Configurador de Presupuestos",
      descripcion: "Genera cotizaciones personalizadas en minutos",
      icono: Calculator,
      color: "from-blue-600 to-blue-800",
      ruta: "/",
      destacado: true,
      stats: [
        { label: "Proyectos", valor: String(numProyectos) },
        { label: "Planes", valor: "2" },
        { label: "Adicionales", valor: String(numAdicionales) },
      ],
      caracteristicas: [
        "PDF automático profesional",
        "Envío de email instantáneo",
        "Integración con WhatsApp",
        "Personalización completa",
      ],
    },
    {
      id: "crm",
      titulo: "CRM Kanban",
      descripcion: "Gestiona leads y cierra ventas con eficiencia",
      icono: Users,
      color: "from-purple-600 to-purple-800",
      ruta: "/crm",
      destacado: true,
      stats: [
        { label: "Estados", valor: String(numEstados) },
        { label: "Drag & Drop", valor: "✓" },
        { label: "Leads Activos", valor: String(totalLeads) },
      ],
      caracteristicas: [
        "Tablero Kanban visual",
        "Sistema de notas integrado",
        "Acciones rápidas (WhatsApp/Email)",
        "Historial automático",
      ],
    },
    {
      id: "admin",
      titulo: "Panel de Analytics",
      descripcion: "Visualiza métricas y toma decisiones data-driven",
      icono: BarChart3,
      color: "from-green-600 to-green-800",
      ruta: "/admin",
      destacado: false,
      stats: [
        { label: "KPIs", valor: "4" },
        { label: "Tiempo real", valor: "✓" },
        { label: "Exportable", valor: "✓" },
      ],
      caracteristicas: [
        "Pipeline total visible",
        "Tasa de conversión",
        "Proyectos más populares",
        "Búsqueda y filtros",
      ],
    },
  ];

  if (mostrarLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-dark via-black to-brand-dark p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md border-2 border-brand-primary bg-brand-card shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]">
            <CardHeader className="pb-3 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary">
                <Lock className="h-8 w-8 text-black" />
              </div>
              <CardTitle className="text-2xl text-brand-text">
                Dashboard Comercial
              </CardTitle>
              <CardDescription className="text-brand-textSecondary">
                Ingresa tu contraseña para acceder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-12 w-full rounded-lg border-2 border-brand-border bg-brand-dark px-4 text-brand-text outline-none transition-all focus:border-brand-primary"
                autoFocus
              />
              <Button
                onClick={handleLogin}
                className="h-12 w-full rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary text-base font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all hover:from-brand-secondary hover:to-brand-primary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
              >
                Acceder al Dashboard
              </Button>
              <p className="text-center text-xs text-brand-textSecondary">
                Acceso restringido al equipo comercial
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-dark p-4 md:p-8">
      {/* Efectos de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-brand-primary/5 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-brand-secondary/5 blur-3xl delay-1000"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/50 bg-brand-primary/20 px-4 py-2">
              <Sparkles className="h-4 w-4 text-brand-primary" />
              <span className="text-sm font-semibold text-brand-primary">
                Sistema Comercial v2.0
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-brand-text md:text-5xl">
              Constructora Colombia
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-brand-textSecondary">
              Tu centro de comando para cotizaciones y gestión de ventas
            </p>
          </motion.div>
        </div>

        {/* Cards de aplicaciones */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {apps.map((app, index) => {
            const IconoApp = app.icono;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={`group cursor-pointer border-2 transition-all duration-300 hover:scale-[1.02] ${
                    app.destacado
                      ? "border-brand-primary shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.5)]"
                      : "border-brand-border hover:border-brand-primary/50"
                  } bg-brand-card`}
                  onClick={() => router.push(app.ruta)}
                >
                  <CardHeader className="pb-4">
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} transition-transform group-hover:scale-110`}
                      >
                        <IconoApp className="h-7 w-7 text-white" />
                      </div>
                      {app.destacado && (
                        <span className="rounded-full bg-brand-primary px-2 py-1 text-xs font-bold text-black">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <CardTitle className="mb-2 text-xl text-brand-text">
                      {app.titulo}
                    </CardTitle>
                    <CardDescription className="text-sm text-brand-textSecondary">
                      {app.descripcion}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {app.stats.map((stat, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-brand-dark p-2 text-center"
                        >
                          <div className="text-lg font-bold text-brand-primary">
                            {stat.valor}
                          </div>
                          <div className="text-xs text-brand-textSecondary">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Características */}
                    <div className="space-y-2">
                      {app.caracteristicas.map((caracteristica, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-brand-textSecondary"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-brand-primary"></div>
                          <span>{caracteristica}</span>
                        </div>
                      ))}
                    </div>

                    {/* Botón de acción */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(app.ruta);
                      }}
                      className={`w-full rounded-lg bg-gradient-to-r ${app.color} py-3 font-semibold text-white transition-all hover:opacity-90 group-hover:shadow-lg`}
                    >
                      Abrir {app.titulo.split(" ")[0]}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Access Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-brand-border bg-brand-card">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-6 w-6 text-brand-primary" />
                  <div>
                    <h3 className="font-semibold text-brand-text">
                      Acceso Rápido
                    </h3>
                    <p className="text-sm text-brand-textSecondary">
                      Atajos del sistema
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => router.push("/centro-operaciones")}
                    className="bg-white font-semibold text-black hover:bg-gray-200"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Centro de Operaciones
                  </Button>
                  <Button
                    onClick={() => router.push("/")}
                    className="border-brand-border bg-white font-semibold text-black hover:bg-gray-200"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Cotizador Web
                  </Button>

                  <Button
                    onClick={() => {
                      localStorage.removeItem("admin_auth");
                      setMostrarLogin(true);
                      setAutenticado(false);
                    }}
                    className="bg-red-600 font-semibold text-white hover:bg-red-700"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-brand-textSecondary">
          <p>Constructora Colombia • Sistema Comercial Integrado</p>
          <p className="mt-1 text-xs">
            Más que una constructora, un aliado para tu hogar
          </p>
        </div>
      </div>
    </div>
  );
}
