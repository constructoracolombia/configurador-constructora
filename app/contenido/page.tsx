"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Instagram,
  Megaphone,
  Globe,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
  Repeat2,
  Smartphone,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

type CheckItem = { id: string; label: string };
type SubSection = { id: string; title: string; items: CheckItem[] };
type Section = {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  subSections: SubSection[];
};

const SECTIONS: Section[] = [
  {
    id: "whatsapp",
    title: "WhatsApp",
    icon: <MessageSquare size={20} />,
    color: "#25D366",
    subSections: [
      {
        id: "wp-stories",
        title: "Stories diarias",
        items: [
          { id: "wp-story-manana", label: "Story mañana enviada" },
          { id: "wp-story-mediodia", label: "Story mediodía enviada" },
          { id: "wp-story-noche", label: "Story noche enviada" },
          { id: "wp-story-testimonio", label: "Story de testimonio publicada" },
        ],
      },
      {
        id: "wp-atencion",
        title: "Sistema de atención",
        items: [
          { id: "wp-plantillas", label: "Plantillas de respuesta actualizadas" },
          { id: "wp-bot", label: "Bot de bienvenida activo y probado" },
          { id: "wp-difusion", label: "Lista de difusión segmentada enviada" },
          { id: "wp-tiempo", label: "Tiempo de respuesta < 5 min monitoreado" },
          { id: "wp-seguimiento", label: "Seguimiento a leads sin respuesta" },
        ],
      },
    ],
  },
  {
    id: "redes",
    title: "IG / TikTok",
    icon: <Instagram size={20} />,
    color: "#E1306C",
    subSections: [
      {
        id: "ig-stories",
        title: "Stories diarias",
        items: [
          { id: "ig-story-ig", label: "Story Instagram publicada" },
          { id: "ig-story-tiktok", label: "Story TikTok publicada" },
          { id: "ig-story-interaccion", label: "Story con encuesta / sticker interactivo" },
          { id: "ig-story-respuestas", label: "Respuestas a interacciones atendidas" },
        ],
      },
      {
        id: "ig-contenidos",
        title: "3 contenidos semanales mínimo",
        items: [
          { id: "ig-contenido-1", label: "Contenido #1 publicado (Proceso de obra)" },
          { id: "ig-contenido-2", label: "Contenido #2 publicado (Antes / Después)" },
          { id: "ig-contenido-3", label: "Contenido #3 publicado (Testimonio cliente)" },
          { id: "ig-reel", label: "Reel / video corto publicado" },
          { id: "ig-hashtags", label: "Hashtags y descripción SEO aplicados" },
        ],
      },
    ],
  },
  {
    id: "pauta",
    title: "Pauta",
    icon: <Megaphone size={20} />,
    color: "#4267B2",
    subSections: [
      {
        id: "pauta-alcance",
        title: "Campaña Alcance",
        items: [
          { id: "alcance-frio-activa", label: "Campaña Frío activa con presupuesto asignado" },
          { id: "alcance-tibio-activa", label: "Campaña Tibio activa con presupuesto asignado" },
          { id: "alcance-creativos", label: "Creativos aprobados (imágenes / videos)" },
          { id: "alcance-publico", label: "Públicos objetivo segmentados correctamente" },
          { id: "alcance-metricas", label: "Métricas de alcance revisadas" },
        ],
      },
      {
        id: "pauta-conversion",
        title: "Campaña Conversión WP",
        items: [
          { id: "conv-tibio", label: "Audiencia Tibio configurada" },
          { id: "conv-caliente", label: "Audiencia Caliente configurada" },
          { id: "conv-cta", label: "CTA WhatsApp operativo y probado" },
          { id: "conv-pixel", label: "Pixel Meta instalado y verificando eventos" },
          { id: "conv-costo", label: "Costo por conversación dentro del objetivo" },
        ],
      },
      {
        id: "pauta-remarketing",
        title: "Remarketing Conversión WP",
        items: [
          { id: "rm-testimonio", label: "Anuncio Testimonio activo" },
          { id: "rm-urgencia", label: "Anuncio Urgencia activo" },
          { id: "rm-cupos", label: "Anuncio Cupos limitados activo" },
          { id: "rm-bonus", label: "Anuncio Bonus activo" },
          { id: "rm-audiencias", label: "Audiencias de remarketing actualizadas (últimos 30 días)" },
          { id: "rm-frecuencia", label: "Frecuencia < 3 (sin fatiga de anuncio)" },
        ],
      },
    ],
  },
  {
    id: "paginas",
    title: "Páginas CC Inversiones → Holding",
    icon: <Globe size={20} />,
    color: "#FFB800",
    subSections: [
      {
        id: "pag-finanzas",
        title: "App Finanzas",
        items: [
          { id: "fin-landing", label: "Landing page publicada y responsive" },
          { id: "fin-demo", label: "Demo funcional disponible" },
          { id: "fin-cta", label: "CTA de contacto / demo activo" },
          { id: "fin-seo", label: "SEO básico aplicado (título, meta, OG tags)" },
        ],
      },
      {
        id: "pag-crm",
        title: "App Comercial CRM",
        items: [
          { id: "crm-landing", label: "Landing page publicada y responsive" },
          { id: "crm-video", label: "Video walkthrough / demo disponible" },
          { id: "crm-formulario", label: "Formulario de solicitud de demo activo" },
          { id: "crm-casos", label: "Casos de uso reales documentados" },
        ],
      },
      {
        id: "pag-bitacora",
        title: "App Bitácora",
        items: [
          { id: "bit-landing", label: "Landing page publicada y responsive" },
          { id: "bit-screenshots", label: "Screenshots actualizados con última versión" },
          { id: "bit-video", label: "Video demo publicado" },
          { id: "bit-beneficios", label: "Beneficios clave diferenciados de competidores" },
        ],
      },
    ],
  },
];

