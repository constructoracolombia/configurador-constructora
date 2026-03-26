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
    setProyecto,
    setPlanBase,
  } = useCotizador();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [totalAnimado, setTotalAnimado] = useState(0);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState("Ciudadela Verde");
  const [tipoProyecto, setTipoProyecto] = useState("vis_remodelacion");
  const containerRef = useRef<HTMLDivElement>(null);
  const esSanJuan = tipoProyecto === "acabados_premium";

  useEffect(() => {
    const proyectoLs =
      localStorage.getItem("proyecto_seleccionado") || "Ciudadela Verde";
    const tipo = localStorage.getItem("proyecto_tipo") || "vis_remodelacion";
    setProyectoSeleccionado(proyectoLs);
    setTipoProyecto(tipo);

    if (tipo === "acabados_premium") {
      if (!proyecto) setProyecto("san-juan-cuesta");
      if (!planBase) setPlanBase("basico");
      return;
    }

    if (!proyecto || !planBase) {
      router.push("/presupuestos");
    }
  }, [planBase, proyecto, router, setPlanBase, setProyecto]);

  // Filtrado dinámico: planBase (selectedPlan) persiste desde /plan; evita mostrar
  // lo que ya viene incluido en el plan (sobre todo Intermedio) para no cobrar doble.
  const productos = planBase ? adicionalesFiltrados(planBase) : [];

  // Categorías según tipo de proyecto (con alias al catálogo real).
  const categoriasPorTipo: Record<string, string[]> = {
    vis_remodelacion: [
      "Carpintería",
      "Baños",
      "Cocina",
      "Pisos",
      "Pintura",
      "Eléctrica",
      "Otros",
    ],
    acabados_premium: [
      "Carpintería",
      "Baños",
      "Cocina",
      "Pintura",
      "Iluminación",
      "Otros Acabados",
    ],
  };

  const aliasCategorias: Record<string, string> = {
    Pisos: "Enchapes",
    Pintura: "Preliminares",
    Eléctrica: "Otros",
    Iluminación: "Otros",
    "Otros Acabados": "Otros",
  };
  const categoriasDisponibles =
    categoriasPorTipo[tipoProyecto] || categoriasPorTipo.vis_remodelacion;
  const categoriasNormalizadas = Array.from(
    new Set(
      categoriasDisponibles.map((cat) => aliasCategorias[cat] || cat).filter((cat) =>
        (categorias as readonly string[]).includes(cat)
      )
    )
  );
  const productosDisponibles = productos.filter((p) =>
    categoriasNormalizadas.includes(p.categoria)
  );

  const productosPorCategoria = categoriasNormalizadas
    .map((cat) => ({
      categoria: cat,
      productos: productosDisponibles.filter((p) => p.categoria === cat),
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
      className={`min-h-screen pb-32 ${
        esSanJuan
          ? "bg-gray-50"
          : "bg-gradient-to-br from-brand-dark via-black to-brand-dark"
      }`}
    >
      {/* Barra de progreso superior FIJA */}
      <div
        className={`fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-sm ${
          esSanJuan
            ? "border-gray-200 bg-white/95"
            : "border-brand-border bg-brand-dark/95"
        }`}
      >
        <div className="mx-auto max-w-6xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`text-xs ${
                esSanJuan ? "text-gray-600" : "text-brand-textSecondary"
              }`}
            >
              Progreso de personalización
            </span>
            <span
              className={`text-xs font-bold ${
                esSanJuan ? "text-blue-600" : "text-brand-primary"
              }`}
            >
              {Math.round(scrollProgress)}%
            </span>
          </div>
          <div
            className={`h-2 w-full overflow-hidden rounded-full ${
              esSanJuan ? "bg-gray-200" : "bg-brand-border"
            }`}
          >
            <motion.div
              className={`h-full ${
                esSanJuan
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                  : "bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary"
              }`}
              style={{ width: `${scrollProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Header San Juan de la Cuesta */}
      {esSanJuan && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 pt-16 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-4xl font-bold">Personaliza tu Apartamento</h1>
              <div className="text-2xl font-semibold text-blue-100">
                San Juan de la Cuesta
              </div>
            </div>

            <div className="relative mb-8 h-64 overflow-hidden rounded-2xl shadow-2xl">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 to-transparent" />
              <img
                src="/proyectos/san-juan-cuesta.jpg"
                alt="San Juan de la Cuesta"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"%3E%3Crect fill="%234F46E5" width="1200" height="400"/%3E%3Ctext fill="white" font-size="32" font-family="Arial" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESan Juan de la Cuesta%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            <div className="mb-6 text-center">
              <div className="inline-block rounded-xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-sm">
                <p className="text-lg text-white">
                  <span className="font-semibold">Constructora Colombia</span>,
                  {" "}tu aliado de confianza en{" "}
                  <span className="font-semibold">San Juan de la Cuesta</span>{" "}
                  para hacer realidad la remodelación de tus sueños
                </p>
              </div>
            </div>

            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-2 text-xl text-blue-100">
                Selecciona lo que deseas mejorar y calcula tu presupuesto de
                remodelación
              </p>
              <p className="text-lg text-blue-200">
                ⏱️ En solo 3 minutos obtendrás tu cotización personalizada
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Ciudadela Verde (original) */}
      {!esSanJuan && (
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-24">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/50 bg-brand-primary/20 px-4 py-2">
              <Sparkles className="h-4 w-4 text-brand-primary" />
              <span className="text-sm font-semibold text-brand-primary">
                {`Personaliza tu ${planBase === "basico" ? "Plan Básico" : "Plan Intermedio Plus"}`}
              </span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-brand-text md:text-4xl">
              Personaliza tu Remodelación
            </h1>
            <p className="text-brand-textSecondary">
              Selecciona los espacios y acabados que deseas remodelar
            </p>
          </motion.div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={`mb-6 flex items-center gap-2 text-sm ${
            esSanJuan ? "text-gray-600" : "text-brand-textSecondary"
          }`}
        >
          <span>Inicio</span>
          <span>›</span>
          <span>{proyectoSeleccionado}</span>
          <span>›</span>
          <span className={esSanJuan ? "font-medium text-blue-600" : "font-medium text-brand-primary"}>
            Personalizar
          </span>
        </div>

        {esSanJuan && (
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              🏗️ Servicios de Remodelación Disponibles
            </h2>
            <p className="text-gray-600">
              Selecciona las áreas y acabados que deseas mejorar en tu apartamento
            </p>
          </div>
        )}
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
