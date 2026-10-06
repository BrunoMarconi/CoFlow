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
  title: "Find flatmates for your Erasmus in Málaga",
  description: "Coming to Málaga on Erasmus and don't know anyone yet? Answer three questions about how you want to live and start finding compatible people.",
  alternates: { canonical: "/erasmus" },
  openGraph: {
    title: "CoFlow | Your Erasmus starts with finding your people",
    description: "Get to know how each person lives before sharing a flat in Málaga.",
    url: "/erasmus",
    type: "website",
    locale: "en_GB",
    siteName: "CoFlow",
  },
  twitter: { card: "summary_large_image", title: "CoFlow for your Erasmus in Málaga", description: "People first. Then, the home." },
  robots: { index: true, follow: true },
};

export default function ErasmusPage() {
  return <ErasmusLanding />;
}