const STORAGE_KEY = "cc-remodela-checklist-v1";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContenidoCCRemodela() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
  }, []);

  // Persist to localStorage
  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Progress calculations
  const sectionProgress = (section: Section) => {
    const allItems = section.subSections.flatMap((s) => s.items);
    const done = allItems.filter((i) => checked[i.id]).length;
    return { done, total: allItems.length, pct: allItems.length ? Math.round((done / allItems.length) * 100) : 0 };
  };

  const totalItems = SECTIONS.flatMap((s) => s.subSections.flatMap((ss) => ss.items)).length;
  const totalDone = SECTIONS.flatMap((s) => s.subSections.flatMap((ss) => ss.items)).filter((i) => checked[i.id]).length;
  const totalPct = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  const resetAll = () => {
    setChecked({});
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div style={{ background: "#0C0C0C", minHeight: "100vh", color: "#F5F5F5", fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #333", background: "#111", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, padding: "6px 12px", color: "#B0B0B0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, transition: "all 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#FFB800"; (e.currentTarget as HTMLButtonElement).style.color = "#FFB800"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#333"; (e.currentTarget as HTMLButtonElement).style.color = "#B0B0B0"; }}
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <div style={{ width: 1, height: 24, background: "#333" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={18} color="#FFB800" />
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>CC Remodela</span>
              <span style={{ background: "#FFB800", color: "#000", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em" }}>CAMPAÑA ACTIVA</span>
            </div>
          </div>
          <button
            onClick={resetAll}
            style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, padding: "6px 12px", color: "#B0B0B0", cursor: "pointer", fontSize: 12, transition: "all 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#333"; (e.currentTarget as HTMLButtonElement).style.color = "#B0B0B0"; }}
          >
            Reiniciar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Hero progress */}
        <div style={{ background: "#1A1A1A", border: "1px solid #333", borderRadius: 16, padding: "28px 32px", marginBottom: 32, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#333", borderRadius: "16px 16px 0 0" }}>
            <div style={{ height: "100%", width: `${totalPct}%`, background: "linear-gradient(90deg, #FFB800, #FFA000)", transition: "width 0.5s ease", borderRadius: "16px 16px 0 0" }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ color: "#B0B0B0", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Progreso Total</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: "#FFB800", lineHeight: 1 }}>{totalPct}%</span>
                <span style={{ color: "#B0B0B0", fontSize: 14 }}>{totalDone} / {totalItems} ítems</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {SECTIONS.map((s) => {
                const p = sectionProgress(s);
                return (
                  <div key={s.id} style={{ background: "#111", border: "1px solid #333", borderRadius: 10, padding: "10px 14px", minWidth: 90, textAlign: "center" }}>
                    <div style={{ color: s.color, marginBottom: 4, display: "flex", justifyContent: "center" }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: p.pct === 100 ? "#22c55e" : "#F5F5F5" }}>{p.pct}%</div>
                    <div style={{ fontSize: 10, color: "#B0B0B0", marginTop: 2 }}>{p.done}/{p.total}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SECTIONS.map((section) => {
            const prog = sectionProgress(section);
            const isCollapsed = collapsed[section.id];

            return (
              <div key={section.id} style={{ background: "#1A1A1A", border: `1px solid ${prog.pct === 100 ? "#22c55e40" : "#333"}`, borderRadius: 16, overflow: "hidden", transition: "border-color 0.3s" }}>
                {/* Section header */}
                <button
                  onClick={() => toggleCollapse(section.id)}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${section.color}20`, border: `1px solid ${section.color}40`, display: "flex", alignItems: "center", justifyContent: "center", color: section.color, flexShrink: 0 }}>
                    {section.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: "#F5F5F5" }}>{section.title}</span>
                      {prog.pct === 100 && (
                        <span style={{ background: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                          COMPLETO ✓
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 6, background: "#333", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${prog.pct}%`, background: prog.pct === 100 ? "#22c55e" : `linear-gradient(90deg, ${section.color}, ${section.color}cc)`, transition: "width 0.4s ease", borderRadius: 99 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: "#B0B0B0", fontWeight: 600 }}>{prog.done}/{prog.total}</span>
                    <div style={{ color: "#B0B0B0" }}>
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>
                  </div>
                </button>

                {/* Sub-sections */}
                {!isCollapsed && (
                  <div style={{ padding: "0 24px 24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {section.subSections.map((sub, subIdx) => {
                        const subDone = sub.items.filter((i) => checked[i.id]).length;
                        const subPct = sub.items.length ? Math.round((subDone / sub.items.length) * 100) : 0;

                        return (
                          <div key={sub.id}>
                            {subIdx > 0 && <div style={{ height: 1, background: "#2A2A2A", marginBottom: 20 }} />}
                            {/* Sub-section header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{sub.title}</span>
                              <span style={{ fontSize: 11, color: subPct === 100 ? "#22c55e" : "#B0B0B0", fontWeight: 600 }}>{subDone}/{sub.items.length}</span>
                            </div>
                            {/* Items */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {sub.items.map((item) => {
                                const isDone = !!checked[item.id];
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => toggle(item.id)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      background: isDone ? "#22c55e0A" : "#111",
                                      border: `1px solid ${isDone ? "#22c55e30" : "#2A2A2A"}`,
                                      borderRadius: 10,
                                      padding: "12px 14px",
                                      cursor: "pointer",
                                      textAlign: "left",
                                      width: "100%",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isDone) (e.currentTarget as HTMLButtonElement).style.borderColor = section.color + "60";
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLButtonElement).style.borderColor = isDone ? "#22c55e30" : "#2A2A2A";
                                    }}
                                  >
                                    <div style={{ flexShrink: 0, color: isDone ? "#22c55e" : "#B0B0B0", transition: "color 0.2s" }}>
                                      {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                    </div>
                                    <span style={{ fontSize: 14, color: isDone ? "#B0B0B0" : "#F5F5F5", textDecoration: isDone ? "line-through" : "none", transition: "all 0.2s", lineHeight: 1.4 }}>
                                      {item.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer summary */}
        <div style={{ marginTop: 32, background: "#1A1A1A", border: "1px solid #333", borderRadius: 12, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color="#FFB800" />
            <span style={{ color: "#B0B0B0", fontSize: 13 }}>Estado actual:</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: totalPct === 100 ? "#22c55e" : totalPct > 50 ? "#FFB800" : "#ef4444" }}>
              {totalPct === 100 ? "Campaña completa 🏆" : totalPct > 50 ? "En marcha — seguir empujando" : "Inicio — activar más ítems"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#B0B0B0", fontSize: 12 }}>
            <Smartphone size={13} />
            <span>Estado guardado automáticamente</span>
          </div>
        </div>
      </div>
    </div>
  );
}
