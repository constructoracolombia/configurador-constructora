/**
 * Formatea un valor numérico como precio en pesos colombianos
 * @example formatoPrecio(14900000) // "$14.900.000"
 */
export function formatoPrecio(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}

export interface ParamsMensajeWhatsApp {
  nombreCliente: string;
  telefono: string;
  proyecto: string;
  planNombre: string;
  planPrecio: number;
  adicionales: { nombre: string; precio: number }[];
  total: number;
}

/**
 * Genera mensaje formateado para enviar por WhatsApp con emojis
 */
export function generarMensajeWhatsApp(params: ParamsMensajeWhatsApp): string {
  const { nombreCliente, telefono, proyecto, planNombre, planPrecio, adicionales, total } = params;

  const lineas: string[] = [
    "🏗️ *COTIZACIÓN CONSTRUCTORA COLOMBIA*",
    "",
    "📍 Proyecto: " + proyecto,
    "📦 Plan: " + planNombre,
    "💰 Valor plan: " + formatoPrecio(planPrecio)
  ];

  if (adicionales.length > 0) {
    lineas.push("", "✨ ADICIONALES:");
    adicionales.forEach((item) => {
      lineas.push(`   • ${item.nombre}: ${formatoPrecio(item.precio)}`);
    });
  }

  lineas.push(
    "",
    "💵 INVERSIÓN TOTAL: " + formatoPrecio(total),
    "",
    "👤 Cliente: " + nombreCliente,
    "📱 Teléfono: " + telefono
  );

  return lineas.join("\n");
}

/**
 * Abre WhatsApp en nueva ventana con el mensaje prellenado
 */
export function enviarWhatsApp(mensaje: string, numeroWhatsApp: string = "573001234567"): void {
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
