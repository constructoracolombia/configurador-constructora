"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCotizador } from "@/lib/store/cotizador";
import { proyectos } from "@/lib/data/catalogo";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function DatosClientePage() {
  const router = useRouter();
  const { proyecto, setClienteInfo, clienteNombre } = useCotizador();
  const proyectoData = proyectos.find((p) => p.id === proyecto);

  const [nombre, setNombre] = useState(clienteNombre || "");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  const steps = [
    {
      field: "nombre",
      icon: User,
      label: "¿Cómo te llamas?",
      placeholder: "Ej: María González",
      type: "text",
    },
    {
      field: "telefono",
      icon: Phone,
      label: "¿Tu número de WhatsApp?",
      placeholder: "Ej: 300 123 4567",
      type: "tel",
    },
    {
      field: "email",
      icon: Mail,
      label: "¿Y tu correo electrónico?",
      placeholder: "Ej: maria@email.com",
      type: "email",
      optional: true,
    },
  ];

  useEffect(() => {
    if (!proyecto) {
      router.push("/");
    }
  }, [proyecto, router]);

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Guardar y continuar
      setIsValidating(true);
      setTimeout(() => {
        setClienteInfo(nombre, telefono, email);
        router.push("/plan");
      }, 800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleContinue();
    }
  };

  const getCurrentValue = () => {
    switch (currentStep) {
      case 0:
        return nombre;
      case 1:
        return telefono;
      case 2:
        return email;
      default:
        return "";
    }
  };

  const setCurrentValue = (value: string) => {
    switch (currentStep) {
      case 0:
        setNombre(value);
        break;
      case 1:
        setTelefono(value);
        break;
      case 2:
        setEmail(value);
        break;
    }
  };

  const isCurrentStepValid = () => {
    const value = getCurrentValue();
    if (currentStep === 2 && !value) return true; // Email opcional
    return value.trim().length > 0;
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!proyectoData) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-dark via-black to-brand-dark p-4">
      {/* Efectos de fondo animados */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-brand-primary/5 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-brand-secondary/5 blur-3xl delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-brand-textSecondary">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <span className="text-sm font-bold text-brand-primary">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-card">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Card principal */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-brand-primary/30 bg-brand-card shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              {/* Header del formulario */}
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="mb-6 inline-block rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-4"
                >
                  <IconComponent className="h-10 w-10 text-black" />
                </motion.div>

                <h1 className="mb-3 text-3xl font-bold text-brand-text md:text-4xl">
                  {currentStepData.label}
                </h1>

                <p className="text-brand-textSecondary">
                  Para preparar tu cotización personalizada de{" "}
                  <span className="font-semibold text-brand-primary">
                    {proyectoData.nombre}
                  </span>
                </p>
              </div>

              {/* Input con animación */}
              <div className="space-y-6">
                <div className="relative">
                  <Input
                    type={currentStepData.type}
                    value={getCurrentValue()}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStepData.placeholder}
                    autoFocus
                    className="h-16 rounded-xl border-2 border-brand-border bg-brand-dark px-6 text-lg text-brand-text transition-all focus:border-brand-primary"
                  />
                  {currentStepData.optional && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded bg-brand-card px-2 py-1 text-xs text-brand-textSecondary">
                      Opcional
                    </span>
                  )}
                </div>

                {/* Pasos completados */}
                {currentStep > 0 && (
                  <div className="space-y-2 rounded-xl bg-brand-dark/50 p-4">
                    {steps.slice(0, currentStep).map((step, idx) => {
                      const StepIcon = step.icon;
                      const value =
                        idx === 0 ? nombre : idx === 1 ? telefono : email;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <StepIcon className="h-4 w-4 text-brand-primary" />
                          <span className="text-brand-textSecondary">
                            {value}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Botón de continuar */}
                <Button
                  onClick={handleContinue}
                  disabled={!isCurrentStepValid() || isValidating}
                  className="h-14 w-full rounded-xl bg-gradient-to-r from-brand-primary via-yellow-400 to-brand-primary text-lg font-bold text-black shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] transition-all hover:scale-[1.02] hover:from-brand-secondary hover:via-yellow-500 hover:to-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isValidating ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-black"></div>
                      Preparando tu cotización...
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Comenzar a cotizar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Texto motivacional */}
                <p className="text-center text-xs text-brand-textSecondary">
                  🔒 Tu información está segura • ⚡ Proceso rápido en 3 minutos
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Indicadores de pasos */}
        <div className="mt-6 flex justify-center gap-2">
          {steps.map((_, idx) => (
            <motion.div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep
                  ? "w-8 bg-brand-primary"
                  : idx < currentStep
                    ? "w-2 bg-green-500"
                    : "w-2 bg-brand-border"
              }`}
              animate={{ scale: idx === currentStep ? [1, 1.2, 1] : 1 }}
              transition={{
                repeat: idx === currentStep ? Infinity : 0,
                duration: 1.5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
