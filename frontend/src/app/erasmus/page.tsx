import type { Metadata } from "next";
import ErasmusLanding from "@/components/landing/ErasmusLanding";

// Esta ruta era un Route Handler que redirigia a / con UTMs de ESN
// (utm_source=esn_malaga, utm_medium=partner, utm_campaign=erasmus_2026).
// En App Router route.ts y page.tsx no pueden convivir en la misma
// carpeta, asi que al convertirla en pagina el redirect desaparece. No se
// pierde medicion: nada del frontend leia esos UTMs — trackProductEvent
// solo envia event_id, session_id, name, path y source — y ahora la propia
// ruta /erasmus identifica la campana en el campo path de cada evento.
export const metadata: Metadata = {
  title: "Compartir piso en tu Erasmus en Málaga",
  description: "Llegas a Málaga de Erasmus y no conoces a nadie. Responde tres preguntas sobre cómo quieres convivir y empieza a encontrar personas compatibles.",
  alternates: { canonical: "/erasmus" },
  openGraph: {
    title: "CoFlow | Tu Erasmus empieza por encontrar a tu gente",
    description: "Conoce cómo vive cada persona antes de compartir piso en Málaga.",
    url: "/erasmus",
    type: "website",
    locale: "es_ES",
    siteName: "CoFlow",
  },
  twitter: { card: "summary_large_image", title: "CoFlow para tu Erasmus en Málaga", description: "Primero las personas. Después, la casa." },
  // Mantener fuera del indice hasta validar el contenido final y el uso del
  // nombre de ESN con el partner. Al aprobarse, se anade tambien al sitemap.
  robots: { index: false, follow: true },
};

export default function ErasmusPage() {
  return <ErasmusLanding />;
}
