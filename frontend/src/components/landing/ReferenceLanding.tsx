"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  HeartHandshake,
  Home,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  VolumeX,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

const values = [
  { icon: HeartHandshake, title: "Afinidad humana real", text: "Conoce hábitos y preferencias antes de compartir hogar." },
  { icon: MessageCircle, title: "Conexión previa sin presiones", text: "Habla en privado y resuelve dudas antes de decidir." },
  { icon: Eye, title: "Trato directo y honesto", text: "Sin datos ocultos: cada persona decide qué muestra en su perfil." },
] as const;

const steps = [
  { title: "Define tu forma de convivir", text: "Completa tus hábitos y preferencias para que otras personas entiendan qué buscas." },
  { title: "Conoce perfiles y comunidades", text: "Consulta presupuesto, ciudad, preferencias y plazas abiertas antes de hablar." },
  { title: "Entra con acuerdos claros", text: "Habla en privado y solicita una plaza solo cuando tenga sentido para ti." },
] as const;

const filterGroups = {
  Personas: [
    { icon: Clock3, title: "Horarios", text: "Compara rutinas y horarios." },
    { icon: Users, title: "Energía social", text: "Conoce el ambiente de convivencia." },
    { icon: VolumeX, title: "Tolerancia", text: "Entiende límites y preferencias." },
  ],
  Comunidades: [
    { icon: Users, title: "Plazas abiertas", text: "Encuentra comunidades con sitio disponible." },
    { icon: Home, title: "Aportación mensual", text: "Consulta la aportación asociada a la comunidad." },
    { icon: MessageCircle, title: "Tipo de acceso", text: "Distingue entre acceso abierto o por solicitud." },
  ],
  Convivencia: [
    { icon: Sparkles, title: "Limpieza", text: "Compara preferencias sobre orden y limpieza." },
    { icon: Clock3, title: "Horario", text: "Valora si las rutinas pueden encajar." },
    { icon: HeartHandshake, title: "Conflictos", text: "Conoce cómo prefiere comunicarse cada persona." },
  ],
} as const;

type FilterGroup = keyof typeof filterGroups;

