"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
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

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-brand-primary py-6 text-base font-bold text-black shadow-[0_4px_20px_0_rgba(255,184,0,0.3)] transition-all hover:scale-105 hover:bg-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Enviar Cotización por WhatsApp
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
