import type { Lead, ClienteGroup } from "@/lib/types/crm";

const ETAPA_RANK: Record<string, number> = {
  PERDIDO: -1,
  NUEVO: 0,
  CORREO_ENVIADO: 1,
  CITA_AGENDADA: 2,
  EN_SEGUIMIENTO: 3,
  RESERVADO: 3,        // legacy — se normaliza a EN_SEGUIMIENTO en etapaMasAvanzada
  CONTRATO_FIRMADO: 4,
};

function normalizePhone(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, "");
  return digits || null;
}

export function agruparPorCliente(leads: Lead[]): ClienteGroup[] {
  const map = new Map<string, Lead[]>();

  for (const lead of leads) {
    const phone = normalizePhone(lead.cliente_telefono);
    const key = phone ?? lead.cliente_email.toLowerCase().trim();
    if (!key) continue;
    const grupo = map.get(key) ?? [];
    grupo.push(lead);
    map.set(key, grupo);
  }

  const result: ClienteGroup[] = [];

  for (const [key, cotizaciones] of map) {
    // Más reciente primero
    const sorted = [...cotizaciones].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Etapa más avanzada (PERDIDO = -1 para que cualquier etapa activa lo supere)
    let etapaMasAvanzada = "NUEVO";
    let maxRank = -2;
    for (const cot of sorted) {
      const estado = cot.estado_crm || "NUEVO";
      const rank = ETAPA_RANK[estado] ?? 0;
      if (rank > maxRank) {
        maxRank = rank;
        // Normalizar RESERVADO → EN_SEGUIMIENTO
        etapaMasAvanzada = estado === "RESERVADO" ? "EN_SEGUIMIENTO" : estado;
      }
    }

    // Valor más alto entre todas sus cotizaciones
    const valorMax = Math.max(...sorted.map((c) => Number(c.total) || 0));

    result.push({
      key,
      nombre: sorted[0].cliente_nombre,
      telefono: normalizePhone(sorted[0].cliente_telefono),
      email: sorted[0].cliente_email,
      cotizaciones: sorted,
      etapaMasAvanzada,
      valorMax,
    });
  }

  // Grupos ordenados: el más reciente (por su cotización más reciente) primero
  result.sort(
    (a, b) =>
      new Date(b.cotizaciones[0].created_at).getTime() -
      new Date(a.cotizaciones[0].created_at).getTime()
  );

  return result;
}
