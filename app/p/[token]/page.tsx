"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  SECCIONES_POR_PLAN,
  BONUS_ITEMS,
  CONDICIONES,
  WA_EMPRESA,
  type PlanSeccion,
} from "@/lib/plan-constants";

// ── tipos ───────────────────────────────────────────────────────────────────

type EstadoItem = { aplica: boolean; cantidad: number; descuento: number };

type Presupuesto = {
  id: string;
  nombre_cliente: string;
  telefono_cliente: string;
  nombre_proyecto: string;
  plan_base: string;
  conjunto: string;
  precio_base: number | null;
  precio_manual: number | null;
  seleccionados: Record<string, number>;
  items_plan_estado: Record<string, EstadoItem>;
  items_ocultos: string[];
  items_manuales: Array<{ id: string; nombre: string; precio: number; cantidad: number }>;
  aplica_iva: boolean;
  notas: string;
  total_final: number;
  precios_snapshot: Record<string, number>;
  created_at: string;
  version_num: number;
  visto_primera_vez: string | null;
  veces_visto: number;
};

type CatItem = { id: string; nombre: string; codigo: string | null };

// ── helpers ─────────────────────────────────────────────────────────────────

const cop = (n: number) => `$ ${Math.round(n).toLocaleString("es-CO")}`;

const NAVY   = "#111D2E";
const CARD   = "#1A2740";
const GOLD   = "#B0894F";
const CREAM  = "#FAF8F4";
const CREAM2 = "#E8E0D4";

// ── componente ───────────────────────────────────────────────────────────────

