import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityLandingPage from "@/components/seo/CityLandingPage";
import { getSeoCity, seoCities } from "@/lib/seoCities";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* Genera en build solo las ciudades de seoCities (SSG) — cualquier
 * otro slug (ej. /companeros-de-piso/no-existe) sirve un 404 real vía
 * notFound(), nunca una página "vacía" indexable. Deja el sitio
 * preparado para crecer: añadir una ciudad nueva a seoCities.ts es
 * suficiente, no hay que tocar esta página. */
export function generateStaticParams() {
  return seoCities.map((city) => ({ ciudad: city.slug }));
}

// Lista cerrada: cualquier slug fuera de generateStaticParams debe
// devolver un 404 real e inmediato (sin intentar renderizar ni cachear
// nada dinámicamente). Sin esto, Next sirve el contenido de "no
// encontrado" con status 200 — un soft-404 que confunde a Google.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ciudad: string }>;
}): Promise<Metadata> {
  const { ciudad } = await params;
  const city = getSeoCity(ciudad);

  if (!city) return {};

  const title = `Compañeros de piso en ${city.name}`;
  const path = `/companeros-de-piso/${city.slug}`;

  return {
    title,
    description: city.metaDescription,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${title} | CoFlow`,
      description: city.metaDescription,
      type: "website",
      locale: "es_ES",
      siteName: "CoFlow",
      url: path,
      images: [{ url: city.image, width: 1200, height: 900, alt: `Vista de ${city.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | CoFlow`,
      description: city.metaDescription,
      images: [city.image],
    },
  };
}

export default async function CiudadPage({
  params,
}: {
  params: Promise<{ ciudad: string }>;
}) {
  const { ciudad } = await params;
  const city = getSeoCity(ciudad);

  if (!city) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "CoFlow", item: APP_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Compañeros de piso",
        item: `${APP_URL}/companeros-de-piso`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: city.name,
        item: `${APP_URL}/companeros-de-piso/${city.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CityLandingPage city={city} />
    </>
  );
}
