"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Target,
  DollarSign,
  Users,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";

interface CampanaMetrics {
  campana: string;
  total_leads: number;
  en_prospeccion: number;
  en_negociacion: number;
  cerrados: number;
  perdidos: number;
  pipeline_total: number;
  tasa_conversion: number;
  origen: string;
  contenidos: string[];
}

export default function PautasPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [mostrarLogin, setMostrarLogin] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [campanas, setCampanas] = useState<CampanaMetrics[]>([]);
  const [filtroOrigen, setFiltroOrigen] = useState("TODOS");
  const [filtroFecha, setFiltroFecha] = useState("30");

  const [kpisGenerales, setKpisGenerales] = useState({
    total_leads_pautas: 0,
    leads_meta: 0,
    leads_google: 0,
    pipeline_total: 0,
    conversion_promedio: 0,
    total_campanas: 0,
  });

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setAutenticado(true);
      setMostrarLogin(false);
    }
  }, []);

  useEffect(() => {
    if (autenticado) {
      void cargarDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, filtroOrigen, filtroFecha]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - Number.parseInt(filtroFecha, 10));

      let query = supabase
        .from("leads")
        .select("*")
        .not("utm_campaign", "is", null)
        .gte("created_at", fechaInicio.toISOString());

      if (filtroOrigen !== "TODOS") {
        query = query.eq("origen", filtroOrigen);
      }

      const { data: leadsConPauta } = await query;
      const leads = leadsConPauta || [];

      const campanaMap = new Map<string, any>();

      leads.forEach((lead) => {
        const campana = lead.utm_campaign || "Sin campaña";

        if (!campanaMap.has(campana)) {
          campanaMap.set(campana, {
            campana,
            total_leads: 0,
            en_prospeccion: 0,
            en_negociacion: 0,
            cerrados: 0,
            perdidos: 0,
            pipeline_total: 0,
            origen: lead.origen || "Desconocido",
            contenidos: new Set<string>(),
          });
        }

        const metrics = campanaMap.get(campana);
        metrics.total_leads++;

        if (lead.etapa === "PROSPECCION") metrics.en_prospeccion++;
        if (lead.etapa === "NEGOCIACION") metrics.en_negociacion++;
        if (lead.etapa === "CIERRE") metrics.cerrados++;
        if (lead.etapa === "PERDIDO" || lead.etapa === "DESCALIFICADO") {
          metrics.perdidos++;
        }

        if (!["PERDIDO", "DESCALIFICADO"].includes(lead.etapa)) {
          metrics.pipeline_total += lead.presupuesto_estimado || 0;
        }

        if (lead.utm_content) {
          metrics.contenidos.add(lead.utm_content);
        }
      });

      const campanasArray: CampanaMetrics[] = Array.from(campanaMap.values()).map(
        (c) => ({
          ...c,
          contenidos: Array.from(c.contenidos),
          tasa_conversion: c.total_leads > 0 ? (c.cerrados / c.total_leads) * 100 : 0,
        })
      );

      campanasArray.sort((a, b) => b.total_leads - a.total_leads);
      setCampanas(campanasArray);

      const totalLeadsPautas = leads.length;
      const leadsMeta = leads.filter((l) => l.origen === "PAUTA_META").length;
      const leadsGoogle = leads.filter((l) => l.origen === "PAUTA_GOOGLE").length;
      const pipelineTotal = leads
        .filter((l) => !["PERDIDO", "DESCALIFICADO"].includes(l.etapa))
        .reduce((sum, l) => sum + (l.presupuesto_estimado || 0), 0);
      const totalCerrados = leads.filter((l) => l.etapa === "CIERRE").length;
      const conversionPromedio =
        totalLeadsPautas > 0 ? (totalCerrados / totalLeadsPautas) * 100 : 0;

      setKpisGenerales({
        total_leads_pautas: totalLeadsPautas,
        leads_meta: leadsMeta,
        leads_google: leadsGoogle,
        pipeline_total: pipelineTotal,
        conversion_promedio: conversionPromedio,
        total_campanas: campanasArray.length,
      });
    } catch (error) {
      console.error("Error cargando datos de pautas:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = () => {
    if (password === "admin2026") {
      setAutenticado(true);
      setMostrarLogin(false);
      localStorage.setItem("admin_auth", "true");
      void cargarDatos();
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const topConversion = useMemo(
    () => [...campanas].sort((a, b) => b.tasa_conversion - a.tasa_conversion).slice(0, 3),
    [campanas]
  );
  const topLeads = useMemo(
    () => [...campanas].sort((a, b) => b.total_leads - a.total_leads).slice(0, 3),
    [campanas]
  );
  const topPipeline = useMemo(
    () => [...campanas].sort((a, b) => b.pipeline_total - a.pipeline_total).slice(0, 3),
    [campanas]
  );

  if (mostrarLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Análisis de Pautas
              </h1>
              <p className="text-sm text-gray-600">
                Rendimiento de campañas Meta Ads
              </p>
            </div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="mb-4 h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <Button
              onClick={handleLogin}
              className="h-12 w-full bg-purple-600 hover:bg-purple-700"
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
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                className="text-gray-600"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Análisis de Pautas</h1>
                <p className="text-sm text-gray-500">
                  Rendimiento de campañas publicitarias
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                localStorage.removeItem("admin_auth");
                setAutenticado(false);
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

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold text-gray-900">
                {kpisGenerales.total_leads_pautas}
              </div>
              <div className="text-sm text-gray-600">Leads de Pautas</div>
              <div className="mt-2 text-xs text-gray-500">
                Meta: {kpisGenerales.leads_meta} • Google: {kpisGenerales.leads_google}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold text-gray-900">
                {kpisGenerales.total_campanas}
              </div>
              <div className="text-sm text-gray-600">Campañas Activas</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold text-gray-900">
                {kpisGenerales.conversion_promedio.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Conversión Promedio</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mb-1 text-2xl font-bold text-gray-900">
                {formatoPrecio(kpisGenerales.pipeline_total)}
              </div>
              <div className="text-sm text-gray-600">Pipeline de Pautas</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>

              <select
                value={filtroOrigen}
                onChange={(e) => setFiltroOrigen(e.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="TODOS">Todos los orígenes</option>
                <option value="PAUTA_META">Meta Ads</option>
                <option value="PAUTA_GOOGLE">Google Ads</option>
              </select>

              <select
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="60">Últimos 60 días</option>
                <option value="90">Últimos 90 días</option>
              </select>

              <Button
                onClick={() => void cargarDatos()}
                variant="outline"
                size="sm"
                disabled={cargando}
              >
                {cargando ? "Cargando..." : "Actualizar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Rendimiento por Campaña</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Campaña
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                      Total Leads
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                      Prospección
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                      Negociación
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                      Cerrados
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                      Conv. %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Pipeline
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Origen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campanas.map((campana) => (
                    <tr key={campana.campana} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{campana.campana}</div>
                        {campana.contenidos.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            Contenidos: {campana.contenidos.slice(0, 2).join(", ")}
                            {campana.contenidos.length > 2 &&
                              ` +${campana.contenidos.length - 2}`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-900">
                        {campana.total_leads}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600">
                        {campana.en_prospeccion}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-orange-600">
                        {campana.en_negociacion}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-green-600">
                        {campana.cerrados}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`font-semibold ${
                            campana.tasa_conversion >= 15
                              ? "text-green-600"
                              : campana.tasa_conversion >= 10
                                ? "text-orange-600"
                                : "text-gray-600"
                          }`}
                        >
                          {campana.tasa_conversion.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900">
                        {formatoPrecio(campana.pipeline_total)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            campana.origen === "PAUTA_META"
                              ? "bg-purple-100 text-purple-700"
                              : campana.origen === "PAUTA_GOOGLE"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {campana.origen.replace("PAUTA_", "")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {campanas.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="font-medium">No hay datos de campañas</p>
                  <p className="mt-2 text-sm">
                    Los leads con parámetros UTM aparecerán aquí
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {campanas.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">🏆 Mayor Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                {topConversion.map((c, i) => (
                  <div key={`${c.campana}-${i}`} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {c.campana}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {c.tasa_conversion.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">📈 Más Leads</CardTitle>
              </CardHeader>
              <CardContent>
                {topLeads.map((c, i) => (
                  <div key={`${c.campana}-${i}`} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {c.campana}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {c.total_leads} leads
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">💰 Mayor Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                {topPipeline.map((c, i) => (
                  <div key={`${c.campana}-${i}`} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {c.campana}
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {formatoPrecio(c.pipeline_total)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
