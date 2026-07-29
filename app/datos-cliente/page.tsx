"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCotizador } from "@/lib/store/cotizador";
import { proyectos, findProyecto } from "@/lib/data/catalogo";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function DatosClientePage() {
  const router = useRouter();
  const { proyecto, setClienteInfo, clienteNombre, clienteTelefono, clienteEmail } = useCotizador();

  const proyectoData = findProyecto(proyecto);

  // DEBUG - Diagnóstico de pantalla negra
  console.log('🎯 DATOS-CLIENTE - Estado:', {
    proyecto,
    proyectoData: proyectoData ? proyectoData.nombre : 'NO ENCONTRADO',
    todosLosIds: proyectos.map(p => p.id),
  });

  // Nombre y teléfono llegan precargados (ya sea de una visita anterior o
  // del chatbot Mateo en constructoracolombia.com/cotiza, ver /plan) — el
  // cliente solo tiene que confirmarlos/editarlos y escribir el correo.
  const [nombre, setNombre] = useState(clienteNombre || "");
  const [telefono, setTelefono] = useState(clienteTelefono || "");
  const [email, setEmail] = useState(clienteEmail || "");
  const [nombreError, setNombreError] = useState("");
  const [telefonoError, setTelefonoError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const planBase = useCotizador((s) => s.planBase);

  useEffect(() => {
    if (!proyecto) {
      router.push("/presupuestos");
      return;
    }
    if (!planBase) {
      router.push("/plan");
    }
  }, [proyecto, planBase, router]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const validateTelefono = (tel: string) => {
    const soloNumeros = tel.replace(/\D/g, "");
    return soloNumeros.length >= 10 && soloNumeros.length <= 15;
  };

  const handleContinue = () => {
    let ok = true;
    if (!nombre.trim()) {
      setNombreError("El nombre es obligatorio");
      ok = false;
    } else {
      setNombreError("");
    }
    if (!validateTelefono(telefono)) {
      setTelefonoError(
        telefono.trim() ? "Ingresa entre 10 y 15 dígitos (solo números)" : "El teléfono es obligatorio"
      );
      ok = false;
    } else {
      setTelefonoError("");
    }
    if (!validateEmail(email)) {
      setEmailError(email.trim() ? "Ingresa un correo válido" : "El correo es obligatorio");
      ok = false;
    } else {
      setEmailError("");
    }
    if (!ok) return;

    setIsValidating(true);
    setTimeout(() => {
      const telefonoLimpio = telefono.replace(/\D/g, "");
      setClienteInfo(nombre, telefonoLimpio, email);
      router.push("/resumen");
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleContinue();
    }
  };

  if (!proyectoData) {
    console.error('❌ DATOS-CLIENTE: proyectoData es null. proyecto en store:', JSON.stringify(proyecto));
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <p className="mb-4 text-xl text-gray-900">No se encontró el proyecto</p>
        <p className="mb-6 text-sm text-gray-500">
          Valor en store: &quot;{proyecto || 'null'}&quot;
        </p>
        <Button onClick={() => router.push("/presupuestos")} className="bg-brand-primary text-black hover:bg-brand-secondary">
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 p-4">
      {/* Efectos de fondo animados */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-brand-primary/[0.06] blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-brand-secondary/[0.06] blur-3xl delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 border-brand-primary/30 bg-white shadow-[0_10px_40px_-12px_rgba(255,184,0,0.25)]">
            <CardContent className="p-8 md:p-10">
              {/* Header */}
              <div className="mb-7 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="mb-5 inline-block rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-4"
                >
                  <Sparkles className="h-9 w-9 text-black" />
                </motion.div>

                <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
                  Ya casi tienes tu presupuesto
                </h1>

                <p className="text-sm text-gray-500 md:text-base">
                  Para preparar tu cotización personalizada de{" "}
                  <span className="font-semibold text-amber-600">
                    {proyectoData.nombre}
                  </span>
                </p>
              </div>

              {/* Los 3 campos, en un solo paso */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <User className="h-3.5 w-3.5 text-amber-600" />
                    Nombre completo
                  </label>
                  <Input
                    type="text"
                    value={nombre}
                    onChange={(e) => { setNombre(e.target.value); setNombreError(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: María González"
                    className="h-12 rounded-xl border-2 border-gray-300 bg-white px-4 text-base text-gray-900 transition-all focus:border-brand-primary"
                  />
                  {nombreError && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {nombreError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Phone className="h-3.5 w-3.5 text-amber-600" />
                    Teléfono
                  </label>
                  <Input
                    type="tel"
                    value={telefono}
                    onChange={(e) => { setTelefono(e.target.value); setTelefonoError(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: 3001234567"
                    className="h-12 rounded-xl border-2 border-gray-300 bg-white px-4 text-base text-gray-900 transition-all focus:border-brand-primary"
                  />
                  {telefonoError && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {telefonoError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Mail className="h-3.5 w-3.5 text-amber-600" />
                    Correo electrónico
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: maria@email.com"
                    autoFocus={!clienteNombre && !clienteTelefono}
                    className="h-12 rounded-xl border-2 border-gray-300 bg-white px-4 text-base text-gray-900 transition-all focus:border-brand-primary"
                  />
                  {emailError ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {emailError}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-gray-400">
                      Aquí te enviaremos tu presupuesto detallado en PDF
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={isValidating}
                  className="h-14 w-full rounded-xl bg-gradient-to-r from-brand-primary via-yellow-400 to-brand-primary text-lg font-bold text-black shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] transition-all hover:scale-[1.02] hover:from-brand-secondary hover:via-yellow-500 hover:to-brand-secondary hover:shadow-[0_10px_40px_0_rgba(255,184,0,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isValidating ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-black"></div>
                      Preparando tu cotización...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Ver mi presupuesto
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-500">
                  🔒 Tu información está segura • ⚡ Proceso rápido en 1 minuto
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
