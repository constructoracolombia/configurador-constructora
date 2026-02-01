"use client";

import { useState } from "react";
import { useCotizador } from "@/lib/store/cotizador";
import { proyectos } from "@/lib/data/catalogo";
import { formatoPrecio } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Flame,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CierreVentaExpressProps {
  nombreCliente: string;
  telefonoCliente: string;
  emailCliente?: string;
  onReservar?: () => void | Promise<void>;
  onConsultar?: () => void | Promise<void>;
  generandoPDF?: boolean;
}

export function CierreVentaExpress({
  nombreCliente,
  telefonoCliente,
  emailCliente,
  onReservar,
  onConsultar,
  generandoPDF = false,
}: CierreVentaExpressProps) {
  const { proyecto, planBase, adicionales, getTotal } = useCotizador();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const proyectoData = proyectos.find((p) => p.id === proyecto);
  const cuposDisponibles = 3;
  const porcentajeOcupacion = 70;
  const montoReserva = 500_000;

  const handleReservar = () => {
    if (onReservar) {
      void onReservar();
    } else {
      setMostrarModal(true);
    }
  };

  const handleConfirmarReserva = async () => {
    setProcesando(true);

    const reservaData = {
      timestamp: new Date().toISOString(),
      cliente: {
        nombre: nombreCliente,
        telefono: telefonoCliente,
        email: emailCliente,
      },
      proyecto: proyectoData?.nombre,
      planBase,
      adicionales: adicionales.map((a) => ({ nombre: a.nombre, precio: a.precio })),
      total: getTotal(),
      montoReserva,
      estado: "pendiente_pago",
    };

    localStorage.setItem("reserva_pendiente", JSON.stringify(reservaData));

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mensajeReserva = `🎉 ¡Quiero RESERVAR mi cupo de remodelación!

📋 *Cotización:* ${getTotal() ? formatoPrecio(getTotal()) : "N/A"}
🏢 *Proyecto:* ${proyectoData?.nombre || "N/A"}
👤 *Cliente:* ${nombreCliente}
📱 *Teléfono:* ${telefonoCliente}

💰 *Abono de reserva:* ${formatoPrecio(montoReserva)}

Quiero asegurar mi cupo para este mes y congelar el precio actual de los materiales.`;

    const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(mensajeReserva)}`;

    window.open(whatsappUrl, "_blank");

    setProcesando(false);
    setMostrarModal(false);
  };

  return (
    <>
      <Card className="relative mt-8 overflow-hidden border-2 border-brand-primary bg-gradient-to-br from-brand-card via-black to-brand-card shadow-[0_10px_40px_0_rgba(255,184,0,0.4)]">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent" />

        <CardContent className="relative space-y-6 p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="animate-pulse rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary p-3 shadow-[0_4px_20px_0_rgba(255,184,0,0.3)]">
                <Flame className="h-6 w-6 text-black" />
              </div>
              <div>
                <Badge className="mb-2 animate-pulse bg-red-600 text-white">
                  🔥 ¡ALTA DEMANDA!
                </Badge>
                <h3 className="text-2xl font-bold text-brand-text md:text-3xl">
                  Separa tu cupo de remodelación hoy
                </h3>
              </div>
            </div>
          </div>

          <p className="text-lg text-brand-textSecondary">
            Asegura el precio actual de tus materiales y garantiza tu fecha de
            entrega por solo{" "}
            <span className="text-xl font-bold text-brand-primary">
              {formatoPrecio(montoReserva)}
            </span>
          </p>

          <div className="rounded-xl border border-brand-primary/30 bg-brand-dark/50 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-primary" />
                <span className="font-semibold text-brand-text">
                  Solo quedan{" "}
                  <span className="text-2xl font-bold text-brand-primary">
                    {cuposDisponibles}
                  </span>{" "}
                  cupos
                </span>
              </div>
              <span className="text-sm text-brand-textSecondary">
                para iniciar este mes en{" "}
                {proyectoData?.nombre || "tu proyecto"}
              </span>
            </div>

            <div className="relative h-3 w-full overflow-hidden rounded-full bg-brand-dark">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-600 to-brand-primary transition-all duration-1000 ease-out"
                style={{ width: `${porcentajeOcupacion}%` }}
              >
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>
            <p className="mt-1 text-right text-xs text-brand-textSecondary">
              {porcentajeOcupacion}% de cupos ya reservados
            </p>
          </div>

          <div className="rounded-lg border-l-4 border-green-500 bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-4 backdrop-blur-sm">
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 h-6 w-6 flex-shrink-0 text-green-400" />
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-bold text-brand-text">
                  <Sparkles className="h-4 w-4 text-brand-primary" />
                  Garantía de Flexibilidad Total
                </h4>
                <p className="text-sm leading-relaxed text-brand-textSecondary">
                  ¿Quieres cambiar algo después?{" "}
                  <span className="font-semibold text-brand-text">
                    No te preocupes.
                  </span>{" "}
                  Esta reserva congela tu cupo y precio base; podrás ajustar,
                  quitar o agregar acabados durante la visita técnica con el
                  arquitecto{" "}
                  <span className="text-green-400">sin perder tu beneficio</span>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-brand-border bg-brand-dark/30 p-4 text-center backdrop-blur-sm">
              <div className="mb-2 text-3xl">🔒</div>
              <p className="text-sm font-semibold text-brand-text">
                Precio Congelado
              </p>
              <p className="mt-1 text-xs text-brand-textSecondary">
                Protegido contra inflación
              </p>
            </div>
            <div className="rounded-lg border border-brand-border bg-brand-dark/30 p-4 text-center backdrop-blur-sm">
              <div className="mb-2 text-3xl">📅</div>
              <p className="text-sm font-semibold text-brand-text">
                Fecha Garantizada
              </p>
              <p className="mt-1 text-xs text-brand-textSecondary">
                Inicio asegurado este mes
              </p>
            </div>
            <div className="rounded-lg border border-brand-border bg-brand-dark/30 p-4 text-center backdrop-blur-sm">
              <div className="mb-2 text-3xl">✏️</div>
              <p className="text-sm font-semibold text-brand-text">
                100% Modificable
              </p>
              <p className="mt-1 text-xs text-brand-textSecondary">
                Ajusta después sin costo
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleReservar}
              disabled={generandoPDF}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-yellow-400 to-brand-primary py-8 text-xl font-bold text-black shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] transition-all duration-300 hover:scale-[1.02] hover:from-brand-secondary hover:via-yellow-500 hover:to-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generandoPDF ? (
                <span className="relative flex items-center justify-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Generando y vinculando presupuesto...
                </span>
              ) : (
                <>
                  <div className="absolute inset-0 -translate-x-[200%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-[200%]" />
                  <span className="relative flex items-center justify-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    RESERVAR MI CUPO AHORA
                    <Sparkles className="h-6 w-6" />
                  </span>
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-brand-textSecondary">
              ⚡ Respuesta inmediata por WhatsApp • 🔐 Proceso 100% seguro
            </p>

            {/* Separador sutil */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-border to-transparent" />
              <span className="text-sm font-medium text-brand-textSecondary">
                O si lo prefieres
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-border to-transparent" />
            </div>

            {/* Botón secundario de WhatsApp */}
            <Button
              onClick={() => {
                if (onConsultar) {
                  void onConsultar();
                } else {
                  const mensajeConsulta = `Hola, estoy revisando mi cotización para ${proyectoData?.nombre || "un proyecto"} y me gustaría hablar con un asesor experto antes de reservar.

📋 *Cotización:* ${formatoPrecio(getTotal())}
👤 *Mi nombre:* ${nombreCliente}
📱 *Teléfono:* ${telefonoCliente}

¿Podrían ayudarme a resolver algunas dudas?`;

                  const whatsappUrl = `https://wa.me/573175639674?text=${encodeURIComponent(mensajeConsulta)}`;
                  window.open(whatsappUrl, "_blank");
                }
              }}
              variant="outline"
              disabled={generandoPDF}
              className="group w-full rounded-xl border-2 border-brand-primary bg-transparent py-6 font-semibold text-brand-text transition-all duration-300 hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generandoPDF ? (
                <>
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                  Preparando...
                </>
              ) : (
                <>
                  <svg
                    className="mr-3 h-6 w-6 text-green-400 transition-transform group-hover:scale-110"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Consultar por WhatsApp
                </>
              )}
            </Button>

            <p className="mt-3 text-center text-xs text-brand-textSecondary">
              💬 Habla directamente con un asesor experto • Respuesta inmediata
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent
          className="max-w-md border-brand-primary bg-brand-card"
          showCloseButton={!procesando}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-brand-text">
              <CheckCircle2 className="h-6 w-6 text-brand-primary" />
              ¡Casi listo!
            </DialogTitle>
            <DialogDescription className="text-brand-textSecondary">
              Confirma tus datos para reservar tu cupo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2 rounded-lg bg-brand-dark p-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-textSecondary">Proyecto:</span>
                <span className="font-semibold text-brand-text">
                  {proyectoData?.nombre}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-textSecondary">
                  Inversión Total:
                </span>
                <span className="font-semibold text-brand-text">
                  {formatoPrecio(getTotal())}
                </span>
              </div>
              <div className="mt-2 border-t border-brand-border pt-2">
                <div className="flex justify-between">
                  <span className="text-brand-textSecondary">
                    Abono de Reserva:
                  </span>
                  <span className="text-xl font-bold text-brand-primary">
                    {formatoPrecio(montoReserva)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-brand-textSecondary">
                  Nombre completo
                </label>
                <Input
                  value={nombreCliente}
                  disabled
                  className="border-brand-border bg-brand-dark text-brand-text"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-brand-textSecondary">
                  Teléfono
                </label>
                <Input
                  value={telefonoCliente}
                  disabled
                  className="border-brand-border bg-brand-dark text-brand-text"
                />
              </div>
            </div>

            <div className="rounded border-l-4 border-blue-500 bg-blue-900/20 p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-400" />
                <p className="text-xs text-brand-textSecondary">
                  Al confirmar, serás redirigido a WhatsApp para completar el
                  proceso de reserva con nuestro equipo.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setMostrarModal(false)}
                disabled={procesando}
                className="flex-1 border-brand-border text-brand-text hover:bg-brand-dark"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarReserva}
                disabled={procesando}
                className="flex-1 bg-brand-primary font-bold text-black hover:bg-brand-secondary"
              >
                {procesando ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-black" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Reserva"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
