"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { productos, categorias } from "@/lib/data/catalogo";
import type { Producto } from "@/lib/data/catalogo";
import { formatoPrecio } from "@/lib/utils/format";
import { useCotizador } from "@/lib/store/cotizador";
import { ImagenOptimizada } from "@/components/ImagenOptimizada";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PersonalizarPage() {
  const router = useRouter();
  const {
    adicionales,
    addAdicional,
    removeAdicional,
    getTotal,
    getCantidadAdicionales
  } = useCotizador();

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null);

  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria === categoriaSeleccionada)
    : productos;

  const isProductoAgregado = (codigo: number) =>
    adicionales.some((p) => p.codigo === codigo);

  const handleAgregar = (producto: Producto) => {
    addAdicional(producto);
  };

  const handleRemover = (codigo: number) => {
    removeAdicional(codigo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-light/20 via-white to-gray-50 pb-32">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar - Categorías (oculto en móvil) */}
          <aside className="hidden shrink-0 lg:block lg:w-64">
            <div className="sticky top-4 rounded-xl border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <h2 className="mb-4 font-semibold">Categorías</h2>
              <div className="space-y-1">
                <button
                  onClick={() => setCategoriaSeleccionada(null)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    !categoriaSeleccionada
                      ? "bg-brand-primary/10 font-medium text-brand-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  Todas
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      categoriaSeleccionada === cat
                        ? "bg-brand-primary/10 font-medium text-brand-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid de productos */}
          <main className="flex-1">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productosFiltrados.map((producto) => {
                const agregado = isProductoAgregado(producto.codigo);
                return (
                  <Card
                    key={producto.codigo}
                    className="overflow-hidden border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                  >
                    <ImagenOptimizada
                      src={producto.imagen}
                      alt={producto.nombre}
                      width={300}
                      height={200}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                    <CardHeader className="pb-2">
                      <h3 className="font-semibold">{producto.nombre}</h3>
                      <p
                        className="line-clamp-2 text-sm text-gray-600"
                        title={producto.descripcion}
                      >
                        {producto.descripcion}
                      </p>
                      <p className="text-xl font-bold">
                        {formatoPrecio(producto.precio)}
                      </p>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {producto.categoria}
                      </Badge>
                    </CardHeader>
                    <CardFooter>
                      {agregado ? (
                        <Button
                          disabled
                          className="w-full bg-green-600 text-white hover:bg-green-600"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Agregado
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-brand-primary/50 text-brand-dark hover:bg-brand-primary/10 hover:border-brand-primary"
                          onClick={() => handleAgregar(producto)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </main>
        </div>
      </div>

      {/* Floating Bar dorada */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-brand-primary/20 bg-white/95 shadow-[0_-4px_20px_rgba(245,166,35,0.15)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {getCantidadAdicionales()} productos agregados
            </p>
            <p className="text-2xl font-bold text-brand-dark">
              Total: {formatoPrecio(getTotal())}
            </p>
          </div>
          <Button
            className="w-full rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary py-6 font-semibold text-brand-dark shadow-[0_4px_14px_0_rgba(245,166,35,0.39)] transition-all hover:-translate-y-0.5 hover:from-brand-secondary hover:to-brand-primary hover:shadow-[0_10px_40px_0_rgba(245,166,35,0.45)] md:w-auto md:min-w-[200px]"
            onClick={() => router.push("/resumen")}
          >
            Ver Resumen
          </Button>
        </div>
      </div>
    </div>
  );
}
