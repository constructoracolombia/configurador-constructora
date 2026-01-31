// lib/utils/format.ts
export function formatoPrecio(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  }
  
  export function generarMensajeWhatsApp(params: {
    nombreCliente: string;
    telefono: string;
    proyecto: string;
    planNombre: string;
    planPrecio: number;
    adicionales: Array<{ nombre: string; precio: number }>;
    total: number;
  }): string {
    const { nombreCliente, telefono, proyecto, planNombre, planPrecio, adicionales, total } = params;
    
    let mensaje = `🏗️ *COTIZACIÓN CONSTRUCTORA COLOMBIA*\n\n`;
    mensaje += `📍 *Proyecto:* ${proyecto}\n`;
    mensaje += `📦 *Plan:* ${planNombre}\n`;
    mensaje += `💰 *Valor plan:* ${formatoPrecio(planPrecio)}\n`;
    
    if (adicionales.length > 0) {
      mensaje += `\n✨ *ADICIONALES SELECCIONADOS:*\n`;
      adicionales.forEach((item, index) => {
        mensaje += `${index + 1}. ${item.nombre}: ${formatoPrecio(item.precio)}\n`;
      });
    }
    
    mensaje += `\n💵 *INVERSIÓN TOTAL: ${formatoPrecio(total)}*\n`;
    mensaje += `\n👤 *Cliente:* ${nombreCliente}\n`;
    mensaje += `📱 *Teléfono:* ${telefono}\n`;
    
    return mensaje;
  }
  
  export function enviarWhatsApp(mensaje: string, numeroWhatsApp: string = '573175639674') {
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }