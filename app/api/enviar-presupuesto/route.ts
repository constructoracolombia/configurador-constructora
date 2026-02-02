import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Inicializar Resend solo si hay API key (evita error en build sin .env)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    const {
      clienteNombre,
      clienteEmail,
      numeroCotizacion,
      proyecto,
      total,
      pdfUrl,
    } = await request.json();

    // Validar datos
    if (!clienteEmail || !clienteNombre) {
      return NextResponse.json(
        { error: "Faltan datos del cliente" },
        { status: 400 }
      );
    }

    const whatsappText = encodeURIComponent(
      `Hola, recibí mi cotización ${numeroCotizacion} y quiero más información`
    );

    // Crear HTML del email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Presupuesto de Remodelación</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header dorado -->
          <tr>
            <td style="background: linear-gradient(135deg, #FFB800 0%, #FFA000 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">
                CONSTRUCTORA COLOMBIA
              </h1>
              <p style="margin: 10px 0 0; color: #000000; font-size: 14px;">
                Tu hogar soñado está a un paso de ser realidad
              </p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1F2937; font-size: 24px;">
                ¡Hola ${clienteNombre}! 👋
              </h2>
              
              <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">
                Gracias por confiar en <strong>Constructora Colombia</strong> para tu proyecto de remodelación.
              </p>

              <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hemos preparado tu cotización personalizada con todos los detalles de tu proyecto en <strong>${proyecto}</strong>.
              </p>

              <!-- Caja de información -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #6B7280; font-size: 14px;">
                      <strong style="color: #1F2937;">Cotización:</strong> ${numeroCotizacion}
                    </p>
                    <p style="margin: 0 0 10px; color: #6B7280; font-size: 14px;">
                      <strong style="color: #1F2937;">Proyecto:</strong> ${proyecto}
                    </p>
                    <p style="margin: 0; color: #6B7280; font-size: 14px;">
                      <strong style="color: #1F2937;">Inversión Total:</strong> <span style="color: #FFB800; font-size: 18px; font-weight: bold;">${total}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Botón de descarga -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <a href="${pdfUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #FFB800 0%, #FFA000 100%); color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 184, 0, 0.3);">
                      📄 VER PRESUPUESTO COMPLETO
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Próximos pasos -->
              <div style="background-color: #FFFBEB; border-left: 4px solid #FFB800; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                <h3 style="margin: 0 0 12px; color: #92400E; font-size: 16px;">
                  🎯 Próximos Pasos:
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #92400E; font-size: 14px; line-height: 1.8;">
                  <li>Revisa el presupuesto detallado adjunto</li>
                  <li><strong>Reserva tu cupo</strong> por $500.000 y congela el precio actual</li>
                  <li>O agenda una reunión virtual gratuita para aclarar dudas</li>
                </ol>
              </div>

              <!-- Beneficios de reservar ahora -->
              <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                <h3 style="margin: 0 0 12px; color: #065F46; font-size: 16px;">
                  ✨ Beneficios de Reservar Hoy:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #065F46; font-size: 14px; line-height: 1.8;">
                  <li>Precio congelado (protección contra inflación)</li>
                  <li>Fecha de inicio garantizada este mes</li>
                  <li>Flexibilidad para ajustar acabados después</li>
                  <li>Solo quedan 3 cupos disponibles</li>
                </ul>
              </div>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Cualquier duda, estamos disponibles por WhatsApp o puedes agendar una reunión virtual gratuita.
              </p>

              <!-- Botones de contacto -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px;">
                    <a href="https://wa.me/573175639674?text=${whatsappText}" 
                       style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 5px;">
                      💬 Contactar por WhatsApp
                    </a>
                    <a href="https://calendly.com/contacto-constructoracolombia/30min" 
                       style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 5px;">
                      📅 Agendar Reunión Virtual
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1F2937; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #9CA3AF; font-size: 14px;">
                <strong style="color: #FFB800;">CONSTRUCTORA COLOMBIA</strong>
              </p>
              <p style="margin: 0 0 5px; color: #9CA3AF; font-size: 13px;">
                📱 +57 317 563 9674
              </p>
              <p style="margin: 0 0 5px; color: #9CA3AF; font-size: 13px;">
                📧 contacto@constructoracolombia.com
              </p>
              <p style="margin: 0 0 15px; color: #9CA3AF; font-size: 13px;">
                🌐 www.constructoracolombia.com
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 12px; font-style: italic;">
                Más que una constructora, un aliado para tu hogar
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Verificar que Resend esté configurado
    if (!resend) {
      return NextResponse.json(
        {
          error:
            "Servicio de email no configurado. Agregue RESEND_API_KEY a las variables de entorno.",
        },
        { status: 503 }
      );
    }

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: "Constructora Colombia <contacto@constructoracolombia.com>",
      to: [clienteEmail],
      subject: `✨ Tu Presupuesto Personalizado - ${proyecto} | ${numeroCotizacion}`,
      html: htmlContent,
      replyTo: "contacto@constructoracolombia.com",
    });

    if (error) {
      console.error("Error enviando email:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error("Error en API route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
