"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCotizador } from "@/lib/store/cotizador";
import type { ProductoConCantidad } from "@/lib/store/cotizador";
import { usePreciosPlanProyecto } from "@/lib/hooks/usePreciosPlanProyecto";
import { planesBase, proyectos, findProyecto, getNombreAdicional, getPrecioAdicional } from "@/lib/data/catalogo";
import { formatoPrecio } from "@/lib/utils/format";
import { generarCotizacionPDF } from "@/lib/utils/pdf-generator";
import { subirPresupuesto } from "@/lib/utils/storage-service";
import { getStoredTrackingParams } from "@/lib/hooks/useTrackingParams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
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
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
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
          <h4 className="font-bold text-gray-900">{nombre}</h4>
          <div className="text-sm text-amber-500">★★★★★</div>
        </div>
      </div>
      <p className="text-sm italic text-gray-600">&quot;{texto}&quot;</p>
    </div>
  );
}

export default function ResumenPage() {
  const router = useRouter();
  const {
    proyecto,
    planBase,
    adicionales,
    itemsManuales,
    _hasHydrated,
    getPrecioPlanBase,
    getTotal,
    clienteNombre,
    clienteTelefono,
    clienteEmail,
    preciosLiveAdicionales,
  } = useCotizador();
  // Re-sincroniza los precios en vivo por si el store trae valores viejos
  // guardados en localStorage de una visita anterior (ej. el catálogo
  // cambió de precio desde que el cliente entró) — así lo que se envía acá
  // nunca queda desactualizado aunque el usuario haya saltado directo a
  // /resumen. El valor de retorno no se usa acá, solo el efecto de
  // sincronizar el store.
  usePreciosPlanProyecto(proyecto);
  // Precio en vivo del catálogo si este adicional está mapeado y el
  // catálogo del proyecto lo tiene (poblado por usePreciosPlanProyecto en
  // /plan y /personalizar), si no, el precio dinámico por plan de siempre.
  // Todo lo que se muestra, se manda al PDF y se guarda en la DB en esta
  // página pasa por acá para no desincronizarse del total ya calculado.
  const resolverPrecioAdicional = (a: ProductoConCantidad) =>
    preciosLiveAdicionales[a.id] ?? getPrecioAdicional(a, planBase);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [itemsEditados, setItemsEditados] = useState<Record<string, string>>({});
  const [itemEnEdicion, setItemEnEdicion] = useState<string | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');

  const proyectoData = findProyecto(proyecto);
  const planData =
    planBase === "basico"
      ? planesBase.basico
      : planBase === "intermedio"
        ? planesBase.intermedio
        : null;

  const tipoProyecto =
    typeof window !== "undefined"
      ? localStorage.getItem("proyecto_tipo") || "vis_remodelacion"
      : "vis_remodelacion";
  const esSanJuan = tipoProyecto === "acabados_premium";

  const totalAdicionales = adicionales.reduce((sum, adicional) => {
    const qty = adicional.cantidad ?? 1;
    return sum + resolverPrecioAdicional(adicional) * qty;
  }, 0);

  const planBasicoMonto = esSanJuan ? 0 : getPrecioPlanBase();
  const inversionTotal = esSanJuan ? totalAdicionales : getTotal();
  const bonusSanJuan = [
    "Recorrido virtual 360°",
    "Supervisión profesional",
    "Garantía de calidad",
  ];

  useEffect(() => {
    if (!planBase || !proyecto) {
      router.push("/presupuestos");
      return;
    }
    if (!clienteNombre?.trim() || !clienteEmail?.trim()) {
      router.push("/datos-cliente");
    }
  }, [planBase, proyecto, clienteNombre, clienteEmail, router]);

  useEffect(() => {
    const editados = localStorage.getItem('items_editados');
    if (editados) setItemsEditados(JSON.parse(editados));
  }, []);

  const getNombreItem = (itemId: string, nombreOriginal: string): string =>
    itemsEditados[itemId] || nombreOriginal;

  const iniciarEdicion = (itemId: string, nombreActual: string) => {
    setItemEnEdicion(itemId);
    setNuevoNombre(nombreActual);
  };

  const guardarNombreEditado = (itemId: string) => {
    if (nuevoNombre.trim()) {
      const nuevosEditados = { ...itemsEditados, [itemId]: nuevoNombre.trim() };
      setItemsEditados(nuevosEditados);
      localStorage.setItem('items_editados', JSON.stringify(nuevosEditados));
    }
    setItemEnEdicion(null);
    setNuevoNombre('');
  };

  const cancelarEdicion = () => {
    setItemEnEdicion(null);
    setNuevoNombre('');
  };

  const resetearNombres = () => {
    if (confirm('¿Estás seguro de que quieres restaurar todos los nombres originales?')) {
      setItemsEditados({});
      localStorage.removeItem('items_editados');
    }
  };

  const guardarCotizacionEnDB = async (
    numeroCotizacion: string,
    pdfUrl: string
  ) => {
    if (!clienteNombre || !clienteEmail || !planData || !planBase) return;

    try {
      console.log("💾 Guardando cotización via API...");

      const trackingParams = getStoredTrackingParams();
      const utmSource = trackingParams?.utm_source?.toLowerCase() ?? null;

      const res = await fetch("/api/cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nombre: clienteNombre,
          cliente_email: clienteEmail,
          cliente_telefono: clienteTelefono || null,
          proyecto_id: proyecto,
          proyecto_nombre: proyectoData?.nombre,
          plan_tipo: planBase,
          plan_nombre: planData.nombre,
          precio_plan: esSanJuan ? 0 : getPrecioPlanBase(),
          total: inversionTotal,
          pdf_url: pdfUrl,
          numero_cotizacion: numeroCotizacion,
          adicionales: adicionales.map((a) => {
            const qty = a.cantidad ?? 1;
            const nombre = getNombreItem(a.id, getNombreAdicional(a, planBase));
            const precio = resolverPrecioAdicional(a);
            return {
              nombre: qty > 1 ? `${nombre} (×${qty})` : nombre,
              precio: precio * qty,
            };
          }),
          // Precio unitario y cantidad por separado (a diferencia de
          // `adicionales` arriba) — arma la fila real en `presupuestos`,
          // la misma tabla que lee /p/[token] y el generador de contrato.
          items_manuales: adicionales.map((a) => ({
            id: a.id,
            nombre: getNombreItem(a.id, getNombreAdicional(a, planBase)),
            precio: resolverPrecioAdicional(a),
            cantidad: a.cantidad ?? 1,
          })),
          presupuesto_estimado: inversionTotal,
          fuente: "WEB",
          origen:
            utmSource === "facebook" || utmSource === "instagram"
              ? "PAUTA_META"
              : utmSource === "google"
                ? "PAUTA_GOOGLE"
                : "WEB",
          utm_source: trackingParams?.utm_source,
          utm_medium: trackingParams?.utm_medium,
          utm_campaign: trackingParams?.utm_campaign,
          utm_content: trackingParams?.utm_content,
          utm_term: trackingParams?.utm_term,
          fbclid: trackingParams?.fbclid,
          gclid: trackingParams?.gclid,
          landing_page: trackingParams?.landing_page,
          referrer: trackingParams?.referrer,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        console.error("❌ Error guardando cotización:", errData);
        throw new Error(errData.error ?? "Error al guardar cotización");
      }

      const result = await res.json() as { cotizacion_id: string; token_publico: string | null };
      console.log("✅ Cotización guardada en DB:", result.cotizacion_id);
      return { success: true, tokenPublico: result.token_publico };
    } catch (error) {
      console.error("❌ Error:", error);
      return { success: false, error };
    }
  };

  const enviarPresupuestoPorEmail = async (
    pdfUrl: string,
    numeroCotizacion: string
  ): Promise<boolean> => {
    if (!clienteEmail || emailEnviado) return false;

    setEnviandoEmail(true);

    try {
      const response = await fetch("/api/enviar-presupuesto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteNombre,
          clienteEmail,
          numeroCotizacion,
          proyecto: proyectoData?.nombre,
          total: formatoPrecio(inversionTotal),
          pdfUrl,
        }),
      });

      if (response.ok) {
        setEmailEnviado(true);
        console.log("✅ Email enviado exitosamente");
        return true;
      } else {
        console.error("❌ Error enviando email");
        return false;
      }
    } catch (error) {
      console.error("Error:", error);
      return false;
    } finally {
      setEnviandoEmail(false);
    }
  };

  const generarYEnviarPresupuestoAutomatico = async () => {
    if (!planData || !proyectoData) return;

    setEnviandoEmail(true);

    try {
      const numeroCotizacion = `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

      console.log("📊 ADICIONALES AL CREAR PDFDATA:", {
        cantidad: adicionales.length,
        items: adicionales.map(a => ({
          id: a.id,
          nombre: getNombreAdicional(a, planBase),
          cantidad: a.cantidad
        }))
      });

      const pdfData = {
        numeroConsecutivo: numeroCotizacion,
        fecha: new Date().toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        cliente: {
          nombre: clienteNombre || "Cliente",
          telefono: clienteTelefono || "",
          email: clienteEmail || undefined,
        },
        proyecto: {
          nombre: proyectoData?.nombre || "Proyecto",
          ubicacion: proyectoData?.ubicacion || "Bucaramanga",
        },
        plan: {
          nombre: planData.nombre,
          precio: esSanJuan ? 0 : getPrecioPlanBase(),
          tiempoEntrega: planData.tiempoEntrega,
          incluye: esSanJuan ? [] : [...planData.incluye],
          bonus: esSanJuan ? bonusSanJuan : [...planData.bonus],
        },
        adicionales: adicionales.map((a) => ({
          nombre: getNombreItem(a.id, getNombreAdicional(a, planBase)),
          precio: resolverPrecioAdicional(a),
          cantidad: a.cantidad || 1,
        })),
        itemsManuales: itemsManuales && itemsManuales.length > 0 ? itemsManuales : [],
        total: inversionTotal,
      };

      const pdfBlob = await generarCotizacionPDF(pdfData);
      const fileName = `Cotizacion_${(proyectoData?.nombre || "Proyecto").replace(/\s/g, "_")}_${numeroCotizacion}.pdf`;
      const { success, publicUrl } = await subirPresupuesto(pdfBlob, fileName);

      if (success && publicUrl) {
        const dbResult = await guardarCotizacionEnDB(numeroCotizacion, publicUrl);

        if (dbResult?.success) {
          // Enviar email automáticamente
          const emailOk = await enviarPresupuestoPorEmail(
            publicUrl,
            numeroCotizacion
          );

          if (emailOk) {
            void fetch("/api/cotizacion", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ numero_cotizacion: numeroCotizacion, estado_crm: "CORREO_ENVIADO" }),
            });
          }

          // El cliente aterriza en /p/[token] — la misma página de
          // resultado que ya usa el presupuesto manual. /resumen sigue
          // existiendo (queda como historial / respaldo si algo falla acá
          // abajo), pero deja de ser el destino final del flujo.
          if (dbResult.tokenPublico) {
            router.replace(`/p/${dbResult.tokenPublico}`);
          }
        }
      }
    } catch (error) {
      console.error("Error enviando presupuesto automático:", error);
    } finally {
      setEnviandoEmail(false);
    }
  };

  useEffect(() => {
    if (_hasHydrated && planBase && proyecto && clienteEmail && !emailEnviado) {
      void generarYEnviarPresupuestoAutomatico();
    }
  }, [_hasHydrated, planBase, proyecto, clienteEmail]);

  if (!planBase || !proyecto || !planData) {
    return null;
  }

  const generarYCompartirPDF = async (tipo: "whatsapp" | "reserva") => {
    setGenerandoPDF(true);

    try {
      // 1. Generar número de cotización único
      const numeroCotizacion = `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

      // 2. Preparar datos del PDF
      const pdfData = {
        numeroConsecutivo: numeroCotizacion,
        fecha: new Date().toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        cliente: {
          nombre: clienteNombre || "Cliente",
          telefono: clienteTelefono || "",
          email: clienteEmail || undefined,
        },
        proyecto: {
          nombre: proyectoData?.nombre || "Proyecto",
          ubicacion: proyectoData?.ubicacion || "Bucaramanga",
        },
        plan: {
          nombre: planData.nombre,
          precio: esSanJuan ? 0 : getPrecioPlanBase(),
          tiempoEntrega: planData.tiempoEntrega,
          incluye: esSanJuan ? [] : [...planData.incluye],
          bonus: esSanJuan ? bonusSanJuan : [...planData.bonus],
        },
        adicionales: adicionales.map((a) => ({
          nombre: getNombreItem(a.id, getNombreAdicional(a, planBase)),
          precio: resolverPrecioAdicional(a),
          cantidad: a.cantidad || 1,
        })),
        itemsManuales: itemsManuales && itemsManuales.length > 0 ? itemsManuales : [],
        total: inversionTotal,
      };

      // 3. Generar PDF
      console.log("📄 Generando PDF...");
      const pdfBlob = await generarCotizacionPDF(pdfData);

      // 4. Subir a Supabase Storage
      console.log("☁️ Subiendo a Supabase...");
      const fileName = `Cotizacion_${(proyectoData?.nombre || "Proyecto").replace(/\s/g, "_")}_${numeroCotizacion}.pdf`;
      const {
        success,
        publicUrl,
        error: uploadError,
      } = await subirPresupuesto(pdfBlob, fileName);

      // 5. Guardar en DB y enviar email ANTES de abrir WhatsApp
      if (success && publicUrl) {
        console.log("✅ PDF subido exitosamente:", publicUrl);
        await guardarCotizacionEnDB(numeroCotizacion, publicUrl);
        const emailOk = await enviarPresupuestoPorEmail(
          publicUrl,
          numeroCotizacion
        );
        if (emailOk) {
          void fetch("/api/cotizacion", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numero_cotizacion: numeroCotizacion, estado_crm: "CORREO_ENVIADO" }),
          });
        }
      } else {
        console.error("❌ Error subiendo PDF:", uploadError);
      }

      // 6. Construir mensaje de WhatsApp (sin emojis para evitar encodeURIComponent)
      let mensaje = "";

      if (tipo === "reserva") {
        mensaje = `Hola! Vengo de la web de Constructora Colombia.

Ya tengo mi presupuesto listo para *${proyectoData?.nombre}* (${numeroCotizacion}).

${success ? `Ver Detalle:\n${publicUrl}\n\n` : ""}Quiero asegurar mi precio actual antes de que suban los insumos. Sigue disponible el cupo de reserva por $500.000 para este mes?

*DATOS DE CONTACTO:*
Nombre: ${clienteNombre || "Por definir"}
Telefono: ${clienteTelefono || "Por WhatsApp"}
${clienteEmail ? `Email: ${clienteEmail}` : ""}`;
      } else {
        mensaje = `Hola!

Acabo de generar mi presupuesto de remodelacion.

${success ? `Ver Detalle:\n${publicUrl}\n\n` : ""}*COTIZACION:* ${numeroCotizacion}
*PROYECTO:* ${proyectoData?.nombre}
*PLAN:* ${planData.nombre}
*INVERSION ESTIMADA:* ${formatoPrecio(inversionTotal)}

Me gustaria resolver algunas dudas antes de continuar. Podrian ayudarme?`;
      }

      // 7. Abrir WhatsApp
      const whatsappNumber =
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573175639674";
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;

      const isMobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, "_blank");
      }

      console.log("✅ Proceso completado");
    } catch (error) {
      console.error("❌ Error en el proceso:", error);

      // Si falla todo, al menos intentar abrir WhatsApp con mensaje básico (sin emojis)
      const mensajeBasico = `Hola, estoy interesado en una cotizacion de remodelacion para ${proyectoData?.nombre || "mi proyecto"}.

Tuve un problema tecnico generando el PDF. Podrian ayudarme?

*DATOS DE CONTACTO:*
Nombre: ${clienteNombre || "Por definir"}
Telefono: ${clienteTelefono || "Por WhatsApp"}
${clienteEmail ? `Email: ${clienteEmail}` : ""}`;
      const whatsappNumber =
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573175639674";
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensajeBasico)}`;

      const isMobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, "_blank");
      }
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:space-y-8 md:py-8">
        {/* Header con breadcrumb */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-3 text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="mb-1 text-2xl font-bold text-gray-900 md:mb-2 md:text-4xl">
            Resumen de tu Cotización
          </h1>
          <p className="text-sm text-gray-500 md:text-base">
            Revisa el detalle completo de tu remodelación
          </p>
        </div>

        {/* Banner de confirmación de email */}
        {emailEnviado && clienteEmail && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border-2 border-green-300 bg-green-50 p-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />
              <div className="flex-1">
                <h3 className="mb-1 font-bold text-gray-900">
                  ✅ ¡Presupuesto enviado a tu correo!
                </h3>
                <p className="text-sm text-gray-600">
                  Ya tienes el presupuesto detallado en{" "}
                  <span className="font-semibold text-amber-600">
                    {clienteEmail}
                  </span>{" "}
                  para que lo revises con calma.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {enviandoEmail && !emailEnviado && (
          <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-amber-500"></div>
              <p className="text-sm text-gray-600">
                Enviando presupuesto a tu correo...
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Columna principal - Resumen expandido */}
          <div className="space-y-6 lg:col-span-2">
            {/* Info del proyecto */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <CheckCircle2 className="h-6 w-6 text-amber-500" />
                  Información del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">
                      Proyecto
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {proyectoData?.nombre}
                    </p>
                    <p className="text-sm text-gray-500">
                      {proyectoData?.ubicacion}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">
                      Plan seleccionado
                    </p>
                    {esSanJuan ? (
                      <p className="text-lg font-bold text-amber-600">
                        Sin Plan Básico
                      </p>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-amber-600">
                          {planData.nombre}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {planData.tiempoEntrega} días hábiles
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desglose del plan - EXPANDIDO */}
            {!esSanJuan ? (
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">
                    ¿Qué incluye el Plan {planData.nombre}?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-gray-500">
                        Precio del Plan
                      </span>
                      <span className="text-2xl font-bold text-amber-600">
                        {formatoPrecio(getPrecioPlanBase())}
                      </span>
                    </div>
                    <Separator className="mb-4 bg-gray-200" />

                    <div className="space-y-3">
                      <p className="mb-3 text-sm font-semibold text-gray-900">
                        Todas las actividades incluidas:
                      </p>
                      <div className="grid gap-2">
                        {planData.incluye.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3"
                          >
                            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                            <span className="text-sm text-gray-600">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BONUS GRATIS - Ajustado */}
                  <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">⭐</span>
                      <h3 className="text-xl font-bold text-green-800">
                        BONUS GRATIS INCLUIDOS:
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="text-green-600 text-lg">✓</div>
                        <span className="text-green-900">
                          Recorrido virtual 360°
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-600 text-lg">✓</div>
                        <span className="text-green-900">
                          Supervisión profesional
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-600 text-lg">✓</div>
                        <span className="text-green-900">
                          Garantía de calidad
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">⭐</span>
                  <h3 className="text-xl font-bold text-green-800">
                    BONUS GRATIS INCLUIDOS:
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 text-lg">✓</div>
                    <span className="text-green-900">Recorrido virtual 360°</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 text-lg">✓</div>
                    <span className="text-green-900">
                      Supervisión profesional
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 text-lg">✓</div>
                    <span className="text-green-900">Garantía de calidad</span>
                  </div>
                </div>
              </div>
            )}

            {/* Adicionales si hay */}
            {adicionales.length > 0 && (
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-gray-900">
                    <span>Adicionales Seleccionados</span>
                    {Object.keys(itemsEditados).length > 0 && (
                      <button
                        onClick={resetearNombres}
                        className="text-xs font-normal text-blue-600 underline hover:text-blue-700"
                      >
                        Restaurar nombres originales
                      </button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-xs text-gray-500">
                    💡 Haz click en cualquier nombre para personalizarlo en el presupuesto.
                  </p>
                  <div className="space-y-3">
                    {adicionales.map((adicional, index) => {
                      const qty = adicional.cantidad ?? 1;
                      const nombreBase = getNombreAdicional(adicional, planBase);
                      const nombreMostrar = getNombreItem(adicional.id, nombreBase);
                      const precioMostrar = resolverPrecioAdicional(adicional);
                      const lineTotal = precioMostrar * qty;
                      const enEdicion = itemEnEdicion === adicional.id;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0"
                        >
                          <div className="flex-1 pr-4">
                            {enEdicion ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={nuevoNombre}
                                  onChange={(e) => setNuevoNombre(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') guardarNombreEditado(adicional.id);
                                    if (e.key === 'Escape') cancelarEdicion();
                                  }}
                                  autoFocus
                                  className="h-8 flex-1 rounded border-2 border-blue-500 bg-white px-2 text-sm text-gray-900 focus:outline-none"
                                />
                                <button
                                  onClick={() => guardarNombreEditado(adicional.id)}
                                  className="h-8 rounded bg-green-600 px-3 text-xs font-medium text-white hover:bg-green-700"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={cancelarEdicion}
                                  className="h-8 rounded bg-gray-400 px-3 text-xs font-medium text-white hover:bg-gray-500"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => iniciarEdicion(adicional.id, nombreMostrar)}
                                className="group flex items-center gap-1 text-left text-gray-600 hover:text-amber-600"
                              >
                                <span>{nombreMostrar}</span>
                                {qty > 1 && (
                                  <span className="text-amber-600">×{qty}</span>
                                )}
                                <span className="opacity-0 transition-opacity group-hover:opacity-100">✏️</span>
                              </button>
                            )}
                          </div>
                          <span className="shrink-0 font-semibold text-amber-600">
                            {formatoPrecio(lineTotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna lateral - Total sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <Card className="border-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center text-black/80">
                    Inversión Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-black mb-4">
                      {formatoPrecio(inversionTotal)}
                    </p>
                    {!esSanJuan ? (
                      <>
                        {planBasicoMonto > 0 && (
                          <p className="text-sm text-black/70 mb-1">
                            Plan Básico Esencial: {formatoPrecio(planBasicoMonto)}
                          </p>
                        )}
                        <p className="text-sm text-black/70">
                          Adicionales: {formatoPrecio(totalAdicionales)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-black/70">
                        Incluye {adicionales.length} adicionales seleccionados
                      </p>
                    )}
                  </div>

                  <Separator className="bg-black/15" />

                  {!esSanJuan && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-black/70">
                          Plan {planData.nombre}
                        </span>
                        <span className="text-black/90">
                          {formatoPrecio(planBasicoMonto)}
                        </span>
                      </div>
                      {adicionales.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-black/70">
                            Adicionales
                          </span>
                          <span className="text-black/90">
                            {formatoPrecio(totalAdicionales)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Componente de Cierre de Venta */}
        <CierreVentaExpress
          onReservar={() => generarYCompartirPDF("reserva")}
          generandoPDF={generandoPDF}
        />

        {/* Testimonios al final de la página */}
        <Card className="mt-8 border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-gray-900">
              Lo Que Dicen Nuestros Clientes
            </CardTitle>
            <p className="text-center text-gray-500">
              Más de 100 familias ya confían en nosotros
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <TestimonialCard
                src="/testimonios/michael-correa.jpg"
                alt="Michael Correa"
                nombre="Michael Correa"
                fallback="MC"
                texto="Excelente trabajo, muy profesionales. Mi apartamento quedó hermoso y lo entregaron en el tiempo prometido."
              />
              <TestimonialCard
                src="/testimonios/liliana-sanchez.jpg"
                alt="Liliana Sánchez"
                nombre="Liliana Sánchez"
                fallback="LS"
                texto="La mejor inversión que hice. El equipo fue muy atento y el resultado superó mis expectativas."
              />
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
    </main>
  );
}
