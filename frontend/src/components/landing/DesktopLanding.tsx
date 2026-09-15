"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Eye,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Volume2,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const raf = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [active, target, duration]);
  return count;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const principles = [
  { icon: HeartHandshake, title: "Afinidad humana real", text: "Conoce hábitos, rutinas y preferencias antes de compartir hogar.", link: "Ver la métrica de convivencia" },
  { icon: MessageCircle, title: "Conexión previa sin presiones", text: "Habla en privado y resuelve dudas antes de tomar una decisión.", link: "Descubrir cómo funciona" },
  { icon: Eye, title: "Trato directo y honesto", text: "Cada persona decide qué información muestra y con quién conversa.", link: "Conocer la experiencia" },
] as const;

const steps = [
  { number: "01", label: "Paso inicial", title: "Define tu ritmo y valores", text: "Completa tus hábitos de descanso, limpieza, vida social y organización diaria.", note: "Un perfil claro desde el inicio" },
  { number: "02", label: "Conexión", title: "Conoce antes de escribir", text: "Consulta perfiles y comunidades con contexto real antes de empezar a hablar.", note: "Información antes de decidir" },
  { number: "03", label: "Bienvenida", title: "Entra con acuerdos claros", text: "Habla en privado y solicita una plaza cuando la convivencia tenga sentido.", note: "Acuerdos de convivencia" },
] as const;

const filters = [
  "Silencio tras 23h", "Hogar como refugio", "Café pausado matutino",
  "Teletrabajo respetuoso", "Orden compartido", "Planificar",
  "Visitas improvisadas", "Cocina consciente y limpia",
];

