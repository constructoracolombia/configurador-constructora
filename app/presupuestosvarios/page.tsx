"use client";

import { useState, useMemo } from "react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface Item {
  id: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
}

interface Capitulo {
  id: string;
  nombre: string;
  icono: string;
  items: Item[];
}

// ─── DATOS EXTRAÍDOS DE LOS PLANOS (Lote #2 Vereda Nazareth Ruitoque Alto) ──
const CAPITULOS_INICIALES: Capitulo[] = [
  {
    id: "cimentacion",
    nombre: "Cimentación",
    icono: "⬛",
    items: [
      { id: "c1", descripcion: "Excavación para zapatas (mín. 2.50m prof.)", unidad: "m³", cantidad: 38.5, precioUnitario: 0 },
      { id: "c2", descripcion: "Hormigón ciclópeo bajo zapatas", unidad: "m³", cantidad: 12.0, precioUnitario: 0 },
      { id: "c3", descripcion: "Zapata C1=C2=C3=C5 (110x110x45 cm) f'c=21MPa — 4 und", unidad: "und", cantidad: 4, precioUnitario: 0 },
      { id: "c4", descripcion: "Zapata C4=C9 (90x90x45 cm) f'c=21MPa — 2 und", unidad: "und", cantidad: 2, precioUnitario: 0 },
      { id: "c5", descripcion: "Zapata C6=C7=C8=C10=C11 (130x130x45 cm) f'c=21MPa — 5 und", unidad: "und", cantidad: 5, precioUnitario: 0 },
      { id: "c6", descripcion: "Zapata C12=C13 (150x150x45 cm) f'c=21MPa — 2 und", unidad: "und", cantidad: 2, precioUnitario: 0 },
      { id: "c7", descripcion: "Acero corrugado Fy=420MPa — zapatas (varilla #4)", unidad: "kg", cantidad: 680, precioUnitario: 0 },
      { id: "c8", descripcion: "Vigas de amarre (30x35 cm) f'c=21MPa", unidad: "ml", cantidad: 92, precioUnitario: 0 },
      { id: "c9", descripcion: "Relleno compactado bajo losa de antepiso", unidad: "m³", cantidad: 24.0, precioUnitario: 0 },
      { id: "c10", descripcion: "Losa de antepiso e=10cm, Ø6mm c/15cm c/sentido", unidad: "m²", cantidad: 120, precioUnitario: 0 },
    ],
  },
  {
    id: "columnas",
    nombre: "Columnas",
    icono: "▮",
    items: [
      { id: "col1", descripcion: "Columna 40x30 cm f'c=21MPa — todas (13 und)", unidad: "und", cantidad: 13, precioUnitario: 0 },
      { id: "col2", descripcion: "Acero C1=C2=C3=C4 (8#5, E#3) — piso 1 a CUB subnivel", unidad: "kg", cantidad: 285, precioUnitario: 0 },
      { id: "col3", descripcion: "Acero C5=C10=C11=C12=C13 (8#5, E#3) — piso 1 a CUB P1", unidad: "kg", cantidad: 310, precioUnitario: 0 },
      { id: "col4", descripcion: "Acero C6=C7=C8=C9 (8#5, E#3) — doble altura (subnivel+P1)", unidad: "kg", cantidad: 420, precioUnitario: 0 },
      { id: "col5", descripcion: "Encofrado metálico columnas", unidad: "m²", cantidad: 156, precioUnitario: 0 },
    ],
  },
  {
    id: "vigas",
    nombre: "Vigas",
    icono: "━",
    items: [
      { id: "v1", descripcion: "Vigas principales 30x35 cm f'c=21MPa (V-101 a V-211)", unidad: "ml", cantidad: 198, precioUnitario: 0 },
      { id: "v2", descripcion: "Vigas secundarias 15x35 cm f'c=21MPa (V-116 a V-213)", unidad: "ml", cantidad: 28, precioUnitario: 0 },
      { id: "v3", descripcion: "Viguetas riostra 10x35 cm f'c=21MPa", unidad: "ml", cantidad: 64, precioUnitario: 0 },
      { id: "v4", descripcion: "Acero longitudinal vigas — varilla #5 (corridas)", unidad: "kg", cantidad: 1850, precioUnitario: 0 },
      { id: "v5", descripcion: "Acero longitudinal vigas — varilla #4 (corridas)", unidad: "kg", cantidad: 920, precioUnitario: 0 },
      { id: "v6", descripcion: "Estribos #3 vigas (c/7cm zonas sísmicas, c/14cm centro)", unidad: "kg", cantidad: 680, precioUnitario: 0 },
      { id: "v7", descripcion: "Encofrado vigas", unidad: "m²", cantidad: 245, precioUnitario: 0 },
    ],
  },
  {
    id: "losas",
    nombre: "Losas",
    icono: "▬",
    items: [
      { id: "l1", descripcion: "Placa aligerada e=35cm cubierta subnivel (viguetas 10x35)", unidad: "m²", cantidad: 115, precioUnitario: 0 },
      { id: "l2", descripcion: "Placa aligerada e=35cm cubierta piso 1", unidad: "m²", cantidad: 98, precioUnitario: 0 },
      { id: "l3", descripcion: "Viguetas prefabricadas para placa aligerada", unidad: "ml", cantidad: 520, precioUnitario: 0 },
      { id: "l4", descripcion: "Bloques de aligeramiento (0.10x0.70x0.35)", unidad: "und", cantidad: 1480, precioUnitario: 0 },
      { id: "l5", descripcion: "Malla electrosoldada Ø6mm c/15cm c/sentido — losas", unidad: "m²", cantidad: 213, precioUnitario: 0 },
      { id: "l6", descripcion: "Encofrado losas", unidad: "m²", cantidad: 213, precioUnitario: 0 },
    ],
  },
  {
    id: "muros_contencion",
    nombre: "Muros de contención",
    icono: "🧱",
    items: [
      { id: "mc1", descripcion: "Muro de contención tipo 1 — f'c=21MPa (h=2.80m, e=20cm)", unidad: "m²", cantidad: 48, precioUnitario: 0 },
      { id: "mc2", descripcion: "Acero muro contención #4 c/15cm c/sentido L=3.90m", unidad: "kg", cantidad: 340, precioUnitario: 0 },
      { id: "mc3", descripcion: "Encofrado muro de contención (2 caras)", unidad: "m²", cantidad: 96, precioUnitario: 0 },
    ],
  },
  {
    id: "muros_ne",
    nombre: "Muros no estructurales (Mampostería H10)",
    icono: "🪨",
    items: [
      { id: "mne1", descripcion: "Mampostería H10 piso-techo biarticulada (h≤3.25m) — Ladrillo perforación horizontal f'cu=3MPa", unidad: "m²", cantidad: 285, precioUnitario: 0 },
      { id: "mne2", descripcion: "Mampostería H10 antepecho-voladizo (h=1.20m)", unidad: "m²", cantidad: 68, precioUnitario: 0 },
      { id: "mne3", descripcion: "Columneta 20x10 cm f'c=21MPa (2#4, E#2 c/10cm)", unidad: "ml", cantidad: 186, precioUnitario: 0 },
      { id: "mne4", descripcion: "Viga cinta 10x20 cm f'c=21MPa", unidad: "ml", cantidad: 198, precioUnitario: 0 },
      { id: "mne5", descripcion: "Refuerzo horizontal RAM cada 1.20m (muros piso-techo)", unidad: "ml", cantidad: 855, precioUnitario: 0 },
      { id: "mne6", descripcion: "Mortero de pega f'cp=7.5MPa (dosif. 1:4)", unidad: "m³", cantidad: 8.5, precioUnitario: 0 },
      { id: "mne7", descripcion: "Mortero de relleno f'cr=17.5MPa (columnetas y vigas cinta)", unidad: "m³", cantidad: 4.2, precioUnitario: 0 },
      { id: "mne8", descripcion: "Anclaje superior 2#4 L=10cm resina epóxica (R2)", unidad: "und", cantidad: 620, precioUnitario: 0 },
      { id: "mne9", descripcion: "Dilatación superior e=1.0cm Icopor (d1)", unidad: "ml", cantidad: 198, precioUnitario: 0 },
      { id: "mne10", descripcion: "Dilatación lateral e=1.5cm Icopor (d2)", unidad: "ml", cantidad: 372, precioUnitario: 0 },
      { id: "mne11", descripcion: "Vacío o Icopor 0.10x0.06x0.06 m (separación muro-viga)", unidad: "ml", cantidad: 198, precioUnitario: 0 },
    ],
  },
  {
    id: "pasamanos",
    nombre: "Pasamanos metálicos",
    icono: "🔩",
    items: [
      { id: "ps1", descripcion: "Perfil tubular O 2x2.00 mm A572 50ksi — poste vertical (h=1.20m)", unidad: "und", cantidad: 18, precioUnitario: 0 },
      { id: "ps2", descripcion: 'Tubo cuadrado 2"x1.50mm — horizontal (L≈1.50m)', unidad: "ml", cantidad: 38, precioUnitario: 0 },
      { id: "ps3", descripcion: 'Tubo cuadrado 2"x2.00mm — pasamano superior (L≈2.00m)', unidad: "ml", cantidad: 24, precioUnitario: 0 },
      { id: "ps4", descripcion: "Platina de anclaje + perno expansión (fijación a losa)", unidad: "und", cantidad: 18, precioUnitario: 0 },
      { id: "ps5", descripcion: "Pintura anticorrosiva + acabado esmalte", unidad: "m²", cantidad: 42, precioUnitario: 0 },
    ],
  },
  {
    id: "vidrios",
    nombre: "Vidrios y acristalamiento",
    icono: "🪟",
    items: [
      { id: "vid1", descripcion: "Vidrio laminado arquitectura 2 float + 1 PVB 0.38mm (ventanas interiores)", unidad: "m²", cantidad: 28, precioUnitario: 0 },
      { id: "vid2", descripcion: "Vidrio laminado 2 float + 2 PVB (antepechos balcón — antidefenestración)", unidad: "m²", cantidad: 14, precioUnitario: 0 },
      { id: "vid3", descripcion: "Vidrio laminado 2 float + 3 PVB (planta baja — antirrotura)", unidad: "m²", cantidad: 8, precioUnitario: 0 },
      { id: "vid4", descripcion: "Silicona estructural para fijación", unidad: "ml", cantidad: 280, precioUnitario: 0 },
    ],
  },
];