export default function ReferenceLanding() {
  const [activeGroup, setActiveGroup] = useState<FilterGroup>("Personas");
  const [selectedFilter, setSelectedFilter] = useState(0);

  return (
    <main className="min-h-dvh bg-[#f4f4f7] text-[#18251f]">
      <header className="sticky top-0 z-50 border-b border-black/[0.055] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[480px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="CoFlow, inicio"><Logo /><span className="text-[12px] font-semibold">CoFlow</span></Link>
          <div className="flex items-center gap-4"><Link href="/para-propietarios" className="text-[10px] text-[#5f6763]">Propietarios</Link><Link href="/login" className="rounded-full bg-[#315f4b] px-3.5 py-2 text-[10px] font-semibold text-white">Entrar</Link></div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4">
        <section className="pb-7 pt-5">
          <Pill>El nuevo hábitat compartido</Pill>
          <h1 className="mt-4 text-[36px] font-semibold leading-[0.98] tracking-[-0.055em]">Convivir en armonía.<br /><span className="font-normal text-[#66706b]">Alquilar con serenidad.</span></h1>
          <p className="mt-4 max-w-[390px] text-[12px] leading-[1.55] text-[#727975]">Conectamos personas afines para crear hogares armónicos y respetuosos, con hábitos, presupuesto y preferencias visibles antes de decidir.</p>
          <div className="mt-5 grid grid-cols-2 gap-2"><Link href="/companeros-de-piso" className="ios-secondary">Buscar comunidad</Link><Link href="/para-propietarios" className="ios-muted">Soy propietario</Link></div>

          <article className="mt-5 rounded-[22px] bg-white p-2 shadow-[0_12px_34px_rgba(25,45,36,0.07)]">
            <div className="relative aspect-[1.62] overflow-hidden rounded-[17px]">
              <Image src="https://images.unsplash.com/photo-1641667710644-fb8a6abf2a06?auto=format&fit=crop&q=85&w=1400" alt="Vista urbana de Málaga con su catedral" fill priority sizes="448px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <span className="absolute left-2.5 top-2.5 rounded-full bg-[#263b32]/80 px-2.5 py-1 text-[8px] text-white backdrop-blur">Comunidad</span>
              <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Málaga</span>
              <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/40 px-2.5 py-1 text-[8px] text-white backdrop-blur">Plazas abiertas</span>
            </div>
            <div className="px-2 pb-2 pt-3">
              <div className="flex justify-between gap-3"><div><h2 className="text-[13px] font-semibold">Comunidades en Málaga</h2><p className="mt-1 text-[9px] leading-4 text-[#747b77]">Consulta preferencias de convivencia y condiciones de cada plaza.</p></div><span className="h-fit shrink-0 rounded-full bg-[#f1f2f1] px-2 py-1 text-[8px]">Málaga</span></div>
              <div className="mt-2.5 flex flex-wrap gap-1.5"><Tag>Preferencias</Tag><Tag>Presupuesto</Tag><Tag>Plazas abiertas</Tag></div>
              <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3"><span className="text-[8px] uppercase tracking-[0.12em] text-[#8b918e]">Explora antes de decidir</span><Link href="/comunidades" className="flex items-center gap-1 rounded-full bg-[#315f4b] px-3 py-2 text-[9px] font-semibold text-white">Ver comunidades <ChevronRight size={12} /></Link></div>
              <p className="mt-2 text-[7px] text-[#a0a5a2]">Foto de <a href="https://unsplash.com/photos/Nx0C3cDKRLw" target="_blank" rel="noreferrer" className="underline">Yuliya Matuzava</a> en Unsplash</p>
            </div>
          </article>
        </section>

        <section className="py-7">
          <Eyebrow>Valores esenciales</Eyebrow><Title>Diseñado para la calma diaria</Title><Copy>Sin prisas ni decisiones a ciegas. Una experiencia pensada para entenderse antes de compartir.</Copy>
          <div className="mt-4 space-y-2">{values.map(({ icon: Icon, title, text }) => <InfoRow key={title} icon={<Icon size={15} />} title={title} text={text} />)}</div>
        </section>

        <section id="como-funciona" className="py-7">
          <Eyebrow>El viaje CoFlow</Eyebrow><Title>Tu camino hacia el hogar adecuado</Title><Copy>Un proceso abierto, humano y transparente para conectar con naturalidad desde el primer instante.</Copy>
          <div className="mt-5 space-y-2.5">{steps.map((step, index) => <div key={step.title} className="flex gap-3 rounded-[17px] bg-white p-4"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#edf1ef] text-[9px] font-semibold text-[#315f4b]">{index + 1}</span><div><h3 className="text-[11px] font-semibold">{step.title}</h3><p className="mt-1 text-[9px] leading-4 text-[#7a817d]">{step.text}</p></div></div>)}</div>
        </section>

        <section className="py-7">
          <Pill>Afinidad estructurada</Pill><Title>Encuentra tu equilibrio diario</Title><Copy>Elige por bloques esenciales sin sobrecargar tu búsqueda.</Copy>
          <div className="mt-4 rounded-[22px] bg-white p-3 shadow-[0_10px_28px_rgba(25,45,36,0.055)]">
            <div role="tablist" aria-label="Tipo de filtro" className="grid grid-cols-3 rounded-[13px] bg-[#f1f2f3] p-1 text-center text-[8px]">{(Object.keys(filterGroups) as FilterGroup[]).map((group) => <button key={group} type="button" role="tab" aria-selected={activeGroup === group} onClick={() => { setActiveGroup(group); setSelectedFilter(0); }} className={`rounded-[10px] px-2 py-2 transition ${activeGroup === group ? "bg-white text-[#18251f] shadow-sm" : "text-[#747b77] hover:text-[#315f4b]"}`}>{group}</button>)}</div>
            <div className="mt-3 space-y-2">{filterGroups[activeGroup].map(({ icon: Icon, title, text }, index) => <button type="button" key={title} onClick={() => setSelectedFilter(index)} aria-pressed={selectedFilter === index} className={`flex w-full items-center gap-3 rounded-[14px] p-3 text-left transition ${selectedFilter === index ? "bg-[#edf3ef] ring-1 ring-[#315f4b]/15" : "bg-[#f5f6f6] hover:bg-[#f0f2f1]"}`}><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#315f4b]"><Icon size={14} /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold">{title}</p><p className="mt-0.5 truncate text-[8px] text-[#808682]">{text}</p></div><span className={`h-4 w-4 rounded-full border transition ${selectedFilter === index ? "border-[#315f4b] bg-[#315f4b] shadow-[inset_0_0_0_4px_white]" : "border-black/10 bg-white"}`} /></button>)}</div>
            <div className="mt-3 flex items-center justify-between"><span className="flex items-center gap-1 text-[8px] text-[#75807a]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />6 ejes de convivencia</span><Link href="/register" className="flex items-center gap-1 rounded-full bg-[#315f4b] px-3 py-2 text-[9px] font-semibold text-white">Crear mi perfil <ArrowRight size={11} /></Link></div>
          </div>
        </section>

        <section id="propietarios" className="py-7">
          <Pill>Para propietarios · CoFlow es gratuito</Pill><Title>Tu patrimonio en manos cuidadosas</Title><Copy>Publica tu vivienda y conoce las preferencias de convivencia antes de responder.</Copy>
          <div className="mt-4 rounded-[22px] bg-white p-3 shadow-[0_10px_28px_rgba(25,45,36,0.055)]">
            <div className="relative aspect-[1.75] overflow-hidden rounded-[17px]"><Image src="https://images.unsplash.com/photo-1641667710644-fb8a6abf2a06?auto=format&fit=crop&q=85&w=1400" alt="Vista de Málaga" fill sizes="448px" className="object-cover object-[center_58%]" /><span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[8px] backdrop-blur">Málaga</span></div>
            <div className="mt-3 rounded-[15px] bg-[#f3f6f3] p-3"><p className="text-[10px] font-semibold">Información antes de responder</p><div className="mt-2 space-y-1.5 text-[9px] text-[#66706b]"><CheckLine>Presupuesto y preferencias visibles</CheckLine><CheckLine>Solicitudes desde Málaga</CheckLine><CheckLine>Control directo de la conversación</CheckLine></div></div>
            <div className="mt-2.5 rounded-[15px] border border-[#b9d5c5] bg-[#f2faf5] p-3"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold">Cuenta CoFlow</p><span className="rounded-full bg-[#d9efe2] px-2 py-1 text-[8px] text-[#315f4b]">Email verificado</span></div><div className="mt-2 space-y-1.5 text-[9px] text-[#557062]"><CheckLine>Publicación gratuita</CheckLine><CheckLine>Sin tarjeta y sin permanencia</CheckLine><CheckLine>Control sobre cada solicitud</CheckLine></div></div>
            <Link href="/register?role=owner" className="mt-3 flex h-11 items-center justify-center rounded-full bg-[#315f4b] text-[10px] font-semibold text-white">Publicar mi vivienda gratis <ArrowRight className="ml-1.5" size={12} /></Link>
          </div>
        </section>

        <section className="py-8 text-center"><h2 className="text-[26px] font-semibold leading-[1.05] tracking-[-0.045em]">Comienza una nueva etapa residencial</h2><p className="mx-auto mt-3 max-w-[340px] text-[10px] leading-4 text-[#777e7a]">Únete a una comunidad donde la convivencia armónica y el equilibrio personal sean una realidad cotidiana.</p><Link href="/register" className="mx-auto mt-5 flex h-11 max-w-[360px] items-center justify-center rounded-full bg-[#315f4b] text-[10px] font-semibold text-white">Crear cuenta gratuita</Link><p className="mt-2 text-[8px] text-[#8a908d]">Sin tarjeta · Sin permanencia</p><p className="mt-4 text-[9px] text-[#707773]">¿Tienes dudas? <a href="mailto:soporte@coflowapp.es" className="underline underline-offset-2">Contacta con nosotros</a></p></section>
      </div>

      <footer className="mt-5 border-t border-black/5 bg-[#eeeff2] px-4 py-9"><div className="mx-auto max-w-[480px] text-center"><Link href="/" className="inline-flex items-center gap-2"><Logo /><span className="text-[11px] font-semibold">CoFlow</span></Link><p className="mt-3 text-[8px] text-[#8b918e]">Convivir en armonía. Alquilar con serenidad.</p><div className="mt-7 grid grid-cols-2 gap-6 text-left"><FooterColumn title="Para particulares" links={[["Compañeros de piso en Málaga","/companeros-de-piso"],["Explorar comunidades","/comunidades"],["Crear perfil","/register"]]} /><FooterColumn title="Para propietarios" links={[["Publicar vivienda en Málaga","/para-propietarios"],["Cómo funciona para propietarios","/para-propietarios#como-funciona"],["Contacto directo","mailto:soporte@coflowapp.es"]]} /></div><div className="mt-7 rounded-full bg-white px-3 py-2 text-[8px] text-[#68716c]"><ShieldCheck className="mr-1 inline" size={10} />Basado en el respeto mutuo, la afinidad real y la convivencia transparente.</div><div className="mt-7 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[8px] text-[#8b918e]"><Link href="/legal/privacidad">Privacidad</Link><Link href="/legal/terminos">Términos</Link><a href="mailto:soporte@coflowapp.es">Contacto</a></div><p className="mt-3 text-[8px] text-[#9a9f9c]">© {new Date().getFullYear()} CoFlow</p></div></footer>
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) { return <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.035] px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#65706a]"><Sparkles size={9} />{children}</span>; }
function Eyebrow({ children }: { children: React.ReactNode }) { return <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#69736e]">{children}</p>; }
function Title({ children }: { children: React.ReactNode }) { return <h2 className="mt-2 text-[24px] font-semibold leading-[1.04] tracking-[-0.045em]">{children}</h2>; }
function Copy({ children }: { children: React.ReactNode }) { return <p className="mt-2 max-w-[410px] text-[10px] leading-4 text-[#777e7a]">{children}</p>; }
function Tag({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-[#f1f4f1] px-2.5 py-1.5 text-[8px] text-[#4f5d56]">{children}</span>; }
function InfoRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex gap-3 rounded-[17px] bg-white p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f3f1] text-[#315f4b]">{icon}</span><div><h3 className="text-[11px] font-semibold">{title}</h3><p className="mt-1 text-[9px] leading-4 text-[#7a817d]">{text}</p></div></div>; }
function CheckLine({ children }: { children: React.ReactNode }) { return <p className="flex items-start gap-1.5"><Check className="mt-0.5 shrink-0 text-emerald-600" size={10} />{children}</p>; }
function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) { return <div><h3 className="text-[8px] font-semibold uppercase tracking-[0.12em]">{title}</h3><div className="mt-3 space-y-2">{links.map(([label, href]) => <Link key={label} href={href} className="block text-[9px] text-[#707874]">{label}</Link>)}</div></div>; }
