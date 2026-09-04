"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, CircleCheck, HeartHandshake, Home, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import Logo from "@/components/ui/Logo";

const benefits = [
  { icon: ShieldCheck, title: "Información antes de responder", text: "Consulta presupuesto y preferencias de convivencia antes de iniciar una conversación.", link: "Conoce la información disponible" },
  { icon: Users, title: "Solicitudes desde Málaga", text: "CoFlow está disponible actualmente para viviendas y personas en Málaga.", link: "Ver comunidades activas" },
  { icon: MessageCircle, title: "Conversación directa", text: "Habla con cada persona y mantén el control de la conversación.", link: "Descubrir cómo funciona" },
] as const;

const steps = [
  { number: "01", label: "Publicación", title: "Publica tu vivienda", text: "Describe la ubicación, capacidad, condiciones y plazas disponibles.", note: "Información clara desde el inicio" },
  { number: "02", label: "Solicitudes", title: "Conoce cada perfil", text: "Consulta la información que cada persona ha decidido compartir.", note: "Contexto antes de responder" },
  { number: "03", label: "Conversación", title: "Habla antes de decidir", text: "Resuelve dudas por mensaje y responde cuando tenga sentido para ti.", note: "Tú mantienes el control" },
] as const;

const faqs = [
  ["¿Publicar una vivienda tiene coste?", "No. La publicación de viviendas en CoFlow es gratuita."],
  ["¿Cómo contacto con las personas interesadas?", "Puedes hablar directamente con ellas mediante la mensajería privada de CoFlow."],
  ["¿Puedo revisar sus preferencias de convivencia?", "Sí. Cada perfil muestra las preferencias que esa persona ha decidido compartir."],
  ["¿En qué ciudades está disponible CoFlow?", "Durante el lanzamiento, CoFlow está disponible en Málaga."],
] as const;

