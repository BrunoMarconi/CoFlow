import type { Metadata } from "next";
import ReferenceLanding from "@/components/landing/ReferenceLanding";

export const metadata: Metadata = {
  title: "Compañeros de piso compatibles en Málaga",
  description: "Encuentra compañeros de piso y comunidades en Málaga según hábitos, presupuesto y preferencias de convivencia. Crea tu perfil gratis en CoFlow.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CoFlow | Encuentra una convivencia que encaje contigo",
    description: "Conoce hábitos, presupuesto y preferencias antes de compartir piso en Málaga.",
    url: "/",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoFlow | Compañeros de piso compatibles en Málaga",
    description: "Conoce cómo se vive antes de decidir dónde vivir.",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": "https://coflowapp.es/#webpage", url: "https://coflowapp.es/", name: "Compañeros de piso compatibles en Málaga | CoFlow", description: "Encuentra compañeros de piso y comunidades en Málaga según hábitos, presupuesto y preferencias de convivencia.", inLanguage: "es-ES", isPartOf: { "@id": "https://coflowapp.es/#website" } },
      { "@type": "Service", name: "CoFlow", serviceType: "Plataforma para encontrar compañeros de piso compatibles", areaServed: { "@type": "City", name: "Málaga" }, provider: { "@id": "https://coflowapp.es/#organization" }, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" } },
    ],
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><ReferenceLanding /></>;
}
