"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  etapa: string;
  presupuesto_estimado: number | null;
};

type EtapaVisual = {
  nombre: string;
  key: string;
  color: string;
  dias: string;
};

type EtapaConDatos = EtapaVisual & {
  cantidad: number;
  leads: Lead[];
};

const ETAPAS_VISUALES: EtapaVisual[] = [
  { nombre: "Prospección", key: "PROSPECCION", color: "blue", dias: "1-3" },
  { nombre: "Primer Contacto", key: "PRIMER_CONTACTO", color: "purple", dias: "3-7" },
  { nombre: "Cotización", key: "COTIZACION", color: "yellow", dias: "7-10" },
  { nombre: "Presentación", key: "PRESENTACION", color: "orange", dias: "10-14" },
  { nombre: "Negociación", key: "NEGOCIACION", color: "teal", dias: "14-21" },
  { nombre: "Cierre", key: "CIERRE", color: "green", dias: "21-30" },
];

export default function CentroOperacionesPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [mostrarLogin, setMostrarLogin] = useState(true);
  const [cargando, setCargando] = useState(false);

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
        .select("id,nombre,etapa,presupuesto_estimado,updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      const leads = ((leadsData || []) as Lead[]).map((lead) => ({
        ...lead,
        presupuesto_estimado: lead.presupuesto_estimado ?? 0,
      }));

      const total = leads.length;
      const prospeccion = leads.filter((l) => l.etapa === "PROSPECCION").length;
      const negociacion = leads.filter((l) => l.etapa === "NEGOCIACION").length;
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
        leads: leads.filter((l) => l.etapa === etapa.key).slice(0, 3),
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

  const getColorClasses = (color: string) => {
    const colores: Record<string, string> = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      teal: "bg-teal-50 border-teal-200 text-teal-700",
      green: "bg-green-50 border-green-200 text-green-700",
    };
    return colores[color] || colores.blue;
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

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card
            className="group cursor-pointer border-0 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => router.push("/")}
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
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="mb-6 text-lg font-bold text-gray-900">Flujo Comercial</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {leadsPorEtapa.map((etapa) => (
                <div
                  key={etapa.key}
                  className={`rounded-xl border-2 p-4 ${getColorClasses(etapa.color)}`}
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

                  {etapa.leads.length > 0 ? (
                    <div className="space-y-2">
                      {etapa.leads.map((lead) => (
                        <div
                          key={lead.id}
                          className="rounded-lg bg-white/60 p-2 text-xs"
                        >
                          <div className="truncate font-medium text-gray-900">
                            {lead.nombre}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            {lead.presupuesto_estimado
                              ? formatoPrecio(lead.presupuesto_estimado)
                              : "Sin presupuesto"}
                          </div>
                        </div>
                      ))}
                      {etapa.cantidad > 3 && (
                        <div className="text-center text-xs text-gray-600">
                          +{etapa.cantidad - 3} más
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-gray-500">
                      Sin leads
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