export default function DesktopOwnersLanding() {
  return (
    <div className="hidden bg-[#f3f8f6] text-[#17251f] lg:block">
      <header className="sticky top-0 z-50 border-b border-[#dfe9e4] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-8 px-10 xl:px-14">
          <Link href="/" className="mr-2 flex items-center gap-2.5" aria-label="CoFlow, inicio"><Logo /><span className="text-[17px] font-semibold">CoFlow</span></Link>
          <nav className="flex flex-1 items-center gap-2 text-[13px] text-[#52605a]" aria-label="Navegación principal">
            <Link className="rounded-full px-4 py-2.5 font-medium transition hover:bg-[#f2f5f3]" href="/">Para inquilinos</Link>
            <Link className="rounded-full px-4 py-2.5 transition hover:bg-[#f2f5f3]" href="/comunidades">Explorar comunidades</Link>
            <Link className="rounded-full bg-[#eef4f1] px-4 py-2.5 font-medium text-[#18382c]" href="/para-propietarios">Para propietarios</Link>
            <Link className="rounded-full px-4 py-2.5 transition hover:bg-[#f2f5f3]" href="#como-funciona">Cómo funciona</Link>
            <Link className="rounded-full px-4 py-2.5 transition hover:bg-[#f2f5f3]" href="#preguntas">Preguntas frecuentes</Link>
          </nav>
          <div className="flex items-center gap-3 text-[13px] font-medium"><Link className="px-3 py-2" href="/login">Iniciar sesión</Link><Link data-apple-magnetic className="apple-magnetic rounded-full bg-[#315f4b] px-5 py-3 text-white shadow-[0_8px_20px_rgba(49,95,75,.18)]" href="/register?role=owner">Publicar gratis</Link></div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#e3e7df] bg-[radial-gradient(circle_at_78%_16%,rgba(224,207,179,.38),transparent_34%),linear-gradient(180deg,#fffdfa_0%,#f5f4ee_100%)]">
        <div className="mx-auto grid min-h-[680px] max-w-[1440px] grid-cols-[.92fr_1.08fr] items-center gap-16 px-10 py-16 xl:px-14">
          <div className="max-w-[690px]">
            <Eyebrow>CoFlow para propietarios en Málaga</Eyebrow>
            <h1 className="mt-6 text-[clamp(60px,5.2vw,84px)] font-semibold leading-[.92] tracking-[-.065em]">Tu vivienda merece<br /><span className="font-normal text-[#758079]">una buena convivencia.</span></h1>
            <p className="mt-7 max-w-[610px] text-[18px] leading-8 text-[#64716b]">Publica gratis y recibe solicitudes con más contexto: presupuesto, hábitos y preferencias antes de empezar la conversación.</p>
            <div className="mt-7 flex gap-3"><Link className="rounded-full bg-[#315f4b] px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_9px_22px_rgba(49,95,75,.2)] transition hover:-translate-y-0.5" href="/register?role=owner"><Home className="mr-2 inline" size={14} />Publicar vivienda gratis</Link><a className="rounded-full bg-white px-6 py-3.5 text-[14px] font-semibold shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5" href="#como-funciona">Cómo funciona</a></div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-[12px] text-[#68766f]"><span className="flex items-center gap-2"><CircleCheck size={14} /> Publicación gratuita</span><span className="flex items-center gap-2"><ShieldCheck size={14} /> Sin tarjeta</span><span className="flex items-center gap-2"><HeartHandshake size={14} /> Tú decides a quién responder</span></div>
          </div>

          <article data-apple-tilt className="apple-tilt ml-auto w-full max-w-[650px] overflow-hidden rounded-[38px] border border-white/80 bg-white/85 p-3 shadow-[0_34px_90px_rgba(60,53,38,.16)] backdrop-blur">
            <div className="relative aspect-[1.45] overflow-hidden rounded-[29px]"><Image src="/images/owners-malaga-apartment-v2.png" alt="Salón luminoso de una vivienda en Málaga" fill priority sizes="650px" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" /><span className="absolute left-4 top-4 rounded-full bg-[#244638]/85 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur">Vivienda en Málaga</span><span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium backdrop-blur">Publicación gratuita</span><div className="absolute bottom-5 left-5 text-white"><p className="text-[11px] uppercase tracking-[.14em]">Más contexto desde el primer contacto</p><h2 className="mt-1 text-[28px] font-semibold tracking-[-.04em]">Decide a quién quieres responder</h2></div></div>
            <div className="p-4"><p className="text-[13px] leading-5 text-[#68736e]">Añade ubicación, capacidad, condiciones y plazas disponibles.</p><div className="mt-4 flex items-center justify-between gap-4"><div className="flex flex-wrap gap-2"><Chip>Publicación gratuita</Chip><Chip>Contacto directo</Chip><Chip>Solicitudes</Chip></div><Link className="flex shrink-0 items-center gap-1 rounded-full bg-[#315f4b] px-5 py-3 text-[13px] font-semibold text-white" href="/register?role=owner">Publicar ahora <ArrowRight size={13} /></Link></div></div>
          </article>
        </div>
      </section>

      <section className="border-b border-[#e1ebe6] bg-[#edf5f2]">
        <div className="mx-auto max-w-[1440px] px-10 py-20 xl:px-14">
          <div className="grid grid-cols-2 items-end gap-16"><div><Eyebrow>Más claridad, menos incertidumbre</Eyebrow><h2 className="mt-3 text-[36px] font-semibold tracking-[-.045em]">Conoce la información antes de responder</h2></div><p className="ml-auto max-w-[510px] text-[16px] leading-7 text-[#64716b]">Una experiencia diseñada para ayudarte a valorar cada solicitud con más contexto y sin perder el control.</p></div>
          <div className="mt-10 grid grid-cols-3 gap-5">{benefits.map(({ icon: Icon, title, text, link }) => <article key={title} className="group rounded-[28px] bg-white p-7 shadow-[0_10px_30px_rgba(31,58,47,.055)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(31,58,47,.1)]"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ee] text-[#315f4b]"><Icon size={18} /></span><h3 className="mt-6 text-[19px] font-semibold">{title}</h3><p className="mt-3 min-h-14 text-[14px] leading-6 text-[#6b7771]">{text}</p><p className="mt-6 flex items-center gap-1.5 text-[12px] font-semibold text-[#315f4b]">{link} <ArrowRight size={12} /></p></article>)}</div>
        </div>
      </section>

      <section id="como-funciona" className="border-b border-[#e1ebe6] bg-[#f8fbfa]">
        <div className="mx-auto max-w-[1440px] px-10 py-20 xl:px-14"><div className="text-center"><Eyebrow>Proceso transparente</Eyebrow><h2 className="mt-3 text-[36px] font-semibold tracking-[-.045em]">Tu camino como propietario</h2><p className="mx-auto mt-3 max-w-[650px] text-[14px] leading-6 text-[#6c7872]">Del primer anuncio a la conversación, mantienes el control.</p></div><div className="mt-11 grid grid-cols-3 gap-5">{steps.map(step => <article key={step.number} className="rounded-[26px] border border-[#e3ebe7] bg-white p-7"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#315f4b] text-[13px] font-semibold text-white">{step.number}</span><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#87918c]">{step.label}</span></div><h3 className="mt-7 text-[19px] font-semibold">{step.title}</h3><p className="mt-3 text-[14px] leading-6 text-[#6b7771]">{step.text}</p><span className="mt-7 inline-flex rounded-full bg-[#eef5f1] px-3 py-1.5 text-[11px] text-[#446052]">{step.note}</span></article>)}</div></div>
      </section>

      <section className="border-b border-[#e1ebe6] bg-[#edf5f2]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-[.85fr_1.15fr] items-center gap-16 px-10 py-20 xl:px-14">
          <div><Eyebrow>Información organizada</Eyebrow><h2 className="mt-4 text-[42px] font-semibold leading-[1.03] tracking-[-.05em]">Cada solicitud llega con más contexto</h2><p className="mt-5 max-w-[500px] text-[15px] leading-7 text-[#66736d]">Antes de responder, puedes consultar la información que la persona ha decidido compartir y sus preferencias de convivencia.</p><div className="mt-7 space-y-3 text-[13px] text-[#54635b]"><Line>Presupuesto y preferencias visibles</Line><Line>Perfil de convivencia organizado</Line><Line>Conversación privada y directa</Line></div></div>
          <div className="rounded-[32px] bg-white p-7 shadow-[0_22px_55px_rgba(31,58,47,.09)]"><div className="flex items-center justify-between border-b border-[#e7eeea] pb-5"><div><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-[#718078]">Solicitud recibida</p><h3 className="mt-2 text-[22px] font-semibold">Información antes de responder</h3></div><span className="rounded-full bg-[#e5f2ea] px-3 py-2 text-[11px] font-semibold text-[#315f4b]">Perfil disponible</span></div><div className="mt-6 grid grid-cols-2 gap-3"><InfoCard title="Presupuesto" text="Visible cuando la persona decide compartirlo" /><InfoCard title="Preferencias" text="Hábitos y convivencia en un mismo perfil" /><InfoCard title="Mensajería" text="Conversación privada dentro de CoFlow" /><InfoCard title="Decisión" text="Tú decides si quieres responder" /></div><Link className="mt-5 flex w-full items-center justify-center rounded-full bg-[#315f4b] py-3.5 text-[13px] font-semibold text-white" href="/register?role=owner">Crear cuenta de propietario</Link></div>
        </div>
      </section>

      <section className="border-b border-[#e1ebe6] bg-[#f8fbfa]">
        <div className="mx-auto max-w-[1280px] px-10 py-20"><div className="text-center"><Eyebrow>Transparencia desde el principio</Eyebrow><h2 className="mt-3 text-[36px] font-semibold tracking-[-.045em]">Otra forma de conocer a tus futuros inquilinos</h2><p className="mx-auto mt-3 max-w-[660px] text-[14px] leading-6 text-[#6c7872]">CoFlow añade información sobre convivencia antes de que empiece la conversación.</p></div><div className="mt-11 grid grid-cols-2 gap-6"><article className="rounded-[30px] bg-[#edf3f0] p-8"><h3 className="text-[22px] font-semibold">Un anuncio convencional</h3><div className="mt-7 space-y-5 text-[14px] text-[#66736d]"><MutedLine>La información se centra en la vivienda.</MutedLine><MutedLine>Las preferencias suelen conocerse durante la conversación.</MutedLine><MutedLine>El primer contacto empieza con menos contexto.</MutedLine></div></article><article className="rounded-[30px] border-t-4 border-[#315f4b] bg-white p-8 shadow-[0_18px_45px_rgba(31,58,47,.08)]"><span className="rounded-full bg-[#315f4b] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-white">CoFlow</span><h3 className="mt-5 text-[22px] font-semibold">Tu vivienda, con más contexto</h3><div className="mt-7 space-y-5 text-[14px] text-[#58675f]"><Line>Presupuesto y preferencias antes de responder.</Line><Line>Conversación privada con cada persona.</Line><Line>Control sobre cada solicitud.</Line></div><Link className="mt-8 flex w-full items-center justify-center rounded-full bg-[#315f4b] py-3.5 text-[13px] font-semibold text-white" href="/register?role=owner">Empezar como propietario</Link></article></div></div>
      </section>

      <section id="preguntas" className="bg-[#edf5f2]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[.72fr_1.28fr] gap-16 px-10 py-20"><div><Eyebrow>Dudas frecuentes</Eyebrow><h2 className="mt-4 text-[38px] font-semibold leading-[1.05] tracking-[-.05em]">Preguntas de propietarios</h2><p className="mt-4 text-[14px] leading-6 text-[#6c7872]">Claridad antes de empezar a publicar.</p></div><div className="space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-[20px] bg-white px-6 shadow-[0_6px_22px_rgba(31,58,47,.04)]"><summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15px] font-semibold">{question}<ChevronDown size={15} className="transition group-open:rotate-180" /></summary><p className="border-t border-black/5 pb-5 pt-4 text-[14px] leading-6 text-[#68756e]">{answer}</p></details>)}</div></div>
      </section>

      <section className="bg-[#edf5f2] px-10 pb-16"><div className="mx-auto max-w-[1330px] rounded-[36px] bg-[#244638] px-12 py-16 text-center text-white shadow-[0_18px_50px_rgba(24,55,43,.16)]"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Sparkles size={18} /></span><h2 className="mx-auto mt-6 max-w-[720px] text-[44px] font-semibold leading-[1.04] tracking-[-.05em]">Pon tu vivienda en manos afines</h2><p className="mx-auto mt-4 max-w-[620px] text-[14px] leading-6 text-white/65">Recibe solicitudes de personas que ya han compartido su presupuesto y preferencias de convivencia.</p><Link className="mx-auto mt-7 inline-flex rounded-full bg-white px-8 py-3.5 text-[13px] font-semibold text-[#244638]" href="/register?role=owner">Publicar mi vivienda gratis</Link><p className="mt-4 text-[11px] text-white/45">Sin tarjeta · Sin permanencia</p></div></section>

      <footer className="border-t border-[#dfe9e4] bg-[#eaf3ef]"><div className="mx-auto grid max-w-[1440px] grid-cols-[1.2fr_1fr_1fr_1fr] gap-12 px-10 py-14 xl:px-14"><div><Link href="/" className="flex items-center gap-2"><Logo /><span className="font-semibold">CoFlow</span></Link><p className="mt-5 max-w-[250px] text-[12px] leading-5 text-[#66736d]">Vivienda compartida con calma, diseñada para conocer mejor cada solicitud antes de responder.</p></div><Footer title="Inquilinos y comunidades" links={[["Buscar habitaciones", "/companeros-de-piso"], ["Explorar comunidades", "/comunidades"], ["Crear perfil", "/register"]]} /><Footer title="Propietarios" links={[["Publicar propiedad", "/register?role=owner"], ["Cómo funciona", "#como-funciona"], ["Contacto", "mailto:soporte@coflowapp.es"]]} /><Footer title="Transparencia y legal" links={[["Términos de servicio", "/legal/terminos"], ["Condiciones para propietarios", "/legal/condiciones-propietarios"], ["Política de privacidad", "/legal/privacidad"]]} /></div><div className="mx-auto flex max-w-[1440px] items-center justify-between border-t border-[#d7e3dd] px-10 py-6 text-[11px] text-[#78847e] xl:px-14"><p>CoFlow está disponible actualmente en Málaga.</p><p>© {new Date().getFullYear()} CoFlow Living S.L.</p></div></footer>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) { return <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#617069]">{children}</p>; }
function Chip({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-[#eef3f0] px-3 py-2 text-[11px] text-[#536159]">{children}</span>; }
function Line({ children }: { children: React.ReactNode }) { return <p className="flex gap-3"><Check className="mt-0.5 shrink-0 text-[#315f4b]" size={14} /><span>{children}</span></p>; }
function MutedLine({ children }: { children: React.ReactNode }) { return <p className="flex gap-3"><span className="mt-0.5 text-[#b6675d]">×</span><span>{children}</span></p>; }
function InfoCard({ title, text }: { title: string; text: string }) { return <div className="rounded-[18px] bg-[#f0f5f2] p-5"><p className="text-[13px] font-semibold">{title}</p><p className="mt-2 text-[12px] leading-5 text-[#6d7973]">{text}</p></div>; }
function Footer({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) { return <div><h3 className="text-[11px] font-semibold uppercase tracking-[.12em]">{title}</h3><div className="mt-5 space-y-3">{links.map(([label, href]) => <Link key={label} href={href} className="block text-[12px] text-[#65726c] transition hover:text-[#244638]">{label}</Link>)}</div></div>; }
