"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCotizador } from "@/lib/store/cotizador";
import { planesBase, proyectos, findProyecto, getNombreAdicional, getPrecioAdicional } from "@/lib/data/catalogo";
import { formatoPrecio } from "@/lib/utils/format";
import { generarCotizacionPDF } from "@/lib/utils/pdf-generator";
import { subirPresupuesto } from "@/lib/utils/storage-service";
import { supabase } from "@/lib/supabase/client";
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
    itemsManuales,
    getPrecioPlanBase,
    getTotal,
    clienteNombre,
    clienteTelefono,
    clienteEmail,
  } = useCotizador();
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
    return sum + getPrecioAdicional(adicional, planBase) * qty;
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
      console.log("💾 Guardando cotización en base de datos...");
      console.log("📝 Intentando insertar:", {
        cliente_nombre: clienteNombre,
        cliente_email: clienteEmail,
        proyecto_id: proyecto,
        proyecto_nombre: proyectoData?.nombre,
        plan_tipo: planBase,
        estado_crm: "NUEVO",
        numero_cotizacion: numeroCotizacion,
      });

      const { data, error } = await supabase.from("cotizaciones").insert({
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
        estado_crm: "NUEVO",
        posicion_kanban: 0,
        adicionales: adicionales.map((a) => {
          const qty = a.cantidad ?? 1;
          const nombre = getNombreItem(a.id, getNombreAdicional(a, planBase));
          const precio = getPrecioAdicional(a, planBase);
          return {
            nombre: qty > 1 ? `${nombre} (×${qty})` : nombre,
            precio: precio * qty,
          };
        }),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      }).select();

      console.log("✅ Respuesta de Supabase - Data:", data);
      console.log("❌ Respuesta de Supabase - Error:", error);

      if (error) {
        console.error("❌ Error guardando en DB:", error);
        throw error;
      }

      console.log("✅ Cotización guardada exitosamente en DB");

      const cotizacionId = data?.[0]?.id as string | undefined;
      if (cotizacionId) {
        try {
          const trackingParams = getStoredTrackingParams();
          const utmSource = trackingParams?.utm_source?.toLowerCase() ?? null;

          // Crear lead automáticamente desde cotización web
          const { data: lead, error: leadError } = await supabase
            .from("leads")
            .insert({
              nombre: clienteNombre,
              telefono: clienteTelefono || "Sin teléfono",
              email: clienteEmail,
              proyecto: proyectoData?.nombre,
              presupuesto_estimado: inversionTotal,
              fuente: "WEB",
              origen:
                utmSource === "facebook" || utmSource === "instagram"
                  ? "PAUTA_META"
                  : utmSource === "google"
                    ? "PAUTA_GOOGLE"
                    : "WEB",
              fuente_detalle: "Configurador online",
              etapa: "COTIZACION",
              probabilidad: 40,
              cotizacion_id: cotizacionId,
              utm_source: trackingParams?.utm_source,
              utm_medium: trackingParams?.utm_medium,
              utm_campaign: trackingParams?.utm_campaign,
              utm_content: trackingParams?.utm_content,
              utm_term: trackingParams?.utm_term,
              fbclid: trackingParams?.fbclid,
              gclid: trackingParams?.gclid,
              landing_page: trackingParams?.landing_page,
              referrer: trackingParams?.referrer,
            })
            .select("id")
            .single();

          if (leadError) {
            console.error("⚠️ No se pudo crear lead:", leadError);
          }
          // Temporalmente comentado para debugging
          // if (lead?.id) {
          //   await supabase.from("lead_actividades").insert({
          //     lead_id: lead.id,
          //     tipo: "NOTA",
          //     descripcion: `Cotización generada: ${numeroCotizacion}. Total: ${formatoPrecio(inversionTotal)}`,
          //   });
          // }
        } catch (leadFlowError) {
          console.error("⚠️ Error integrando lead desde cotización:", leadFlowError);
        }
      }

      return { success: true, data };
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
          precio: getPrecioAdicional(a, planBase),
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
            await supabase
              .from("cotizaciones")
              .update({ estado_crm: "CORREO_ENVIADO" })
              .eq("numero_cotizacion", numeroCotizacion);
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
    if (planBase && proyecto && clienteEmail && !emailEnviado) {
      void generarYEnviarPresupuestoAutomatico();
    }
  }, [planBase, proyecto, clienteEmail]);

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
          precio: getPrecioAdicional(a, planBase),
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
          await supabase
            .from("cotizaciones")
            .update({ estado_crm: "CORREO_ENVIADO" })
            .eq("numero_cotizacion", numeroCotizacion);
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

        {/* Banner de confirmación de email */}
        {emailEnviado && clienteEmail && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border-2 border-green-500 bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-400" />
              <div className="flex-1">
                <h3 className="mb-1 font-bold text-brand-text">
                  ✅ ¡Presupuesto enviado a tu correo!
                </h3>
                <p className="text-sm text-brand-textSecondary">
                  Ya tienes el presupuesto detallado en{" "}
                  <span className="font-semibold text-brand-primary">
                    {clienteEmail}
                  </span>{" "}
                  para que lo revises con calma.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {enviandoEmail && !emailEnviado && (
          <div className="mb-6 rounded-xl border-2 border-blue-500 bg-blue-900/20 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-brand-primary"></div>
              <p className="text-sm text-brand-textSecondary">
                Enviando presupuesto a tu correo...
              </p>
            </div>
          </div>
        )}

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
                    {esSanJuan ? (
                      <p className="text-lg font-bold text-brand-primary">
                        Sin Plan Básico
                      </p>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-brand-primary">
                          {planData.nombre}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-brand-textSecondary" />
                          <span className="text-sm text-brand-textSecondary">
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

                  {/* BONUS GRATIS - Ajustado */}
                  <div className="bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-600 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">⭐</span>
                      <h3 className="text-xl font-bold text-white">
                        BONUS GRATIS INCLUIDOS:
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="text-green-400 text-lg">✓</div>
                        <span className="text-white">
                          Recorrido virtual 360°
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-400 text-lg">✓</div>
                        <span className="text-white">
                          Supervisión profesional
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-400 text-lg">✓</div>
                        <span className="text-white">
                          Garantía de calidad
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-600 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">⭐</span>
                  <h3 className="text-xl font-bold text-white">
                    BONUS GRATIS INCLUIDOS:
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="text-green-400 text-lg">✓</div>
                    <span className="text-white">Recorrido virtual 360°</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-green-400 text-lg">✓</div>
                    <span className="text-white">
                      Supervisión profesional
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-green-400 text-lg">✓</div>
                    <span className="text-white">Garantía de calidad</span>
                  </div>
                </div>
              </div>
            )}

            {/* Adicionales si hay */}
            {adicionales.length > 0 && (
              <Card className="border-brand-border bg-brand-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-brand-text">
                    <span>Adicionales Seleccionados</span>
                    {Object.keys(itemsEditados).length > 0 && (
                      <button
                        onClick={resetearNombres}
                        className="text-xs font-normal text-blue-400 underline hover:text-blue-300"
                      >
                        Restaurar nombres originales
                      </button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-xs text-brand-textSecondary">
                    💡 Haz click en cualquier nombre para personalizarlo en el presupuesto.
                  </p>
                  <div className="space-y-3">
                    {adicionales.map((adicional, index) => {
                      const qty = adicional.cantidad ?? 1;
                      const nombreBase = getNombreAdicional(adicional, planBase);
                      const nombreMostrar = getNombreItem(adicional.id, nombreBase);
                      const precioMostrar = getPrecioAdicional(adicional, planBase);
                      const lineTotal = precioMostrar * qty;
                      const enEdicion = itemEnEdicion === adicional.id;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between border-b border-brand-border py-2 last:border-0"
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
                                  className="h-8 rounded bg-gray-500 px-3 text-xs font-medium text-white hover:bg-gray-600"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => iniciarEdicion(adicional.id, nombreMostrar)}
                                className="group flex items-center gap-1 text-left text-brand-textSecondary hover:text-brand-primary"
                              >
                                <span>{nombreMostrar}</span>
                                {qty > 1 && (
                                  <span className="text-brand-primary">×{qty}</span>
                                )}
                                <span className="opacity-0 transition-opacity group-hover:opacity-100">✏️</span>
                              </button>
                            )}
                          </div>
                          <span className="shrink-0 font-semibold text-brand-primary">
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
              <Card className="border-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-xl">
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

                  <Separator className="bg-brand-border" />

                  {!esSanJuan && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brand-textSecondary">
                          Plan {planData.nombre}
                        </span>
                        <span className="text-brand-text">
                          {formatoPrecio(planBasicoMonto)}
                        </span>
                      </div>
                      {adicionales.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-brand-textSecondary">
                            Adicionales
                          </span>
                          <span className="text-brand-text">
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
        <Card className="mt-8 border-brand-border bg-brand-card">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-brand-text">
              Lo Que Dicen Nuestros Clientes
            </CardTitle>
            <p className="text-center text-brand-textSecondary">
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
