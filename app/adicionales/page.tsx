"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCotizador } from "@/lib/store/cotizador";
import { adicionalesFiltrados, categorias } from "@/lib/data/catalogo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, TrendingUp, Plus, Minus } from "lucide-react";
import { formatoPrecio } from "@/lib/utils/format";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AdicionalesPage() {
  const router = useRouter();
  const {
    adicionales: seleccionados,
    toggleAdicional,
    incrementarCantidad,
    decrementarCantidad,
    getCantidad,
    getTotal,
    planBase,
    proyecto,
  } = useCotizador();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [totalAnimado, setTotalAnimado] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!proyecto || !planBase) {
      router.push("/presupuestos");
    }
  }, [proyecto, planBase, router]);

  // Filtrado dinámico: planBase (selectedPlan) persiste desde /plan; evita mostrar
  // lo que ya viene incluido en el plan (sobre todo Intermedio) para no cobrar doble.
  const productos = planBase ? adicionalesFiltrados(planBase) : [];

  const productosPorCategoria = categorias
    .map((cat) => ({
      categoria: cat,
      productos: productos.filter((p) => p.categoria === cat),
    }))
    .filter((g) => g.productos.length > 0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = documentHeight - windowHeight;
      if (trackLength <= 0) {
        setScrollProgress(100);
        return;
      }
      const progress = (scrollTop / trackLength) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [productosPorCategoria.length]);

  useEffect(() => {
    const totalFinal = seleccionados.reduce(
      (sum, p) => sum + p.precio * (p.cantidad ?? 1),
      0
    );
    const duracion = 500;
    const steps = Math.max(1, Math.floor(duracion / 16));
    let step = 0;
    const interval = setInterval(() => {
      setTotalAnimado((prev) => {
        const diff = totalFinal - prev;
        const incremento = diff / (steps - step || 1);
        step += 1;
        const siguiente = prev + incremento;
        if (step >= steps) return totalFinal;
        return siguiente;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [seleccionados]);

  const estaSeleccionado = (id: string) => {
    return seleccionados.some((p) => p.id === id);
  };

  const getCantidadItem = (id: string) => {
    return getCantidad(id);
  };

  if (!planBase || !proyecto) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-dark pb-32"
    >
      {/* Barra de progreso superior FIJA */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-brand-border bg-brand-dark/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-brand-textSecondary">
              Progreso de personalización
            </span>
            <span className="text-xs font-bold text-brand-primary">
              {Math.round(scrollProgress)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-border">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary"
              style={{ width: `${scrollProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/50 bg-brand-primary/20 px-4 py-2">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span className="text-sm font-semibold text-brand-primary">
              Personaliza tu{" "}
              {planBase === "basico" ? "Plan Básico" : "Plan Intermedio Plus"}
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-brand-text md:text-4xl">
            Arma tu Remodelación Perfecta
          </h1>
          <p className="text-brand-textSecondary">
            Agrega los acabados premium que desees • Scroll para explorar
          </p>
        </motion.div>
      </div>

      {/* Contenido principal - Layout vertical por categorías */}
      <div className="mx-auto max-w-6xl space-y-12 px-4">
        {productosPorCategoria.map((grupo, grupoIdx) => (
          <motion.div
            key={grupo.categoria}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: grupoIdx * 0.05 }}
          >
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold text-brand-text">
                {grupo.categoria}
              </h2>
              <div className="h-1 w-20 rounded-full bg-brand-primary" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {grupo.productos.map((producto, idx) => {
                const seleccionado = estaSeleccionado(producto.id);
                const cantidad = getCantidadItem(producto.id);
                const permiteMultiples = producto.permiteMultiples;

                return (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.02 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      onClick={() =>
                        !permiteMultiples && toggleAdicional(producto)
                      }
                      className={`h-full cursor-pointer transition-all ${
                        seleccionado
                          ? "border-2 border-brand-primary bg-brand-primary/10 shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
                          : "border border-brand-border bg-brand-card hover:border-brand-primary/50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="relative mb-3 aspect-[3/2] w-full overflow-hidden rounded-lg bg-brand-border">
                          {producto.imagen &&
                          !producto.imagen.includes("placeholder") ? (
                            <Image
                              src={producto.imagen}
                              alt={producto.nombre}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-4xl text-brand-textSecondary">
                              🏗️
                            </div>
                          )}

                          <div className="absolute right-2 top-2">
                            <Badge className="bg-brand-primary text-xs text-black">
                              {producto.categoria}
                            </Badge>
                          </div>

                          {seleccionado && !permiteMultiples && (
                            <div className="absolute inset-0 flex items-center justify-center bg-brand-primary/90">
                              <Check className="h-12 w-12 text-black" />
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="mb-1 text-sm font-semibold text-brand-text">
                            {producto.nombre}
                          </h4>
                          <p className="mb-3 line-clamp-2 text-xs text-brand-textSecondary">
                            {producto.descripcion}
                          </p>

                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-base font-bold text-brand-primary">
                              {formatoPrecio(producto.precio)}
                            </span>
                            {producto.codigo && (
                              <span className="text-xs text-brand-textSecondary">
                                #{producto.codigo}
                              </span>
                            )}
                          </div>

                          {permiteMultiples && (
                            <div className="mt-3 flex items-center justify-center gap-3">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  decrementarCantidad(producto.id);
                                }}
                                disabled={cantidad === 0}
                                className="h-8 w-8 bg-brand-dark p-0 hover:bg-brand-border"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>

                              <span className="w-8 text-center text-lg font-bold text-brand-text">
                                {cantidad}
                              </span>

                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cantidad === 0) {
                                    toggleAdicional(producto);
                                  }
                                  incrementarCantidad(
                                    producto.id,
                                    producto.maxCantidad ?? 10
                                  );
                                }}
                                disabled={
                                  cantidad >= (producto.maxCantidad ?? 10)
                                }
                                className="h-8 w-8 bg-brand-primary p-0 text-black hover:bg-brand-secondary"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer sticky con total */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-brand-primary bg-brand-dark/95 p-4 shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs text-brand-textSecondary">
              {seleccionados.length} adicionales • {Math.round(scrollProgress)}%
              explorado
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
            className="rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary px-8 py-6 text-lg font-bold text-black shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] transition-all hover:from-brand-secondary hover:to-brand-primary hover:shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]"
          >
            Continuar →
          </Button>
        </div>
      </div>
    </div>
  );
}