// ─── FORMATO COP ──────────────────────────────────────────────────────────────
function formatCOP(valor: number): string {
  if (valor === 0) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}

function parsePrecio(raw: string): number {
  const limpio = raw.replace(/[^0-9]/g, "");
  return limpio === "" ? 0 : parseInt(limpio, 10);
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function PresupuestosVarios() {
  const [capitulos, setCapitulos] = useState<Capitulo[]>(CAPITULOS_INICIALES);
  const [capitulosAbiertos, setCapitulosAbiertos] = useState<Set<string>>(
    new Set(["cimentacion", "columnas"])
  );
  const [preciosEditando, setPreciosEditando] = useState<Record<string, string>>({});

  const totalesPorCapitulo = useMemo(
    () =>
      capitulos.map((cap) => ({
        id: cap.id,
        subtotal: cap.items.reduce((s, item) => s + item.cantidad * item.precioUnitario, 0),
        itemsConPrecio: cap.items.filter((i) => i.precioUnitario > 0).length,
        totalItems: cap.items.length,
      })),
    [capitulos]
  );

  const totalGeneral = useMemo(
    () => totalesPorCapitulo.reduce((s, c) => s + c.subtotal, 0),
    [totalesPorCapitulo]
  );
  const cantidadItemsConPrecio = useMemo(
    () => totalesPorCapitulo.reduce((s, c) => s + c.itemsConPrecio, 0),
    [totalesPorCapitulo]
  );
  const totalItems = useMemo(
    () => totalesPorCapitulo.reduce((s, c) => s + c.totalItems, 0),
    [totalesPorCapitulo]
  );

  function toggleCapitulo(id: string) {
    setCapitulosAbiertos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handlePrecioChange(itemId: string, raw: string) {
    setPreciosEditando((prev) => ({ ...prev, [itemId]: raw }));
  }

  function handlePrecioBlur(capId: string, itemId: string, raw: string) {
    const valor = parsePrecio(raw);
    setPreciosEditando((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setCapitulos((prev) =>
      prev.map((cap) =>
        cap.id !== capId
          ? cap
          : {
              ...cap,
              items: cap.items.map((item) =>
                item.id !== itemId ? item : { ...item, precioUnitario: valor }
              ),
            }
      )
    );
  }

  function getPrecioDisplay(item: Item): string {
    if (preciosEditando[item.id] !== undefined) return preciosEditando[item.id];
    return item.precioUnitario > 0 ? item.precioUnitario.toString() : "";
  }

  const pct = Math.round((cantidadItemsConPrecio / totalItems) * 100);

  return (
    <main className="min-h-screen bg-brand-dark text-brand-text font-sans">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 border-b border-brand-border bg-brand-dark/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-brand-textSecondary uppercase tracking-widest">
              Constructora Colombia
            </p>
            <h1 className="text-lg font-bold text-brand-primary leading-tight">
              Presupuesto estructural
            </h1>
            <p className="text-xs text-brand-textSecondary">
              Lote #2 · Vereda Nazareth Ruitoque Alto · Floridablanca
            </p>
          </div>

          {/* Total flotante */}
          <div className="text-right">
            <p className="text-xs text-brand-textSecondary">Total presupuestado</p>
            <p className="text-2xl font-bold text-brand-primary tabular-nums">
              {totalGeneral > 0 ? formatCOP(totalGeneral) : "$ 0"}
            </p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <div className="h-1.5 w-24 rounded-full bg-brand-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-brand-textSecondary">{pct}% ingresado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FICHA TÉCNICA ── */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Sistema estructural", value: "Pórtico DES R=7.00" },
            { label: "f'c concreto", value: "21 MPa (3000 PSI)" },
            { label: "Fy acero", value: "420 MPa (60.000 psi)" },
            { label: "Zona sísmica", value: "Alta · Aa=0.25 · Suelo D" },
          ].map((d) => (
            <div
              key={d.label}
              className="rounded-lg bg-brand-card border border-brand-border p-3"
            >
              <p className="text-xs text-brand-textSecondary">{d.label}</p>
              <p className="text-sm font-semibold text-brand-text">{d.value}</p>
            </div>
          ))}
        </div>

        {/* ── CAPÍTULOS ── */}
        <div className="space-y-3 pb-24">
          {capitulos.map((cap) => {
            const totCap = totalesPorCapitulo.find((t) => t.id === cap.id)!;
            const abierto = capitulosAbiertos.has(cap.id);

            return (
              <div
                key={cap.id}
                className="rounded-xl border border-brand-border bg-brand-card overflow-hidden"
              >
                {/* Cabecera capítulo */}
                <button
                  onClick={() => toggleCapitulo(cap.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-cement transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cap.icono}</span>
                    <div className="text-left">
                      <p className="font-semibold text-brand-text text-sm">{cap.nombre}</p>
                      <p className="text-xs text-brand-textSecondary">
                        {totCap.itemsConPrecio}/{totCap.totalItems} ítems ·{" "}
                        {totCap.subtotal > 0 ? (
                          <span className="text-brand-primary font-medium">
                            {formatCOP(totCap.subtotal)}
                          </span>
                        ) : (
                          "sin precio"
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-brand-textSecondary text-sm">
                    {abierto ? "▲" : "▼"}
                  </span>
                </button>

                {/* Tabla de ítems */}
                {abierto && (
                  <div className="border-t border-brand-border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-brand-border bg-brand-cement">
                          <th className="px-4 py-2 text-left text-xs text-brand-textSecondary font-medium w-full">
                            Descripción
                          </th>
                          <th className="px-3 py-2 text-center text-xs text-brand-textSecondary font-medium whitespace-nowrap">
                            Und
                          </th>
                          <th className="px-3 py-2 text-right text-xs text-brand-textSecondary font-medium whitespace-nowrap">
                            Cant.
                          </th>
                          <th className="px-3 py-2 text-right text-xs text-brand-textSecondary font-medium whitespace-nowrap min-w-[140px]">
                            P. Unitario
                          </th>
                          <th className="px-4 py-2 text-right text-xs text-brand-textSecondary font-medium whitespace-nowrap min-w-[130px]">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cap.items.map((item, idx) => {
                          const subtotal = item.cantidad * item.precioUnitario;
                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-brand-border/50 ${
                                idx % 2 === 0 ? "bg-brand-card" : "bg-brand-cement/30"
                              }`}
                            >
                              <td className="px-4 py-2.5 text-brand-text text-xs leading-snug">
                                {item.descripcion}
                              </td>
                              <td className="px-3 py-2.5 text-center text-brand-textSecondary text-xs">
                                {item.unidad}
                              </td>
                              <td className="px-3 py-2.5 text-right text-brand-text text-xs tabular-nums font-medium">
                                {item.cantidad.toLocaleString("es-CO")}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Ingresar..."
                                  value={getPrecioDisplay(item)}
                                  onChange={(e) =>
                                    handlePrecioChange(item.id, e.target.value)
                                  }
                                  onBlur={(e) =>
                                    handlePrecioBlur(cap.id, item.id, e.target.value)
                                  }
                                  className="w-full bg-transparent border border-brand-border rounded px-2 py-1 text-right text-xs text-brand-text placeholder-brand-border focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors tabular-nums"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                                {subtotal > 0 ? (
                                  <span className="text-brand-primary font-semibold">
                                    {formatCOP(subtotal)}
                                  </span>
                                ) : (
                                  <span className="text-brand-border">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Subtotal capítulo */}
                      <tfoot>
                        <tr className="bg-brand-cement border-t border-brand-border">
                          <td
                            colSpan={4}
                            className="px-4 py-2 text-right text-xs font-semibold text-brand-textSecondary"
                          >
                            Subtotal {cap.nombre}
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-bold text-brand-primary tabular-nums">
                            {formatCOP(totCap.subtotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RESUMEN FINAL FLOTANTE ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-border bg-brand-dark/98 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-textSecondary">
                {cantidadItemsConPrecio} de {totalItems} ítems con precio
              </p>
              <p className="text-xs text-brand-textSecondary">
                NSR-10 · Zona sísmica alta · Floridablanca
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-textSecondary uppercase tracking-wider">
                TOTAL PRESUPUESTO
              </p>
              <p className="text-3xl font-bold text-brand-primary tabular-nums">
                {totalGeneral > 0 ? formatCOP(totalGeneral) : "$ —"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
