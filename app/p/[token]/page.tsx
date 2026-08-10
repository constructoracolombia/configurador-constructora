"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  SECCIONES_POR_PLAN,
  BONUS_ITEMS,
  getCondiciones,
  WA_EMPRESA,
  type PlanSeccion,
} from "@/lib/plan-constants";
import { generarPresupuestoPublicoPDF } from "@/lib/utils/pdf-generator";

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

const BG    = "#FAF8F4";
const CARD  = "#FFFFFF";
const GOLD  = "#B0894F";
const TEXT  = "#111D2E";
const TEXT2 = "#6B7280";

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

  // ── carga de datos ──────────────────────────────────────────────────────
  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/presupuesto/${token}`);
      if (!res.ok) {
        setError("Este link no es válido o el presupuesto fue eliminado.");
        setLoading(false);
        return;
      }
      const { presupuesto, catItems: cats } = await res.json() as {
        presupuesto: Presupuesto;
        catItems: CatItem[];
      };
      setPpto(presupuesto);
      setCatItems(cats || []);
      setLoading(false);
    })();
  }, [token]);

  // ── tracking ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ppto || hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    const now = new Date().toISOString();
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ppto.id,
        visto_primera_vez: ppto.visto_primera_vez ?? now,
        veces_visto: ppto.veces_visto ?? 0,
      }),
    })
      .then((r) => { if (!r.ok) r.json().then((e) => console.error("track-view error:", r.status, e)); })
      .catch((err) => console.error("track-view fetch falló:", err));
  }, [ppto]);

  // ── estados carga / error ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: GOLD, fontFamily: "serif", fontSize: 18 }}>Cargando…</div>
      </div>
    );
  }

  if (error || !ppto) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: GOLD, fontSize: 40, marginBottom: 12 }}>⚠</div>
          <p style={{ color: TEXT, fontFamily: "serif", fontSize: 20, marginBottom: 8 }}>Link no disponible</p>
          <p style={{ color: TEXT2, fontSize: 14 }}>{error ?? "Presupuesto no encontrado."}</p>
        </div>
      </div>
    );
  }

  // ── cálculos ─────────────────────────────────────────────────────────────
  const precioEfectivo = ppto.precio_manual ?? ppto.precio_base ?? 0;
  const itemsOcultosSet = new Set(ppto.items_ocultos || []);
  const catItemMap = new Map(catItems.map((i) => [i.id, i]));

  const adicionales = Object.entries(ppto.seleccionados).map(([id, qty]) => {
    const snap   = ppto.precios_snapshot[id] ?? 0;
    const precio = snap;
    const cat    = catItemMap.get(id);
    return { id, nombre: cat?.nombre ?? "Ítem", codigo: cat?.codigo ?? null, qty, precio, total: precio * qty };
  }).filter((a) => a.precio > 0 || a.qty > 0);

  const subtotalAdicionales = adicionales.reduce((s, a) => s + a.total, 0);
  const subtotalManuales    = ppto.items_manuales.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const baseTotal           = precioEfectivo + subtotalAdicionales + subtotalManuales;
  const iva                 = ppto.aplica_iva ? Math.round(baseTotal * 0.19) : 0;
  const totalFinal          = ppto.total_final;

  const secciones: PlanSeccion[] = SECCIONES_POR_PLAN[ppto.plan_base] ?? [];

  const fechaFormato = new Date(ppto.created_at).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });
  const refNum = `V${ppto.version_num} · ${new Date(ppto.created_at).toISOString().split("T")[0]!.replace(/-/g, "")}`;

  // CTA de reserva — mismo mensaje/tono que el botón "Reservar Mi Cupo
  // Ahora" de /resumen (CierreVentaExpress), reconstruido acá con los
  // datos del presupuesto en vez de los del store del cliente.
  const waMsgReserva = encodeURIComponent(
    `Hola! Vengo de la web de Constructora Colombia.\n\n` +
      `Ya tengo mi presupuesto listo para *${ppto.conjunto || ppto.nombre_proyecto}* (${refNum}) por ${cop(totalFinal)}.\n\n` +
      `Quiero asegurar mi precio actual antes de que suban los insumos. ¿Sigue disponible el cupo de reserva por $500.000 para este mes?\n\n` +
      `*DATOS DE CONTACTO:*\nNombre: ${ppto.nombre_cliente}\nTelefono: ${ppto.telefono_cliente || "Por WhatsApp"}`
  );
  const waUrlReserva = `https://wa.me/${WA_EMPRESA}?text=${waMsgReserva}`;

  const copiarLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const descargarPDF = async () => {
    if (!ppto) return;
    setDescargandoPDF(true);
    try {
      // Segundo rediseño 2026-08-10 (pedido explícito de Javier): el enfoque
      // anterior (html2canvas-pro capturando el DOM como una imagen larga y
      // cortándola en bloques A4 fijos) arreglaba el error de colores
      // oklch/lab, pero seguía partiendo tarjetas a la mitad entre página y
      // página — no se veía profesional. Ahora se dibuja el PDF con jsPDF
      // nativo (generarPresupuestoPublicoPDF), verificando el espacio
      // restante antes de cada sección para saltar de página limpio, nunca
      // a mitad de una tarjeta. Ya no depende de html2canvas en absoluto.
      const blob = await generarPresupuestoPublicoPDF({
        nombreCliente: ppto.nombre_cliente,
        nombreProyecto: ppto.nombre_proyecto,
        conjunto: ppto.conjunto,
        fecha: fechaFormato,
        refNum,
        planBase: ppto.plan_base,
        precioEfectivo,
        secciones: secciones.map(({ seccion, items: secItems }) => ({
          seccion,
          items: secItems
            .filter((n) => !itemsOcultosSet.has(`${seccion}_${n}`))
            .map((nombre) => {
              const estado = ppto.items_plan_estado[nombre];
              return { nombre, aplica: estado?.aplica ?? true, cantidad: estado?.cantidad ?? 1 };
            }),
        })).filter((s) => s.items.length > 0),
        adicionales: adicionales.map((a) => ({ nombre: a.nombre, qty: a.qty, total: a.total })),
        subtotalAdicionales,
        itemsManuales: ppto.items_manuales.map((i) => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
        subtotalManuales,
        iva,
        totalFinal,
        condiciones: getCondiciones(ppto.plan_base),
        notas: ppto.notas || "",
      });

      const clienteSlug = ppto.nombre_cliente.split(" ")[0]!.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "");
      const fecha = ppto.created_at.slice(0, 10).replace(/-/g, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Presupuesto-${clienteSlug}-V${ppto.version_num}-${fecha}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Bug real corregido 2026-08-10: este bloque no tenía catch, solo
      // finally — si el generador fallaba, el error quedaba como una promesa
      // rechazada sin manejar, invisible para quien hace clic: el botón
      // volvía a la normalidad sin descargar nada y sin ningún aviso.
      console.error("Error generando el PDF de la cotización:", err);
      alert("No se pudo generar el PDF. Vuelve a intentarlo; si el problema sigue, avísale a soporte con el error de la consola (F12).");
    } finally {
      setDescargandoPDF(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* ── HEADER (oscuro — identidad de marca) ── */}
      <div style={{ background: "#111D2E", borderBottom: `2px solid ${GOLD}`, padding: "16px 20px", textAlign: "center" }}>
        <p style={{ color: GOLD, fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>
          Constructora Colombia
        </p>
        <p style={{ color: "#FAF8F4", fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
          REMODELA
        </p>
        <p style={{ color: "#D4C9B8", fontSize: 11, marginTop: 2, opacity: 0.7 }}>constructoracolombia.com</p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 32px" }}>

        {/* ── HERO ── */}
        <div style={{ background: CARD, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid rgba(176,137,79,0.25)`, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Cotización de remodelación
          </p>
          <p style={{ color: TEXT, fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.2 }}>
            {ppto.nombre_cliente}
          </p>
          {ppto.conjunto && (
            <p style={{ color: TEXT2, fontSize: 14, marginBottom: 2 }}>
              {ppto.conjunto}{ppto.nombre_proyecto ? ` · ${ppto.nombre_proyecto}` : ""}
            </p>
          )}
          <p style={{ color: TEXT2, fontSize: 12, marginTop: 6 }}>
            {fechaFormato} · <span style={{ fontFamily: "monospace" }}>{refNum}</span>
          </p>
        </div>

        {/* ── TOTAL DESTACADO ── */}
        <div style={{
          background: `linear-gradient(135deg, #FDF6EC 0%, #FAF0E0 100%)`,
          border: `2px solid ${GOLD}`,
          borderRadius: 16, padding: "24px 20px", marginBottom: 16, textAlign: "center",
        }}>
          <p style={{ color: TEXT2, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Inversión total
          </p>
          <p style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 800, margin: "0 0 6px", lineHeight: 1 }}>
            {cop(totalFinal)}
          </p>
          <p style={{ color: TEXT2, fontSize: 13, fontStyle: "italic", opacity: 0.9 }}>
            Precio fijo · Sin sobrecostos
          </p>
        </div>

        {/* ── PLAN BASE ── */}
        {ppto.plan_base && secciones.length > 0 && (
          <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ background: GOLD, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase" }}>
                {ppto.plan_base}
              </span>
              <p style={{ color: TEXT, fontSize: 13, margin: 0 }}>· Todo lo que incluye tu remodelación</p>
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
                        <span style={{ color: aplica ? "#16a34a" : "#9ca3af", fontSize: 13, flexShrink: 0 }}>
                          {aplica ? "✓" : "✗"}
                        </span>
                        <span style={{ color: aplica ? TEXT : TEXT2, fontSize: 13, textDecoration: aplica ? "none" : "line-through" }}>
                          {nombre}
                          {aplica && (estado?.cantidad ?? 1) > 1 && (
                            <span style={{ color: TEXT2, fontSize: 11, marginLeft: 4 }}>×{estado.cantidad}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div style={{ borderTop: `1px solid rgba(176,137,79,0.3)`, marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: TEXT2, fontSize: 13 }}>Total {ppto.plan_base}</span>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{cop(precioEfectivo)}</span>
            </div>
          </div>
        )}

        {/* ── ADICIONALES ── */}
        {adicionales.length > 0 && (
          <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
            <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
              + Adicionales seleccionados
            </p>
            {adicionales.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: TEXT, fontSize: 13 }}>{a.nombre}</span>
                  {a.qty > 1 && <span style={{ color: TEXT2, fontSize: 11, marginLeft: 4 }}>×{a.qty}</span>}
                </div>
                <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{cop(a.total)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid rgba(176,137,79,0.3)`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: TEXT2, fontSize: 13 }}>Subtotal adicionales</span>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{cop(subtotalAdicionales)}</span>
            </div>
          </div>
        )}

        {/* ── PERSONALIZADOS ── */}
        {ppto.items_manuales.length > 0 && (
          <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
            <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
              + Personalizados
            </p>
            {ppto.items_manuales.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: TEXT, fontSize: 13 }}>{item.nombre}</span>
                  {item.cantidad > 1 && <span style={{ color: TEXT2, fontSize: 11, marginLeft: 4 }}>×{item.cantidad}</span>}
                </div>
                <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{cop(item.precio * item.cantidad)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid rgba(176,137,79,0.3)`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: TEXT2, fontSize: 13 }}>Subtotal personalizados</span>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{cop(subtotalManuales)}</span>
            </div>
          </div>
        )}

        {/* ── BONUS GRATIS ── */}
        <div style={{
          background: "#F0FDF4",
          border: `1.5px solid rgba(34,197,94,0.3)`,
          borderRadius: 16, padding: 20, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 24 }}>🎁</span>
            <div>
              <p style={{ color: "#15803D", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 2px" }}>
                Bonus gratis incluido
              </p>
              <p style={{ color: "#166534", fontSize: 12, margin: 0, opacity: 0.85 }}>Solo por confirmar en este mes</p>
            </div>
          </div>
          {BONUS_ITEMS.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#16a34a", fontSize: 12, flexShrink: 0, marginTop: 1 }}>✦</span>
              <span style={{ color: "#166534", fontSize: 13 }}>{b}</span>
            </div>
          ))}
        </div>

        {/* ── DESGLOSE TOTALES ── */}
        <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          {ppto.plan_base && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: TEXT2, fontSize: 14 }}>{ppto.plan_base}</span>
              <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{cop(precioEfectivo)}</span>
            </div>
          )}
          {subtotalAdicionales > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: TEXT2, fontSize: 14 }}>Adicionales</span>
              <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{cop(subtotalAdicionales)}</span>
            </div>
          )}
          {subtotalManuales > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: TEXT2, fontSize: 14 }}>Personalizados</span>
              <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{cop(subtotalManuales)}</span>
            </div>
          )}
          {iva > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: TEXT2, fontSize: 14 }}>IVA (19%)</span>
              <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{cop(iva)}</span>
            </div>
          )}
          <div style={{ borderTop: `1.5px solid ${GOLD}`, marginTop: 10, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: TEXT, fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700 }}>TOTAL GENERAL</span>
            <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 800 }}>{cop(totalFinal)}</span>
          </div>
        </div>

        {/* ── CONDICIONES ── */}
        <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(0,0,0,0.08)`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            Condiciones
          </p>
          {getCondiciones(ppto.plan_base).map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ color: GOLD, fontSize: 14, flexShrink: 0 }}>·</span>
              <span style={{ color: TEXT2, fontSize: 13 }}>{c}</span>
            </div>
          ))}
          {ppto.notas?.trim() && (
            <div style={{ marginTop: 12, borderTop: `1px solid rgba(0,0,0,0.07)`, paddingTop: 12 }}>
              <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{ppto.notas}</p>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <p style={{ color: TEXT2, fontSize: 12, marginBottom: 4 }}>
            @constructoraColombia · constructoracolombia.com
          </p>
          <p style={{ color: TEXT2, fontSize: 11, opacity: 0.6 }}>
            Bucaramanga, Santander · © {new Date().getFullYear()}
          </p>
        </div>

      </div>{/* cierra inner max-width */}

      {/* ── BOTONES DE ACCIÓN ── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 40px" }}>

        {/* ── ALTA DEMANDA ── */}
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10,
          background: "#FEF2F2", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 12,
          padding: "12px 16px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#DC2626", opacity: 0.6, animation: "pulse-ppto 1.6s cubic-bezier(0.4,0,0.6,1) infinite" }} />
              <span style={{ position: "relative", width: 10, height: 10, borderRadius: "50%", background: "#DC2626" }} />
            </span>
            <span style={{ fontWeight: 700, color: TEXT, fontSize: 13 }}>Alta demanda</span>
            <span style={{ color: TEXT2, fontSize: 13 }}>· Solo quedan 3 cupos este mes</span>
          </div>
        </div>
        <style>{`@keyframes pulse-ppto { 0%,100% { transform: scale(1); opacity: .6; } 70% { transform: scale(2.2); opacity: 0; } }`}</style>

        {/* ── GARANTÍA DE FLEXIBILIDAD ── */}
        <div style={{ background: CARD, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid rgba(176,137,79,0.2)`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <p style={{ color: TEXT, fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, textAlign: "center", margin: "0 0 4px" }}>
            Garantía de Flexibilidad Total
          </p>
          <p style={{ color: TEXT2, fontSize: 12, textAlign: "center", margin: "0 0 16px" }}>
            ¿Quieres cambiar algo después? No te preocupes.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 22, marginBottom: 4 }}>🛡️</div>
              <div style={{ color: TEXT, fontSize: 11, fontWeight: 700 }}>Precio Congelado</div>
              <div style={{ color: TEXT2, fontSize: 10, marginTop: 2 }}>Protegido contra inflación</div>
            </div>
            <div>
              <div style={{ fontSize: 22, marginBottom: 4 }}>📅</div>
              <div style={{ color: TEXT, fontSize: 11, fontWeight: 700 }}>Fecha Garantizada</div>
              <div style={{ color: TEXT2, fontSize: 10, marginTop: 2 }}>Inicio asegurado este mes</div>
            </div>
            <div>
              <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
              <div style={{ color: TEXT, fontSize: 11, fontWeight: 700 }}>100% Modificable</div>
              <div style={{ color: TEXT2, fontSize: 10, marginTop: 2 }}>Ajusta después sin costo</div>
            </div>
          </div>
        </div>

        {/* CTA WHATSAPP — reservar cupo */}
        <a
          href={waUrlReserva}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            background: "#25D366", color: "#fff", borderRadius: 16,
            padding: "18px 24px", marginBottom: 10, textDecoration: "none",
            fontWeight: 700, fontSize: 17, boxShadow: "0 4px 20px rgba(37,211,102,0.35)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.534 5.874L.057 23.57a.5.5 0 00.614.614l5.696-1.477A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.375l-.36-.213-3.734.978.993-3.63-.233-.374A9.818 9.818 0 1112 21.818z"/>
          </svg>
          Reservar Mi Cupo Ahora
        </a>

        {/* AGENDA UNA REUNIÓN GRATUITA */}
        <div style={{ background: "#EFF6FF", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ color: TEXT, fontSize: 12.5, margin: "0 0 6px" }}>
            💬 ¿No estás seguro? Agenda una reunión gratuita de 30 min
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#2563EB", fontSize: 11.5 }}>
            <span>✓ 30 minutos</span>
            <span>✓ Virtual/presencial</span>
            <span>✓ Sin compromiso</span>
          </div>
        </div>

        {/* COPIAR LINK */}
        <button
          onClick={copiarLink}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", background: "transparent", border: `1px solid rgba(176,137,79,0.4)`,
            color: TEXT, borderRadius: 12, padding: "12px 20px", marginBottom: 10,
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
            width: "100%", background: "transparent", border: `1px solid rgba(0,0,0,0.12)`,
            color: TEXT2, borderRadius: 12, padding: "12px 20px", marginBottom: 24,
            fontSize: 14, cursor: descargandoPDF ? "wait" : "pointer",
            opacity: descargandoPDF ? 0.6 : 1,
          }}
        >
          {descargandoPDF ? "⏳ Generando PDF…" : "📄 Descargar cotización"}
        </button>

        {/* ── TESTIMONIOS ── */}
        <div style={{ marginTop: 24 }}>
          <p style={{ color: TEXT, fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, textAlign: "center", margin: "0 0 2px" }}>
            Lo que dicen nuestros clientes
          </p>
          <p style={{ color: TEXT2, fontSize: 12, textAlign: "center", margin: "0 0 16px" }}>
            Más de 100 familias ya confían en nosotros
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { nombre: "Michael Correa", inicial: "MC", texto: "Excelente trabajo, muy profesionales. Mi apartamento quedó hermoso y lo entregaron en el tiempo prometido." },
              { nombre: "Liliana Sánchez", inicial: "LS", texto: "La mejor inversión que hice. El equipo fue muy atento y el resultado superó mis expectativas." },
              { nombre: "Alexandra Pimiento", inicial: "AP", texto: "Todo el proceso fue transparente desde el inicio. Recomiendo 100% sus servicios." },
            ].map((t) => (
              <div key={t.nombre} style={{ background: CARD, border: `1px solid rgba(176,137,79,0.2)`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${GOLD}, #7c611f)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 13,
                  }}>
                    {t.inicial}
                  </div>
                  <div>
                    <div style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{t.nombre}</div>
                    <div style={{ color: GOLD, fontSize: 11 }}>★★★★★</div>
                  </div>
                </div>
                <p style={{ color: TEXT2, fontSize: 12.5, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>&quot;{t.texto}&quot;</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
