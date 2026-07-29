"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { findProyecto, planesBase } from "@/lib/data/catalogo";
import { usePreciosPlanProyecto } from "@/lib/hooks/usePreciosPlanProyecto";
import { formatoPrecio } from "@/lib/utils/format";
import { useCotizador } from "@/lib/store/cotizador";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getProyectoNombre(proyectoId: string | null): string {
  if (!proyectoId) return "";
  const proyecto = findProyecto(proyectoId);
  return proyecto?.nombre ?? proyectoId;
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
      const proyectoExiste = findProyecto(proyectoGuardado);
      if (proyectoExiste) {
        setProyecto(proyectoGuardado);
      }
      // Limpiar localStorage después de usar
      localStorage.removeItem('proyecto-seleccionado');
    }
  }, [setProyecto]);

  // Si la URL tiene proyecto, SIEMPRE actualizar el store (tiene prioridad)
  useEffect(() => {
    if (proyectoFromUrl && proyectoFromUrl !== proyectoFromStore) {
      setProyecto(proyectoFromUrl);
    }
  }, [proyectoFromUrl, proyectoFromStore, setProyecto]);

  useEffect(() => {
    if (!proyectoId) {
      router.push("/presupuestos");
    }
  }, [proyectoId, router]);

  const { precios, cargando: cargandoPrecios } = usePreciosPlanProyecto(proyectoId);
  const mostrarAhorro = precios.intermedio < planesBase.intermedio.precio;
  const ahorro = planesBase.intermedio.precio - precios.intermedio;

  const handleElegirPlan = (plan: "basico" | "intermedio") => {
    // CRÍTICO: Siempre guardar el proyecto actual en el store antes de navegar
    if (proyectoId) {
      setProyecto(proyectoId);
    }
    setPlanBase(plan);
    router.push("/personalizar");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Hero claro con acento dorado */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm md:mb-10 md:px-6 md:py-10">
          <div className="absolute inset-0 opacity-[0.06]">
            <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-brand-primary blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-primary blur-3xl" />
          </div>
          <div className="relative z-10">
            <nav className="mb-3 text-xs text-gray-500 md:mb-4 md:text-sm">
              <Link href="/" className="hover:text-amber-600">
                HOME
              </Link>
              <span className="mx-2">/</span>
              <span>{proyectoNombre || proyectoId || "Proyecto"}</span>
              <span className="mx-2">/</span>
              <span className="font-medium text-gray-900">Elige tu plan</span>
            </nav>
            <h1 className="text-xl font-bold text-gray-900 md:text-3xl">
              Elige tu Plan de Remodelación
              {proyectoNombre ? (
                <span className="block text-amber-600">en {proyectoNombre}</span>
              ) : null}
            </h1>
            <p className="mt-2 text-sm text-gray-500 md:text-base">
              Personaliza tu apartamento{proyectoNombre ? ` en ${proyectoNombre}` : ""} con el plan que mejor se adapte a ti
            </p>
          </div>
        </div>

        {/* Comparador de planes */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* Plan Básico */}
          <Card className="relative border-2 border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-md">
            <CardHeader>
              <Badge className="w-fit bg-gray-100 text-gray-600 hover:bg-gray-100">
                Básico Esencial
              </Badge>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                {cargandoPrecios ? (
                  <span className="inline-block h-8 w-40 animate-pulse rounded bg-gray-200 align-middle" />
                ) : (
                  formatoPrecio(precios.basico)
                )}
              </p>
              <p className="text-sm text-gray-500">
                {planesBase.basico.subtitulo}
              </p>
              <p className="text-sm text-gray-500">
                Tiempo de entrega: 39 días hábiles
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 font-medium text-gray-900">Incluye:</p>
                <ul className="space-y-2">
                  {planesBase.basico.incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="mb-2 font-medium text-green-800">BONUS GRATIS</p>
                <ul className="space-y-1 text-sm text-green-700">
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
                className="w-full rounded-xl border-2 border-gray-300 bg-white py-6 font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50"
                onClick={() => handleElegirPlan("basico")}
              >
                Elegir Plan Básico
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Intermedio Plus */}
          <Card className="border-2 border-brand-primary bg-white shadow-[0_4px_20px_0_rgba(255,184,0,0.15)] transition-all hover:shadow-[0_8px_30px_0_rgba(255,184,0,0.25)]">
            <CardHeader>
              <Badge className="w-fit bg-brand-primary text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] hover:bg-brand-primary">
                Más Popular
              </Badge>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                {cargandoPrecios ? (
                  <span className="inline-block h-8 w-40 animate-pulse rounded bg-gray-200 align-middle" />
                ) : (
                  formatoPrecio(precios.intermedio)
                )}
              </p>
              {!cargandoPrecios && mostrarAhorro && (
                <p className="text-sm font-medium text-green-600">
                  Ahorra {formatoPrecio(ahorro)}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {planesBase.intermedio.subtitulo}
              </p>
              <p className="text-sm text-gray-500">
                Tiempo de entrega: 59 días hábiles
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 font-medium text-gray-900">Incluye:</p>
                <ul className="space-y-2">
                  {planesBase.intermedio.incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="mb-2 font-medium text-green-800">BONUS GRATIS</p>
                <ul className="space-y-1 text-sm text-green-700">
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
                className="w-full rounded-xl bg-brand-primary py-6 font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all hover:scale-[1.02] hover:bg-brand-secondary hover:shadow-[0_10px_30px_0_rgba(255,184,0,0.35)]"
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
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
          Cargando...
        </div>
      }
    >
      <PlanPageContent />
    </Suspense>
  );
}
