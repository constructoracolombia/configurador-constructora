"use client";

import { useRouter } from "next/navigation";
import { proyectos } from "@/lib/data/catalogo";
import { useCotizador } from "@/lib/store/cotizador";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ImagenOptimizada } from "@/components/ImagenOptimizada";
import { MapPin, Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const setProyecto = useCotizador((state) => state.setProyecto);

  const handleProyectoClick = (proyecto: (typeof proyectos)[number]) => {
    setProyecto(proyecto.id);
    router.push(`/plan?proyecto=${encodeURIComponent(proyecto.id)}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-light via-white to-gray-50">
      {/* Hero Section con gradiente dorado */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-primary px-4 py-20 text-white">
        {/* Patrón de fondo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl text-center animate-[fadeIn_0.5s_ease-in]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm animate-[scaleIn_0.3s_ease-out] [text-shadow:_0_1px_2px_rgba(0,0,0,0.3)]">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Cotización en línea 24/7</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl [text-shadow:_0_2px_8px_rgba(0,0,0,0.4)]">
            Cotiza tu Remodelación <br />
            <span className="text-brand-accent [text-shadow:_0_2px_8px_rgba(0,0,0,0.4)]">
              en 3 Minutos
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-xl text-white/90 md:text-2xl [text-shadow:_0_2px_4px_rgba(0,0,0,0.3)]">
            Elige tu proyecto y personaliza tu apartamento VIS con acabados
            premium
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <div className="rounded-lg bg-white/10 px-6 py-3 backdrop-blur-sm">
              <div className="text-3xl font-bold [text-shadow:_0_2px_4px_rgba(0,0,0,0.3)]">
                +100
              </div>
              <div className="text-sm text-white/90 [text-shadow:_0_1px_2px_rgba(0,0,0,0.3)]">
                Proyectos Remodelados
              </div>
            </div>
            <div className="rounded-lg bg-white/10 px-6 py-3 backdrop-blur-sm">
              <div className="text-3xl font-bold [text-shadow:_0_2px_4px_rgba(0,0,0,0.3)]">
                +100
              </div>
              <div className="text-sm text-white/90 [text-shadow:_0_1px_2px_rgba(0,0,0,0.3)]">
                Clientes Satisfechos
              </div>
            </div>
            <div className="rounded-lg bg-white/10 px-6 py-3 backdrop-blur-sm">
              <div className="text-3xl font-bold [text-shadow:_0_2px_4px_rgba(0,0,0,0.3)]">
                5★
              </div>
              <div className="text-sm text-white/90 [text-shadow:_0_1px_2px_rgba(0,0,0,0.3)]">
                Calificación
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Proyectos */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-12 text-center animate-[slideUp_0.4s_ease-out]">
          <h2 className="mb-4 text-3xl font-bold text-brand-dark md:text-4xl">
            Elige tu Proyecto
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Contamos con presencia en los mejores conjuntos residenciales de
            Bucaramanga
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proyecto, index) => (
            <Card
              key={proyecto.id}
              className="group overflow-hidden border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] animate-[slideUp_0.4s_ease-out]"
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
                  {/* Overlay con gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Badge especial para Ciudadela Verde */}
                  {"precioIntermedioEspecial" in proyecto &&
                    proyecto.precioIntermedioEspecial && (
                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-brand-primary px-3 py-1 text-xs font-bold text-brand-dark shadow-[0_4px_14px_0_rgba(255,204,0,0.39)]">
                        <Sparkles className="h-3 w-3" />
                        OFERTA ESPECIAL
                      </div>
                    )}

                  {/* Nombre del proyecto en overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <CardTitle className="mb-1 text-2xl font-bold text-white [text-shadow:_0_2px_4px_rgba(0,0,0,0.4)]">
                      {proyecto.nombre}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-white/90 [text-shadow:_0_1px_2px_rgba(0,0,0,0.3)]">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{proyecto.ubicacion}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardFooter className="bg-white p-6">
                <Button
                  onClick={() => handleProyectoClick(proyecto)}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary py-6 font-semibold text-brand-dark shadow-[0_4px_14px_0_rgba(255,204,0,0.39)] transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-secondary hover:to-brand-primary hover:shadow-[0_10px_40px_0_rgba(255,204,0,0.45)]"
                >
                  Cotizar mi apartamento
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Tarjeta especial - ¿No está tu proyecto? */}
          <Card className="group overflow-hidden border-2 border-dashed border-brand-primary bg-gradient-to-br from-brand-light to-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_10px_40px_0_rgba(255,204,0,0.45)]">
            <CardHeader className="relative overflow-hidden p-0">
              <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10">
                <div className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_4px_14px_0_rgba(255,204,0,0.39)]">
                    <span className="text-4xl">🏢</span>
                  </div>
                  <CardTitle className="mb-2 text-2xl font-bold text-brand-dark">
                    ¿No está tu proyecto?
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Cotizamos en cualquier conjunto residencial de Bucaramanga
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardFooter className="bg-white p-6">
              <Button
                onClick={() =>
                  window.open(
                    "https://wa.me/573175639674?text=Hola,%20quiero%20cotizar%20mi%20apartamento",
                    "_blank"
                  )
                }
                className="w-full rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary py-6 font-semibold text-brand-dark shadow-[0_4px_14px_0_rgba(255,204,0,0.39)] transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-secondary hover:to-brand-primary hover:shadow-[0_10px_40px_0_rgba(255,204,0,0.45)]"
              >
                Escríbenos por WhatsApp
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Sección de beneficios */}
      <section className="bg-gradient-to-br from-brand-light to-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_4px_14px_0_rgba(255,204,0,0.39)]">
                <span className="text-3xl">🏗️</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-brand-dark">
                +4 Años de Experiencia
              </h3>
              <p className="text-gray-600">
                Remodelando apartamentos VIS en Bucaramanga
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_4px_14px_0_rgba(255,204,0,0.39)]">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-brand-dark">
                Entrega Rápida
              </h3>
              <p className="text-gray-600">
                Desde 39 días hábiles según el plan elegido
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_4px_14px_0_rgba(255,204,0,0.39)]">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-brand-dark">
                Garantía de Calidad
              </h3>
              <p className="text-gray-600">
                Todos nuestros proyectos incluyen garantía y seguimiento
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Testimonios */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-brand-dark md:text-4xl">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-lg text-gray-600">
            Más de 100 familias ya confían en nosotros
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Testimonial 1 */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/testimonios/cliente-1.jpg"
                  alt="Cliente"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/64x64/FFCC00/1A1A1A?text=👤";
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-brand-dark">María González</h4>
                <div className="text-sm text-yellow-500">★★★★★</div>
              </div>
            </div>
            <p className="italic text-gray-600">
              &quot;Excelente trabajo, muy profesionales. Mi apartamento quedó
              hermoso y lo entregaron en el tiempo prometido.&quot;
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/testimonios/cliente-2.jpg"
                  alt="Cliente"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/64x64/FFCC00/1A1A1A?text=👤";
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-brand-dark">Carlos Ramírez</h4>
                <div className="text-sm text-yellow-500">★★★★★</div>
              </div>
            </div>
            <p className="italic text-gray-600">
              &quot;La mejor inversión que hice. El equipo fue muy atento y el
              resultado superó mis expectativas.&quot;
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/testimonios/cliente-3.jpg"
                  alt="Cliente"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/64x64/FFCC00/1A1A1A?text=👤";
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-brand-dark">Laura Díaz</h4>
                <div className="text-sm text-yellow-500">★★★★★</div>
              </div>
            </div>
            <p className="italic text-gray-600">
              &quot;Todo el proceso fue transparente desde el inicio. Recomiendo
              100% sus servicios.&quot;
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
