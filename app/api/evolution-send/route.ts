import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { telefono, mensaje } = await request.json();

    if (!telefono || !mensaje) {
      return NextResponse.json(
        { error: "telefono y mensaje son requeridos" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.EVOLUTION_API_URL;
    const instance = process.env.EVOLUTION_INSTANCE;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrl || !instance || !apiKey) {
      return NextResponse.json(
        { error: "Variables de Evolution API no configuradas" },
        { status: 500 }
      );
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
      throw new Error(`Error: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    return NextResponse.json({ error: "Error enviando mensaje" }, { status: 500 });
  }
}
