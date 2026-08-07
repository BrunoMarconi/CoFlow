import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "*.onrender.com" },
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
