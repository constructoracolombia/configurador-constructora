"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Check,
  Plus,
  Minus,
  X,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignType = "alcance" | "conversion_wp" | "remarketing";

interface DayModal {
  fecha: string; // YYYY-MM-DD
  alcance: boolean;
  conversion_wp: boolean;
  remarketing: boolean;
  notas: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function isoWeekKey() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

function monthRange(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { first, last };
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

const CAMPAIGNS: { id: CampaignType; label: string; color: string; bg: string }[] = [
  { id: "alcance", label: "Alcance", color: "#F97316", bg: "#F9731620" },
  { id: "conversion_wp", label: "Conversión WP", color: "#3B82F6", bg: "#3B82F620" },
  { id: "remarketing", label: "Remarketing", color: "#EF4444", bg: "#EF444420" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContenidoPage() {
  const router = useRouter();
  const today = todayKey();
  const weekKey = isoWeekKey();

  // ── Daily checklist ──
  const [daily, setDaily] = useState({ whatsapp: false, ig: false, tiktok: false });
  const [weeklyCount, setWeeklyCount] = useState(0);

  // ── Calendar ──
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  // Map of "YYYY-MM-DD" → active campaign ids
  const [pautaMap, setPautaMap] = useState<Record<string, CampaignType[]>>({});

  // ── Chart ──
  const [chartData, setChartData] = useState<{ labels: string[]; alcance: number[]; conversion_wp: number[]; remarketing: number[] }>({ labels: [], alcance: [], conversion_wp: [], remarketing: [] });

  const loadChart = useCallback(async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);

    const { data } = await supabase
      .from("pauta_historial")
      .select("fecha, tipo_campana, activa")
      .gte("fecha", fmt(start))
      .lte("fecha", fmt(end))
      .eq("activa", true);

    // Build ordered list of last 30 days
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(fmt(d));
    }

    const byDay: Record<string, Set<CampaignType>> = {};
    for (const row of data ?? []) {
      if (!byDay[row.fecha]) byDay[row.fecha] = new Set();
      byDay[row.fecha].add(row.tipo_campana as CampaignType);
    }

    setChartData({
      labels: days.map((d) => {
        const [, m, day] = d.split("-");
        return `${day}/${m}`;
      }),
      alcance: days.map((d) => (byDay[d]?.has("alcance") ? 1 : 0)),
      conversion_wp: days.map((d) => (byDay[d]?.has("conversion_wp") ? 1 : 0)),
      remarketing: days.map((d) => (byDay[d]?.has("remarketing") ? 1 : 0)),
    });
  }, []);

  useEffect(() => { loadChart(); }, [loadChart]);

  // ── Day modal ──
  const [modal, setModal] = useState<DayModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [calError, setCalError] = useState<string | null>(null);

  // ── Load daily from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`cc-daily-${today}`);
      if (raw) setDaily(JSON.parse(raw));
      const wRaw = localStorage.getItem(`cc-weekly-${weekKey}`);
      if (wRaw) setWeeklyCount(Number(wRaw));
    } catch {}
  }, [today, weekKey]);

  const setDailyItem = useCallback((key: keyof typeof daily) => {
    setDaily((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(`cc-daily-${today}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [today]);

  const adjustWeekly = useCallback((delta: number) => {
    setWeeklyCount((prev) => {
      const next = Math.max(0, Math.min(3, prev + delta));
      try { localStorage.setItem(`cc-weekly-${weekKey}`, String(next)); } catch {}
      return next;
    });
  }, [weekKey]);

  // ── Load pauta for current month ──
  const loadPauta = useCallback(async (year: number, month: number) => {
    setCalError(null);
    const { first, last } = monthRange(year, month);
    const { data, error } = await supabase
      .from("pauta_historial")
      .select("fecha, tipo_campana")
      .gte("fecha", fmt(first))
      .lte("fecha", fmt(last))
      .eq("activa", true);

    if (error) {
      setCalError(`Error cargando pauta: ${error.message} (código: ${error.code})`);
      return;
    }

    const map: Record<string, CampaignType[]> = {};
    for (const row of data ?? []) {
      if (!map[row.fecha]) map[row.fecha] = [];
      map[row.fecha].push(row.tipo_campana as CampaignType);
    }
    setPautaMap(map);
  }, []);

  useEffect(() => { loadPauta(calYear, calMonth); }, [calYear, calMonth, loadPauta]);

  // ── Open modal for a day ──
  const openDay = async (fecha: string) => {
    const { data } = await supabase
      .from("pauta_historial")
      .select("tipo_campana, activa, notas")
      .eq("fecha", fecha);

    const rows = data ?? [];
    const notasRow = rows.find((r) => r.notas);

    setModal({
      fecha,
      alcance: rows.some((r) => r.tipo_campana === "alcance" && r.activa),
      conversion_wp: rows.some((r) => r.tipo_campana === "conversion_wp" && r.activa),
      remarketing: rows.some((r) => r.tipo_campana === "remarketing" && r.activa),
      notas: notasRow?.notas ?? "",
    });
  };

  // ── Save modal ──
  const saveModal = async () => {
    if (!modal) return;
    setSaving(true);
    setSaveError(null);

    const upserts = CAMPAIGNS.map((c) => ({
      fecha: modal.fecha,
      tipo_campana: c.id,
      activa: modal[c.id],
      notas: c.id === "alcance" ? modal.notas : null,
    }));

    const { error } = await supabase
      .from("pauta_historial")
      .upsert(upserts, { onConflict: "fecha,tipo_campana" });

    if (error) {
      setSaveError(`${error.message} (código: ${error.code})`);
      setSaving(false);
      return;
    }

    await Promise.all([loadPauta(calYear, calMonth), loadChart()]);
    setSaving(false);
    setModal(null);
  };

  // ── Build calendar grid ──
  const { first, last } = monthRange(calYear, calMonth);
  // Monday-first: 0=Mon ... 6=Sun
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = last.getDate();
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad end to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const weeklyDone = weeklyCount >= 3;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#0C0C0C", minHeight: "100dvh", color: "#F5F5F5", fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #222", background: "#111", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{ background: "none", border: "none", color: "#B0B0B0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 0" }}
          >
            <LayoutDashboard size={15} /> Dashboard
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.03em" }}>
            CC Remodela
          </span>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── SECCIÓN 1: DAILY CHECKLIST ─────────────────────────────────── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#B0B0B0", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              Daily Checklist
            </h2>
            <span style={{ fontSize: 11, color: "#555" }}>
              {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" })}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Story items */}
            {([
              { key: "whatsapp" as const, label: "WhatsApp Story", color: "#25D366" },
              { key: "ig" as const, label: "IG Story", color: "#E1306C" },
              { key: "tiktok" as const, label: "TikTok Story", color: "#69C9D0" },
            ]).map(({ key, label, color }) => {
              const done = daily[key];
              return (
                <button
                  key={key}
                  onClick={() => setDailyItem(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: done ? "#1A1A1A" : "#141414",
                    border: `1px solid ${done ? color + "50" : "#222"}`,
                    borderRadius: 12, padding: "14px 16px",
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: done ? color : "transparent",
                    border: `2px solid ${done ? color : "#444"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {done && <Check size={13} color="#000" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: done ? "#B0B0B0" : "#F5F5F5", textDecoration: done ? "line-through" : "none" }}>
                    {label}
                  </span>
                  {done && (
                    <span style={{ marginLeft: "auto", fontSize: 12, color: color, fontWeight: 600 }}>✓</span>
                  )}
                </button>
              );
            })}

            {/* Weekly counter */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              background: weeklyDone ? "#1A1A1A" : "#141414",
              border: `1px solid ${weeklyDone ? "#FFB80050" : "#222"}`,
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: weeklyDone ? "#FFB800" : "transparent",
                border: `2px solid ${weeklyDone ? "#FFB800" : "#444"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {weeklyDone && <Check size={13} color="#000" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: weeklyDone ? "#B0B0B0" : "#F5F5F5", flex: 1 }}>
                Contenido semanal
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => adjustWeekly(-1)}
                  style={{ background: "#222", border: "1px solid #333", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#B0B0B0" }}
                >
                  <Minus size={13} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 700, color: weeklyDone ? "#FFB800" : "#F5F5F5", minWidth: 36, textAlign: "center" }}>
                  {weeklyCount}/3
                </span>
                <button
                  onClick={() => adjustWeekly(1)}
                  style={{ background: weeklyDone ? "#222" : "#FFB80020", border: `1px solid ${weeklyDone ? "#333" : "#FFB80060"}`, borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: weeklyDone ? "default" : "pointer", color: weeklyDone ? "#555" : "#FFB800" }}
                  disabled={weeklyDone}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: "#1E1E1E" }} />

        {/* ── SECCIÓN 2: PAUTA CALENDAR ──────────────────────────────────── */}
        <section>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: "#B0B0B0", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>
            Pauta
          </h2>

          {calError && (
            <div style={{ background: "#EF444420", border: "1px solid #EF444460", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#FCA5A5", wordBreak: "break-all" }}>
              ⚠️ {calError}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {CAMPAIGNS.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#B0B0B0" }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Calendar nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#B0B0B0" }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>
              {monthLabel(calYear, calMonth)}
            </span>
            <button onClick={nextMonth} style={{ background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#B0B0B0" }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#555", fontWeight: 600, paddingBottom: 4 }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />;

              const fecha = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const active = pautaMap[fecha] ?? [];
              const isToday = fecha === today;
              const hasCampaigns = active.length > 0;

              return (
                <button
                  key={fecha}
                  onClick={() => openDay(fecha)}
                  style={{
                    background: hasCampaigns ? "#1A1A1A" : "#111",
                    border: `1px solid ${isToday ? "#FFB800" : hasCampaigns ? "#2A2A2A" : "#1A1A1A"}`,
                    borderRadius: 8, padding: "6px 4px",
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    minHeight: 52, transition: "border-color 0.15s",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? "#FFB800" : "#F5F5F5" }}>
                    {day}
                  </span>
                  {active.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
                      {active.map((c) => {
                        const camp = CAMPAIGNS.find((x) => x.id === c);
                        return camp ? (
                          <div key={c} style={{ width: 6, height: 6, borderRadius: "50%", background: camp.color }} />
                        ) : null;
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: "#1E1E1E" }} />

        {/* ── SECCIÓN 3: GRÁFICA 30 DÍAS ─────────────────────────────────── */}
        <section>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: "#B0B0B0", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" }}>
            Últimos 30 días
          </h2>
          <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: 12, padding: "16px 8px 8px" }}>
            <Bar
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    label: "Alcance",
                    data: chartData.alcance,
                    backgroundColor: "#F97316",
                    stack: "pauta",
                    borderRadius: 2,
                  },
                  {
                    label: "Conversión WP",
                    data: chartData.conversion_wp,
                    backgroundColor: "#3B82F6",
                    stack: "pauta",
                    borderRadius: 2,
                  },
                  {
                    label: "Remarketing",
                    data: chartData.remarketing,
                    backgroundColor: "#EF4444",
                    stack: "pauta",
                    borderRadius: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                animation: { duration: 400 },
                plugins: {
                  legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                      color: "#B0B0B0",
                      font: { size: 11 },
                      boxWidth: 10,
                      boxHeight: 10,
                      padding: 16,
                    },
                  },
                  tooltip: {
                    backgroundColor: "#1A1A1A",
                    borderColor: "#333",
                    borderWidth: 1,
                    titleColor: "#F5F5F5",
                    bodyColor: "#B0B0B0",
                    callbacks: {
                      label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y ? "Activa" : "—"}`,
                    },
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                    grid: { color: "#1E1E1E" },
                    ticks: {
                      color: "#555",
                      font: { size: 9 },
                      maxRotation: 0,
                      maxTicksLimit: 10,
                    },
                  },
                  y: {
                    stacked: true,
                    grid: { color: "#1E1E1E" },
                    ticks: { color: "#555", font: { size: 10 }, stepSize: 1 },
                    max: 3,
                    title: { display: false },
                  },
                },
              }}
            />
          </div>
        </section>
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{ background: "#1A1A1A", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480, border: "1px solid #333", borderBottom: "none" }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: "#B0B0B0", margin: 0 }}>Campañas activas</p>
                <p style={{ fontWeight: 700, fontSize: 16, margin: "2px 0 0", color: "#F5F5F5" }}>
                  {new Date(modal.fecha + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "#222", border: "1px solid #333", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#B0B0B0" }}>
                <X size={15} />
              </button>
            </div>

            {/* Campaign toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {CAMPAIGNS.map((c) => {
                const on = modal[c.id];
                return (
                  <button
                    key={c.id}
                    onClick={() => setModal((m) => m ? { ...m, [c.id]: !m[c.id] } : m)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: on ? c.bg : "#111",
                      border: `1px solid ${on ? c.color + "60" : "#2A2A2A"}`,
                      borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: on ? c.color : "transparent",
                      border: `2px solid ${on ? c.color : "#444"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {on && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: on ? "#F5F5F5" : "#B0B0B0" }}>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Notes */}
            <textarea
              value={modal.notas}
              onChange={(e) => setModal((m) => m ? { ...m, notas: e.target.value } : m)}
              placeholder="Notas (opcional)..."
              rows={2}
              style={{
                width: "100%", background: "#111", border: "1px solid #2A2A2A", borderRadius: 10,
                padding: "10px 12px", color: "#F5F5F5", fontSize: 14, resize: "none",
                outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 14,
              }}
            />

            {/* Save error */}
            {saveError && (
              <div style={{ background: "#EF444420", border: "1px solid #EF444460", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#FCA5A5", wordBreak: "break-all" }}>
                ⚠️ {saveError}
              </div>
            )}

            {/* Save */}
            <button
              onClick={saveModal}
              disabled={saving}
              style={{
                width: "100%", background: "#FFB800", color: "#000", fontWeight: 700, fontSize: 15,
                border: "none", borderRadius: 12, padding: "14px", cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.6 : 1, transition: "opacity 0.15s",
              }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
