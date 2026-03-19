"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { proyectos } from "@/lib/data/catalogo";
import { useCotizador } from "@/lib/store/cotizador";
import { useTrackingParams } from "@/lib/hooks/useTrackingParams";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagenOptimizada } from "@/components/ImagenOptimizada";
import { ExternalLink, Loader2, MapPin, Sparkles } from "lucide-react";

const BROCHURE_URLS: Record<string, string> = {
  "Ciudadela Verde": "https://constructoracolombia.com/brochure_cv",
  Beltramonto: "https://constructoracolombia.com/brochure_beltramonto",
  Fiore: "https://constructoracolombia.com/brochure_fiore",
  Azafrán: "https://constructoracolombia.com/brochure_azafran",
  "Parque Oriente": "https://constructoracolombia.com/brochure_parqueoriente",
  Aurora: "https://constructoracolombia.com/brochure_parqueoriente",
  Montevista: "https://constructoracolombia.com/brochure_parqueoriente",
  Montebello: "https://constructoracolombia.com/brochure_montebello",
  "Alto Tramonti": "https://constructoracolombia.com/brochure_altotramonti",
  "Morada del Viento": "https://constructoracolombia.com/brochure_moradaviento",
  "Fontana de la Sierra": "https://constructoracolombia.com/brochure_fontanasierra",
};

function PresupuestosContent() {
  const trackingParams = useTrackingParams();
  void trackingParams;
  const router = useRouter();
  const setProyecto = useCotizador((state) => state.setProyecto);
  const [loading, setLoading] = useState(false);
  const [proyectoCargando, setProyectoCargando] = useState("");

  const handleProyectoClick = (proyecto: (typeof proyectos)[number]) => {
    const brochureUrl = BROCHURE_URLS[proyecto.nombre];

    setLoading(true);
    setProyectoCargando(proyecto.nombre);

    if (brochureUrl) {
      window.open(brochureUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => {
        setLoading(false);
        setProyectoCargando("");
      }, 1500);
    } else {
      setProyecto(proyecto.id);
      router.push("/plan");
    }
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
                  <ImagenOptimizada
                    src={proyecto.imagen}
                    alt={proyecto.nombre}
                    width={400}
                    height={300}
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
                      {BROCHURE_URLS[proyecto.nombre] && (
                        <ExternalLink className="h-4 w-4" />
                      )}
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
