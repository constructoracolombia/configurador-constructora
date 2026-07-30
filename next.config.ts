import type { NextConfig } from "next";

// Hostname del proyecto de Supabase (ej. "ngawmyhrfgdckjyynhbr.supabase.co")
// derivado de la URL pública — así next/image puede optimizar las fotos
// subidas a Storage (bucket personalizar-productos) sin hardcodear el ref
// del proyecto acá.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
