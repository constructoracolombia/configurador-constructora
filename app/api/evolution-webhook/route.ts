import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

type ClienteInfo = {
  nombre?: string;
  telefono?: string;
};

async function generarRespuesta(mensaje: string, cliente: ClienteInfo) {
  const mensajeLower = mensaje.toLowerCase();

  if (
    mensajeLower.includes("hola") ||
    mensajeLower.includes("buenos") ||
    mensajeLower.includes("buenas") ||
    mensajeLower.includes("menu") ||
    mensajeLower.includes("menú")
  ) {
    return `¡Hola ${cliente.nombre || ""}! 👋

Soy el asistente virtual de *Constructora Colombia*.

¿En qué te puedo ayudar?

*1️⃣* Ver presupuesto personalizado
*2️⃣* Agendar reunión con asesor
*3️⃣* Información de proyectos
*4️⃣* Formas de pago

Escribe el número o tu pregunta directamente.`;
  }

  if (
    mensajeLower.includes("presupuesto") ||
    mensajeLower.includes("cotizacion") ||
    mensajeLower.includes("cotización") ||
    mensajeLower === "1"
  ) {
    return `*💰 PRESUPUESTO PERSONALIZADO*

Arma tu remodelación en 5 minutos:
👉 https://ppto.constructoracolombia.com

*Proceso simple:*
✅ Eliges tu proyecto
✅ Personalizas acabados
✅ Recibes PDF gratis al instante

El presupuesto se envía a tu email y WhatsApp.

¿Tienes alguna duda?`;
  }

  if (
    mensajeLower.includes("agendar") ||
    mensajeLower.includes("reunion") ||
    mensajeLower.includes("reunión") ||
    mensajeLower.includes("cita") ||
    mensajeLower === "2"
  ) {
    return `*📅 AGENDAR REUNIÓN*

Agenda tu asesoría gratuita aquí:
👉 https://calendly.com/contacto-constructoracolombia/30min

*Modalidad:*
📍 Presencial o virtual
⏱ 30 minutos
🎯 Sin compromiso
💡 Asesoría profesional

¿Quieres que te comparta info adicional?`;
  }

  if (
    mensajeLower.includes("proyecto") ||
    mensajeLower.includes("ciudadela") ||
    mensajeLower.includes("parque") ||
    mensajeLower === "3"
  ) {
    return `*🏗️ PROYECTOS DONDE TRABAJAMOS*

Especializados en VIS Bucaramanga y alrededores:

🔹 Ciudadela Verde
🔹 Parque Oriente
🔹 Beltramonto
🔹 Azafrán
🔹 Fiore
🔹 Fontana de la Sierra

Y muchos más...

¿En cuál está tu apartamento?`;
  }

  if (
    mensajeLower.includes("pago") ||
    mensajeLower.includes("financiacion") ||
    mensajeLower.includes("financiación") ||
    mensajeLower.includes("cuotas") ||
    mensajeLower === "4"
  ) {
    return `*💳 FORMA DE PAGO*

Estructura flexible:

*1️⃣* 45% Anticipo (al firmar)
*2️⃣* 30% Semana 3 (avance)
*3️⃣* 20% Semana 5 (pre-entrega)
*4️⃣* 5% Final (entrega)

También manejamos:
✅ Convenios bancarios
✅ Crédito libre inversión
✅ Facilidades de pago

¿Necesitas más información?`;
  }

  if (
    mensajeLower.includes("cuanto") ||
    mensajeLower.includes("cuánto") ||
    mensajeLower.includes("precio") ||
    mensajeLower.includes("costo")
  ) {
    return `*💎 RANGOS DE INVERSIÓN*

*Plan Básico:*
$18M - $25M
Remodelación completa

*Plan Intermedio Plus:*
$25M - $50M
Con acabados premium

*Incluye:*
✅ Mano de obra certificada
✅ Materiales de calidad
✅ Garantía 1 año
✅ Supervisión profesional

¿Quieres un presupuesto exacto para tu caso?

Hazlo aquí: https://ppto.constructoracolombia.com`;
  }

  if (
    mensajeLower.includes("tiempo") ||
    mensajeLower.includes("demora") ||
    mensajeLower.includes("entrega") ||
    mensajeLower.includes("cuanto tarda") ||
    mensajeLower.includes("cuánto tarda")
  ) {
    return `*⏱ TIEMPOS DE ENTREGA*

*Plan Básico:*
6 semanas (42 días hábiles)

*Plan Intermedio Plus:*
8 semanas (56 días hábiles)

Trabajamos de lunes a sábado.

*Ventaja:* Precio congelado desde que firmas.

¿Tienes fecha límite específica?`;
  }

  if (mensajeLower.includes("garantia") || mensajeLower.includes("garantía")) {
    return `*🛡️ GARANTÍAS*

✅ 1 año en acabados
✅ 6 meses en pintura
✅ Supervisión técnica permanente
✅ Materiales certificados

Además:
📋 Contrato legal
🏗️ Personal certificado
📸 Evidencia fotográfica
✅ Recibo conforme

Tu tranquilidad es nuestra prioridad.`;
  }

  return `Disculpa, no entendí bien.

Puedo ayudarte con:

*1️⃣* Presupuesto personalizado
*2️⃣* Agendar reunión
*3️⃣* Info de proyectos
*4️⃣* Formas de pago

O pregúntame directamente sobre:
💰 Precios
⏱ Tiempos
🏗️ Proyectos
💳 Financiación

Escribe "menú" para ver opciones.`;
}

