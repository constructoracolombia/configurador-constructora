"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { proyectos, planesBase } from "@/lib/data/catalogo";
import { formatoPrecio } from "@/lib/utils/format";
import { useCotizador } from "@/lib/store/cotizador";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getProyectoNombre(proyectoId: string | null): string {
  if (!proyectoId) return "";
  const proyecto = proyectos.find((p) => p.id === proyectoId);
  return proyecto?.nombre ?? proyectoId;
}

function getPrecioPlanIntermedio(proyectoId: string | null): number {
  return proyectoId === "ciudadela-verde"
    ? planesBase.intermedio.precioCiudadelaVerde
    : planesBase.intermedio.precio;
}

function isCiudadelaVerde(proyectoId: string | null): boolean {
  return proyectoId === "ciudadela-verde";
}

function PlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proyectoId = searchParams.get("proyecto");
  const proyectoNombre = getProyectoNombre(proyectoId);

  const setProyecto = useCotizador((s) => s.setProyecto);
  const setPlanBase = useCotizador((s) => s.setPlanBase);

  useEffect(() => {
    if (proyectoId && !useCotizador.getState().proyecto) {
      setProyecto(proyectoId);
    }
  }, [proyectoId, setProyecto]);

  const precioIntermedio = getPrecioPlanIntermedio(proyectoId);
  const mostrarAhorro = isCiudadelaVerde(proyectoId);
  const ahorro = planesBase.intermedio.precio - planesBase.intermedio.precioCiudadelaVerde;

  const handleElegirPlan = (plan: "basico" | "intermedio") => {
    setPlanBase(plan);
    router.push("/personalizar");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-light/30 via-white to-gray-50 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Hero dorado */}
        <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-primary px-6 py-8 text-white md:py-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative z-10">
            <nav className="mb-4 text-sm text-white/80">
              <Link href="/" className="hover:text-white">
                HOME
              </Link>
              <span className="mx-2">/</span>
              <span>{proyectoNombre || proyectoId || "Proyecto"}</span>
              <span className="mx-2">/</span>
              <span className="font-medium text-white">Elige tu plan</span>
            </nav>
            <h1 className="text-2xl font-bold md:text-3xl">
              Elige tu Plan de Remodelación
            </h1>
            <p className="mt-2 text-white/90">
              Personaliza tu apartamento con el plan que mejor se adapte a ti
            </p>
          </div>
        </div>

        {/* Comparador de planes */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Plan Básico */}
          <Card className="relative border-2 border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <CardHeader>
              <Badge variant="secondary">Básico Esencial</Badge>
              <p className="mt-2 text-3xl font-bold">
                {formatoPrecio(planesBase.basico.precio)}
              </p>
              <p className="text-sm text-muted-foreground">
                {planesBase.basico.subtitulo}
              </p>
              <p className="text-sm text-gray-600">
                Tiempo de entrega: 39 días hábiles
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 font-medium">Incluye:</p>
                <ul className="space-y-2">
                  {planesBase.basico.incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-2 font-medium">BONUS GRATIS</p>
                <ul className="space-y-1 text-sm">
                  {planesBase.basico.bonus.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full rounded-xl border-2 border-gray-400 py-6 font-semibold text-gray-700 transition-all hover:border-gray-500 hover:bg-gray-100"
                onClick={() => handleElegirPlan("basico")}
              >
                Elegir Plan Básico
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Intermedio Plus */}
          <Card className="border-2 border-brand-primary shadow-[0_4px_14px_0_rgba(255,204,0,0.39)] transition-all hover:shadow-[0_10px_40px_0_rgba(255,204,0,0.45)]">
            <CardHeader>
              <Badge className="bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-dark shadow-[0_4px_14px_0_rgba(255,204,0,0.39)]">
                Más Popular
              </Badge>
              <p className="mt-2 text-3xl font-bold">
                {formatoPrecio(precioIntermedio)}
              </p>
              {mostrarAhorro && (
                <p className="text-sm font-medium text-green-600">
                  Ahorra {formatoPrecio(ahorro)}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {planesBase.intermedio.subtitulo}
              </p>
              <p className="text-sm text-gray-600">
                Tiempo de entrega: 59 días hábiles
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 font-medium">Incluye:</p>
                <ul className="space-y-2">
                  {planesBase.intermedio.incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-2 font-medium">BONUS GRATIS</p>
                <ul className="space-y-1 text-sm">
                  {planesBase.intermedio.bonus.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary py-6 font-semibold text-brand-dark shadow-[0_4px_14px_0_rgba(255,204,0,0.39)] transition-all hover:-translate-y-0.5 hover:from-brand-secondary hover:to-brand-primary hover:shadow-[0_10px_40px_0_rgba(255,204,0,0.45)]"
                onClick={() => handleElegirPlan("intermedio")}
              >
                Elegir Plan Plus
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando...</div>}>
      <PlanPageContent />
    </Suspense>
  );
}
