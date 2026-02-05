import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { clienteNombre, clienteTelefono, proyecto, numeroCotizacion, pdfUrl } =
      await request.json();

    // Validar datos
    if (!clienteNombre || !clienteTelefono || !proyecto || !pdfUrl) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Limpiar número de teléfono (remover espacios, guiones, etc)
    const telefonoLimpio = clienteTelefono.replace(/\D/g, "");

    // Asegurar que tenga código de país (Colombia +57)
    const telefonoCompleto = telefonoLimpio.startsWith("57")
      ? telefonoLimpio
      : `57${telefonoLimpio}`;

    // Construir mensaje personalizado
    const mensaje = `¡Hola ${clienteNombre}! 👋

Te saluda Jeisson de Constructora Colombia. Vi que acabas de diseñar el presupuesto para tu apto en ${proyecto}. ¡Excelente elección de acabados!

Aquí tienes tu PDF para que lo revises con calma:
🔗 ${pdfUrl}

Te cuento que los precios de los insumos suben próximamente. ¿Quieres que te asegure este presupuesto con los precios actuales y te guarde el cupo de los 7 Bonos VIP? 🏗️💎`;

    // URL de WhatsApp API con el mensaje
    const whatsappUrl = `https://wa.me/${telefonoCompleto}?text=${encodeURIComponent(mensaje)}`;

    // Logging para desarrollo
    console.log("📱 WhatsApp preparado:", {
      telefono: telefonoCompleto,
      mensaje: mensaje.substring(0, 100) + "...",
      numeroCotizacion,
    });

    // Retornar la URL para que el frontend la use
    // En producción, aquí iría la llamada al servicio de WhatsApp Business API
    return NextResponse.json({
      success: true,
      message: "Mensaje preparado",
      whatsappUrl,
      telefonoCompleto,
    });
  } catch (error) {
    console.error("Error preparando WhatsApp:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