async function enviarMensaje(telefono: string, mensaje: string) {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    throw new Error("Faltan variables EVOLUTION_API_URL/API_KEY/INSTANCE");
  }

  const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: telefono,
      text: mensaje,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error enviando mensaje: ${response.status}`);
  }

  return response.json();
}

function parseIncoming(body: any) {
  const event = body?.event;
  const normalizedEvent = typeof event === "string" ? event.toLowerCase() : "";

  if (normalizedEvent !== "messages.upsert" && normalizedEvent !== "messages_upsert") {
    return { shouldProcess: false as const };
  }

  const payload = body?.data;
  const firstMessage = Array.isArray(payload?.messages)
    ? payload.messages[0]
    : payload;

  if (!firstMessage) {
    return { shouldProcess: false as const };
  }

  if (firstMessage?.key?.fromMe) {
    return { shouldProcess: false as const, reason: "own_message" as const };
  }

  const remoteJid = firstMessage?.key?.remoteJid || "";
  const telefono = String(remoteJid).replace("@s.whatsapp.net", "");
  const contenido =
    firstMessage?.message?.conversation ||
    firstMessage?.message?.extendedTextMessage?.text ||
    firstMessage?.message?.imageMessage?.caption ||
    "";
  const nombreContacto =
    payload?.pushName || firstMessage?.pushName || firstMessage?.notifyName || "Cliente";

  if (!telefono || !contenido) {
    return { shouldProcess: false as const, reason: "missing_fields" as const };
  }

  return {
    shouldProcess: true as const,
    telefono,
    contenido: String(contenido),
    nombreContacto: String(nombreContacto),
    rawMessage: firstMessage,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📱 Evolution webhook recibido:", JSON.stringify(body, null, 2));

    const parsed = parseIncoming(body);
    if (!parsed.shouldProcess) {
      return NextResponse.json({
        status: "ignored",
        reason: "reason" in parsed ? parsed.reason : "event_not_supported",
      });
    }

    const { telefono, contenido, nombreContacto, rawMessage } = parsed;
    const cliente = { nombre: nombreContacto, telefono };

    console.log("👤 De:", nombreContacto, telefono);
    console.log("💬 Mensaje:", contenido);

    let conversacionId: string | null = null;

    if (supabase) {
      const contextInfo = rawMessage?.message?.extendedTextMessage?.contextInfo;
      const quotedAd = contextInfo?.quotedAd;
      let utmParams = {
        utm_source: null as string | null,
        utm_medium: null as string | null,
        utm_campaign: null as string | null,
        utm_content: null as string | null,
      };

      if (quotedAd) {
        utmParams = {
          utm_source: quotedAd.utm_source || "whatsapp",
          utm_medium: quotedAd.utm_medium || "paid",
          utm_campaign: quotedAd.utm_campaign || null,
          utm_content: quotedAd.utm_content || null,
        };
      }

      const { count } = await supabase
        .from("conversaciones_whatsapp")
        .select("id", { count: "exact", head: true })
        .eq("telefono", telefono);
      const esPrimerMensaje = (count || 0) === 0;

      const { data: conversacion, error: convError } = await supabase
        .from("conversaciones_whatsapp")
        .insert({
          telefono,
          nombre: nombreContacto,
          mensaje_cliente: contenido,
          fuente: "whatsapp_evolution",
          leido: false,
          utm_source: esPrimerMensaje ? utmParams.utm_source : null,
          utm_medium: esPrimerMensaje ? utmParams.utm_medium : null,
          utm_campaign: esPrimerMensaje ? utmParams.utm_campaign : null,
          utm_content: esPrimerMensaje ? utmParams.utm_content : null,
        })
        .select("id")
        .single();

      if (convError) {
        console.error("Error guardando conversación:", convError);
      } else {
        conversacionId = conversacion?.id ?? null;
      }
    } else {
      console.warn("Supabase no configurado para webhook.");
    }

    const respuesta = await generarRespuesta(contenido, cliente);
    await enviarMensaje(telefono, respuesta);

    if (supabase && conversacionId) {
      await supabase
        .from("conversaciones_whatsapp")
        .update({
          mensaje_bot: respuesta,
          respondido_at: new Date().toISOString(),
        })
        .eq("id", conversacionId);
    }

    const mensajeLower = contenido.toLowerCase();
    if (
      supabase &&
      (mensajeLower.includes("urgente") ||
        mensajeLower.includes("llamar") ||
        mensajeLower.includes("precio final") ||
        mensajeLower.includes("contratar") ||
        mensajeLower.includes("firmar"))
    ) {
      await supabase.from("notificaciones_admin").insert({
        tipo: "WHATSAPP_IMPORTANTE",
        cliente_nombre: nombreContacto,
        cliente_telefono: telefono,
        mensaje: `💬 Mensaje importante: "${contenido}"`,
        leido: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Mensaje procesado",
    });
  } catch (error) {
    console.error("❌ Error en evolution-webhook:", error);
    return NextResponse.json(
      { error: "Error procesando mensaje" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Evolution API webhook funcionando",
    timestamp: new Date().toISOString(),
  });
}
