import type { Metadata } from "next";
import OwnersLanding from "@/components/landing/OwnersLanding";
import { ownersFaqs } from "@/components/landing/owners-faqs";

export const metadata: Metadata = {
  title: "Publica tu vivienda gratis en Málaga | Propietarios",
  description: "Publica gratis tu vivienda en Málaga, recibe solicitudes con más contexto y conoce presupuesto y preferencias de convivencia antes de responder.",
  alternates: { canonical: "/para-propietarios" },
  openGraph: {
    title: "CoFlow Propietarios | Alquila con más contexto",
    description: "Publica gratis en Málaga y conoce mejor cada solicitud antes de responder.",
    url: "/para-propietarios",
    type: "website",
    locale: "es_ES",
    siteName: "CoFlow",
  },
  twitter: { card: "summary_large_image", title: "CoFlow para propietarios en Málaga", description: "Publica gratis y valora cada solicitud con más contexto." },
  robots: { index: true, follow: true },
};

export default function OwnersPage() {
  const pageJsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": "https://coflowapp.es/para-propietarios#webpage", url: "https://coflowapp.es/para-propietarios", name: "Publicar vivienda en Málaga para compartir piso", description: metadata.description, inLanguage: "es-ES", isPartOf: { "@id": "https://coflowapp.es/#website" } },
    { "@type": "Service", name: "Publicación de viviendas para compartir en Málaga", provider: { "@id": "https://coflowapp.es/#organization" }, areaServed: { "@type": "City", name: "Málaga" }, url: "https://coflowapp.es/para-propietarios", description: metadata.description },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: "https://coflowapp.es/" }, { "@type": "ListItem", position: 2, name: "Para propietarios", item: "https://coflowapp.es/para-propietarios" }] },
    { "@type": "FAQPage", mainEntity: ownersFaqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <OwnersLanding />
    </>
  );
}
