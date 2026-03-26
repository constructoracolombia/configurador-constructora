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

export default function AdicionalesPage() {
  const router = useRouter();
  const {
    adicionales: seleccionados,
    toggleAdicional,
    incrementarCantidad,
    decrementarCantidad,
    removeAdicional,
    getCantidad,
    planBase,
    proyecto,
    setProyecto,
    setPlanBase,
  } = useCotizador();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [totalAnimado, setTotalAnimado] = useState(0);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState("Ciudadela Verde");
  const [tipoProyecto, setTipoProyecto] = useState("vis_remodelacion");
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [productosSeleccionados, setProductosSeleccionados] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const esSanJuan = tipoProyecto === "acabados_premium";

  useEffect(() => {
    const productosGuardados = localStorage.getItem("productos_seleccionados");

    if (productosGuardados) {
      try {
        const productos = JSON.parse(productosGuardados);
        const idsObsoletos = [
          "calentador-bosch",
          "calentador",
          "lavadero-enchapado",
          "ampliacion-balcon",
          "puerta-melamina-rh",
          "puerta-melamina",
          "puerta-corredera",
          "tuberia-agua-caliente",
          "tuberia-aire-acondicionado",
          "tuberia-aire",
          "mueble-alacena-vertical",
          "mueble-alacena",
          "mueble-bajo-lavadero",
          "mueble-lavadero",
          "mueble-sobre-nevera",
          "mueble-nevera",
        ];

        const productosLimpios = (productos as any[]).filter(
          (p) => !idsObsoletos.includes(p.id)
        );

        if (productosLimpios.length !== productos.length) {
          localStorage.setItem(
            "productos_seleccionados",
            JSON.stringify(productosLimpios)
          );
          setProductosSeleccionados(productosLimpios);
        }
      } catch (error) {
        console.error("Error limpiando productos:", error);
      }
    }
  }, []);

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
      "Granitos",
      "Pisos",
      "Pintura",
      "Eléctrica",
      "Otros",
    ],
    acabados_premium: [
      "Carpintería",
      "Baños",
      "Cocina",
      "Granitos",
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

  useEffect(() => {
    setProductosSeleccionados(
      seleccionados.map((p) => ({ ...p, cantidad: p.cantidad ?? 1 }))
    );
  }, [seleccionados]);

  const estaSeleccionado = (id: string) => {
    return seleccionados.some((p) => p.id === id);
  };

  const getCantidadItem = (id: string) => {
    return getCantidad(id);
  };

  const agregarProducto = (producto: any) => {
    const yaExiste = productosSeleccionados.find((p) => p.id === producto.id);

    if (yaExiste) {
      setProductosSeleccionados(
        productosSeleccionados.map((p) =>
          p.id === producto.id ? { ...p, cantidad: (p.cantidad ?? 1) + 1 } : p
        )
      );
      incrementarCantidad(producto.id, producto.maxCantidad ?? 999);
    } else {
      setProductosSeleccionados([
        ...productosSeleccionados,
        { ...producto, cantidad: 1 },
      ]);
      toggleAdicional(producto);
    }
  };

  const quitarProducto = (productoId: string) => {
    const producto = productosSeleccionados.find((p) => p.id === productoId);

    if (producto && (producto.cantidad ?? 1) > 1) {
      setProductosSeleccionados(
        productosSeleccionados.map((p) =>
          p.id === productoId ? { ...p, cantidad: (p.cantidad ?? 1) - 1 } : p
        )
      );
      decrementarCantidad(productoId);
    } else {
      setProductosSeleccionados(
        productosSeleccionados.filter((p) => p.id !== productoId)
      );
      removeAdicional(productoId);
    }
  };

  if (!planBase || !proyecto) {
    return null;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black pb-32">
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
        <div className="border-b-4 border-yellow-400 bg-gradient-to-br from-black via-gray-900 to-black pt-16 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-4xl font-bold">
                Personaliza tu <span className="text-yellow-400">Apartamento</span>
              </h1>
              <div className="text-2xl font-semibold">
                <span className="text-yellow-400">San Juan de la Cuesta</span>
              </div>
            </div>

            <div className="relative mb-8 h-64 overflow-hidden rounded-2xl shadow-2xl">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 to-transparent" />
              <img
                src="/proyectos/san-juan-cuesta.jpg"
                alt="San Juan de la Cuesta"
                className="h-full w-full object-cover"
                onLoad={() => console.log("✅ Imagen cargada correctamente")}
                onError={(e) => {
                  console.error("❌ Error cargando imagen:", e.currentTarget.src);
                  e.currentTarget.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"%3E%3Crect fill="%23000000" width="1200" height="400"/%3E%3Crect fill="%23EAB308" x="0" y="390" width="1200" height="10"/%3E%3Ctext fill="%23EAB308" font-size="32" font-family="Arial" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-weight="bold"%3ESan Juan de la Cuesta%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            <div className="mb-6 text-center">
              <div className="inline-block rounded-xl border-2 border-yellow-400/40 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 px-6 py-4 backdrop-blur-sm">
                <p className="text-lg text-white">
                  <span className="font-bold text-yellow-400">Constructora Colombia</span>,
                  {" "}tu aliado de confianza en{" "}
                  <span className="font-semibold text-yellow-300">San Juan de la Cuesta</span>{" "}
                  para hacer realidad la remodelación de tus sueños
                </p>
              </div>
            </div>

            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-2 text-xl text-gray-300">
                Selecciona lo que deseas mejorar y calcula tu{" "}
                <span className="font-semibold text-yellow-400">
                  presupuesto de remodelación
                </span>
              </p>
              <p className="text-lg text-gray-400">
                <span className="text-yellow-400">⏱️</span> En solo{" "}
                <span className="font-bold text-yellow-400">3 minutos</span>{" "}
                obtendrás tu cotización personalizada
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
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <span>Inicio</span>
          <span>›</span>
          <span>{proyectoSeleccionado}</span>
          <span>›</span>
          <span className="font-medium text-yellow-400">
            Personalizar
          </span>
        </div>

        {esSanJuan && (
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-white">
              🏗️ Servicios de <span className="text-yellow-400">Remodelación</span>{" "}
              Disponibles
            </h2>
            <p className="text-gray-400">
              Selecciona las áreas y acabados que deseas mejorar en tu apartamento
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto mb-8 max-w-6xl px-4">
        <div className="sticky top-24 rounded-2xl border-2 border-gray-800 bg-gradient-to-br from-gray-900 to-black p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Categorías</h2>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <button
              onClick={() => setCategoriaActiva("Todas")}
              className={`rounded-xl px-4 py-3 text-left font-medium transition-all ${
                categoriaActiva === "Todas"
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Todas
            </button>
            {categoriasNormalizadas.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`rounded-xl px-4 py-3 text-left font-medium transition-all ${
                  categoriaActiva === cat
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal - Layout vertical por categorías */}
      <div className="mx-auto max-w-6xl space-y-12 px-4">
        {productosPorCategoria
          .filter(
            (grupo) =>
              categoriaActiva === "Todas" || grupo.categoria === categoriaActiva
          )
          .map((grupo, grupoIdx) => (
          <motion.div
            key={grupo.categoria}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: grupoIdx * 0.05 }}
          >
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold text-white">
                {grupo.categoria}
              </h2>
              <div className="h-1 w-20 rounded-full bg-yellow-400" />
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
                    <Card className="h-full overflow-hidden rounded-2xl border-2 border-gray-800 bg-gradient-to-br from-gray-900 to-black transition-all duration-300 hover:border-yellow-400">
                      <CardContent className="p-4">
                        <div className="relative mb-3 h-48 w-full overflow-hidden rounded-lg bg-gray-800">
                          {producto.imagen &&
                          !producto.imagen.includes("placeholder") ? (
                            <img
                              src={producto.imagen}
                              alt={producto.nombre}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src =
                                  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23111827' width='400' height='300'/%3E%3Crect fill='%23EAB308' x='0' y='280' width='400' height='20'/%3E%3Ctext fill='%23FFFFFF' font-size='16' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(
                                    producto.nombre
                                  )}%3C/text%3E%3C/svg%3E`;
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-4xl text-gray-500">
                              🏗️
                            </div>
                          )}

                          <div className="absolute right-2 top-2">
                            <Badge className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
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
                          <h4 className="mb-1 text-lg font-bold text-white">
                            {producto.nombre}
                          </h4>
                          <p className="mb-3 line-clamp-2 text-sm text-gray-400">
                            {producto.descripcion}
                          </p>

                          <div className="mb-4 text-xl font-bold text-yellow-400">
                            $ {producto.precio.toLocaleString("es-CO")}
                          </div>

                          {(() => {
                            const productoEnCarrito = productosSeleccionados.find(
                              (p) => p.id === producto.id
                            );

                            if (productoEnCarrito) {
                              return (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => quitarProducto(producto.id)}
                                    className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-800 text-xl font-bold text-yellow-400 transition-all hover:bg-gray-700"
                                  >
                                    −
                                  </button>
                                  <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-yellow-400 text-xl font-bold text-black">
                                    {productoEnCarrito.cantidad}
                                  </div>
                                  <button
                                    onClick={() => agregarProducto(producto)}
                                    className="h-12 w-12 flex-shrink-0 rounded-xl bg-yellow-400 text-xl font-bold text-black transition-all hover:bg-yellow-500"
                                  >
                                    +
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <Button
                                onClick={() => agregarProducto(producto)}
                                className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black transition-all duration-300 hover:bg-yellow-500"
                              >
                                <span className="mr-2 text-lg">+</span>
                                Agregar
                              </Button>
                            );
                          })()}
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

      {productosSeleccionados.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="w-80 rounded-2xl border-2 border-yellow-400 bg-gradient-to-br from-gray-900 to-black p-6 shadow-2xl">
            <h3 className="mb-4 flex items-center justify-between text-lg font-bold text-white">
              <span>Tu Selección</span>
              <span className="text-yellow-400">
                {productosSeleccionados.length} items
              </span>
            </h3>

            <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
              {productosSeleccionados.map((p) => (
                <div key={p.id} className="rounded-lg bg-gray-800/50 p-3 text-sm">
                  <div className="mb-1 font-medium text-white">{p.nombre}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">x{p.cantidad}</span>
                    <span className="font-bold text-yellow-400">
                      $ {(p.precio * p.cantidad).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4 border-t-2 border-gray-800 pt-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold text-white">Total:</span>
                <span className="text-xl font-bold text-yellow-400">
                  ${" "}
                  {productosSeleccionados
                    .reduce((sum, p) => sum + p.precio * p.cantidad, 0)
                    .toLocaleString("es-CO")}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem(
                  "productos_seleccionados",
                  JSON.stringify(productosSeleccionados)
                );
                window.location.href = "/datos-cliente";
              }}
              className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black transition-all duration-300 hover:bg-yellow-500"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

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
