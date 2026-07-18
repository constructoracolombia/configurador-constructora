"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PASSWORD_CORRECTA =
  process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || "CC#2026";
export const DASHBOARD_AUTH_STORAGE_KEY = "dashboard_auth";
const SESSION_DURATION = 24 * 60 * 60 * 1000;

/** Cierra sesión del dashboard y recarga para mostrar el login (uso desde hijos fuera del estado del wrapper). */
export function cerrarSesionDashboard() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DASHBOARD_AUTH_STORAGE_KEY);
  window.location.reload();
}

interface ProteccionDashboardProps {
  children: React.ReactNode;
}

export default function ProteccionDashboard({
  children,
}: ProteccionDashboardProps) {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const verificarSesion = useCallback(() => {
    try {
      const sesionGuardada = localStorage.getItem(DASHBOARD_AUTH_STORAGE_KEY);

      if (sesionGuardada) {
        const { timestamp } = JSON.parse(sesionGuardada) as {
          timestamp: number;
        };
        const tiempoTranscurrido = Date.now() - timestamp;

        if (tiempoTranscurrido < SESSION_DURATION) {
          setAutenticado(true);
        } else {
          localStorage.removeItem(DASHBOARD_AUTH_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(DASHBOARD_AUTH_STORAGE_KEY);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    verificarSesion();
  }, [verificarSesion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === PASSWORD_CORRECTA) {
      const sesion = {
        timestamp: Date.now(),
      };
      localStorage.setItem(
        DASHBOARD_AUTH_STORAGE_KEY,
        JSON.stringify(sesion)
      );
      setAutenticado(true);
    } else {
      setError("Contraseña incorrecta");
      setPassword("");
    }
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔄</div>
          <div className="text-gray-600">Verificando acceso...</div>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600">
              <span className="text-4xl">🔒</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Acceso Restringido
            </CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Dashboard Comercial - Constructora Colombia
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Contraseña de Acceso
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setError("")}
                  placeholder="Ingrese la contraseña"
                  className={`h-12 w-full rounded-lg border px-4 focus:outline-none focus:ring-2 ${
                    error
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  autoFocus
                />
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <span>❌</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              >
                Ingresar al Dashboard
              </button>

              <div className="mt-4 text-center text-xs text-gray-500">
                🔐 Sesión válida por 24 horas
              </div>

              <div className="mt-4 space-y-1 text-center text-xs text-gray-500">
                <div>💡 La sesión expira después de 24 horas</div>
                <div>🔒 Contraseña guardada localmente</div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
