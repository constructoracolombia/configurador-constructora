"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { proyectos, planesBase, getPreciosPlanPorProyecto } from "@/lib/data/catalogo";
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

function tieneDescuento(proyectoId: string | null): boolean {
  if (!proyectoId) return false;
  const precios = getPreciosPlanPorProyecto(proyectoId);
  return precios.intermedio < planesBase.intermedio.precio;
}

function PlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proyectoFromUrl = searchParams.get("proyecto");
  const proyectoFromStore = useCotizador((s) => s.proyecto);
  const proyectoId = proyectoFromUrl || proyectoFromStore;
  const proyectoNombre = getProyectoNombre(proyectoId);

  const setProyecto = useCotizador((s) => s.setProyecto);
  const setPlanBase = useCotizador((s) => s.setPlanBase);

  // Leer proyecto pre-seleccionado desde localStorage (desde brochure)
  useEffect(() => {
    const proyectoGuardado = localStorage.getItem('proyecto-seleccionado');
    
    if (proyectoGuardado) {
      // Verificar que el proyecto existe en el catálogo
      const proyectoExiste = proyectos.find(p => p.id === proyectoGuardado);
      if (proyectoExiste) {
        setProyecto(proyectoGuardado);
      }
      // Limpiar localStorage después de usar
      localStorage.removeItem('proyecto-seleccionado');
    }
  }, [setProyecto]);

  useEffect(() => {
    if (proyectoFromUrl && !proyectoFromStore) {
      setProyecto(proyectoFromUrl);
    }
  }, [proyectoFromUrl, proyectoFromStore, setProyecto]);

  useEffect(() => {
    if (!proyectoId) {
      router.push("/");
    }
  }, [proyectoId, router]);

  const precios = getPreciosPlanPorProyecto(proyectoId);
  const mostrarAhorro = tieneDescuento(proyectoId);
  const ahorro = planesBase.intermedio.precio - precios.intermedio;

  const handleElegirPlan = (plan: "basico" | "intermedio") => {
    setPlanBase(plan);
    router.push("/personalizar");
  };

  return (
    <div className="min-h-screen bg-brand-dark px-4 py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Hero oscuro con acento dorado */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-brand-border bg-brand-card px-6 py-8 shadow-[0_2px_8px_rgba(0,0,0,0.4)] md:py-10">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-brand-primary blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-primary blur-3xl" />
          </div>
          <div className="relative z-10">
            <nav className="mb-4 text-sm text-brand-textSecondary">
              <Link href="/" className="hover:text-brand-primary">
                HOME
              </Link>
              <span className="mx-2">/</span>
              <span>{proyectoNombre || proyectoId || "Proyecto"}</span>
              <span className="mx-2">/</span>
              <span className="font-medium text-brand-text">Elige tu plan</span>
            </nav>
            <h1 className="text-2xl font-bold text-brand-text md:text-3xl">
              Elige tu Plan de Remodelación
              {proyectoNombre ? (
                <span className="block text-brand-primary">en {proyectoNombre}</span>
              ) : null}
            </h1>
            <p className="mt-2 text-brand-textSecondary">
              Personaliza tu apartamento{proyectoNombre ? ` en ${proyectoNombre}` : ""} con el plan que mejor se adapte a ti
            </p>
          </div>
        </div>

        {/* Comparador de planes */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Plan Básico */}
          <Card className="relative border-2 border-brand-border bg-brand-card shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all hover:border-brand-textSecondary hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
            <CardHeader>
              <Badge className="bg-brand-cement text-brand-textSecondary">
                Básico Esencial
              </Badge>
              <p className="mt-2 text-3xl font-bold text-brand-primary">
                {formatoPrecio(precios.basico)}
              </p>
              <p className="text-sm text-brand-textSecondary">
                {planesBase.basico.subtitulo}
              </p>
              <p className="text-sm text-brand-textSecondary">
                Tiempo de entrega: 39 días hábiles
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 font-medium text-brand-text">Incluye:</p>
                <ul className="space-y-2">
                  {planesBase.basico.incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-brand-textSecondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-brand-border bg-brand-dark/50 p-3">
                <p className="mb-2 font-medium text-brand-text">BONUS GRATIS</p>
                <ul className="space-y-1 text-sm text-brand-textSecondary">
                  {planesBase.basico.bonus.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full rounded-xl border-2 border-gray-400 bg-white py-6 font-semibold text-black transition-all hover:border-gray-500 hover:bg-gray-100"
                onClick={() => handleElegirPlan("basico")}
              >
                Elegir Plan Básico
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Intermedio Plus */}
          <Card className="border-2 border-brand-primary bg-brand-card shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]">
            <CardHeader>
              <Badge className="bg-brand-primary text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]">
                Más Popular
              </Badge>
              <p className="mt-2 text-3xl font-bold text-brand-primary">
                {formatoPrecio(precios.intermedio)}
              </p>
              {mostrarAhorro && (
                <p className="text-sm font-medium text-green-500">
                  Ahorra {formatoPrecio(ahorro)}
                </p>
              )}
              <p className="text-sm text-brand-textSecondary">
                {planesBase.intermedio.subtitulo}
              </p>
              <p className="text-sm text-brand-textSecondary">
                Tiempo de entrega: 59 días hábiles
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 font-medium text-brand-text">Incluye:</p>
                <ul className="space-y-2">
                  {planesBase.intermedio.incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-brand-textSecondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-brand-border bg-brand-dark/50 p-3">
                <p className="mb-2 font-medium text-brand-text">BONUS GRATIS</p>
                <ul className="space-y-1 text-sm text-brand-textSecondary">
                  {planesBase.intermedio.bonus.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full rounded-xl bg-brand-primary py-6 font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all hover:scale-105 hover:bg-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-brand-dark text-brand-text">
          Cargando...
        </div>
      }
    >
      <PlanPageContent />
    </Suspense>
  );
}
