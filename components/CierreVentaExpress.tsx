"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Shield, Clock, Video } from "lucide-react";
import { motion } from "framer-motion";

interface CierreVentaExpressProps {
  onReservar: () => void;
  generandoPDF?: boolean;
}

export function CierreVentaExpress({
  onReservar,
  generandoPDF = false,
}: CierreVentaExpressProps) {
  const abrirCalendly = () => {
    window.open(
      "https://calendly.com/contacto-constructoracolombia/30min",
      "_blank"
    );
  };

  return (
    <div className="space-y-6">
      {/* Indicadores de urgencia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-red-500/50 bg-gradient-to-r from-red-900/30 to-orange-900/30 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-red-600">
              🔥
            </div>
            <div>
              <h3 className="font-bold text-brand-text">Alta Demanda</h3>
              <p className="text-sm text-brand-textSecondary">
                Solo quedan 3 cupos este mes
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 h-2 w-24 rounded-full bg-brand-dark">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-brand-primary"
                style={{ width: "70%" }}
              />
            </div>
            <span className="text-xs text-brand-textSecondary">
              70% ocupado
            </span>
          </div>
        </div>
      </motion.div>

      {/* Garantía de flexibilidad */}
      <Card className="border-brand-primary bg-brand-card">
        <CardContent className="p-6">
          <div className="mb-4 flex items-start gap-3">
            <Shield className="h-6 w-6 flex-shrink-0 text-brand-primary" />
            <div>
              <h3 className="mb-2 font-bold text-brand-text">
                Garantía de Flexibilidad Total
              </h3>
              <p className="text-sm text-brand-textSecondary">
                ¿Quieres cambiar algo después? No te preocupes. Esta reserva
                congela tu cupo y precio base; podrás ajustar acabados durante
                la visita técnica SIN PERDER TU BENEFICIO.
              </p>
            </div>
          </div>

          {/* Beneficios visuales */}
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-brand-dark p-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/20">
                🔒
              </div>
              <h4 className="mb-1 text-sm font-semibold text-brand-text">
                Precio Congelado
              </h4>
              <p className="text-xs text-brand-textSecondary">
                Protegido contra inflación
              </p>
            </div>
            <div className="rounded-lg bg-brand-dark p-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/20">
                📅
              </div>
              <h4 className="mb-1 text-sm font-semibold text-brand-text">
                Fecha Garantizada
              </h4>
              <p className="text-xs text-brand-textSecondary">
                Inicio asegurado este mes
              </p>
            </div>
            <div className="rounded-lg bg-brand-dark p-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/20">
                ✏️
              </div>
              <h4 className="mb-1 text-sm font-semibold text-brand-text">
                100% Modificable
              </h4>
              <p className="text-xs text-brand-textSecondary">
                Ajusta después sin costo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTAs EQUILIBRADOS - Mismo peso visual */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* CTA 1: Reservar (WhatsApp) */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onReservar}
            disabled={generandoPDF}
            className="flex h-auto w-full flex-col items-center gap-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary p-6 font-bold text-black shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] transition-all hover:from-brand-secondary hover:to-brand-primary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.5)]"
          >
            <MessageSquare className="h-8 w-8" />
            <div>
              <div className="mb-1 text-lg">
                {generandoPDF
                  ? "Preparando presupuesto..."
                  : "Reservar Mi Cupo Ahora"}
              </div>
              <div className="text-xs font-normal opacity-80">
                Respuesta inmediata por WhatsApp
              </div>
            </div>
          </Button>
        </motion.div>

        {/* CTA 2: Agendar Reunión (Calendly) */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={abrirCalendly}
            className="flex h-auto w-full flex-col items-center gap-3 rounded-xl bg-[#006BFF] p-6 font-bold text-white shadow-lg transition-all hover:bg-[#0051CC] hover:shadow-xl"
          >
            <Video className="h-8 w-8" />
            <div>
              <div className="mb-1 text-lg">
                Agenda Reunión Virtual GRATIS
              </div>
              <div className="text-xs font-normal opacity-90">
                Resuelve dudas con un profesional
              </div>
            </div>
          </Button>
        </motion.div>
      </div>

      {/* Mensaje informativo */}
      <Card className="border-blue-500/50 bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Video className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
            <div>
              <h4 className="mb-1 text-sm font-semibold text-brand-text">
                ¿No estás 100% seguro todavía?
              </h4>
              <p className="mb-3 text-xs text-brand-textSecondary">
                Agenda una reunión virtual gratuita de 30 minutos. Aclaramos
                todas tus dudas, revisamos acabados y confirmamos los detalles
                de tu proyecto.
              </p>
              <div className="flex items-center gap-4 text-xs text-blue-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  30 minutos
                </span>
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Virtual o presencial
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Sin compromiso
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
