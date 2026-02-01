"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { generarCotizacionPDF } from "@/lib/utils/pdf-generator";
import {
  planesBase,
  proyectos
} from "@/lib/data/catalogo";
import {
  formatoPrecio,
  generarMensajeWhatsApp,
  enviarWhatsApp
} from "@/lib/utils/format";
import { useCotizador } from "@/lib/store/cotizador";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(100),
  telefono: z
    .string()
    .min(10, "Teléfono inválido")
    .regex(
      /^3[0-9]{9}$|^3\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{3}$/,
      "Formato colombiano: 300 123 4567 (10 dígitos, empieza con 3)"
    )
    .transform((val) => val.replace(/\s/g, "")),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Email inválido"
    )
});

type FormValues = z.infer<typeof formSchema>;

export default function ResumenPage() {
  const router = useRouter();
  const {
    proyecto,
    planBase,
    adicionales,
    getPrecioPlanBase,
    getTotal
  } = useCotizador();

  const plan = planBase ? planesBase[planBase] : null;
  const nombreProyecto = proyecto
    ? (proyectos.find((p) => p.id === proyecto)?.nombre ?? proyecto)
    : "Proyecto no seleccionado";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      telefono: "",
      email: ""
    }
  });

  const [generandoPDF, setGenerandoPDF] = useState(false);

  const onSubmit = (data: FormValues) => {
    if (!planBase || !plan) return;

    const mensaje = generarMensajeWhatsApp({
      nombreCliente: data.nombre,
      telefono: data.telefono,
      proyecto: nombreProyecto,
      planNombre: plan.nombre,
      planPrecio: getPrecioPlanBase(),
      adicionales: adicionales.map((a) => ({
        nombre: a.nombre,
        precio: a.precio
      })),
      total: getTotal()
    });

    enviarWhatsApp(mensaje);
    toast.success("Redirigiendo a WhatsApp...");
  };

  const handleDescargarPDF = async () => {
    if (!planBase || !plan) return;

    setGenerandoPDF(true);
    try {
      const proyectoData = proyectos.find((p) => p.id === proyecto);
      const numeroCotizacion = `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

      const pdfData = {
        numeroConsecutivo: numeroCotizacion,
        fecha: new Date().toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        cliente: {
          nombre: form.getValues("nombre") || "Por definir",
          telefono: form.getValues("telefono") || "",
          email: form.getValues("email") || undefined
        },
        proyecto: {
          nombre: proyectoData?.nombre ?? "Proyecto",
          ubicacion: proyectoData?.ubicacion ?? "Bucaramanga"
        },
        plan: {
          nombre: plan.nombre,
          precio: getPrecioPlanBase(),
          tiempoEntrega: plan.tiempoEntrega,
          incluye: plan.incluye,
          bonus: plan.bonus
        },
        adicionales: adicionales.map((a) => ({
          nombre: a.nombre,
          precio: a.precio
        })),
        total: getTotal()
      };

      const pdfBlob = await generarCotizacionPDF(pdfData);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotizacion_${(proyectoData?.nombre ?? "Proyecto").replace(/\s/g, "_")}_${numeroCotizacion}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("¡PDF generado exitosamente!");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el PDF. Intenta nuevamente.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  if (!planBase || !plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-dark px-4">
        <p className="text-center text-lg text-brand-textSecondary">
          No has seleccionado un plan
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-brand-primary text-black hover:bg-brand-secondary"
        >
          Volver al inicio
        </Button>
      </div>
    );
  }

  const precioAdicionales = adicionales.reduce(
    (sum, a) => sum + a.precio,
    0
  );

  return (
    <div className="min-h-screen bg-brand-dark px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Columna Izquierda - Resumen */}
          <Card className="border border-brand-border bg-brand-card shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <CardHeader>
              <h2 className="text-xl font-semibold text-brand-text">
                Resumen de tu Cotización
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-brand-textSecondary">Proyecto</p>
                <p className="font-medium text-brand-text">{nombreProyecto}</p>
              </div>
              <div>
                <p className="text-sm text-brand-textSecondary">
                  Plan seleccionado
                </p>
                <p className="font-medium text-brand-text">{plan.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-brand-textSecondary">Precio plan</p>
                <p className="font-medium text-brand-primary">
                  {formatoPrecio(getPrecioPlanBase())}
                </p>
              </div>

              {adicionales.length > 0 && (
                <>
                  <div>
                    <p className="mb-2 font-medium text-brand-text">
                      Adicionales
                    </p>
                    <ul className="space-y-1">
                      {adicionales.map((item) => (
                        <li
                          key={item.codigo}
                          className="flex justify-between text-sm text-brand-textSecondary"
                        >
                          <span>{item.nombre}</span>
                          <span className="text-brand-primary">
                            {formatoPrecio(item.precio)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-brand-textSecondary">
                      Subtotal adicionales:{" "}
                      {formatoPrecio(precioAdicionales)}
                    </p>
                  </div>
                </>
              )}

              <Separator className="bg-brand-border" />

              <div>
                <p className="text-3xl font-bold text-brand-primary">
                  Total: {formatoPrecio(getTotal())}
                </p>
                <p className="mt-2 text-sm text-brand-textSecondary">
                  Tiempo estimado: {plan.tiempoEntrega} días hábiles
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Columna Derecha - Formulario */}
          <Card className="border border-brand-border bg-brand-card shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <CardHeader>
              <h2 className="text-xl font-semibold text-brand-text">
                Tus Datos
              </h2>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="nombre"
                    className="mb-1 block text-sm font-medium text-brand-text"
                  >
                    Nombre completo *
                  </label>
                  <Input
                    id="nombre"
                    placeholder="Tu nombre completo"
                    {...form.register("nombre")}
                    className={`border-brand-border bg-brand-dark text-brand-text placeholder:text-brand-textSecondary ${
                      form.formState.errors.nombre ? "border-destructive" : ""
                    }`}
                  />
                  {form.formState.errors.nombre && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="telefono"
                    className="mb-1 block text-sm font-medium text-brand-text"
                  >
                    Teléfono *
                  </label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="300 123 4567"
                    {...form.register("telefono")}
                    className={`border-brand-border bg-brand-dark text-brand-text placeholder:text-brand-textSecondary ${
                      form.formState.errors.telefono ? "border-destructive" : ""
                    }`}
                  />
                  {form.formState.errors.telefono && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.telefono.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-brand-text"
                  >
                    Email (opcional)
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    {...form.register("email")}
                    className={`border-brand-border bg-brand-dark text-brand-text placeholder:text-brand-textSecondary ${
                      form.formState.errors.email ? "border-destructive" : ""
                    }`}
                  />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button
                    type="button"
                    onClick={handleDescargarPDF}
                    disabled={generandoPDF}
                    className="flex-1 rounded-xl border-2 border-brand-primary bg-brand-card py-6 font-bold text-brand-text transition-all hover:scale-105 hover:border-brand-primary hover:bg-brand-primary hover:text-black disabled:opacity-70"
                  >
                    {generandoPDF ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Descargar PDF
                      </>
                    )}
                  </Button>

                  <Button
                    type="submit"
                    className="flex-1 rounded-xl bg-green-600 py-6 text-base font-bold text-white shadow-[0_4px_20px_0_rgba(34,197,94,0.3)] transition-all hover:scale-105 hover:bg-green-700 hover:shadow-[0_10px_40px_0_rgba(34,197,94,0.4)]"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Enviar por WhatsApp
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
