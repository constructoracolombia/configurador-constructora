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
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-600">
          <Link href="/" className="hover:text-brand-primary">
            HOME
          </Link>
          <span className="mx-2">/</span>
          <span>{proyectoNombre || proyectoId || "Proyecto"}</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">Elige tu plan</span>
        </nav>

        {/* Título */}
        <h1 className="mb-10 text-2xl font-bold md:text-3xl">
          Elige tu Plan de Remodelación
        </h1>

        {/* Comparador de planes */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Plan Básico */}
          <Card>
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
                className="w-full"
                onClick={() => handleElegirPlan("basico")}
              >
                Elegir Plan Básico
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Intermedio Plus */}
          <Card className="border-brand-primary md:border-2">
            <CardHeader>
              <Badge className="bg-brand-primary text-white hover:bg-brand-primary/90">
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
                className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
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
