import type { NextConfig } from "next";
import path from "node:path";

// Dominio público del bucket de Cloudflare R2 (imágenes de usuario:
// avatares, fotos de perfil, fotos de piso). Puede ser el subdominio
// r2.dev por defecto o un dominio propio conectado al bucket — en ese
// caso, define NEXT_PUBLIC_R2_PUBLIC_HOSTNAME con solo el hostname
// (sin protocolo), ej. "media.coflow.app".
const r2CustomHostname = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Transición nativa (View Transitions API) al entrar/salir de un
    // chat en móvil — ver globals.css (.nav-forward/.nav-back) y
    // frontend/src/app/(app)/mensajes/.
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "*.onrender.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(r2CustomHostname
        ? [{ protocol: "https" as const, hostname: r2CustomHostname }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        // Contiene el token de verificación de email en la query string
        // mientras se procesa: no debe cachearse ni filtrarse por Referer.
        source: "/verificar-email",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
