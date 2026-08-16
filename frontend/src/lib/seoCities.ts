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
  {
    slug: "madrid",
    name: "Madrid",
    region: "Comunidad de Madrid",
    image: "/images/cities/madrid.webp",
    intro:
      "Madrid tiene un mercado de piso compartido grande y muy variado entre barrios, lo que hace fácil encontrar candidatos pero difícil saber con quién encajarás de verdad. CoFlow te ayuda a comparar hábitos y presupuesto antes de mudarte, no después.",
    metaDescription:
      "Busca compañero de piso en Madrid con CoFlow. Descubre personas y comunidades compatibles por hábitos y presupuesto antes de decidir. Gratis.",
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    region: "Cataluña",
    image: "/images/cities/barcelona.webp",
    intro:
      "Compartir piso en Barcelona suele significar convivir con gente de perfiles muy distintos. Ver de antemano cómo organiza la limpieza, las visitas o los gastos cada persona ayuda a evitar sorpresas una vez ya has firmado el contrato.",
    metaDescription:
      "Compartir piso en Barcelona nunca fue tan claro. Conoce hábitos, presupuesto y preferencias de convivencia antes de decidir con CoFlow.",
  },
  {
    slug: "valencia",
    name: "Valencia",
    region: "Comunidad Valenciana",
    image: "/images/cities/valencia.webp",
    intro:
      "En Valencia buena parte de la demanda de piso compartido viene de estudiantes y jóvenes profesionales cerca de las universidades y las zonas de trabajo. CoFlow te deja ver el perfil de convivencia de cada persona antes de escribirle.",
    metaDescription:
      "Encuentra compañeros de piso en Valencia compatibles contigo. Conoce sus hábitos y presupuesto antes de decidir. Crea tu perfil gratis en CoFlow.",
  },
  {
    slug: "sevilla",
    name: "Sevilla",
    region: "Andalucía",
    image: "/images/cities/sevilla.webp",
    intro:
      "Sevilla combina zonas muy tranquilas con otras de ambiente animado, y el tipo de convivencia que buscas cambia mucho según cuál elijas. Antes de solicitar una plaza, en CoFlow puedes comprobar si el ritmo de vida de esa comunidad encaja con el tuyo.",
    metaDescription:
      "Busca compañero de piso en Sevilla con CoFlow. Compara ambiente, presupuesto y hábitos de convivencia antes de decidir. Regístrate gratis.",
  },
  {
    slug: "granada",
    name: "Granada",
    region: "Andalucía",
    image: "/images/cities/granada.webp",
    intro:
      "Granada tiene una población muy joven y una alta rotación de estudiantes buscando piso cada curso. Conocer el estilo de convivencia de una comunidad antes de unirte ahorra malentendidos que, en una ciudad tan universitaria, se repiten cada septiembre.",
    metaDescription:
      "Encuentra compañeros de piso en Granada afines a ti. Compara hábitos, presupuesto y forma de convivir antes de decidir con CoFlow. Gratis.",
  },
];

export function getSeoCity(slug: string): SeoCity | undefined {
  return seoCities.find((city) => city.slug === slug);
}
