"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Shield, Calendar, CheckCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface CierreVentaExpressProps {
  onReservar: () => void;
  generandoPDF?: boolean;
}

export function CierreVentaExpress({
  onReservar,
  generandoPDF = false,
}: CierreVentaExpressProps) {
  return (
    <Card className="mt-8 overflow-hidden border-gray-200 bg-white shadow-sm">
      <CardContent className="p-5 md:p-8">
        {/* Indicador de urgencia */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
            </div>
            <span className="font-semibold text-gray-900">Alta Demanda</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">Solo quedan 3 cupos este mes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-28 overflow-hidden rounded-full bg-red-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "80%" }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Garantía de Flexibilidad */}
        <div className="mb-6 text-center">
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Garantía de Flexibilidad Total
          </h3>
          <p className="text-gray-500">
            ¿Quieres cambiar algo después? No te preocupes...
          </p>
        </div>

        {/* Tres beneficios */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-5 text-center"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Shield className="h-7 w-7 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Precio Congelado</h4>
            <p className="mt-1 text-xs text-gray-500">
              Protegido contra inflación
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-5 text-center"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Calendar className="h-7 w-7 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Fecha Garantizada</h4>
            <p className="mt-1 text-xs text-gray-500">
              Inicio asegurado este mes
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-5 text-center"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">100% Modificable</h4>
            <p className="mt-1 text-xs text-gray-500">
              Ajusta después sin costo
            </p>
          </motion.div>
        </div>

        {/* CTAs principales */}
        <div className="space-y-4">
          {/* Botón principal: Reservar (Verde) */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onReservar}
              disabled={generandoPDF}
              className="flex h-auto w-full items-center justify-center gap-3 rounded-xl bg-green-600 px-6 py-5 text-lg font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-500 hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-70"
            >
              <MessageSquare className="h-6 w-6" />
              <span>
                {generandoPDF ? "Preparando presupuesto..." : "Reservar Mi Cupo Ahora"}
              </span>
              {!generandoPDF && (
                <span className="ml-1 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-sm font-normal">
                  Respuesta <Zap className="h-3 w-3" />
                </span>
              )}
            </Button>
          </motion.div>

        </div>

        {/* Info adicional */}
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm text-gray-700">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            ¿No estás seguro? Agenda una reunión gratuita de 30 min
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              30 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Virtual/presencial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Sin compromiso
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
