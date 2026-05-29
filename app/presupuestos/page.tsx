"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { proyectos } from "@/lib/data/catalogo";
import { useCotizador } from "@/lib/store/cotizador";
import { useTrackingParams } from "@/lib/hooks/useTrackingParams";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Sparkles } from "lucide-react";

// ─── tipos CRM ───────────────────────────────────────────────────────────────

type CotizacionCrm = {
  id: string;
  cliente_nombre: string;
  total: number;
  estado_crm: string;
  proyecto_nombre: string | null;
  created_at: string;
};

const ETAPAS_CRM = [
  { key: "NUEVO", label: "Nuevos", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { key: "CORREO_ENVIADO", label: "Correo enviado", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  { key: "CITA_AGENDADA", label: "Cita agendada", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  { key: "EN_SEGUIMIENTO", label: "En seguimiento", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { key: "CONTRATO_FIRMADO", label: "Ganados", color: "bg-green-500/20 text-green-300 border-green-500/30" },
] as const;

const copCrm = (n: number) => "$ " + Math.round(n).toLocaleString("es-CO");

function CrmKanbanMini() {
  const router = useRouter();
  const [cotizaciones, setCotizaciones] = useState<CotizacionCrm[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from("cotizaciones")
        .select("id, cliente_nombre, total, estado_crm, proyecto_nombre, created_at")
        .not("estado_crm", "eq", "PERDIDO")
        .order("created_at", { ascending: false })
        .limit(100);
      setCotizaciones(data || []);
      setCargando(false);
    };
    void cargar();
  }, []);

  if (cargando) {
    return (
      <div className="grid grid-cols-5 gap-3">
        {ETAPAS_CRM.map((e) => (
          <div
            key={e.key}
            className="h-32 animate-pulse rounded-lg border border-brand-border bg-brand-card/50"
          />
        ))}
      </div>
    );
  }

  const porEtapa = (key: string) => cotizaciones.filter((c) => c.estado_crm === key);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {ETAPAS_CRM.map((etapa) => {
          const grupo = porEtapa(etapa.key);
          const visibles = grupo.slice(0, 3);
          const resto = grupo.length - 3;
          return (
            <div
              key={etapa.key}
              className="rounded-lg border border-brand-border bg-brand-card/50 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-1">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${etapa.color}`}
                >
                  {etapa.label}
                </span>
                <span className="text-xs font-bold text-brand-text">{grupo.length}</span>
              </div>

              {visibles.map((cot) => (
                <div
                  key={cot.id}
                  className="mt-1 rounded bg-brand-dark p-2"
                >
                  <p className="truncate text-xs font-bold text-brand-text">
                    {cot.cliente_nombre}
                  </p>
                  {cot.proyecto_nombre && (
                    <p className="truncate text-[10px] text-brand-textSecondary">
                      {cot.proyecto_nombre}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] font-semibold text-brand-primary">
                    {copCrm(cot.total || 0)}
                  </p>
                </div>
              ))}

              {resto > 0 && (
                <p className="mt-1 text-center text-[10px] text-brand-textSecondary">
                  ...y {resto} más
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => router.push("/crm")}
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          Ver CRM completo →
        </button>
      </div>
    </div>
  );
}

function PresupuestosContent() {
  const trackingParams = useTrackingParams();
  void trackingParams;
  const setProyecto = useCotizador((state) => state.setProyecto);
  const [loading, setLoading] = useState(false);
  const [proyectoCargando, setProyectoCargando] = useState("");

  const handleProyectoClick = (proyecto: (typeof proyectos)[number]) => {
    setLoading(true);
    setProyectoCargando(proyecto.nombre);
    const tipoProyecto =
      "tipo" in proyecto && proyecto.tipo === "acabados_premium"
        ? "acabados_premium"
        : "vis_remodelacion";

    localStorage.setItem("proyecto_seleccionado", proyecto.nombre);
    localStorage.setItem("proyecto_tipo", tipoProyecto);
    localStorage.setItem("proyecto_slug", proyecto.id);

    setProyecto(proyecto.id);

    if (tipoProyecto === "acabados_premium") {
      // San Juan: limpiar datos previos de plan/productos para evitar duplicidades
      localStorage.removeItem("plan_seleccionado");
      localStorage.removeItem("productos_seleccionados");
      localStorage.removeItem("cotizador-storage");
      window.location.href = "/adicionales";
      return;
    }

    window.location.href = `/plan?proyecto=${encodeURIComponent(proyecto.nombre)}`;
  };

  return (
    <main className="min-h-screen bg-brand-dark">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="animate-[fadeIn_0.2s_ease-in] text-center">
            <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-brand-primary" />
            <p className="text-xl font-semibold text-brand-text">
              Cargando {proyectoCargando}...
            </p>
            <p className="mt-2 text-brand-textSecondary">
              Preparando tu experiencia personalizada
            </p>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden bg-gradient-to-br from-black via-brand-dark to-brand-card px-4 py-20 text-brand-text">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-brand-primary blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-primary blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl animate-[fadeIn_0.5s_ease-in] text-center">
          <div className="glass-effect animate-[scaleIn_0.3s_ease-out] mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2">
            <Sparkles className="h-5 w-5 text-brand-primary" />
            <span className="text-sm font-medium text-brand-text">
              Cotización en línea 24/7
            </span>
          </div>

          <h1 className="text-shadow-dark mb-6 text-5xl font-bold leading-tight md:text-6xl">
            Cotiza tu Remodelación <br />
            <span className="text-shadow-gold text-brand-primary">
              en 3 Minutos
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-xl text-brand-textSecondary md:text-2xl">
            Elige tu proyecto y personaliza tu apartamento VIS con acabados
            premium
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <div className="glass-effect rounded-xl px-6 py-3">
              <div className="text-3xl font-bold text-brand-primary">+100</div>
              <div className="text-sm text-brand-textSecondary">
                Proyectos Remodelados
              </div>
            </div>
            <div className="glass-effect rounded-xl px-6 py-3">
              <div className="text-3xl font-bold text-brand-primary">+100</div>
              <div className="text-sm text-brand-textSecondary">
                Clientes Satisfechos
              </div>
            </div>
            <div className="glass-effect rounded-xl px-6 py-3">
              <div className="text-3xl font-bold text-brand-primary">5★</div>
              <div className="text-sm text-brand-textSecondary">Calificación</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-10">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-brand-text">
            Pipeline Comercial
          </h2>
          <p className="text-brand-textSecondary text-sm">
            Seguimiento de leads por etapa
          </p>
        </div>
        <CrmKanbanMini />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-12 animate-[slideUp_0.4s_ease-out] text-center">
          <h2 className="mb-4 text-3xl font-bold text-brand-text md:text-4xl">
            Elige tu Proyecto
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-brand-textSecondary">
            Contamos con presencia en los mejores conjuntos residenciales de
            Bucaramanga
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proyecto, index) => (
            <Card
              key={proyecto.id}
              className="group animate-[slideUp_0.4s_ease-out] overflow-hidden border border-brand-border bg-brand-card shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-brand-primary hover:shadow-[0_8px_24px_rgba(255,184,0,0.2)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="relative overflow-hidden p-0">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={proyecto.imagen}
                    alt={proyecto.nombre}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {"precioIntermedioEspecial" in proyecto &&
                    proyecto.precioIntermedioEspecial && (
                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-brand-primary px-3 py-1 text-xs font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]">
                        <Sparkles className="h-3 w-3" />
                        OFERTA ESPECIAL
                      </div>
                    )}

                  <div className="absolute bottom-4 left-4 right-4">
                    <CardTitle className="text-shadow-dark mb-1 text-2xl font-bold text-white">
                      {proyecto.nombre}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-white/90">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{proyecto.ubicacion}</span>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 origin-left scale-x-0 bg-brand-primary transition-transform duration-300 group-hover:scale-x-100" />
                </div>
              </CardHeader>

              <CardFooter className="bg-brand-card p-6">
                <Button
                  onClick={() => handleProyectoClick(proyecto)}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-6 font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all duration-300 hover:scale-105 hover:bg-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] disabled:pointer-events-none disabled:opacity-60"
                >
                  {loading && proyectoCargando === proyecto.nombre ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      Cotizar mi apartamento
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}

          <Card className="group overflow-hidden border-2 border-dashed border-brand-primary bg-brand-card shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]">
            <CardHeader className="relative overflow-hidden p-0">
              <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10">
                <div className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]">
                    <span className="text-4xl">🏢</span>
                  </div>
                  <CardTitle className="mb-2 text-2xl font-bold text-brand-text">
                    ¿No está tu proyecto?
                  </CardTitle>
                  <p className="text-sm text-brand-textSecondary">
                    Cotizamos en cualquier conjunto residencial de Bucaramanga
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardFooter className="bg-brand-card p-6">
              <Button
                onClick={() =>
                  window.open(
                    "https://wa.me/573175639674?text=Hola,%20quiero%20cotizar%20mi%20apartamento",
                    "_blank"
                  )
                }
                className="w-full rounded-xl bg-brand-primary py-6 font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all duration-300 hover:scale-105 hover:bg-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
              >
                Escríbenos por WhatsApp
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="border-t border-brand-border bg-brand-dark px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all hover:border-brand-primary hover:shadow-[0_8px_24px_rgba(255,184,0,0.2)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]">
                <span className="text-3xl">🏗️</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-brand-text">
                +4 Años de Experiencia
              </h3>
              <p className="text-brand-textSecondary">
                Remodelando apartamentos VIS en Bucaramanga
              </p>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all hover:border-brand-primary hover:shadow-[0_8px_24px_rgba(255,184,0,0.2)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-brand-text">
                Entrega Rápida
              </h3>
              <p className="text-brand-textSecondary">
                Desde 39 días hábiles según el plan elegido
              </p>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all hover:border-brand-primary hover:shadow-[0_8px_24px_rgba(255,184,0,0.2)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-brand-text">
                Garantía de Calidad
              </h3>
              <p className="text-brand-textSecondary">
                Todos nuestros proyectos incluyen garantía y seguimiento
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-brand-border px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-brand-text md:text-4xl">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-lg text-brand-textSecondary">
            Más de 100 familias ya confían en nosotros
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all hover:border-brand-primary hover:shadow-[0_8px_24px_rgba(255,184,0,0.2)]">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/testimonios/michael-correa.jpg"
                  alt="Michael Correa"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/64x64/FFB800/0C0C0C?text=MC";
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-brand-text">Michael Correa</h4>
                <div className="text-sm text-brand-primary">★★★★★</div>
              </div>
            </div>
            <p className="italic text-brand-textSecondary">
              &quot;Excelente trabajo, muy profesionales. Mi apartamento quedó
              hermoso y lo entregaron en el tiempo prometido.&quot;
            </p>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all hover:border-brand-primary hover:shadow-[0_8px_24px_rgba(255,184,0,0.2)]">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/testimonios/liliana-sanchez.jpg"
                  alt="Liliana Sánchez"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/64x64/FFB800/0C0C0C?text=LS";
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-brand-text">Liliana Sánchez</h4>
                <div className="text-sm text-brand-primary">★★★★★</div>
              </div>
            </div>
            <p className="italic text-brand-textSecondary">
              &quot;La mejor inversión que hice. El equipo fue muy atento y el
              resultado superó mis expectativas.&quot;
            </p>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all hover:border-brand-primary hover:shadow-[0_8px_24px_rgba(255,184,0,0.2)]">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/testimonios/alexandra-pimiento.JPG"
                  alt="Alexandra Pimiento"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/64x64/FFB800/0C0C0C?text=AP";
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-brand-text">Alexandra Pimiento</h4>
                <div className="text-sm text-brand-primary">★★★★★</div>
              </div>
            </div>
            <p className="italic text-brand-textSecondary">
              &quot;Todo el proceso fue transparente desde el inicio. Recomiendo
              100% sus servicios.&quot;
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PresupuestosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-brand-dark text-brand-text">
          Cargando...
        </div>
      }
    >
      <PresupuestosContent />
    </Suspense>
  );
}
