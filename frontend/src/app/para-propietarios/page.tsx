import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Home, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Publicar vivienda en Málaga para compartir piso",
  description: "Publica gratis tu vivienda en Málaga y conoce el presupuesto y las preferencias de convivencia de las personas interesadas antes de responder.",
  alternates: { canonical: "/para-propietarios" },
  openGraph: {
    title: "Propietarios CoFlow | Publica tu vivienda en Málaga",
    description: "Conoce perfiles y preferencias de convivencia antes de responder a una solicitud.",
    url: "/para-propietarios",
    type: "website",
    locale: "es_ES",
    siteName: "CoFlow",
    images: [{ url: "https://images.unsplash.com/photo-1641667710644-fb8a6abf2a06?auto=format&fit=crop&q=85&w=1200&h=630", width: 1200, height: 630, alt: "Vista urbana de Málaga" }],
  },
  twitter: { card: "summary_large_image", title: "Publica tu vivienda en Málaga | CoFlow", description: "Conoce presupuesto y preferencias de convivencia antes de responder.", images: ["https://images.unsplash.com/photo-1641667710644-fb8a6abf2a06?auto=format&fit=crop&q=85&w=1200&h=630"] },
  robots: { index: true, follow: true },
};

const benefits = [
  { icon: ShieldCheck, title: "Información antes de responder", text: "Consulta presupuesto y preferencias de convivencia antes de iniciar una conversación." },
  { icon: Users, title: "Solicitudes desde Málaga", text: "CoFlow se encuentra actualmente disponible para viviendas y personas en Málaga." },
  { icon: MessageCircle, title: "Conversación directa", text: "Habla directamente con cada persona y mantén el control de la conversación." },
] as const;

const steps = [
  { title: "Publica tu vivienda", text: "Describe la ubicación, capacidad, condiciones y plazas disponibles." },
  { title: "Recibe solicitudes", text: "Consulta la información que cada persona ha decidido compartir en su perfil." },
  { title: "Habla antes de decidir", text: "Resuelve dudas por mensaje y responde cuando la solicitud tenga sentido para ti." },
] as const;

const faqs = [
  ["¿Publicar una vivienda tiene coste?", "No. La publicación de viviendas en CoFlow es gratuita."],
  ["¿Cómo contacto con las personas interesadas?", "Puedes hablar directamente con ellas mediante la mensajería privada de CoFlow."],
  ["¿Puedo revisar sus preferencias de convivencia?", "Sí. Cada perfil muestra las preferencias que esa persona ha decidido compartir."],
  ["¿En qué ciudades está disponible CoFlow?", "Durante el lanzamiento, CoFlow está disponible en Málaga."],
] as const;

