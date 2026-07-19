"use client";

import { useEffect, useState } from "react";
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
  campaign_id: string | null;
  total_leads: number;
  en_prospeccion: number;
  en_negociacion: number;
  cerrados: number;
  perdidos: number;
  pipeline_total: number;
  tasa_conversion: number;
  origen: string;
  contenidos: string[];
  // Metricas de Meta
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
}

export default function PautasPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const [campanas, setCampanas] = useState<CampanaMetrics[]>([]);
  const [filtroOrigen, setFiltroOrigen] = useState("TODOS");
  const [filtroFecha, setFiltroFecha] = useState("30");
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState<string | null>(null);

  const [kpisGenerales, setKpisGenerales] = useState({
    total_leads_pautas: 0,
    leads_meta: 0,
    leads_google: 0,
    pipeline_total: 0,
    conversion_promedio: 0,
    total_campanas: 0,
  });

  useEffect(() => {
    void cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroOrigen, filtroFecha]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - Number.parseInt(filtroFecha, 10));

      const { data: metricasMeta } = await supabase
        .from("meta_campaign_insights")
        .select("*")
        .gte("date_start", fechaInicio.toISOString().split("T")[0])
        .order("date_start", { ascending: false });

      let queryLeads = supabase
        .from("leads")
        .select("*")
        .not("utm_campaign", "is", null)
        .gte("created_at", fechaInicio.toISOString());

      if (filtroOrigen !== "TODOS") {
        queryLeads = queryLeads.eq("origen", filtroOrigen);
      }

      const { data: leadsConPauta } = await queryLeads;
      const leads = leadsConPauta || [];

      const campanasMetaMap = new Map<string, any>();

      (metricasMeta || []).forEach((metrica: any) => {
        const campanaName = metrica.campaign_name;
        if (!campanasMetaMap.has(campanaName)) {
          campanasMetaMap.set(campanaName, {
            campana: campanaName,
            campaign_id: metrica.campaign_id || null,
            total_leads: 0,
            en_prospeccion: 0,
            en_negociacion: 0,
            cerrados: 0,
            perdidos: 0,
            pipeline_total: 0,
            origen: "PAUTA_META",
            contenidos: new Set<string>(),
            spend: Number(metrica.spend || 0),
            impressions: Number(metrica.impressions || 0),
            clicks: Number(metrica.clicks || 0),
            ctr: Number(metrica.ctr || 0),
            cpc: Number(metrica.cpc || 0),
          });
        } else {
          const campana = campanasMetaMap.get(campanaName);
          campana.spend += Number(metrica.spend || 0);
          campana.impressions += Number(metrica.impressions || 0);
          campana.clicks += Number(metrica.clicks || 0);
          campana.ctr = campana.impressions > 0 ? (campana.clicks / campana.impressions) * 100 : 0;
          campana.cpc = campana.clicks > 0 ? campana.spend / campana.clicks : 0;
        }
      });

      leads.forEach((lead: any) => {
        const campanaName = lead.utm_campaign || "Sin campaña";
        if (!campanasMetaMap.has(campanaName)) {
          campanasMetaMap.set(campanaName, {
            campana: campanaName,
            campaign_id: null,
            total_leads: 0,
            en_prospeccion: 0,
            en_negociacion: 0,
            cerrados: 0,
            perdidos: 0,
            pipeline_total: 0,
            origen: lead.origen || "WEB",
            contenidos: new Set<string>(),
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpc: 0,
          });
        }

        const campana = campanasMetaMap.get(campanaName);
        campana.total_leads++;

        if (lead.etapa === "PROSPECCION") campana.en_prospeccion++;
        if (lead.etapa === "NEGOCIACION") campana.en_negociacion++;
        if (lead.etapa === "CIERRE") campana.cerrados++;
        if (lead.etapa === "PERDIDO" || lead.etapa === "DESCALIFICADO") {
          campana.perdidos++;
        }

        if (!["PERDIDO", "DESCALIFICADO"].includes(lead.etapa)) {
          campana.pipeline_total += lead.presupuesto_estimado || 0;
        }

        if (lead.utm_content) {
          campana.contenidos.add(lead.utm_content);
        }
      });

      const campanasArray: CampanaMetrics[] = Array.from(campanasMetaMap.values()).map(
        (c) => ({
          ...c,
          contenidos: Array.from(c.contenidos),
          tasa_conversion: c.total_leads > 0 ? (c.cerrados / c.total_leads) * 100 : 0,
        })
      );

      campanasArray.sort((a, b) => {
        if (b.total_leads !== a.total_leads) {
          return b.total_leads - a.total_leads;
        }
        return b.spend - a.spend;
      });
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
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  const sincronizarConMeta = async () => {
    setSincronizando(true);
    try {
      const response = await fetch("/api/meta-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dias: Number.parseInt(filtroFecha, 10) }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.synced} campañas sincronizadas con Meta`);
        setUltimaSync(new Date().toLocaleString("es-CO"));
        await cargarDatos();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error de conexión con Meta");
    } finally {
      setSincronizando(false);
    }
  };

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
              onClick={() => void supabase.auth.signOut().then(() => router.push("/login"))}
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

              <Button
                onClick={() => void sincronizarConMeta()}
                disabled={sincronizando}
                className="bg-purple-600 text-white hover:bg-purple-700"
                size="sm"
              >
                {sincronizando ? "Sincronizando..." : "🔄 Sincronizar con Meta"}
              </Button>

              <Button
                onClick={async () => {
                  const response = await fetch("/api/meta-sync", {
                    method: "GET",
                  });
                  const data = await response.json();
                  console.log("Meta API Status:", data);

                  const testResponse = await fetch("/api/meta-test");
                  const testData = await testResponse.json();
                  console.log("Test Result:", testData);
                  alert(JSON.stringify(testData, null, 2));
                }}
                variant="outline"
                size="sm"
              >
                🔍 Test Conexión Meta
              </Button>

              {ultimaSync && (
                <span className="text-xs text-gray-500">Última sync: {ultimaSync}</span>
              )}
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
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Gasto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                      CPL
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                      ROI %
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
                      <td className="px-4 py-4 text-right text-gray-600">
                        {campana.spend > 0 ? formatoPrecio(campana.spend) : "-"}
                      </td>
                      <td className="px-4 py-4 text-center font-medium">
                        {campana.spend > 0 && campana.total_leads > 0
                          ? formatoPrecio(campana.spend / campana.total_leads)
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-center font-bold">
                        {(() => {
                          if (campana.spend === 0) return "-";

                          const ingresosCerrados =
                            campana.cerrados *
                            (campana.pipeline_total / Math.max(campana.total_leads, 1));
                          const roi = ((ingresosCerrados - campana.spend) / campana.spend) * 100;

                          return (
                            <span className={roi >= 0 ? "text-green-600" : "text-red-600"}>
                              {roi >= 0 ? "+" : ""}
                              {roi.toFixed(0)}%
                            </span>
                          );
                        })()}
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

        {/* Grid de Campañas Detalladas */}
        {campanas.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {campanas.map((campana) => {
              const tieneMetricas = campana.spend > 0;
              const tieneLeads = campana.total_leads > 0;
              const cpl = tieneMetricas && tieneLeads ? campana.spend / campana.total_leads : 0;
              const ingresosCerrados =
                campana.cerrados * (campana.pipeline_total / Math.max(campana.total_leads, 1));
              const roi =
                tieneMetricas && campana.spend > 0
                  ? ((ingresosCerrados - campana.spend) / campana.spend) * 100
                  : 0;

              return (
                <Card key={campana.campana} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-1 text-base font-bold text-gray-900">
                          {campana.campana}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              campana.origen === "PAUTA_META"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {campana.origen.replace("PAUTA_", "")}
                          </span>
                          {campana.contenidos.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {campana.contenidos.length} creativos
                            </span>
                          )}
                          {!tieneLeads && tieneMetricas && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                              Sin conversiones aún
                            </span>
                          )}
                        </div>
                      </div>
                      {tieneMetricas && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatoPrecio(campana.spend)}
                          </div>
                          <div className="text-xs text-gray-500">Invertido</div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Métricas principales */}
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div
                        className={`rounded-lg p-3 text-center ${
                          tieneLeads ? "bg-blue-50" : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`text-2xl font-bold ${
                            tieneLeads ? "text-blue-600" : "text-gray-400"
                          }`}
                        >
                          {campana.total_leads}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">Leads</div>
                      </div>
                      <div
                        className={`rounded-lg p-3 text-center ${
                          campana.cerrados > 0 ? "bg-green-50" : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`text-2xl font-bold ${
                            campana.cerrados > 0 ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {campana.cerrados}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">Cerrados</div>
                      </div>
                      <div
                        className={`rounded-lg p-3 text-center ${
                          campana.tasa_conversion > 0 ? "bg-purple-50" : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`text-2xl font-bold ${
                            campana.tasa_conversion > 0 ? "text-purple-600" : "text-gray-400"
                          }`}
                        >
                          {campana.tasa_conversion.toFixed(1)}%
                        </div>
                        <div className="mt-1 text-xs text-gray-600">Conversión</div>
                      </div>
                    </div>

                    {/* Métricas de Meta Ads */}
                    {tieneMetricas && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="mb-3 text-xs font-medium text-gray-700">
                          📊 Métricas de Meta Ads
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-1 text-xs text-gray-500">Impresiones</div>
                            <div className="font-semibold text-gray-900">
                              {campana.impressions.toLocaleString("es-CO")}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-gray-500">Clicks</div>
                            <div className="font-semibold text-gray-900">
                              {campana.clicks.toLocaleString("es-CO")}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-gray-500">
                              CTR (Click-Through Rate)
                            </div>
                            <div className="font-semibold text-gray-900">
                              {campana.ctr.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-gray-500">
                              CPC (Costo por Click)
                            </div>
                            <div className="font-semibold text-gray-900">
                              {formatoPrecio(campana.cpc)}
                            </div>
                          </div>
                        </div>

                        {/* ROI y CPL destacados - solo si hay leads */}
                        {tieneLeads && (
                          <div className="grid grid-cols-2 gap-4 border-t pt-3">
                            <div className="rounded-lg bg-orange-50 p-3 text-center">
                              <div className="mb-1 text-xs text-gray-600">CPL (Costo por Lead)</div>
                              <div className="text-lg font-bold text-orange-600">
                                {formatoPrecio(cpl)}
                              </div>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-3 text-center">
                              <div className="mb-1 text-xs text-gray-600">ROI</div>
                              <div
                                className={`text-lg font-bold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {roi >= 0 ? "+" : ""}
                                {roi.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        )}

                        {!tieneLeads && (
                          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <div className="flex items-start gap-2">
                              <span className="text-lg text-blue-600">ℹ️</span>
                              <div className="flex-1">
                                <div className="text-xs font-medium text-blue-900">
                                  Campaña activa sin conversiones
                                </div>
                                <div className="mt-1 text-xs text-blue-700">
                                  Has invertido {formatoPrecio(campana.spend)} con {campana.clicks}{" "}
                                  clicks.
                                  {campana.clicks > 0 &&
                                    ` CPL estimado al primer lead: ${formatoPrecio(campana.spend)}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Creativos */}
                    {campana.contenidos.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <div className="mb-2 text-xs font-medium text-gray-700">Creativos:</div>
                        <div className="flex flex-wrap gap-2">
                          {campana.contenidos.map((contenido, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                            >
                              {contenido}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Distribución de leads */}
                    <div className="mt-4 border-t pt-4">
                      <div className="mb-2 text-xs font-medium text-gray-700">Pipeline:</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Prospección</span>
                          <span className="font-medium">{campana.en_prospeccion} leads</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Negociación</span>
                          <span className="font-medium text-orange-600">
                            {campana.en_negociacion} leads
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2 text-xs">
                          <span className="font-medium text-gray-700">Pipeline Total</span>
                          <span className="font-bold text-gray-900">
                            {formatoPrecio(campana.pipeline_total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Alerta de rendimiento */}
                    {tieneMetricas && (
                      <div className="mt-4 border-t pt-4">
                        {cpl > 50000 && (
                          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <span className="text-lg text-amber-600">⚠️</span>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-amber-900">CPL elevado</div>
                              <div className="mt-1 text-xs text-amber-700">
                                El costo por lead está por encima del promedio recomendado
                              </div>
                            </div>
                          </div>
                        )}
                        {campana.tasa_conversion >= 15 && (
                          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                            <span className="text-lg text-green-600">🎯</span>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-green-900">
                                Excelente conversión
                              </div>
                              <div className="mt-1 text-xs text-green-700">
                                Esta campaña está superando el benchmark de conversión
                              </div>
                            </div>
                          </div>
                        )}
                        {roi >= 100 && (
                          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <span className="text-lg text-emerald-600">💰</span>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-emerald-900">
                                ROI sobresaliente
                              </div>
                              <div className="mt-1 text-xs text-emerald-700">
                                Cada peso invertido genera más del doble en retorno
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Análisis de Creativos */}
        {campanas.length > 0 && (
          <Card className="mt-6 border-0 shadow-sm">
            <CardHeader>
              <CardTitle>🎨 Análisis de Creativos</CardTitle>
              <p className="mt-1 text-sm text-gray-600">
                Rendimiento por tipo de contenido (utm_content)
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                type CreativoMetric = {
                  contenido: string;
                  total_leads: number;
                  cerrados: number;
                  campanas: string[];
                };
                const creativosMap = new Map<string, CreativoMetric>();

                campanas.forEach((campana) => {
                  campana.contenidos.forEach((contenido: string) => {
                    if (!creativosMap.has(contenido)) {
                      creativosMap.set(contenido, {
                        contenido,
                        total_leads: 0,
                        cerrados: 0,
                        campanas: [],
                      });
                    }

                    const creativo = creativosMap.get(contenido);
                    if (!creativo) return;
                    const divisor = Math.max(campana.contenidos.length, 1);
                    const leadsDelContenido = Math.floor(campana.total_leads / divisor);
                    const cerradosDelContenido = Math.floor(campana.cerrados / divisor);

                    creativo.total_leads += leadsDelContenido;
                    creativo.cerrados += cerradosDelContenido;
                    creativo.campanas.push(campana.campana);
                  });
                });

                const creativos = Array.from(creativosMap.values())
                  .sort((a, b) => b.total_leads - a.total_leads)
                  .slice(0, 10);

                return (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {creativos.map((creativo, idx) => {
                      const conversion =
                        creativo.total_leads > 0
                          ? (creativo.cerrados / creativo.total_leads) * 100
                          : 0;

                      return (
                        <div
                          key={idx}
                          className="rounded-xl border-2 border-gray-200 p-4 transition-colors hover:border-purple-300"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-1 text-sm font-semibold text-gray-900">
                                {creativo.contenido}
                              </div>
                              <div className="text-xs text-gray-500">
                                {creativo.campanas.length} campaña(s)
                              </div>
                            </div>
                            <div
                              className={`text-lg ${
                                conversion >= 15
                                  ? "text-green-600"
                                  : conversion >= 10
                                    ? "text-orange-600"
                                    : "text-gray-600"
                              }`}
                            >
                              {conversion >= 15 ? "🔥" : conversion >= 10 ? "👍" : "📊"}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-lg font-bold text-blue-600">
                                {creativo.total_leads}
                              </div>
                              <div className="text-xs text-gray-600">Leads</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-600">
                                {creativo.cerrados}
                              </div>
                              <div className="text-xs text-gray-600">Cerrados</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-purple-600">
                                {conversion.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-600">Conv.</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Análisis Comparativo */}
        {campanas.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">📊 Análisis Comparativo</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Mejor ROI */}
              <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="text-lg">💰</span>
                    Mejor ROI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    type RoiCampana = CampanaMetrics & { roi: number };
                    const campanasConROI: RoiCampana[] = campanas
                      .map((c) => {
                        if (c.spend === 0) return null;
                        const ingresos = c.cerrados * (c.pipeline_total / Math.max(c.total_leads, 1));
                        const roi = ((ingresos - c.spend) / c.spend) * 100;
                        return { ...c, roi };
                      })
                      .filter((c): c is RoiCampana => c !== null && c.roi > 0)
                      .sort((a, b) => b.roi - a.roi)
                      .slice(0, 3);

                    return campanasConROI.length > 0 ? (
                      <div className="space-y-3">
                        {campanasConROI.map((c, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="truncate text-xs font-medium text-gray-900">
                                {c.campana}
                              </div>
                              <div className="text-xs text-gray-600">
                                {c.cerrados} cerrados de {c.total_leads} leads
                              </div>
                            </div>
                            <div className="ml-2 text-right">
                              <div className="text-sm font-bold text-green-600">
                                +{c.roi.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-gray-500">
                        Sin datos de ROI aún
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Mejor CPL */}
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="text-lg">💵</span>
                    Menor CPL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    type CplCampana = CampanaMetrics & { cpl: number };
                    const campanasConCPL: CplCampana[] = campanas
                      .map((c) => {
                        if (c.spend === 0 || c.total_leads === 0) return null;
                        const cpl = c.spend / c.total_leads;
                        return { ...c, cpl };
                      })
                      .filter((c): c is CplCampana => c !== null)
                      .sort((a, b) => a.cpl - b.cpl)
                      .slice(0, 3);

                    return campanasConCPL.length > 0 ? (
                      <div className="space-y-3">
                        {campanasConCPL.map((c, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="truncate text-xs font-medium text-gray-900">
                                {c.campana}
                              </div>
                              <div className="text-xs text-gray-600">
                                {c.total_leads} leads generados
                              </div>
                            </div>
                            <div className="ml-2 text-right">
                              <div className="text-sm font-bold text-blue-600">
                                {formatoPrecio(c.cpl)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-gray-500">
                        Sin datos de CPL aún
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Mayor Conversión */}
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="text-lg">🎯</span>
                    Mayor Conversión
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...campanas]
                      .sort((a, b) => b.tasa_conversion - a.tasa_conversion)
                      .slice(0, 3)
                      .map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="truncate text-xs font-medium text-gray-900">
                              {c.campana}
                            </div>
                            <div className="text-xs text-gray-600">
                              {c.cerrados} de {c.total_leads} convertidos
                            </div>
                          </div>
                          <div className="ml-2 text-right">
                            <div className="text-sm font-bold text-purple-600">
                              {c.tasa_conversion.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Más Leads */}
              <Card className="border-0 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="text-lg">📈</span>
                    Más Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...campanas]
                      .sort((a, b) => b.total_leads - a.total_leads)
                      .slice(0, 3)
                      .map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="truncate text-xs font-medium text-gray-900">
                              {c.campana}
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatoPrecio(c.pipeline_total)} pipeline
                            </div>
                          </div>
                          <div className="ml-2 text-right">
                            <div className="text-sm font-bold text-orange-600">
                              {c.total_leads} leads
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
