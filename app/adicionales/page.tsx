"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCotizador } from "@/lib/store/cotizador";
import {
  adicionales as adicionalesCatalogo,
  categorias,
  adicionalesPorCategoria,
} from "@/lib/data/catalogo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";
import { motion, AnimatePresence } from "framer-motion";
import { ImagenOptimizada } from "@/components/ImagenOptimizada";

export default function AdicionalesPage() {
  const router = useRouter();
  const store = useCotizador();
  const seleccionados = store.adicionales;
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<string[]>([
    categorias[0],
  ]);
  const [progresoCategoria, setProgresoCategoria] = useState(0);
  const [totalAnimado, setTotalAnimado] = useState(0);

  useEffect(() => {
    if (!store.proyecto || !store.planBase) {
      router.push("/");
    }
  }, [store.proyecto, store.planBase, router]);

  // Calcular progreso (% de categorías exploradas)
  useEffect(() => {
    const progreso = (categoriasAbiertas.length / categorias.length) * 100;
    setProgresoCategoria(progreso);
  }, [categoriasAbiertas]);

  // Animar contador de total (solo adicionales)
  useEffect(() => {
    const totalFinal = seleccionados.reduce((sum, p) => sum + p.precio, 0);
    const diff = totalFinal - totalAnimado;
    if (Math.abs(diff) < 1) {
      setTotalAnimado(totalFinal);
      return;
    }
    const duracion = 400;
    const steps = Math.max(1, Math.floor(duracion / 16));
    const incremento = diff / steps;
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setTotalAnimado((prev) => {
        const siguiente = prev + incremento;
        if (step >= steps) return totalFinal;
        return siguiente;
      });
      if (step >= steps) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [seleccionados]);

  const toggleCategoria = (cat: string) => {
    setCategoriasAbiertas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const estaSeleccionado = (id: string) => {
    return seleccionados.some((p) => p.id === id);
  };

  const toggleAdicional = (producto: (typeof adicionalesCatalogo)[number]) => {
    if (estaSeleccionado(producto.id)) {
      store.removeAdicional(producto.id);
    } else {
      store.addAdicional(producto);
    }
  };

  if (!store.proyecto || !store.planBase) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-dark pb-20">
      {/* Barra de progreso superior */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-brand-border bg-brand-dark/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-brand-textSecondary">
              Explorado: {categoriasAbiertas.length} / {categorias.length} áreas
            </span>
            <span className="text-xs font-bold text-brand-primary">
              {Math.round(progresoCategoria)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-border">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progresoCategoria}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mx-auto max-w-4xl px-4 pb-32 pt-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/50 bg-brand-primary/20 px-4 py-2">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span className="text-sm font-semibold text-brand-primary">
              Personaliza tu hogar
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-brand-text md:text-4xl">
            Arma tu Remodelación Perfecta
          </h1>
          <p className="text-brand-textSecondary">
            Selecciona los acabados premium que desees agregar
          </p>
        </motion.div>

        {/* Categorías colapsables */}
        <div className="space-y-4">
          {categorias.map((categoria, idx) => {
            const productos = adicionalesPorCategoria(categoria);
            const abierta = categoriasAbiertas.includes(categoria);
            const seleccionadosEnCategoria = productos.filter((p) =>
              estaSeleccionado(p.id)
            ).length;

            return (
              <motion.div
                key={categoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={`border-2 bg-brand-card transition-all ${
                    abierta
                      ? "border-brand-primary shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
                      : "border-brand-border"
                  }`}
                >
                  {/* Header de categoría */}
                  <button
                    type="button"
                    onClick={() => toggleCategoria(categoria)}
                    className="flex w-full items-center justify-between p-4 transition-colors hover:bg-brand-dark/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          seleccionadosEnCategoria > 0
                            ? "bg-brand-primary text-black"
                            : "bg-brand-dark text-brand-textSecondary"
                        }`}
                      >
                        {seleccionadosEnCategoria > 0 ? (
                          <span className="font-bold">
                            {seleccionadosEnCategoria}
                          </span>
                        ) : (
                          <span className="text-lg">✨</span>
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-brand-text">
                          {categoria}
                        </h3>
                        <p className="text-xs text-brand-textSecondary">
                          {productos.length} opciones disponibles
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {seleccionadosEnCategoria > 0 && (
                        <Badge className="bg-brand-primary text-black">
                          {seleccionadosEnCategoria} agregados
                        </Badge>
                      )}
                      {abierta ? (
                        <ChevronUp className="h-5 w-5 text-brand-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-brand-textSecondary" />
                      )}
                    </div>
                  </button>

                  {/* Grid de productos */}
                  <AnimatePresence>
                    {abierta && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-3 p-4 pt-0 md:grid-cols-2">
                          {productos.map((producto) => {
                            const seleccionado = estaSeleccionado(producto.id);

                            return (
                              <motion.div
                                key={producto.id}
                                layout
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Card
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => toggleAdicional(producto)}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" ||
                                      e.key === " "
                                    ) {
                                      e.preventDefault();
                                      toggleAdicional(producto);
                                    }
                                  }}
                                  className={`cursor-pointer transition-all ${
                                    seleccionado
                                      ? "border-2 border-brand-primary bg-brand-primary/10 shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
                                      : "border border-brand-border bg-brand-dark hover:border-brand-primary/50"
                                  }`}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex gap-3">
                                      {/* Imagen */}
                                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-brand-border">
                                        {!producto.imagen.includes(
                                          "placeholder"
                                        ) ? (
                                          <ImagenOptimizada
                                            src={producto.imagen}
                                            alt={producto.nombre}
                                            width={80}
                                            height={80}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center text-2xl text-brand-textSecondary">
                                            🏗️
                                          </div>
                                        )}
                                        {seleccionado && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-brand-primary/90">
                                            <Check className="h-8 w-8 text-black" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Info */}
                                      <div className="min-w-0 flex-1">
                                        <h4 className="mb-1 truncate text-sm font-semibold text-brand-text">
                                          {producto.nombre}
                                        </h4>
                                        <p className="mb-2 line-clamp-2 text-xs text-brand-textSecondary">
                                          {producto.descripcion}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-bold text-brand-primary">
                                            {formatoPrecio(producto.precio)}
                                          </span>
                                          {producto.codigo && (
                                            <span className="text-xs text-brand-textSecondary">
                                              #{producto.codigo}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer sticky con total animado */}
      <div className="fixed bottom-0 left-0 right-0 border-t-2 border-brand-primary bg-brand-dark/95 p-4 shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs text-brand-textSecondary">
              {seleccionados.length} adicionales seleccionados
            </p>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-primary" />
              <span className="text-2xl font-bold text-brand-text">
                {formatoPrecio(Math.round(totalAnimado))}
              </span>
            </div>
          </div>
          <Button
            onClick={() => router.push("/datos-cliente")}
            className="rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary px-8 py-6 text-lg font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all hover:from-brand-secondary hover:to-brand-primary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
          >
            Continuar →
          </Button>
        </div>
      </div>
    </div>
  );
}
