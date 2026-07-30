// Server Component delgado — solo existe para forzar dynamic = "force-dynamic",
// algo que Next.js ignora si se exporta desde un archivo con "use client"
// (el contenido real vive en PersonalizarClient.tsx). Esta página depende
// 100% de datos en vivo (store persistido de cotizador + fetch en
// useEffect a Supabase para precios/nombres/fotos custom) — nada que
// valga la pena prerenderizar/cachear. Sin esto, Vercel sirve un shell
// estático cacheado (ISR) que puede quedar varios minutos desactualizado
// tras un deploy — confirmado con X-Vercel-Cache: HIT y Age > 600s pese
// a deploys recientes.
export const dynamic = "force-dynamic";

import PersonalizarClient from "./PersonalizarClient";

export default function PersonalizarPage() {
  return <PersonalizarClient />;
}