const testimonials = [
  { name: "Lucía M.", city: "Málaga", role: "Estudiante de máster", stars: 5, text: "Encontré mis compañeras en dos semanas. El perfil de convivencia me dio la confianza para decidir antes de conocerlas en persona." },
  { name: "Andrés P.", city: "Torremolinos", role: "Propietario", stars: 5, text: "Como propietario, por fin puedo ver si los candidatos encajan con el ambiente del piso antes de responder. Cambió completamente mi forma de seleccionar inquilinos." },
  { name: "Sara K.", city: "Málaga", role: "Freelancer", stars: 5, text: "La métrica de convivencia es un antes y un después. Sin ella hubiera vuelto a equivocarme de compañero como con el anterior piso." },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DesktopLanding() {
  const [activeFilter, setActiveFilter] = useState("Silencio tras 23h");
  const [activeTab, setActiveTab] = useState("Descanso & Ruido");

  const { ref: statsRef, inView: statsInView } = useInView<HTMLElement>(0.3);
  const c1 = useCountUp(500, 1600, statsInView);
  const c2 = useCountUp(48, 1400, statsInView);
  const c3 = useCountUp(94, 1500, statsInView);
  const c4 = useCountUp(2, 1200, statsInView);

  return (
    <div className="hidden bg-[#f3f8f6] text-brand-dark lg:block">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-[#dfe9e4] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-8 px-10 xl:px-14">
          <Link href="/" className="mr-2 flex items-center gap-2.5" aria-label="CoFlow, inicio">
            <Logo /><span className="text-base font-semibold">CoFlow</span>
          </Link>
          <nav className="flex flex-1 items-center gap-2 text-xs text-[#52605a]" aria-label="Navegación principal">
            <Link className="rounded-full bg-[#eef4f1] px-4 py-2.5 font-medium text-[#18382c]" href="/comunidades">Explorar comunidades</Link>
            <Link className="rounded-full px-4 py-2.5 transition hover:bg-[#f2f5f3]" href="/para-propietarios">Para propietarios</Link>
            <Link className="rounded-full px-4 py-2.5 transition hover:bg-[#f2f5f3]" href="#como-funciona">Cómo funciona</Link>
            <Link className="rounded-full px-4 py-2.5 transition hover:bg-[#f2f5f3]" href="#convivencia">Convivencia y hábitos</Link>
          </nav>
          <div className="flex items-center gap-3 text-xs font-medium">
            <Link className="px-3 py-2" href="/login">Iniciar sesión</Link>
            <Link data-apple-magnetic className="apple-magnetic rounded-full bg-brand-mid px-5 py-3 text-white shadow-[0_8px_20px_rgba(49,95,75,.18)]" href="/register?role=owner">Publicar gratis</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-[#dfe8e3] bg-[radial-gradient(circle_at_82%_18%,rgba(211,229,219,.85),transparent_34%),linear-gradient(180deg,#fbfdfc_0%,#f0f6f3_100%)]">
        <div className="mx-auto grid min-h-[680px] max-w-[1440px] grid-cols-[.92fr_1.08fr] items-center gap-16 px-10 py-16 xl:px-14">

          {/* Left */}
          <div className="max-w-[690px]">
            <DesktopEyebrow>Compañeros de piso en Málaga</DesktopEyebrow>
            <h1 className="optical-display mt-6 text-[clamp(60px,5.35vw,86px)] font-semibold leading-[.92] tracking-[-.065em]">
              Conoce cómo se vive.<br />
              <span className="font-normal text-[#718078]">Antes de elegir dónde.</span>
            </h1>
            <p className="mt-7 max-w-[590px] text-lg leading-8 text-[#607068]">
              Encuentra personas y comunidades compatibles por hábitos, presupuesto y forma de convivir. Menos intuición. Más contexto real.
            </p>
            <div className="mt-7 flex gap-3">
              <Link className="rounded-full bg-brand-dark px-7 py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(36,70,56,.22)] transition hover:-translate-y-0.5" href="/register">
                Crear mi perfil gratis <ArrowRight className="ml-1.5 inline" size={14} />
              </Link>
              <Link className="rounded-full bg-white px-7 py-4 text-sm font-semibold shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5" href="/comunidades">
                Explorar comunidades
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs text-[#68766f]">
              <span className="flex items-center gap-2"><CircleCheck size={14} /> Sin permanencia</span>
              <span className="flex items-center gap-2"><ShieldCheck size={14} /> Email verificado</span>
              <span className="flex items-center gap-2"><HeartHandshake size={14} /> Preferencias visibles</span>
            </div>
          </div>

          {/* Right — layered cards */}
          <div className="relative ml-auto w-full max-w-[640px]">
            {/* Main community card */}
            <article data-apple-tilt className="apple-tilt overflow-hidden rounded-[38px] border border-white/80 bg-white/80 p-3 shadow-[0_34px_90px_rgba(26,58,45,.16)] backdrop-blur">
              <div className="relative aspect-[1.45] overflow-hidden rounded-[29px]">
                <Image src="/images/create-community-living-room.webp" alt="Salón luminoso de una comunidad CoFlow" fill priority sizes="640px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
                <span className="absolute left-4 top-4 rounded-full bg-brand-dark/85 px-3 py-1.5 text-2xs font-medium text-white backdrop-blur">Comunidad</span>
                <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-2xs font-medium backdrop-blur">Málaga</span>
                <div className="absolute bottom-5 left-5 text-white">
                  <p className="text-2xs uppercase tracking-[.14em]">Tu próxima casa empieza por las personas</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">Comunidades en Málaga</h2>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs leading-5 text-[#68736e]">Descubre el ambiente, las preferencias y las condiciones antes de enviar una solicitud.</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2"><Chip>Preferencias</Chip><Chip>Presupuesto</Chip><Chip>Plazas abiertas</Chip></div>
                  <Link className="flex shrink-0 items-center gap-1 rounded-full bg-brand-mid px-5 py-3 text-xs font-semibold text-white" href="/comunidades">
                    Ver comunidades <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </article>

            {/* Floating match notification */}
            <div className="desktop-card-float-1 absolute -right-6 -top-5 z-10 flex items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-[0_16px_48px_rgba(26,58,45,0.18)] backdrop-blur">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-lg">🎉</div>
              <div>
                <p className="text-xs font-semibold text-brand-dark">Nueva coincidencia</p>
                <p className="text-[11px] text-[#6b7771]">María · 94% de afinidad</p>
              </div>
            </div>

            {/* Floating profile chip */}
            <div className="desktop-card-float-2 absolute -left-8 bottom-16 z-10 flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-[0_14px_40px_rgba(26,58,45,0.16)] backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-bold text-brand-mid">SG</div>
              <div>
                <p className="text-xs font-semibold text-brand-dark">Sara · Freelancer</p>
                <p className="text-[11px] text-[#6b7771]">Perfil de convivencia completo</p>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </div>

        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section ref={statsRef} className="border-b border-[#dfe9e4] bg-white">
        <div className="mx-auto max-w-[1440px] px-10 py-12 xl:px-14">
          <div className="grid grid-cols-4 divide-x divide-[#e8eee9]">
            <DesktopStat value={statsInView ? `+${c1}` : "+0"} label="Personas activas en Málaga" />
            <DesktopStat value={statsInView ? String(c2) : "0"} label="Comunidades publicadas" />
            <DesktopStat value={statsInView ? `${c3}%` : "0%"} label="Afinidad media entre coincidencias" />
            <DesktopStat value={statsInView ? `${c4} sem.` : "0 sem."} label="Tiempo medio para encontrar piso" />
          </div>
        </div>
      </section>

      {/* ── PRINCIPLES ── */}
      <section className="border-b border-[#e1ebe6] bg-[#edf5f2]">
        <div className="mx-auto max-w-[1440px] px-10 py-20 xl:px-14">
          <div className="grid grid-cols-2 items-end gap-16">
            <div>
              <DesktopEyebrow>Principios CoFlow</DesktopEyebrow>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em]">El estándar de una convivencia reposada</h2>
            </div>
            <p className="ml-auto max-w-[510px] text-base leading-7 text-[#64716b]">
              Diseñado para reducir la fricción al compartir vivienda mediante afinidad previa, contexto y conversaciones directas.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-5">
            {principles.map(({ icon: Icon, title, text, link }) => (
              <article key={title} className="group rounded-panel bg-white p-7 shadow-[0_10px_30px_rgba(31,58,47,.055)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(31,58,47,.1)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ee] text-brand-mid"><Icon size={18} /></span>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-3 min-h-14 text-sm leading-6 text-[#6b7771]">{text}</p>
                <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-brand-mid">{link} <ArrowRight size={12} /></p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="border-b border-[#e1ebe6] bg-[#f8fbfa]">
        <div className="mx-auto max-w-[1440px] px-10 py-20 xl:px-14">
          <div className="text-center">
            <DesktopEyebrow>Metodología clara</DesktopEyebrow>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em]">Tu camino hacia el hogar adecuado</h2>
            <p className="mx-auto mt-3 max-w-[650px] text-sm leading-6 text-[#6c7872]">Un proceso sencillo y humano para llegar a casa sintiendo que puedes descansar de verdad.</p>
          </div>
          <div className="mt-11 grid grid-cols-3 gap-5">
            {steps.map((step) => (
              <article key={step.number} className="rounded-panel border border-[#e3ebe7] bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-mid text-xs font-semibold text-white">{step.number}</span>
                  <span className="text-3xs font-semibold uppercase tracking-[.18em] text-[#87918c]">{step.label}</span>
                </div>
                <h3 className="mt-7 text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7771]">{step.text}</p>
                <span className="mt-7 inline-flex rounded-full bg-[#eef5f1] px-3 py-1.5 text-2xs text-[#446052]">{step.note}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONVIVENCIA / FILTERS ── */}
      <section id="convivencia" className="border-b border-[#e1ebe6] bg-[#edf5f2]">
        <div className="mx-auto max-w-[1440px] px-10 py-20 xl:px-14">
          <div className="rounded-[34px] bg-white p-9 shadow-[0_16px_48px_rgba(31,58,47,.07)]">
            <div className="flex items-end justify-between gap-10">
              <div>
                <DesktopEyebrow>Filtro vivencial</DesktopEyebrow>
                <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em]">Filtra por convivencia,<br />no solo por cuatro paredes</h2>
              </div>
              <div className="flex rounded-full bg-[#f0f4f2] p-1" role="tablist">
                {["Descanso & Ruido", "Espacio compartido", "Estilo de vida"].map(tab => (
                  <button key={tab} type="button" role="tab" onClick={() => setActiveTab(tab)} aria-selected={activeTab === tab}
                    className={`rounded-full px-4 py-2 text-xs transition ${activeTab === tab ? "bg-white font-semibold text-brand-dark shadow-sm" : "text-[#6c7872]"}`}
                  >{tab}</button>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {filters.map((filter, i) => (
                <button key={filter} type="button" onClick={() => setActiveFilter(filter)} aria-pressed={activeFilter === filter}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium transition ${activeFilter === filter ? "bg-brand-mid text-white shadow-[0_7px_16px_rgba(49,95,75,.18)]" : "bg-[#edf2ef] text-[#46554e] hover:bg-[#e3ece7]"}`}
                >{i === 0 ? <Volume2 size={13} /> : <Check size={13} />}{filter}</button>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-[1fr_auto] items-center gap-6 rounded-card bg-[#e8f1ed] p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-mid"><Sparkles size={19} /></span>
                <div>
                  <p className="text-sm font-semibold">Perfil de convivencia en 6 ejes</p>
                  <p className="mt-1 text-xs text-[#65736c]">Limpieza, energía social, horario, economía, conflictos y tolerancia.</p>
                </div>
              </div>
              <Link className="flex items-center gap-2 rounded-full bg-brand-mid px-6 py-3 text-xs font-semibold text-white" href="/register">
                Crear mi perfil <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="border-b border-[#e1ebe6] bg-[#f8fbfa]">
        <div className="mx-auto max-w-[1280px] px-10 py-20">
          <div className="text-center">
            <DesktopEyebrow>Claridad desde el principio</DesktopEyebrow>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em]">Dos formas de empezar a convivir</h2>
            <p className="mx-auto mt-3 max-w-[660px] text-sm leading-6 text-[#6c7872]">CoFlow añade contexto sobre hábitos y preferencias antes de que empiece la conversación.</p>
          </div>
          <div className="mt-11 grid grid-cols-2 gap-6">
            <article className="rounded-[30px] bg-[#edf3f0] p-8">
              <h3 className="text-xl font-semibold">Una búsqueda convencional</h3>
              <div className="mt-7 space-y-5 text-sm text-[#66736d]">
                <CrossLine>La información se centra principalmente en la vivienda.</CrossLine>
                <CrossLine>Las preferencias suelen conocerse después de contactar.</CrossLine>
                <CrossLine>La conversación empieza con menos contexto.</CrossLine>
              </div>
            </article>
            <article className="rounded-[30px] border-t-4 border-brand-mid bg-white p-8 shadow-[0_18px_45px_rgba(31,58,47,.08)]">
              <span className="rounded-full bg-brand-mid px-3 py-1.5 text-3xs font-semibold uppercase tracking-[.12em] text-white">CoFlow</span>
              <h3 className="mt-5 text-xl font-semibold">Una comunidad con contexto</h3>
              <div className="mt-7 space-y-5 text-sm text-[#58675f]">
                <PositiveLine>Presupuesto y preferencias visibles antes de responder.</PositiveLine>
                <PositiveLine>Perfil de convivencia organizado en seis ejes.</PositiveLine>
                <PositiveLine>Conversación privada y control sobre cada solicitud.</PositiveLine>
              </div>
              <Link className="mt-8 flex w-full items-center justify-center rounded-full bg-brand-mid py-3.5 text-xs font-semibold text-white" href="/register">
                Comenzar con CoFlow
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="border-b border-[#e1ebe6] bg-[#edf5f2]">
        <div className="mx-auto max-w-[1440px] px-10 py-20 xl:px-14">
          <div className="text-center">
            <DesktopEyebrow>Lo que dicen</DesktopEyebrow>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em]">Experiencias reales en Málaga</h2>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <article key={i} className="rounded-[28px] bg-white p-7 shadow-[0_10px_30px_rgba(31,58,47,.06)]">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-[#3a423e]">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-black/[0.05] pt-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-sm font-bold text-brand-mid">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-[#7a817d]">{t.role} · {t.city}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden bg-[#0d1f16] px-10 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-orb-1 absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#1d4731] opacity-60 blur-[100px]" />
          <div className="hero-orb-2 absolute -right-20 -bottom-20 h-[400px] w-[400px] rounded-full bg-[#2a5c3f] opacity-50 blur-[90px]" />
        </div>
        <div className="relative mx-auto max-w-[1330px] text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">🏠</div>
          <h2 className="mx-auto max-w-[720px] text-[clamp(40px,4vw,60px)] font-semibold leading-[1.04] tracking-[-.05em] text-white">
            Comienza una nueva etapa residencial
          </h2>
          <p className="mx-auto mt-5 max-w-[580px] text-base leading-7 text-[#85b09a]">
            Únete a una comunidad donde la convivencia armónica y el equilibrio personal sean una realidad cotidiana.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link className="rounded-full bg-emerald-500 px-8 py-4 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(52,211,153,0.38)] transition hover:-translate-y-0.5" href="/register">
              Crear cuenta gratuita
            </Link>
            <Link className="rounded-full border border-white/15 bg-white/[0.08] px-8 py-4 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5" href="/comunidades">
              Explorar comunidades
            </Link>
          </div>
          <p className="mt-5 text-xs text-[#5e8f72]">Sin tarjeta · Sin permanencia</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#dfe9e4] bg-[#eaf3ef]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-[1.2fr_1fr_1fr_1fr] gap-12 px-10 py-14 xl:px-14">
          <div>
            <Link href="/" className="flex items-center gap-2"><Logo /><span className="font-semibold">CoFlow</span></Link>
            <p className="mt-5 max-w-[250px] text-xs leading-5 text-[#66736d]">Vivienda compartida con calma, diseñada para quienes valoran la armonía diaria.</p>
          </div>
          <Footer title="Inquilinos y comunidades" links={[["Buscar habitaciones", "/companeros-de-piso"], ["Explorar comunidades", "/comunidades"], ["Crear perfil", "/register"]]} />
          <Footer title="Propietarios" links={[["Publicar propiedad", "/para-propietarios"], ["Cómo funciona", "/para-propietarios#como-funciona"], ["Contacto", "mailto:soporte@coflowapp.es"]]} />
          <Footer title="Transparencia y legal" links={[["Términos de servicio", "/legal/terminos"], ["Política de privacidad", "/legal/privacidad"], ["Seguridad y verificación", "/legal/privacidad"]]} />
        </div>
        <div className="mx-auto flex max-w-[1440px] items-center justify-between border-t border-[#d7e3dd] px-10 py-6 text-2xs text-[#78847e] xl:px-14">
          <p>Basado en el respeto mutuo, la convivencia transparente y el cuidado del hogar.</p>
          <p>© {new Date().getFullYear()} CoFlow Living S.L.</p>
        </div>
      </footer>

    </div>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function DesktopEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-3xs font-semibold uppercase tracking-[.18em] text-[#617069]">{children}</p>;
}
function DesktopStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-8 text-center first:pl-0 last:pr-0">
      <p className="text-4xl font-bold tracking-tight text-brand-dark">{value}</p>
      <p className="mt-2 text-xs text-[#6b7771]">{label}</p>
    </div>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#eef3f0] px-3 py-2 text-2xs text-[#536159]">{children}</span>;
}
function CrossLine({ children }: { children: React.ReactNode }) {
  return <p className="flex gap-3"><span className="mt-0.5 text-[#b6675d]">×</span><span>{children}</span></p>;
}
function PositiveLine({ children }: { children: React.ReactNode }) {
  return <p className="flex gap-3"><Check className="mt-0.5 shrink-0 text-brand-mid" size={14} /><span>{children}</span></p>;
}
function Footer({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div>
      <h3 className="text-2xs font-semibold uppercase tracking-[.12em]">{title}</h3>
      <div className="mt-5 space-y-3">
        {links.map(([label, href]) => <Link key={label} href={href} className="block text-xs text-[#65726c] transition hover:text-brand-dark">{label}</Link>)}
      </div>
    </div>
  );
}