export default function OwnersPage() {
  const pageJsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": "https://coflowapp.es/para-propietarios#webpage", url: "https://coflowapp.es/para-propietarios", name: "Publicar vivienda en Málaga para compartir piso", description: metadata.description, inLanguage: "es-ES", isPartOf: { "@id": "https://coflowapp.es/#website" } },
    { "@type": "Service", name: "Publicación de viviendas para compartir en Málaga", provider: { "@id": "https://coflowapp.es/#organization" }, areaServed: { "@type": "City", name: "Málaga" }, url: "https://coflowapp.es/para-propietarios", description: metadata.description },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: "https://coflowapp.es/" }, { "@type": "ListItem", position: 2, name: "Para propietarios", item: "https://coflowapp.es/para-propietarios" }] },
    { "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] };

  return (
    <main className="min-h-dvh bg-[#f4f4f7] text-[#18251f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <header className="sticky top-0 z-50 border-b border-black/[0.055] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[480px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2"><Logo /><span className="text-[12px] font-semibold">CoFlow</span><span className="rounded-full bg-[#edf1ef] px-2 py-1 text-[7px] uppercase tracking-wider text-[#5c6962]">Propietarios</span></Link>
          <Link href="/register?role=owner" className="rounded-full bg-[#315f4b] px-3.5 py-2 text-[9px] font-semibold text-white">Publicar gratis</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4">
        <section className="pb-7 pt-5">
          <div className="grid grid-cols-2 gap-2"><Link href="/companeros-de-piso" className="ios-muted">Buscar comunidad</Link><Link href="/para-propietarios" className="ios-secondary">Soy propietario</Link></div>
          <div className="mt-4 text-center"><OwnerPill>CoFlow para propietarios</OwnerPill><h1 className="mt-3 text-[34px] font-semibold leading-[0.98] tracking-[-0.055em]">Tu vivienda en calma.<br /><span className="font-normal italic text-[#65716b]">Alquilar con serenidad.</span></h1><p className="mx-auto mt-4 max-w-[390px] text-[11px] leading-[1.55] text-[#727975]">Conoce a las personas interesadas, consulta su presupuesto y preferencias de convivencia y mantén el control antes de responder.</p><Link href="/register?role=owner" className="mx-auto mt-5 flex h-11 max-w-[420px] items-center justify-center rounded-full bg-[#315f4b] text-[10px] font-semibold text-white"><Home className="mr-1.5" size={12} />Publicar vivienda gratis</Link><a href="#como-funciona" className="mx-auto mt-2 flex h-10 max-w-[420px] items-center justify-center rounded-full bg-white text-[9px] font-semibold ring-1 ring-black/5">Cómo funciona <ChevronDown className="ml-1" size={11} /></a><div className="mt-3 flex justify-center gap-4 text-[8px] text-[#7b827e]"><span className="flex items-center gap-1"><Check size={9} />Sin permanencia</span><span className="flex items-center gap-1"><Check size={9} />Sin tarjeta</span></div></div>

          <article className="mt-5 rounded-[22px] bg-white p-2 shadow-[0_12px_34px_rgba(25,45,36,0.07)]">
            <div className="relative aspect-[1.62] overflow-hidden rounded-[17px]"><Image src="https://images.unsplash.com/photo-1641667710644-fb8a6abf2a06?auto=format&fit=crop&q=85&w=1400" alt="Vista urbana de Málaga" fill priority sizes="448px" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" /><span className="absolute left-2.5 top-2.5 rounded-full bg-[#263b32]/80 px-2.5 py-1 text-[8px] text-white backdrop-blur">Vivienda en Málaga</span><span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[8px]">Plazas disponibles</span></div>
            <div className="px-2 pb-2 pt-3"><div className="flex justify-between gap-3"><div><h2 className="text-[13px] font-semibold">Publica tu vivienda en Málaga</h2><p className="mt-1 text-[9px] leading-4 text-[#747b77]">Añade su ubicación, capacidad, condiciones y plazas disponibles.</p></div><span className="h-fit shrink-0 rounded-full bg-[#f1f2f1] px-2 py-1 text-[8px]">Málaga</span></div><div className="mt-2.5 flex flex-wrap gap-1.5"><SmallTag>Publicación gratuita</SmallTag><SmallTag>Contacto directo</SmallTag><SmallTag>Solicitudes</SmallTag></div><div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3"><span className="text-[8px] text-[#8b918e]">Tú decides a quién responder</span><Link href="/register?role=owner" className="rounded-full bg-[#315f4b] px-3 py-2 text-[9px] font-semibold text-white">Publicar ahora</Link></div><p className="mt-2 text-[7px] text-[#a0a5a2]">Foto de <a href="https://unsplash.com/photos/Nx0C3cDKRLw" target="_blank" rel="noreferrer" className="underline">Yuliya Matuzava</a> en Unsplash</p></div>
          </article>
        </section>

        <section className="py-8"><OwnerEyebrow>Más claridad, menos incertidumbre</OwnerEyebrow><OwnerTitle>Conoce la información antes de responder</OwnerTitle><OwnerCopy>Una experiencia diseñada para ayudarte a valorar cada solicitud con más contexto.</OwnerCopy><div className="mt-4 space-y-2">{benefits.map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3 rounded-[17px] bg-white p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef3f0] text-[#315f4b]"><Icon size={14} /></span><div><h3 className="text-[11px] font-semibold">{title}</h3><p className="mt-1 text-[9px] leading-4 text-[#7a817d]">{text}</p></div></div>)}</div></section>

        <section id="como-funciona" className="py-8 text-center"><OwnerEyebrow>Proceso transparente</OwnerEyebrow><OwnerTitle>Tu camino como propietario</OwnerTitle><OwnerCopy center>Del primer contacto a la respuesta, mantienes el control.</OwnerCopy><div className="mt-5 space-y-2 text-left">{steps.map((step, index) => <div key={step.title} className="flex gap-3 rounded-[17px] bg-white p-4"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#315f4b] text-[9px] font-semibold text-white">{index + 1}</span><div><h3 className="text-[11px] font-semibold">{step.title}</h3><p className="mt-1 text-[9px] leading-4 text-[#7a817d]">{step.text}</p></div></div>)}</div></section>

        <section className="py-8"><div className="text-center"><OwnerEyebrow>Transparencia total</OwnerEyebrow><OwnerTitle>¿Por qué CoFlow es diferente?</OwnerTitle></div><div className="mt-4 rounded-[22px] bg-white p-3 shadow-[0_10px_28px_rgba(25,45,36,0.055)]"><div className="rounded-[15px] bg-[#f5f5f6] p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold text-[#67706b]">Anuncio convencional</p><span className="text-[8px] text-[#aa5e5e]">Menos contexto</span></div><p className="mt-2 text-[9px] leading-4 text-[#858b88]">Datos básicos de la vivienda y conversaciones que empiezan sin conocer previamente las preferencias de convivencia.</p></div><div className="mt-2 rounded-[15px] border border-[#8eb7a0] bg-[#f2faf5] p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold">CoFlow</p><span className="rounded-full bg-[#dcefe3] px-2 py-1 text-[8px] text-[#315f4b]">Más información</span></div><div className="mt-2 space-y-1.5 text-[9px] text-[#557062]"><CheckItem>Presupuesto y preferencias antes de responder</CheckItem><CheckItem>Conversación privada y directa</CheckItem><CheckItem>Control sobre cada solicitud</CheckItem></div></div><Link href="/register?role=owner" className="mt-3 flex h-11 items-center justify-center rounded-full bg-[#315f4b] text-[10px] font-semibold text-white">Empezar como propietario <ArrowRight className="ml-1.5" size={12} /></Link></div></section>

        <section className="py-8 text-center"><OwnerEyebrow>Dudas frecuentes</OwnerEyebrow><OwnerTitle>Preguntas de propietarios</OwnerTitle><OwnerCopy center>Claridad antes de empezar.</OwnerCopy><div className="mt-4 space-y-2 text-left">{faqs.map(([question, answer]) => <details key={question} className="group rounded-[15px] bg-white px-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[10px] font-semibold">{question}<ChevronDown size={12} className="shrink-0 transition group-open:rotate-180" /></summary><p className="border-t border-black/5 pb-4 pt-3 text-[9px] leading-4 text-[#747b77]">{answer}</p></details>)}</div></section>

        <section className="py-8"><div className="rounded-[22px] bg-[#203e32] px-5 py-8 text-center text-white"><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/10"><Sparkles size={13} /></span><h2 className="mt-4 text-[21px] font-semibold tracking-[-0.04em]">Pon tu vivienda en manos afines</h2><p className="mx-auto mt-2 max-w-[330px] text-[9px] leading-4 text-white/65">Recibe solicitudes de personas que ya han contado su presupuesto y preferencias de convivencia.</p><Link href="/register?role=owner" className="mx-auto mt-5 flex h-10 max-w-[380px] items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[#203e32]">Publicar mi vivienda gratis</Link><p className="mt-3 text-[8px] text-white/50">Sin tarjeta · Sin permanencia</p></div><div className="mt-4 rounded-[15px] bg-white p-4"><p className="text-[9px] font-semibold">CoFlow está disponible en Málaga</p><div className="mt-2 flex flex-wrap gap-1.5"><SmallTag>Málaga</SmallTag><SmallTag>Teatinos</SmallTag><SmallTag>Centro</SmallTag></div></div></section>
      </div>

      <footer className="mt-5 border-t border-black/5 bg-[#e9efeb] px-4 py-8"><div className="mx-auto max-w-[480px]"><Link href="/" className="inline-flex items-center gap-2"><Logo /><span className="text-[11px] font-semibold">CoFlow</span></Link><p className="mt-2 text-[8px] text-[#7f8782]">Convivir en armonía. Alquilar con serenidad.</p><div className="mt-6 grid grid-cols-2 gap-6"><FooterLinks title="Para inquilinos" links={[["Compañeros de piso en Málaga","/companeros-de-piso"],["Explorar comunidades","/comunidades"],["Crear perfil","/register"]]} /><FooterLinks title="Para propietarios" links={[["Publicar vivienda","/register?role=owner"],["Cómo funciona","#como-funciona"],["Contacto directo","mailto:soporte@coflowapp.es"]]} /></div><div className="mt-6 rounded-full bg-white/75 px-3 py-2 text-center text-[8px] text-[#68716c]">Basado en el respeto mutuo, la afinidad real y la convivencia transparente.</div><p className="mt-6 text-center text-[8px] text-[#929894]">© {new Date().getFullYear()} CoFlow</p></div></footer>
    </main>
  );
}

function OwnerPill({ children }: { children: React.ReactNode }) { return <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.035] px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#65706a]"><Sparkles size={9} />{children}</span>; }
function OwnerEyebrow({ children }: { children: React.ReactNode }) { return <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#69736e]">{children}</p>; }
function OwnerTitle({ children }: { children: React.ReactNode }) { return <h2 className="mt-2 text-[24px] font-semibold leading-[1.04] tracking-[-0.045em]">{children}</h2>; }
function OwnerCopy({ children, center = false }: { children: React.ReactNode; center?: boolean }) { return <p className={`mt-2 max-w-[410px] text-[10px] leading-4 text-[#777e7a] ${center ? "mx-auto" : ""}`}>{children}</p>; }
function SmallTag({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-[#f1f4f1] px-2.5 py-1.5 text-[8px] text-[#4f5d56]">{children}</span>; }
function CheckItem({ children }: { children: React.ReactNode }) { return <p className="flex items-start gap-1.5"><Check className="mt-0.5 shrink-0 text-emerald-600" size={10} />{children}</p>; }
function FooterLinks({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) { return <div><h3 className="text-[8px] font-semibold uppercase tracking-[0.12em]">{title}</h3><div className="mt-3 space-y-2">{links.map(([label, href]) => <Link key={label} href={href} className="block text-[9px] text-[#707874]">{label}</Link>)}</div></div>; }
