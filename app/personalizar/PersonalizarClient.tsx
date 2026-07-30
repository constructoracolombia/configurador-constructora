"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Flame, BadgeCheck } from "lucide-react";
import {
  categorias,
  findProyecto,
  adicionalesFiltrados,
  adicionalesOcultosPorPlan,
  getNombreAdicional,
  getPrecioAdicional,
  getCatalogoIdPorProyecto,
} from "@/lib/data/catalogo";
import type { Producto } from "@/lib/data/catalogo";
import { usePreciosPlanProyecto } from "@/lib/hooks/usePreciosPlanProyecto";
import { useProductosCustomCatalogo } from "@/lib/hooks/useProductosCustomCatalogo";
import { formatoPrecio } from "@/lib/utils/format";
import { useCotizador } from "@/lib/store/cotizador";
import { ImagenOptimizada } from "@/components/ImagenOptimizada";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PersonalizarClient() {
  const router = useRouter();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null);

  // CRÍTICO: Usar el store directamente - NO destructurar para máxima reactividad
  const store = useCotizador();

  // Productos creados dinámicamente desde Finanzas para este catálogo
  // (tabla personalizar_items_custom) — se muestran siempre, sin importar
  // el plan, ya que no forman parte de ningún plan base.
  const catalogoIdActual = getCatalogoIdPorProyecto(store.proyecto);
  const productosCustom = useProductosCustomCatalogo(catalogoIdActual);

  // Obtener productos filtrados según el plan seleccionado, ordenados por
  // categoría (mismo orden que los chips de filtro: Preliminares,
  // Enchapes, Baños...) — necesario porque los productos creados desde
  // Finanzas (productosCustom) se agregan al final del arreglo y, sin
  // esto, rompían el agrupamiento por categoría en la vista "Todas".
  const productosDisponibles = useMemo(() => {
    if (!store.planBase) return [];
    const todos = [...adicionalesFiltrados(store.planBase), ...productosCustom];
    return todos.sort(
      (a, b) => categorias.indexOf(a.categoria as (typeof categorias)[number]) -
        categorias.indexOf(b.categoria as (typeof categorias)[number])
    );
  }, [store.planBase, productosCustom]);

  // Filtrar por categoría si está seleccionada
  const productosFiltrados = categoriaSeleccionada
    ? productosDisponibles.filter((p) => p.categoria === categoriaSeleccionada)
    : productosDisponibles;

  // Limpiar adicionales que ya no están disponibles cuando cambia el plan
  useEffect(() => {
    if (!store.planBase) return;

    const ocultos = adicionalesOcultosPorPlan[store.planBase] || [];
    const adicionalesInvalidos = store.adicionales.filter((a) =>
      ocultos.includes(a.id)
    );

    adicionalesInvalidos.forEach((adicional) => {
      store.removeAdicional(adicional.id);
    });
  }, [store.planBase]);

  const isProductoAgregado = (id: string): boolean =>
    store.adicionales.some((a) => a.id === id);

  const handleToggleProducto = (producto: Producto) => {
    if (isProductoAgregado(producto.id)) {
      store.removeAdicional(producto.id);
    } else {
      store.addAdicional(producto);
    }
  };

  const handleVerResumen = () => {
    router.push("/datos-cliente");
  };

  const proyectoNombre = store.proyecto
    ? (findProyecto(store.proyecto)?.nombre ?? "tu proyecto")
    : "tu proyecto";

  // Precios dinámicos por proyecto — mismo hook que /plan, así los dos
  // páginas siempre muestran el mismo precio para el mismo proyecto.
  const { precios: preciosDinamicos } = usePreciosPlanProyecto(store.proyecto);
  const precioBase = store.planBase ? preciosDinamicos[store.planBase] : 0;

  // Total = precio base del plan + adicionales
  const totalAdicionales = store.getPrecioAdicionales();
  const totalFinal = precioBase + totalAdicionales;

  return (
    <main className="min-h-screen bg-gray-50 pb-28 md:pb-32">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 md:mb-2 md:text-4xl">
          Personaliza tu Remodelación
        </h1>
        <p className="mb-5 text-sm text-gray-500 md:mb-8 md:text-base">
          Agrega los acabados premium que desees
        </p>

        {/* Banner de urgencia */}
        <div className="mb-5 rounded-xl border border-red-200 border-l-4 border-l-red-500 bg-red-50 p-4 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="shrink-0 text-red-500">
              <Flame className="h-6 w-6 fill-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 md:text-base">
                7 personas ya reservaron su remodelación en {proyectoNombre}{" "}
                este mes
              </p>
              <p className="mt-1 text-xs text-gray-600 md:text-sm">
                Nos quedan solo{" "}
                <span className="font-bold text-red-600">
                  3 cupos disponibles
                </span>
                . ¡No te quedes por fuera!
              </p>
            </div>
          </div>
        </div>

        {/* Filtro de categorías — chips horizontales, misma fila en desktop y
            móvil (con scroll lateral en pantallas chicas en vez de un
            sidebar vertical que empuja todo el contenido hacia abajo). */}
        <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur-sm md:static md:mx-0 md:mb-8 md:border-0 md:bg-transparent md:px-0 md:py-0">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setCategoriaSeleccionada(null)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                categoriaSeleccionada === null
                  ? "bg-brand-primary text-black"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  categoriaSeleccionada === cat
                    ? "bg-brand-primary text-black"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {productosFiltrados.map((producto) => {
            const agregado = isProductoAgregado(producto.id);
            const cantidad = store.getCantidad(producto.id);
            const tieneMultiples = producto.permiteMultiples;
            const maxCantidad = producto.maxCantidad || 2;

            // Obtener nombre y precio según el plan seleccionado — precio
            // en vivo del catálogo si este adicional está mapeado y el
            // catálogo del proyecto lo tiene (ver usePreciosPlanProyecto),
            // si no, el precio dinámico por plan de siempre.
            const nombreMostrar = getNombreAdicional(producto, store.planBase);
            const precioEnVivo = store.preciosLiveAdicionales[producto.id];
            const precioMostrar = precioEnVivo ?? getPrecioAdicional(producto, store.planBase);
            const tienePrecioDeCatalogo = precioEnVivo != null;

            return (
              <Card
                key={producto.id}
                className="group overflow-hidden border border-gray-200 bg-white shadow-sm transition-all hover:border-brand-primary hover:shadow-md"
              >
                <CardHeader className="relative p-0">
                  <div className="relative h-36 overflow-hidden sm:h-40">
                    <ImagenOptimizada
                      src={producto.imagen}
                      alt={nombreMostrar}
                      width={300}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute right-2 top-2 bg-brand-primary text-xs text-black hover:bg-brand-primary">
                      {producto.categoria}
                    </Badge>
                    {tieneMultiples && (
                      <Badge className="absolute left-2 top-2 bg-purple-600 text-xs text-white hover:bg-purple-600">
                        Hasta {maxCantidad}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900">
                    {nombreMostrar}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                    {producto.descripcion}
                  </p>
                  <p className="text-xl font-bold text-amber-600 sm:text-2xl">
                    {formatoPrecio(precioMostrar)}
                    {tienePrecioDeCatalogo && (
                      <BadgeCheck
                        className="ml-1 inline h-3.5 w-3.5 align-middle text-emerald-600/60"
                        aria-label="Precio ya asignado en el catálogo de Finanzas"
                      >
                        <title>Precio ya asignado en el catálogo de Finanzas</title>
                      </BadgeCheck>
                    )}
                    {tieneMultiples && cantidad > 1 && (
                      <span className="ml-2 text-sm text-gray-500 sm:text-base">
                        × {cantidad} = {formatoPrecio(precioMostrar * cantidad)}
                      </span>
                    )}
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  {tieneMultiples ? (
                    // Selector de cantidad para productos que permiten múltiples
                    <div className="flex w-full items-center justify-between gap-2">
                      <button
                        onClick={() => store.decrementarCantidad(producto.id)}
                        disabled={cantidad === 0}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl font-bold text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-40"
                      >
                        −
                      </button>
                      <div className="flex flex-1 items-center justify-center">
                        <span className={`rounded-lg px-4 py-2 text-lg font-bold ${
                          cantidad > 0
                            ? "bg-brand-primary text-black"
                            : "bg-gray-100 text-gray-400"
                        }`}>
                          {cantidad}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (cantidad === 0) {
                            store.addAdicional(producto);
                          } else {
                            store.incrementarCantidad(producto.id, maxCantidad);
                          }
                        }}
                        disabled={cantidad >= maxCantidad}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary text-xl font-bold text-black transition-all hover:bg-brand-secondary disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    // Botón normal para productos sin múltiples
                    <Button
                      onClick={() => handleToggleProducto(producto)}
                      className={`w-full rounded-xl font-semibold transition-all duration-300 ${
                        agregado
                          ? "bg-green-600 text-white hover:bg-red-600"
                          : "bg-brand-primary text-black shadow-[0_2px_10px_0_rgba(255,184,0,0.25)] hover:bg-brand-secondary hover:shadow-[0_4px_18px_0_rgba(255,184,0,0.35)]"
                      }`}
                    >
                      {agregado ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Agregado
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Barra flotante reactiva — clara, con blur, siempre visible al
          fondo mientras el cliente arma su presupuesto. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-gray-500 sm:text-sm">
              Plan: {formatoPrecio(precioBase)}
              {store.getCantidadAdicionales() > 0 && (
                <> + {store.getCantidadAdicionales()}{" "}
                {store.getCantidadAdicionales() === 1
                  ? "adicional"
                  : "adicionales"}</>
              )}
            </p>
            <p className="text-xl font-bold text-amber-600 sm:text-3xl">
              Total: {formatoPrecio(totalFinal)}
            </p>
          </div>
          <Button
            onClick={handleVerResumen}
            className="shrink-0 rounded-xl bg-brand-primary px-5 py-5 text-sm font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all hover:bg-brand-secondary hover:shadow-[0_10px_30px_0_rgba(255,184,0,0.35)] sm:px-8 sm:py-6 sm:text-base"
          >
            Ver Resumen
          </Button>
        </div>
      </div>
    </main>
  );
}
