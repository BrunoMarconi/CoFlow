/* Ciudades con página SEO propia bajo /companeros-de-piso/[ciudad].
 *
 * Lista cerrada a propósito (no generada desde datos dinámicos): hoy
 * no existe ningún endpoint público sin autenticación que permita
 * filtrar personas/comunidades por ciudad (tanto GET /users/public
 * como GET /communities exigen JWT), así que estas páginas no pueden
 * mostrar listados reales todavía. Para no indexar contenido vacío o
 * "programáticamente generado" sin valor (mala práctica de SEO y
 * contraria a las directrices de Google), se limita a las ciudades que
 * ya trata como principales el propio producto (mismo conjunto que
 * frontend/src/components/landing/content.ts → cities).
 *
 * Cuando exista un endpoint público de agregados por ciudad, este
 * archivo es el único sitio que hay que tocar para añadir una ciudad
 * nueva — generateStaticParams en [ciudad]/page.tsx ya itera esta
 * lista automáticamente.
 */
export interface SeoCity {
  slug: string;
  name: string;
  region: string;
  image: string;
  /** Una frase distinta por ciudad (no plantilla con el nombre
   * sustituido) para que cada página tenga contenido realmente único,
   * no solo el H1/title cambiados. */
  intro: string;
  metaDescription: string;
}

export const seoCities: SeoCity[] = [
  {
    slug: "malaga",
    name: "Málaga",
    region: "Andalucía",
    image: "/images/cities/malaga.webp",
    intro:
      "En Málaga la demanda de piso compartido se concentra en Teatinos y el centro, cerca de la universidad y de las zonas con más vida. Encontrar a alguien con quien encajar de verdad marca la diferencia entre una convivencia tranquila y un curso entero de fricciones.",
    metaDescription:
      "Encuentra compañeros de piso compatibles en Málaga. Compara hábitos, presupuesto y forma de convivir antes de decidir. Regístrate gratis en CoFlow.",
  },
];

export function getSeoCity(slug: string): SeoCity | undefined {
  return seoCities.find((city) => city.slug === slug);
}
