"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCotizador } from "@/lib/store/cotizador";
import { planesBase, proyectos } from "@/lib/data/catalogo";
import { formatoPrecio } from "@/lib/utils/format";
import { generarCotizacionPDF } from "@/lib/utils/pdf-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CierreVentaExpress } from "@/components/CierreVentaExpress";

function TestimonialCard({
  src,
  alt,
  nombre,
  fallback,
  texto,
}: {
  src: string;
  alt: string;
  nombre: string;
  fallback: string;
  texto: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="rounded-xl bg-brand-dark p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary">
          {imgError ? (
            <span className="text-2xl font-bold text-black">{fallback}</span>
          ) : (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <div>
          <h4 className="font-bold text-brand-text">{nombre}</h4>
          <div className="text-sm text-brand-primary">★★★★★</div>
        </div>
      </div>
      <p className="text-sm italic text-brand-textSecondary">&quot;{texto}&quot;</p>
    </div>
  );
}

export default function ResumenPage() {
  const router = useRouter();
  const {
    proyecto,
    planBase,
    adicionales,
    getPrecioPlanBase,
    getTotal,
  } = useCotizador();
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const proyectoData = proyectos.find((p) => p.id === proyecto);
  const planData =
    planBase === "basico"
      ? planesBase.basico
      : planBase === "intermedio"
        ? planesBase.intermedio
        : null;

  useEffect(() => {
    if (!planBase || !proyecto) {
      router.push("/");
    }
  }, [planBase, proyecto, router]);

  if (!planBase || !proyecto || !planData) {
    return null;
  }

  const generarYCompartirPDF = async (tipo: "whatsapp" | "reserva") => {
    setGenerandoPDF(true);

    try {
      const numeroCotizacion = `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

      const pdfData = {
        numeroConsecutivo: numeroCotizacion,
        fecha: new Date().toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        cliente: {
          nombre: "Cliente",
          telefono: "",
          email: undefined as string | undefined,
        },
        proyecto: {
          nombre: proyectoData?.nombre ?? "Proyecto",
          ubicacion: proyectoData?.ubicacion ?? "Bucaramanga",
        },
        plan: {
          nombre: planData.nombre,
          precio: getPrecioPlanBase(),
          tiempoEntrega: planData.tiempoEntrega,
          incluye: [...planData.incluye],
          bonus: [...planData.bonus],
        },
        adicionales: adicionales.map((a) => ({
          nombre: a.nombre,
          precio: a.precio,
        })),
        total: getTotal(),
      };

      const pdfBlob = await generarCotizacionPDF(pdfData);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotizacion_${(proyectoData?.nombre ?? "Proyecto").replace(/\s/g, "_")}_${numeroCotizacion}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setTimeout(() => {
        const mensaje =
          tipo === "reserva"
            ? `🎉 ¡Quiero RESERVAR mi cupo!

📋 Cotización: ${numeroCotizacion}
🏢 Proyecto: ${proyectoData?.nombre}
💰 Total: ${formatoPrecio(getTotal())}

📎 Adjunto PDF con el detalle completo.

💵 Abono de reserva: $500.000`
            : `Hola, acabo de generar mi cotización:

📋 Cotización: ${numeroCotizacion}
🏢 Proyecto: ${proyectoData?.nombre}
📦 Plan: ${planData.nombre}
💰 Total: ${formatoPrecio(getTotal())}

📎 Adjunto PDF con el detalle. ¿Podrían ayudarme con algunas preguntas?`;

        const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, "_blank");
      }, 1000);
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark pb-20">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* Header con breadcrumb */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-brand-textSecondary hover:text-brand-text"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="mb-2 text-4xl font-bold text-brand-text">
            Resumen de tu Cotización
          </h1>
          <p className="text-brand-textSecondary">
            Revisa el detalle completo de tu remodelación
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna principal - Resumen expandido */}
          <div className="space-y-6 lg:col-span-2">
            {/* Info del proyecto */}
            <Card className="border-brand-border bg-brand-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-text">
                  <CheckCircle2 className="h-6 w-6 text-brand-primary" />
                  Información del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm text-brand-textSecondary">
                      Proyecto
                    </p>
                    <p className="text-lg font-bold text-brand-text">
                      {proyectoData?.nombre}
                    </p>
                    <p className="text-sm text-brand-textSecondary">
                      {proyectoData?.ubicacion}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-brand-textSecondary">
                      Plan seleccionado
                    </p>
                    <p className="text-lg font-bold text-brand-primary">
                      {planData.nombre}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-textSecondary" />
                      <span className="text-sm text-brand-textSecondary">
                        {planData.tiempoEntrega} días hábiles
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desglose del plan - EXPANDIDO */}
            <Card className="border-brand-border bg-brand-card">
              <CardHeader>
                <CardTitle className="text-brand-text">
                  ¿Qué incluye el Plan {planData.nombre}?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-brand-dark p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-brand-textSecondary">
                      Precio del Plan
                    </span>
                    <span className="text-2xl font-bold text-brand-primary">
                      {formatoPrecio(getPrecioPlanBase())}
                    </span>
                  </div>
                  <Separator className="mb-4 bg-brand-border" />

                  <div className="space-y-3">
                    <p className="mb-3 text-sm font-semibold text-brand-text">
                      Todas las actividades incluidas:
                    </p>
                    <div className="grid gap-2">
                      {planData.incluye.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3"
                        >
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
                          <span className="text-sm text-brand-textSecondary">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bonus */}
                <div className="rounded-lg border-l-4 border-green-500 bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-text">
                    <span className="text-xl">⭐</span>
                    BONUS GRATIS INCLUIDOS:
                  </p>
                  <div className="grid gap-2">
                    {planData.bonus.map((bonus, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3"
                      >
                        <span className="text-brand-primary">✓</span>
                        <span className="text-sm text-brand-textSecondary">
                          {bonus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adicionales si hay */}
            {adicionales.length > 0 && (
              <Card className="border-brand-border bg-brand-card">
                <CardHeader>
                  <CardTitle className="text-brand-text">
                    Adicionales Seleccionados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {adicionales.map((adicional, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-brand-border py-2 last:border-0"
                      >
                        <span className="text-brand-textSecondary">
                          {adicional.nombre}
                        </span>
                        <span className="font-semibold text-brand-primary">
                          {formatoPrecio(adicional.precio)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Testimonios */}
            <Card className="border-brand-border bg-brand-card">
              <CardHeader>
                <CardTitle className="text-center text-brand-text">
                  Lo Que Dicen Nuestros Clientes
                </CardTitle>
                <p className="text-center text-brand-textSecondary">
                  Más de 100 familias ya confían en nosotros
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Testimonial 1 */}
                  <TestimonialCard
                    src="/testimonios/michael-correa.jpg"
                    alt="Michael Correa"
                    nombre="Michael Correa"
                    fallback="MC"
                    texto="Excelente trabajo, muy profesionales. Mi apartamento quedó hermoso y lo entregaron en el tiempo prometido."
                  />
                  {/* Testimonial 2 */}
                  <TestimonialCard
                    src="/testimonios/liliana-sanchez.jpg"
                    alt="Liliana Sánchez"
                    nombre="Liliana Sánchez"
                    fallback="LS"
                    texto="La mejor inversión que hice. El equipo fue muy atento y el resultado superó mis expectativas."
                  />
                  {/* Testimonial 3 */}
                  <TestimonialCard
                    src="/testimonios/alexandra-pimiento.JPG"
                    alt="Alexandra Pimiento"
                    nombre="Alexandra Pimiento"
                    fallback="AP"
                    texto="Todo el proceso fue transparente desde el inicio. Recomiendo 100% sus servicios."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral - Total sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <Card className="border-2 border-brand-primary bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10">
                <CardHeader>
                  <CardTitle className="text-center text-brand-text">
                    Inversión Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-brand-primary">
                      {formatoPrecio(getTotal())}
                    </p>
                    <p className="mt-2 text-sm text-brand-textSecondary">
                      Incluye plan base + {adicionales.length} adicionales
                    </p>
                  </div>

                  <Separator className="bg-brand-border" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-brand-textSecondary">
                        Plan {planData.nombre}
                      </span>
                      <span className="text-brand-text">
                        {formatoPrecio(getPrecioPlanBase())}
                      </span>
                    </div>
                    {adicionales.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-brand-textSecondary">
                          Adicionales
                        </span>
                        <span className="text-brand-text">
                          {formatoPrecio(
                            adicionales.reduce((sum, a) => sum + a.precio, 0)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Componente de Cierre de Venta */}
        <CierreVentaExpress
          nombreCliente=""
          telefonoCliente=""
          isLoading={generandoPDF}
          onReservar={() => generarYCompartirPDF("reserva")}
          onConsultar={() => generarYCompartirPDF("whatsapp")}
        />
      </div>
    </main>
  );
}
