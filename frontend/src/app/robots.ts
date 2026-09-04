import type { MetadataRoute } from "next";

const APP_URL = "https://coflowapp.es";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/register", "/verificacion-pendiente", "/verificar-email", "/mensajes", "/notificaciones", "/perfil", "/onboarding", "/propietarios/"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
