"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Correo o contraseña incorrectos");
      setCargando(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF8F4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Header */}
        <div
          style={{
            background: "#111D2E",
            borderRadius: "16px 16px 0 0",
            padding: "32px 32px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#B0894F", fontSize: 36, marginBottom: 8 }}>🏗</div>
          <h1 style={{ color: "#FAF8F4", fontSize: 20, fontWeight: 700, margin: 0 }}>
            Constructora Colombia
          </h1>
          <p style={{ color: "#D4C9B8", fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Dashboard Comercial
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "0 0 16px 16px",
            padding: "32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#111D2E", marginBottom: 6 }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setError("")}
                placeholder="contacto@constructoracolombia.com"
                required
                autoFocus
                style={{
                  width: "100%",
                  height: 44,
                  border: `1.5px solid ${error ? "#ef4444" : "#E5E7EB"}`,
                  borderRadius: 8,
                  padding: "0 14px",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#FAFAFA",
                }}
              />
            </div>

            <div>
              <label
                style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#111D2E", marginBottom: 6 }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setError("")}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  height: 44,
                  border: `1.5px solid ${error ? "#ef4444" : "#E5E7EB"}`,
                  borderRadius: 8,
                  padding: "0 14px",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#FAFAFA",
                }}
              />
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: 13, color: "#ef4444" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              style={{
                height: 46,
                background: cargando ? "#6B7280" : "#111D2E",
                color: "#FAF8F4",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: cargando ? "not-allowed" : "pointer",
                marginTop: 4,
                transition: "background 0.2s",
              }}
            >
              {cargando ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
