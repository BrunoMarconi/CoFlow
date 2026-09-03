import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { seoCities } from "@/lib/seoCities";
import { Check, MessageCircle, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Compañeros de piso en Málaga",
  description:
    "Encuentra compañeros de piso compatibles en Málaga. Compara hábitos, presupuesto y forma de convivir antes de decidir. Regístrate gratis en CoFlow.",
  alternates: {
    canonical: "/companeros-de-piso",
  },
  openGraph: {
    title: "Compañeros de piso en Málaga | CoFlow",
    description:
      "Encuentra compañeros de piso compatibles en Málaga y regístrate gratis.",
    type: "website",
    locale: "es_ES",
    siteName: "CoFlow",
    url: "/companeros-de-piso",
    images: [{ url: "https://images.unsplash.com/photo-1641667710644-fb8a6abf2a06?auto=format&fit=crop&q=85&w=1200&h=630", width: 1200, height: 630, alt: "Vista urbana de Málaga" }],
  },
  twitter: { card: "summary_large_image", title: "Compañeros de piso en Málaga | CoFlow", description: "Encuentra personas compatibles según hábitos, presupuesto y forma de convivir.", images: ["https://images.unsplash.com/photo-1641667710644-fb8a6abf2a06?auto=format&fit=crop&q=85&w=1200&h=630"] },
  robots: { index: true, follow: true },
};

const faqs = [
  ["¿Cómo encontrar compañeros de piso en Málaga?", "En CoFlow puedes crear un perfil, indicar tu presupuesto y preferencias de convivencia y explorar personas y comunidades disponibles en Málaga."],
  ["¿Qué información aparece en los perfiles?", "Cada persona decide qué datos y preferencias comparte públicamente, incluyendo ciudad, presupuesto y hábitos de convivencia."],
  ["¿Puedo hablar antes de unirme a una comunidad?", "Sí. Puedes utilizar la mensajería privada para resolver dudas antes de solicitar una plaza."],
  ["¿Cuánto cuesta crear un perfil?", "Crear un perfil, explorar comunidades y hablar con otras personas no tiene coste dentro de CoFlow."],
] as const;

export default function CompanerosDePisoPage() {
  const pageJsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": "https://coflowapp.es/companeros-de-piso#webpage", url: "https://coflowapp.es/companeros-de-piso", name: "Compañeros de piso en Málaga", description: metadata.description, inLanguage: "es-ES", isPartOf: { "@id": "https://coflowapp.es/#website" } },
    { "@type": "Service", name: "Búsqueda de compañeros de piso en Málaga", provider: { "@id": "https://coflowapp.es/#organization" }, areaServed: { "@type": "City", name: "Málaga" }, url: "https://coflowapp.es/companeros-de-piso", description: metadata.description },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: "https://coflowapp.es/" }, { "@type": "ListItem", position: 2, name: "Compañeros de piso", item: "https://coflowapp.es/companeros-de-piso" }] },
    { "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] };

  return (
    <main className="min-h-dvh overflow-hidden bg-background text-brand-dark">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <Navbar />

      <section className="px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.13em] text-brand-dark shadow-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
            Lanzamiento en Málaga
          </div>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-[-0.04em] text-brand-dark sm:text-5xl">
            Compañeros de piso en Málaga
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
            CoFlow te ayuda a encontrar compañeros de piso compatibles según hábitos, presupuesto y forma de convivir —
            no solo por disponibilidad. Empezamos en Málaga para concentrar personas, comunidades y viviendas reales.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seoCities.map((city, index) => (
            <Link
              key={city.slug}
              href={`/companeros-de-piso/${city.slug}`}
              className="group relative min-h-48 overflow-hidden rounded-[2rem] bg-brand-dark shadow-sm"
            >
              <Image
                src={city.image}
                alt={`Vista de ${city.name}`}
                fill
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="rounded-full border border-white/25 bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                  {city.region}
                </span>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white">
                  Compañeros de piso en {city.name}
                </h2>
              </div>
            </Link>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-7 text-muted">
          CoFlow está concentrando esta primera fase en Málaga. Puedes{" "}
          <Link href="/register" className="font-bold text-primary-dark underline underline-offset-2">
            crear tu perfil gratis
          </Link>{" "}
          y participar en las primeras comunidades de la ciudad.
        </p>

        <section className="mx-auto mt-16 max-w-4xl">
          <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">Convivencia con más contexto</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-brand-dark">Cómo encontrar compañeros de piso compatibles</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">No se trata únicamente de encontrar una habitación disponible. CoFlow permite conocer presupuesto, rutinas y preferencias antes de compartir vivienda.</p></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <SeoCard icon={<Users size={18} />} title="Crea tu perfil">Indica qué buscas y cómo prefieres convivir.</SeoCard>
            <SeoCard icon={<ShieldCheck size={18} />} title="Compara información">Consulta ciudad, presupuesto y hábitos compartidos.</SeoCard>
            <SeoCard icon={<MessageCircle size={18} />} title="Habla antes de decidir">Resuelve dudas mediante una conversación privada.</SeoCard>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-4xl rounded-[2rem] bg-surface-soft p-6 sm:p-10">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-brand-dark">Personas, comunidades y viviendas: ¿qué diferencia hay?</h2>
          <div className="mt-6 space-y-3 text-sm leading-6 text-muted"><SeoCheck><strong className="text-brand-dark">Persona:</strong> un perfil individual con la información y preferencias que decide compartir.</SeoCheck><SeoCheck><strong className="text-brand-dark">Comunidad:</strong> el grupo de personas que vive o va a vivir en una vivienda y puede tener plazas abiertas.</SeoCheck><SeoCheck><strong className="text-brand-dark">Vivienda:</strong> el espacio físico asociado a una comunidad.</SeoCheck></div>
          <p className="mt-6 text-sm leading-7 text-muted">Puedes explorar las opciones disponibles y, cuando encuentres un perfil que encaje, <Link href="/register" className="font-semibold text-brand underline underline-offset-2">crear tu perfil gratuito</Link> para comenzar.</p>
        </section>

        <section className="mx-auto mt-16 max-w-4xl">
          <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">Preguntas frecuentes</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-brand-dark">Compartir piso en Málaga con CoFlow</h2></div>
          <div className="mt-8 space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-line bg-white px-5"><summary className="cursor-pointer list-none py-5 text-sm font-semibold text-brand-dark">{question}</summary><p className="border-t border-line pb-5 pt-4 text-sm leading-6 text-muted">{answer}</p></details>)}</div>
        </section>

        <div className="mx-auto mt-16 max-w-4xl rounded-[2rem] bg-brand-dark px-6 py-10 text-center text-white"><h2 className="text-3xl font-bold tracking-[-0.035em]">Empieza a buscar compañeros de piso en Málaga</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70">Crea tu perfil, descubre personas y comunidades y habla antes de tomar una decisión.</p><Link href="/register" className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-brand-dark">Crear perfil gratis</Link></div>
      </section>

      <Footer />
    </main>
  );
}

function SeoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <article className="rounded-2xl border border-line bg-white p-5"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">{icon}</span><h3 className="mt-4 text-base font-semibold text-brand-dark">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{children}</p></article>; }
function SeoCheck({ children }: { children: React.ReactNode }) { return <p className="flex items-start gap-2"><Check className="mt-1 shrink-0 text-brand" size={14} />{children}</p>; }