export default function PresupuestoPublicoPage() {
  const { token } = useParams<{ token: string }>();
  const [ppto, setPpto] = useState<Presupuesto | null>(null);
  const [catItems, setCatItems] = useState<CatItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const hasTrackedRef = useRef(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // ── carga de datos ──────────────────────────────────────────────────────
  useEffect(() => {
    void (async () => {
      const { data, error: err } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("token_publico", token)
        .single();

      if (err || !data) {
        setError("Este link no es válido o el presupuesto fue eliminado.");
        setLoading(false);
        return;
      }

      setPpto(data as Presupuesto);

      // Nombres de ítems del catálogo para mostrar en Adicionales
      const selIds = Object.keys(data.seleccionados || {});
      if (selIds.length > 0) {
        const { data: cats } = await supabase
          .from("catalogo_items")
          .select("id, nombre, codigo")
          .in("id", selIds);
        setCatItems(cats || []);
      }

      setLoading(false);
    })();
  }, [token]);

  // ── tracking (guard anti-doble-invoke Strict Mode) ──────────────────────
  useEffect(() => {
    if (!ppto || hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    const now = new Date().toISOString();
    void supabase
      .from("presupuestos")
      .update({
        visto_primera_vez: ppto.visto_primera_vez ?? now,
        visto_ultima_vez: now,
        veces_visto: (ppto.veces_visto ?? 0) + 1,
      })
      .eq("id", ppto.id);
  }, [ppto]);

  // ── estados de carga / error ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: NAVY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: GOLD, fontFamily: "serif", fontSize: 18 }}>Cargando…</div>
      </div>
    );
  }

  if (error || !ppto) {
    return (
      <div style={{ background: NAVY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: GOLD, fontSize: 40, marginBottom: 12 }}>⚠</div>
          <p style={{ color: CREAM, fontFamily: "serif", fontSize: 20, marginBottom: 8 }}>Link no disponible</p>
          <p style={{ color: CREAM2, fontSize: 14 }}>{error ?? "Presupuesto no encontrado."}</p>
        </div>
      </div>
    );
  }

  // ── cálculos (usando precios_snapshot — nunca catálogo actual) ──────────
  const precioEfectivo = ppto.precio_manual ?? ppto.precio_base ?? 0;
  const itemsOcultosSet = new Set(ppto.items_ocultos || []);

  const catItemMap = new Map(catItems.map((i) => [i.id, i]));

  const adicionales = Object.entries(ppto.seleccionados).map(([id, qty]) => {
    const snap  = ppto.precios_snapshot[id] ?? 0;
    const precio = Math.round(snap * 1.20);
    const cat   = catItemMap.get(id);
    return { id, nombre: cat?.nombre ?? "Ítem", codigo: cat?.codigo ?? null, qty, precio, total: precio * qty };
  }).filter((a) => a.precio > 0 || a.qty > 0);

  const subtotalAdicionales = adicionales.reduce((s, a) => s + a.total, 0);
  const subtotalManuales    = ppto.items_manuales.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const baseTotal           = precioEfectivo + subtotalAdicionales + subtotalManuales;
  const iva                 = ppto.aplica_iva ? Math.round(baseTotal * 0.19) : 0;
  const totalFinal          = ppto.total_final; // valor congelado

  const secciones: PlanSeccion[] = SECCIONES_POR_PLAN[ppto.plan_base] ?? [];

  const fechaFormato = new Date(ppto.created_at).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });
  const refNum = `V${ppto.version_num} · ${new Date(ppto.created_at).toISOString().split("T")[0].replace(/-/g, "")}`;

  const waMsg = encodeURIComponent(
    `Hola, vi mi presupuesto (${refNum}) por ${cop(totalFinal)} y quiero avanzar con la remodelación. 🏠`
  );
  const waUrl = `https://wa.me/${WA_EMPRESA}?text=${waMsg}`;

  const copiarLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const descargarPDF = async () => {
    if (!pdfContentRef.current || !ppto) return;
    setDescargandoPDF(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: NAVY,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = pdfW;
      const imgH = (canvas.height / canvas.width) * pdfW;

      const pageCount = Math.ceil(imgH / pdfH);
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -(i * pdfH), imgW, imgH);
      }

      const clienteSlug = ppto.nombre_cliente.split(" ")[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "");
      const fecha = ppto.created_at.slice(0, 10).replace(/-/g, "");
      pdf.save(`Presupuesto-${clienteSlug}-V${ppto.version_num}-${fecha}.pdf`);
    } finally {
      setDescargandoPDF(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: NAVY, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* ── ZONA CAPTURADA POR PDF (header → footer, sin botones) ── */}
      <div ref={pdfContentRef} style={{ background: NAVY }}>

      {/* ── HEADER ── */}
      <div style={{ background: CARD, borderBottom: `2px solid ${GOLD}`, padding: "16px 20px", textAlign: "center" }}>
        <p style={{ color: GOLD, fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>
          Constructora Colombia
        </p>
        <p style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
          REMODELA
        </p>
        <p style={{ color: CREAM2, fontSize: 11, marginTop: 2, opacity: 0.7 }}>constructoracolombia.com</p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 32px" }}>

        {/* ── HERO: datos del cliente ── */}
        <div style={{ background: CARD, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid rgba(176,137,79,0.25)` }}>
          <p style={{ color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Cotización de remodelación
          </p>
          <p style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.2 }}>
            {ppto.nombre_cliente}
          </p>
          {ppto.conjunto && (
            <p style={{ color: CREAM2, fontSize: 14, marginBottom: 2 }}>
              {ppto.conjunto}{ppto.nombre_proyecto ? ` · ${ppto.nombre_proyecto}` : ""}
            </p>
          )}
          <p style={{ color: "#7a8a9a", fontSize: 12, marginTop: 6 }}>
            {fechaFormato} · <span style={{ fontFamily: "monospace" }}>{refNum}</span>
          </p>
        </div>

        {/* ── TOTAL DESTACADO ── */}
        <div style={{
          background: `linear-gradient(135deg, ${CARD} 0%, #24374f 100%)`,
          border: `2px solid ${GOLD}`,
          borderRadius: 16, padding: "24px 20px", marginBottom: 16, textAlign: "center",
        }}>
          <p style={{ color: CREAM2, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Inversión total
          </p>
          <p style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 800, margin: "0 0 6px", lineHeight: 1 }}>
            {cop(totalFinal)}
          </p>
          <p style={{ color: CREAM2, fontSize: 13, fontStyle: "italic", opacity: 0.8 }}>
            Precio fijo · Sin sobrecostos
          </p>
        </div>

        {/* ── PLAN BASE ── */}
        {ppto.plan_base && secciones.length > 0 && (
          <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ background: GOLD, color: NAVY, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase" }}>
                {ppto.plan_base}
              </span>
              <p style={{ color: CREAM, fontSize: 13, margin: 0 }}>· Todo lo que incluye tu remodelación</p>
            </div>

            {secciones.map(({ seccion, items: secItems }) => {
              const visibles = secItems.filter((n) => !itemsOcultosSet.has(`${seccion}_${n}`));
              if (visibles.length === 0) return null;
              return (
                <div key={seccion} style={{ marginBottom: 14 }}>
                  <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                    {seccion}
                  </p>
                  {visibles.map((nombre) => {
                    const estado = ppto.items_plan_estado[nombre];
                    const aplica = estado?.aplica ?? true;
                    return (
                      <div key={nombre} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, opacity: aplica ? 1 : 0.4 }}>
                        <span style={{ color: aplica ? "#4ade80" : "#9ca3af", fontSize: 13, flexShrink: 0 }}>
                          {aplica ? "✓" : "✗"}
                        </span>
                        <span style={{ color: aplica ? CREAM : "#6b7280", fontSize: 13, textDecoration: aplica ? "none" : "line-through" }}>
                          {nombre}
                          {aplica && (estado?.cantidad ?? 1) > 1 && (
                            <span style={{ color: "#7a8a9a", fontSize: 11, marginLeft: 4 }}>×{estado.cantidad}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Total plan */}
            <div style={{ borderTop: `1px solid rgba(176,137,79,0.3)`, marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: CREAM2, fontSize: 13 }}>Total {ppto.plan_base}</span>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{cop(precioEfectivo)}</span>
            </div>
          </div>
        )}

        {/* ── ADICIONALES DEL CATÁLOGO ── */}
        {adicionales.length > 0 && (
          <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)` }}>
            <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
              + Adicionales seleccionados
            </p>
            {adicionales.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: CREAM, fontSize: 13 }}>{a.nombre}</span>
                  {a.qty > 1 && <span style={{ color: "#7a8a9a", fontSize: 11, marginLeft: 4 }}>×{a.qty}</span>}
                </div>
                <span style={{ color: CREAM2, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{cop(a.total)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid rgba(176,137,79,0.3)`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: CREAM2, fontSize: 13 }}>Subtotal adicionales</span>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{cop(subtotalAdicionales)}</span>
            </div>
          </div>
        )}

        {/* ── PERSONALIZADOS ── */}
        {ppto.items_manuales.length > 0 && (
          <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)` }}>
            <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
              + Personalizados
            </p>
            {ppto.items_manuales.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: CREAM, fontSize: 13 }}>{item.nombre}</span>
                  {item.cantidad > 1 && <span style={{ color: "#7a8a9a", fontSize: 11, marginLeft: 4 }}>×{item.cantidad}</span>}
                </div>
                <span style={{ color: CREAM2, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{cop(item.precio * item.cantidad)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid rgba(176,137,79,0.3)`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: CREAM2, fontSize: 13 }}>Subtotal personalizados</span>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{cop(subtotalManuales)}</span>
            </div>
          </div>
        )}

        {/* ── BONUS GRATIS ── */}
        <div style={{
          background: `linear-gradient(135deg, #1c2e1a 0%, #1e3320 100%)`,
          border: `1.5px solid rgba(74,222,128,0.35)`,
          borderRadius: 16, padding: 20, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 24 }}>🎁</span>
            <div>
              <p style={{ color: "#4ade80", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 2px" }}>
                Bonus gratis incluido
              </p>
              <p style={{ color: CREAM2, fontSize: 12, margin: 0, opacity: 0.8 }}>Solo por confirmar en este mes</p>
            </div>
          </div>
          {BONUS_ITEMS.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#4ade80", fontSize: 12, flexShrink: 0, marginTop: 1 }}>✦</span>
              <span style={{ color: CREAM2, fontSize: 13 }}>{b}</span>
            </div>
          ))}
        </div>

        {/* ── DESGLOSE TOTALES ── */}
        <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)` }}>
          {ppto.plan_base && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: CREAM2, fontSize: 14 }}>{ppto.plan_base}</span>
              <span style={{ color: CREAM, fontSize: 14, fontWeight: 600 }}>{cop(precioEfectivo)}</span>
            </div>
          )}
          {subtotalAdicionales > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: CREAM2, fontSize: 14 }}>Adicionales</span>
              <span style={{ color: CREAM, fontSize: 14, fontWeight: 600 }}>{cop(subtotalAdicionales)}</span>
            </div>
          )}
          {subtotalManuales > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: CREAM2, fontSize: 14 }}>Personalizados</span>
              <span style={{ color: CREAM, fontSize: 14, fontWeight: 600 }}>{cop(subtotalManuales)}</span>
            </div>
          )}
          {iva > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: CREAM2, fontSize: 14 }}>IVA (19%)</span>
              <span style={{ color: CREAM, fontSize: 14, fontWeight: 600 }}>{cop(iva)}</span>
            </div>
          )}
          <div style={{ borderTop: `1.5px solid ${GOLD}`, marginTop: 10, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700 }}>TOTAL GENERAL</span>
            <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 800 }}>{cop(totalFinal)}</span>
          </div>
        </div>

        {/* ── CONDICIONES ── */}
        <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(255,255,255,0.07)` }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            Condiciones
          </p>
          {CONDICIONES.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ color: GOLD, fontSize: 14, flexShrink: 0 }}>·</span>
              <span style={{ color: CREAM2, fontSize: 13 }}>{c}</span>
            </div>
          ))}
          {ppto.notas?.trim() && (
            <div style={{ marginTop: 12, borderTop: `1px solid rgba(255,255,255,0.07)`, paddingTop: 12 }}>
              <p style={{ color: CREAM2, fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{ppto.notas}</p>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <p style={{ color: "#4a5568", fontSize: 12, marginBottom: 4 }}>
            @constructoraColombia · constructoracolombia.com
          </p>
          <p style={{ color: "#2d3748", fontSize: 11 }}>
            Bucaramanga, Santander · © {new Date().getFullYear()}
          </p>
        </div>

      </div>{/* cierra inner max-width */}
      </div>{/* cierra pdfContentRef */}

      {/* ── BOTONES DE ACCIÓN (excluidos del PDF) ── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 40px" }}>

        {/* CTA WHATSAPP */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            background: "#25D366", color: "#fff", borderRadius: 16,
            padding: "18px 24px", marginBottom: 12, textDecoration: "none",
            fontWeight: 700, fontSize: 17, boxShadow: "0 4px 20px rgba(37,211,102,0.35)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.534 5.874L.057 23.57a.5.5 0 00.614.614l5.696-1.477A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.375l-.36-.213-3.734.978.993-3.63-.233-.374A9.818 9.818 0 1112 21.818z"/>
          </svg>
          Quiero avanzar con mi remodelación
        </a>

        {/* COPIAR LINK */}
        <button
          onClick={copiarLink}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", background: "transparent", border: `1px solid rgba(176,137,79,0.4)`,
            color: CREAM2, borderRadius: 12, padding: "12px 20px", marginBottom: 10,
            fontSize: 14, cursor: "pointer",
          }}
        >
          {copiado ? "✓ Link copiado" : "🔗 Copiar este link"}
        </button>

        {/* DESCARGAR PDF */}
        <button
          onClick={() => void descargarPDF()}
          disabled={descargandoPDF}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", background: "transparent", border: `1px solid rgba(255,255,255,0.15)`,
            color: "#7a8a9a", borderRadius: 12, padding: "12px 20px", marginBottom: 24,
            fontSize: 14, cursor: descargandoPDF ? "wait" : "pointer",
            opacity: descargandoPDF ? 0.6 : 1,
          }}
        >
          {descargandoPDF ? "⏳ Generando PDF…" : "📄 Descargar cotización"}
        </button>

      </div>
    </div>
  );
}
