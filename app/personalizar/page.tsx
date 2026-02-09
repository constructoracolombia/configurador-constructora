"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { 
  categorias, 
  proyectos,
  findProyecto,
  adicionalesFiltrados,
  adicionalesOcultosPorPlan,
  getNombreAdicional,
  getPrecioAdicional,
  getPreciosPlanPorProyecto,
} from "@/lib/data/catalogo";
import type { Producto } from "@/lib/data/catalogo";
import { formatoPrecio } from "@/lib/utils/format";
import { useCotizador } from "@/lib/store/cotizador";
import { ImagenOptimizada } from "@/components/ImagenOptimizada";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PersonalizarPage() {
  const router = useRouter();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null);

  // CRÍTICO: Usar el store directamente - NO destructurar para máxima reactividad
  const store = useCotizador();

  // Obtener productos filtrados según el plan seleccionado
  const productosDisponibles = useMemo(() => {
    if (!store.planBase) return [];
    return adicionalesFiltrados(store.planBase);
  }, [store.planBase]);

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

    // Remover cada adicional que ya no debería estar disponible
    adicionalesInvalidos.forEach((adicional) => {
      console.log(`🧹 Removiendo adicional no disponible para plan ${store.planBase}:`, adicional.nombre);
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

  // Precios dinámicos por proyecto (cálculo directo, no depende del store getter)
  const preciosDinamicos = getPreciosPlanPorProyecto(store.proyecto);
  const precioBase = store.planBase ? preciosDinamicos[store.planBase] : 0;

  // Total = precio base del plan + adicionales
  const totalAdicionales = store.getPrecioAdicionales();
  const totalFinal = precioBase + totalAdicionales;

  // DEBUG - ELIMINAR DESPUÉS
  console.log('🔍 DEBUG PERSONALIZAR:');
  console.log('  - store.proyecto:', JSON.stringify(store.proyecto));
  console.log('  - store.planBase:', JSON.stringify(store.planBase));
  console.log('  - preciosDinamicos:', JSON.stringify(preciosDinamicos));
  console.log('  - precioBase:', precioBase);
  console.log('  - store.getPrecioPlanBase():', store.getPrecioPlanBase());
  console.log('  - totalFinal:', totalFinal);

  return (
    <main className="min-h-screen bg-brand-dark pb-32">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-4xl font-bold text-brand-text">
          Personaliza tu Remodelación
        </h1>
        <p className="mb-8 text-brand-textSecondary">
          Agrega los acabados premium que desees
        </p>

        {/* Banner de urgencia */}
        <div className="mb-8 rounded-xl border-l-4 border-brand-primary bg-gradient-to-r from-red-900/30 to-orange-900/30 p-4 shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite] glass-effect">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-brand-text">
                7 personas ya reservaron su remodelación en {proyectoNombre}{" "}
                este mes
              </p>
              <p className="mt-1 text-sm text-brand-textSecondary">
                Nos quedan solo{" "}
                <span className="font-bold text-brand-primary">
                  3 cupos disponibles
                </span>
                . ¡No te quedes por fuera!
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <aside className="shrink-0 lg:w-64">
            <Card className="sticky top-4 border border-brand-border bg-brand-card">
              <CardHeader>
                <h2 className="text-xl font-bold text-brand-text">
                  Categorías
                </h2>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setCategoriaSeleccionada(null)}
                  className={`w-full rounded-lg px-4 py-2 text-left transition-all ${
                    categoriaSeleccionada === null
                      ? "bg-brand-primary font-semibold text-black"
                      : "text-brand-textSecondary hover:bg-brand-border"
                  }`}
                >
                  Todas
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className={`w-full rounded-lg px-4 py-2 text-left transition-all ${
                      categoriaSeleccionada === cat
                        ? "bg-brand-primary font-semibold text-black"
                        : "text-brand-textSecondary hover:bg-brand-border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Grid de productos */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {productosFiltrados.map((producto) => {
                const agregado = isProductoAgregado(producto.id);
                const cantidad = store.getCantidad(producto.id);
                const tieneMultiples = producto.permiteMultiples;
                const maxCantidad = producto.maxCantidad || 2;
                
                // Obtener nombre y precio según el plan seleccionado
                const nombreMostrar = getNombreAdicional(producto, store.planBase);
                const precioMostrar = getPrecioAdicional(producto, store.planBase);

                return (
                  <Card
                    key={producto.id}
                    className="group overflow-hidden border border-brand-border bg-brand-card transition-all hover:border-brand-primary"
                  >
                    <CardHeader className="relative p-0">
                      <div className="relative h-40 overflow-hidden">
                        <ImagenOptimizada
                          src={producto.imagen}
                          alt={nombreMostrar}
                          width={300}
                          height={200}
                          className="h-full w-full object-cover"
                        />
                        <Badge className="absolute right-2 top-2 bg-brand-primary text-xs text-black">
                          {producto.categoria}
                        </Badge>
                        {tieneMultiples && (
                          <Badge className="absolute left-2 top-2 bg-purple-600 text-xs text-white">
                            Hasta {maxCantidad}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4">
                      <h3 className="mb-1 line-clamp-2 font-semibold text-brand-text">
                        {nombreMostrar}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-sm text-brand-textSecondary">
                        {producto.descripcion}
                      </p>
                      <p className="text-2xl font-bold text-brand-primary">
                        {formatoPrecio(precioMostrar)}
                        {tieneMultiples && cantidad > 1 && (
                          <span className="ml-2 text-base text-brand-textSecondary">
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
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 text-xl font-bold text-white transition-all hover:bg-gray-600 disabled:opacity-50"
                          >
                            −
                          </button>
                          <div className="flex flex-1 items-center justify-center">
                            <span className={`rounded-lg px-4 py-2 text-lg font-bold ${
                              cantidad > 0 
                                ? "bg-brand-primary text-black" 
                                : "bg-gray-800 text-brand-textSecondary"
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
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary text-xl font-bold text-black transition-all hover:bg-brand-secondary disabled:opacity-50"
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
                              : "bg-brand-primary text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] hover:scale-105 hover:bg-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
                          }`}
                        >
                          {agregado ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Agregado (Click para quitar)
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
        </div>
      </div>

      {/* Floating bar REACTIVO */}
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-effect shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex-1">
            <p className="text-sm text-brand-textSecondary">
              Plan: {formatoPrecio(precioBase)}
              {store.getCantidadAdicionales() > 0 && (
                <> + {store.getCantidadAdicionales()}{" "}
                {store.getCantidadAdicionales() === 1
                  ? "adicional"
                  : "adicionales"}</>
              )}
            </p>
            <p className="text-3xl font-bold text-brand-primary">
              Total: {formatoPrecio(totalFinal)}
            </p>
          </div>
          <Button
            onClick={handleVerResumen}
            className="rounded-xl bg-brand-primary px-8 py-6 font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all hover:scale-105 hover:bg-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
          >
            Ver Resumen
          </Button>
        </div>
      </div>
    </main>
  );
}
