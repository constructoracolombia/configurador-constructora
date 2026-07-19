"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["contacto@constructoracolombia.com"];

type Estado = "verificando" | "autorizado" | "no-autorizado";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [emailNoAutorizado, setEmailNoAutorizado] = useState("");

  useEffect(() => {
    const evaluar = (session: { user: { email?: string } } | null) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      const email = session.user.email ?? "";
      if (ADMIN_EMAILS.includes(email)) {
        setEstado("autorizado");
      } else {
        setEmailNoAutorizado(email);
        setEstado("no-autorizado");
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => evaluar(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluar(session);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (estado === "verificando") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111D2E]">
        <div className="text-[#D4C9B8] text-sm">Verificando acceso…</div>
      </div>
    );
  }

  if (estado === "no-autorizado") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#111D2E] px-4 text-center">
        <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-8 max-w-md w-full">
          <div className="mb-4 text-4xl">🚫</div>
          <h1 className="mb-2 text-xl font-semibold text-red-300">Acceso no autorizado</h1>
          <p className="mb-1 text-sm text-[#D4C9B8]">
            Esta cuenta no tiene acceso al panel administrativo.
          </p>
          {emailNoAutorizado && (
            <p className="mb-6 text-xs text-[#8A7A6A]">{emailNoAutorizado}</p>
          )}
          <button
            type="button"
            onClick={() => void supabase.auth.signOut().then(() => router.replace("/login"))}
            className="w-full rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
