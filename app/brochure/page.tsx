"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useCotizador } from "@/lib/store/cotizador";

function BrochureContent() {
  const searchParams = useSearchParams();
  const proyecto = searchParams?.get("proyecto") || "San Juan de la Cuesta";
  const setProyecto = useCotizador((state) => state.setProyecto);
  const setPlanBase = useCotizador((state) => state.setPlanBase);
  const [_imagenCargada, setImagenCargada] = useState(false);

  const irACotizar = () => {
    localStorage.setItem("proyecto_seleccionado", proyecto);
    localStorage.setItem("proyecto_tipo", "acabados_premium");
    setProyecto("san-juan-cuesta");
    setPlanBase("basico");
    window.location.href = "/adicionales";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/proyectos/logo-san-juan.png"
                alt="San Juan de la Cuesta"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-gray-900">{proyecto}</div>
              <div className="text-xs text-gray-600">Conjunto Residencial</div>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/presupuestos")}
            className="px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            ← Volver
          </button>
        </div>
      </div>

      <div className="relative h-96 bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/proyectos/san-juan-cuesta.jpg"
            alt="San Juan de la Cuesta"
            fill
            className="object-cover"
            onLoad={() => setImagenCargada(true)}
          />
        </div>
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="text-white">
            <div className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              Piedecuesta, Santander
            </div>
            <h1 className="mb-4 text-5xl font-bold">San Juan de la Cuesta</h1>
            <p className="max-w-2xl text-xl text-blue-100">
              Vive rodeado de naturaleza con acabados premium y espacios
              diseñados para tu comodidad
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-2xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Personaliza tu Apartamento</h2>
            <p className="mb-6 text-lg text-blue-100">
              Cotiza carpintería, enchapes de baño y acabados premium para tu
              nuevo hogar
            </p>
            <button
              onClick={irACotizar}
              className="transform rounded-xl bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-lg transition-all hover:scale-105 hover:bg-blue-50 hover:shadow-xl"
            >
              🏗️ Cotizar mi Presupuesto →
            </button>
          </div>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <span className="text-2xl">🌳</span>
            </div>
            <h3 className="mb-2 font-bold text-gray-900">Entorno Natural</h3>
            <p className="text-sm text-gray-600">
              Rodeado de zonas verdes y paisaje natural de Piedecuesta
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <span className="text-2xl">🏊</span>
            </div>
            <h3 className="mb-2 font-bold text-gray-900">Áreas Comunes</h3>
            <p className="text-sm text-gray-600">
              Piscina, zonas recreativas y espacios para toda la familia
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="mb-2 font-bold text-gray-900">Acabados Premium</h3>
            <p className="text-sm text-gray-600">
              Enchapes de piso incluidos, listos para personalizar
            </p>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            🛠️ Servicios Disponibles
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                <span className="text-3xl">🚪</span>
              </div>
              <div className="font-semibold text-gray-900">Carpintería</div>
              <div className="mt-1 text-sm text-gray-600">
                Closets, puertas, muebles
              </div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                <span className="text-3xl">🚿</span>
              </div>
              <div className="font-semibold text-gray-900">Baños</div>
              <div className="mt-1 text-sm text-gray-600">
                Enchapes, sanitarios, grifería
              </div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
                <span className="text-3xl">🎨</span>
              </div>
              <div className="font-semibold text-gray-900">Pintura</div>
              <div className="mt-1 text-sm text-gray-600">Interior y exterior</div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100">
                <span className="text-3xl">🔌</span>
              </div>
              <div className="font-semibold text-gray-900">Instalaciones</div>
              <div className="mt-1 text-sm text-gray-600">
                Eléctricas, iluminación
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            📸 Conoce el Proyecto
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative h-64 overflow-hidden rounded-xl bg-gray-200">
              <Image
                src="/proyectos/san-juan-cuesta.jpg"
                alt="San Juan de la Cuesta - Exterior"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-xl bg-gray-200">
              <Image
                src="/proyectos/logo-san-juan.png"
                alt="Logo San Juan de la Cuesta"
                fill
                className="object-contain p-8"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            ¿Listo para personalizar tu apartamento?
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-gray-600">
            Obtén tu cotización personalizada en minutos. Sin compromiso.
          </p>
          <button
            onClick={irACotizar}
            className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
          >
            Empezar Cotización →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrochurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-4xl">🏢</div>
            <div className="text-gray-600">Cargando...</div>
          </div>
        </div>
      }
    >
      <BrochureContent />
    </Suspense>
  );
}
