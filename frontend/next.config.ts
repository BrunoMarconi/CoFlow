import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
