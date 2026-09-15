"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Check, ChevronRight, Clock3, Eye,
  HeartHandshake, Home, MessageCircle, ShieldCheck,
  Sparkles, Star, Users, VolumeX,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import AppleInteractions from "./AppleInteractions";
import DesktopLanding from "./DesktopLanding";

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useInView<T extends HTMLElement>(threshold = 0.15) {
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

function useAnimProgress(duration = 1200, active = false) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const raf = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [active, duration]);
  return progress;
}

// ── Grain texture overlay ─────────────────────────────────────────────────────

function Grain({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden style={{ opacity }}>
      <filter id="lp-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#lp-grain)" />
    </svg>
  );
}

// ── Animated radar chart ──────────────────────────────────────────────────────

const radarAxes = [
  { label: "Limpieza",      value: 0.85 },
  { label: "Energía social",value: 0.70 },
  { label: "Horario",       value: 0.90 },
  { label: "Economía",      value: 0.75 },
  { label: "Conflictos",    value: 0.80 },
  { label: "Tolerancia",    value: 0.65 },
];

function RadarChart({ progress }: { progress: number }) {
  const cx = 140, cy = 140, r = 95;
  const angle = (i: number) => (i * 60 - 90) * (Math.PI / 180);
  const hex = (frac: number) =>
    Array.from({ length: 6 }, (_, i) =>
      `${cx + r * frac * Math.cos(angle(i))},${cy + r * frac * Math.sin(angle(i))}`
    ).join(" ");
  const dataPoints = radarAxes
    .map(({ value }, i) => {
      const rv = value * progress;
      return `${cx + r * Math.cos(angle(i)) * rv},${cy + r * Math.sin(angle(i)) * rv}`;
    })
    .join(" ");
  const labelR = 1.3;

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[300px] mx-auto" aria-label="Perfil de convivencia CoFlow">
      {/* Grid rings */}
      {[0.33, 0.66, 1].map(f => (
        <polygon key={f} points={hex(f)} fill="none"
          stroke="rgba(255,255,255,0.1)" strokeWidth={f === 1 ? 1.5 : 1} />
      ))}
      {/* Axis lines */}
      {radarAxes.map((_, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {/* Data fill */}
      <polygon points={dataPoints}
        fill="rgba(52,211,153,0.12)"
        stroke="rgba(52,211,153,0.75)"
        strokeWidth="2"
        strokeLinejoin="round" />
      {/* Dots */}
      {radarAxes.map(({ value }, i) => {
        const rv = value * progress;
        return (
          <circle key={i}
            cx={cx + r * Math.cos(angle(i)) * rv}
            cy={cy + r * Math.sin(angle(i)) * rv}
            r="4.5" fill="rgb(52,211,153)"
            stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        );
      })}
      {/* Labels */}
      {radarAxes.map(({ label }, i) => {
        const lx = cx + r * labelR * Math.cos(angle(i));
        const ly = cy + r * labelR * Math.sin(angle(i));
        return (
          <text key={i} x={lx} y={ly}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="rgba(255,255,255,0.65)"
            fontFamily="system-ui, sans-serif" fontWeight="500">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const habitChips = [
  "🌙 Silencio tras las 23h", "☕ Café pausado matutino", "💻 Teletrabajo respetuoso",
  "🧹 Orden compartido", "🏠 Hogar como refugio", "🎯 Planificar juntos",
  "🍳 Cocina consciente", "🤝 Visitas con aviso", "🎵 Música tranquila",
  "📚 Espacio de concentración",
];

const testimonials = [
  { name: "Lucía M.", city: "Málaga", role: "Estudiante de máster", stars: 5,
    text: "Encontré mis compañeras en dos semanas. El perfil de convivencia me dio la confianza para decidir antes de conocerlas en persona." },
  { name: "Andrés P.", city: "Torremolinos", role: "Propietario", stars: 5,
    text: "Como propietario, ahora veo si los candidatos encajan con el ambiente del piso antes de responder. Cambió todo." },
  { name: "Sara K.", city: "Málaga", role: "Freelancer", stars: 5,
    text: "Sin la métrica de convivencia hubiera vuelto a equivocarme de compañero, como con el piso anterior." },
];

const steps = [
  { n: "01", title: "Define tu forma de convivir",
    text: "Completa hábitos, horarios y preferencias para que los demás entiendan cómo eres antes de conocerte." },
  { n: "02", title: "Conoce perfiles y comunidades",
    text: "Consulta presupuesto, ambiente y plazas disponibles antes de escribir a nadie." },
  { n: "03", title: "Entra con acuerdos claros",
    text: "Habla en privado y solicita una plaza solo cuando tenga sentido para ti." },
] as const;

const filterGroups = {
  Personas: [
    { icon: Clock3, title: "Horarios", text: "Compara rutinas y horarios de descanso." },
    { icon: Users, title: "Energía social", text: "Conoce el ambiente de convivencia." },
    { icon: VolumeX, title: "Tolerancia", text: "Entiende límites y preferencias de espacio." },
  ],
  Comunidades: [
    { icon: Users, title: "Plazas abiertas", text: "Encuentra comunidades con sitio disponible." },
    { icon: Home, title: "Aportación mensual", text: "Consulta la aportación de la comunidad." },
    { icon: MessageCircle, title: "Tipo de acceso", text: "Acceso abierto o por solicitud." },
  ],
} as const;
type FilterGroup = keyof typeof filterGroups;

// ── Main component ────────────────────────────────────────────────────────────

export default function ReferenceLanding() {
  const [mounted, setMounted] = useState(false);
  const [activeGroup, setActiveGroup] = useState<FilterGroup>("Personas");
  const [selectedFilter, setSelectedFilter] = useState(0);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { ref: statsRef, inView: statsIn } = useInView<HTMLElement>(0.3);
  const { ref: radarRef, inView: radarIn } = useInView<HTMLElement>(0.25);
  const { ref: stepsRef, inView: stepsIn } = useInView<HTMLElement>(0.1);
  const { ref: testiRef, inView: testiIn } = useInView<HTMLElement>(0.1);
  const { ref: bentoRef, inView: bentoIn } = useInView<HTMLElement>(0.1);

  const c1 = useCountUp(500, 1600, statsIn);
  const c2 = useCountUp(48, 1400, statsIn);
  const c3 = useCountUp(94, 1500, statsIn);
  const radarP = useAnimProgress(1400, radarIn);

  const chips = [...habitChips, ...habitChips]; // double for seamless marquee

  return (
    <main className="motion-landing min-h-dvh text-brand-dark">
      <AppleInteractions />
      <DesktopLanding />

      <div className="lg:hidden">

        {/* ── NAVBAR ── */}
        <header className="sticky top-0 z-50 border-b border-black/[0.055] bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
            <Link href="/" className="flex items-center gap-2" aria-label="CoFlow, inicio">
              <Logo /><span className="text-base font-semibold">CoFlow</span>
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link href="/para-propietarios" className="flex h-10 items-center rounded-full bg-[#edf2ef] px-3 text-xs font-semibold text-brand-mid">
                Tengo vivienda
              </Link>
              <Link href="/register" className="flex h-10 items-center rounded-full bg-brand-mid px-3.5 text-xs font-semibold text-white">
                Empezar
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#0b1a11] px-4 pb-14 pt-10">
          <Grain opacity={0.045} />
          {/* Animated orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="hero-orb-1 absolute -left-28 -top-28 h-[340px] w-[340px] rounded-full bg-[#1a3f28] opacity-80 blur-[80px]" />
            <div className="hero-orb-2 absolute -right-20 top-12 h-[280px] w-[280px] rounded-full bg-[#234f35] opacity-65 blur-[70px]" />
            <div className="hero-orb-3 absolute bottom-0 left-1/3 h-[200px] w-[200px] rounded-full bg-[#12311d] opacity-55 blur-[60px]" />
          </div>

          <div className="relative">
            {/* Eyebrow */}
            <div className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 backdrop-blur-sm transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300">Compañeros de piso · Málaga</span>
            </div>

            {/* Animated headline */}
            <h1 className="optical-display mt-5 text-[clamp(38px,10.5vw,52px)] font-semibold leading-[0.95] tracking-[-0.055em]">
              {[
                { text: "El piso correcto", color: "text-white", delay: "0.15s" },
                { text: "empieza por", color: "text-white", delay: "0.3s" },
                { text: "las personas", color: "text-white", delay: "0.45s" },
                { text: "correctas.", color: "text-[#6dba8e]", delay: "0.6s" },
              ].map(({ text, color, delay }) => (
                <span key={text} className={`block transition-all duration-700 ${color} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                  style={{ transitionDelay: delay }}>
                  {text}
                </span>
              ))}
            </h1>

            <p className={`mt-5 max-w-[330px] text-sm leading-6 text-[#8ab8a0] transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "0.75s" }}>
              Conoce hábitos, presupuesto y forma de convivir antes de compartir espacio con alguien.
            </p>

            {/* CTAs */}
            <div className={`mt-7 flex flex-col gap-2.5 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "0.9s" }}>
              <Link href="/register"
                className="flex h-12 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(52,211,153,0.38)]">
                Crear mi perfil gratis <ArrowRight className="ml-1.5" size={14} />
              </Link>
              <Link href="/comunidades"
                className="flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-xs font-medium text-[#b0d0be] backdrop-blur-sm">
                Explorar comunidades <ChevronRight className="ml-1" size={12} />
              </Link>
            </div>
            <p className="mt-3 text-center text-xs text-[#4d7a60]">Gratis · Sin tarjeta · Tú eliges con quién hablar</p>

            {/* Floating notification */}
            <div className="notification-float mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.09] p-3 backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl shadow-[0_4px_16px_rgba(52,211,153,0.45)]">
                🎉
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">Nueva coincidencia</p>
                <p className="truncate text-[11px] text-[#88b8a0]">María · 94% de afinidad en convivencia</p>
              </div>
              <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>

            {/* Hero community card */}
            <article data-apple-tilt className="apple-tilt mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.08] p-2 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
              <div className="relative aspect-[1.65] overflow-hidden rounded-[22px]">
                <Image src="/images/create-community-living-room.webp" alt="Salón de una comunidad CoFlow"
                  fill priority sizes="448px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                  Comunidad
                </span>
                <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Málaga
                </span>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-white/70">Plazas abiertas</p>
                    <p className="text-sm font-semibold text-white">Comunidad en Centro</p>
                  </div>
                  <Link href="/comunidades"
                    className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
                    Ver <ChevronRight size={11} />
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="overflow-hidden border-b border-black/[0.04] bg-white py-4">
          <div className="marquee-track flex gap-3 whitespace-nowrap">
            {chips.map((chip, i) => (
              <span key={i} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f0f4f2] px-3.5 py-2 text-xs font-medium text-[#3d5448]">
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <section ref={statsRef} className="bg-white px-4 py-11">
          <div className="grid grid-cols-3 divide-x divide-black/[0.055]">
            {[
              { val: statsIn ? `+${c1}` : "+0", label: "Personas activas" },
              { val: statsIn ? String(c2) : "0", label: "Comunidades" },
              { val: statsIn ? `${c3}%` : "0%", label: "Afinidad media" },
            ].map(({ val, label }, i) => (
              <div key={i} className="px-3 text-center">
                <p className="text-[28px] font-bold tracking-tight text-brand-dark">{val}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#7a817d]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── BENTO FEATURES ── */}
        <section ref={bentoRef} className="bg-[#f2f4f2] px-4 py-12">
          <Eyebrow>Por qué CoFlow</Eyebrow>
          <Title>Convivencia pensada desde las personas</Title>
          <Copy>Sin intuición a ciegas. Con contexto real antes de cada decisión.</Copy>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {/* Big left card */}
            <div className={`col-span-2 rounded-3xl bg-[#0b1a11] p-6 transition-all duration-700 delay-[100ms] ${bentoIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <Grain opacity={0.04} />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                <HeartHandshake size={20} className="text-emerald-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Afinidad humana real</h3>
              <p className="mt-2 text-sm leading-5 text-[#7db898]">Conoce hábitos, rutinas y preferencias antes de compartir hogar.</p>
            </div>
            {/* Card 2 */}
            <div className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all duration-700 delay-[200ms] ${bentoIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf5f0]">
                <Eye size={17} className="text-brand-mid" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">Trato honesto</h3>
              <p className="mt-1.5 text-xs leading-5 text-[#747a76]">Tú decides qué compartes y con quién hablas.</p>
            </div>
            {/* Card 3 */}
            <div className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all duration-700 delay-[300ms] ${bentoIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf5f0]">
                <MessageCircle size={17} className="text-brand-mid" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">Sin presiones</h3>
              <p className="mt-1.5 text-xs leading-5 text-[#747a76]">Habla en privado cuando quieras.</p>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section ref={stepsRef} id="como-funciona" className="bg-white px-4 py-12">
          <Eyebrow>El viaje CoFlow</Eyebrow>
          <Title>Tu camino hacia el hogar adecuado</Title>
          <Copy>Un proceso abierto, humano y transparente desde el primer instante.</Copy>

          <div className="relative mt-8 pl-[52px]">
            {/* Vertical connecting line */}
            <div className="absolute left-5 top-5 h-[calc(100%-40px)] w-px bg-gradient-to-b from-brand-mid/50 via-brand-mid/20 to-transparent" />

            {steps.map((step, i) => (
              <div key={step.n}
                className={`relative mb-8 last:mb-0 transition-all duration-700 ${stepsIn ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
                style={{ transitionDelay: `${i * 150}ms` }}>
                {/* Step number circle */}
                <div className="absolute -left-[52px] top-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-mid text-xs font-bold text-white shadow-[0_6px_18px_rgba(49,95,75,0.4)]">
                  {step.n}
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#737a76]">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMPATIBILITY RADAR ── */}
        <section ref={radarRef} className="relative overflow-hidden bg-[#0b1a11] px-4 py-14">
          <Grain opacity={0.04} />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="hero-orb-1 absolute -right-24 -top-16 h-[300px] w-[300px] rounded-full bg-[#1a3f28] opacity-70 blur-[72px]" />
            <div className="hero-orb-2 absolute -left-16 bottom-0 h-[240px] w-[240px] rounded-full bg-[#234f35] opacity-55 blur-[64px]" />
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">
              <Sparkles size={9} />Métrica de convivencia
            </span>
            <h2 className="optical-display mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-white">
              Tu forma de convivir,<br />en un vistazo.
            </h2>
            <p className="mt-3 max-w-[330px] text-sm leading-6 text-[#8ab8a0]">
              Tus respuestas se organizan en seis ejes para que todos entiendan cómo prefieres compartir hogar.
            </p>

            {/* SVG Radar */}
            <div className="mt-7 overflow-hidden rounded-3xl bg-[#0f2318] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
              <RadarChart progress={radarP} />
            </div>

            {/* Progress bars */}
            <div className="mt-6 space-y-3">
              {radarAxes.map(({ label, value }) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-white/75">{label}</span>
                    <span className="text-xs font-semibold text-emerald-400">{Math.round(value * radarP * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-1000 ease-out"
                      style={{ width: `${value * radarP * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-xs font-semibold text-emerald-400">
              CoFlow no decide por ti. Te ayuda a decidir con más información.
            </p>
            <Link href="/register"
              className="mt-5 flex h-12 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(52,211,153,0.38)]">
              Crear mi perfil gratis <ArrowRight className="ml-1.5" size={14} />
            </Link>
          </div>
        </section>

        {/* ── FILTERS ── */}
        <section className="bg-white px-4 py-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.035] px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#65706a]">
            <Sparkles size={9} />Afinidad estructurada
          </span>
          <Title>Filtra por lo que importa de verdad</Title>
          <Copy>Elige por bloques esenciales de convivencia antes de tomar ninguna decisión.</Copy>

          <div className="mt-5 rounded-[24px] bg-[#f4f4f7] p-3 shadow-inner">
            <div role="tablist" className="grid grid-cols-2 rounded-[16px] bg-white p-1 text-center text-xs shadow-sm">
              {(Object.keys(filterGroups) as FilterGroup[]).map((group) => (
                <button key={group} type="button" role="tab" aria-selected={activeGroup === group}
                  onClick={() => { setActiveGroup(group); setSelectedFilter(0); }}
                  className={`rounded-[12px] px-2 py-2.5 font-medium transition-all duration-200 ${activeGroup === group ? "bg-brand-mid text-white shadow-md" : "text-[#747b77]"}`}>
                  {group}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {filterGroups[activeGroup].map(({ icon: Icon, title, text }, index) => (
                <button type="button" key={title} onClick={() => setSelectedFilter(index)}
                  aria-pressed={selectedFilter === index}
                  className={`flex w-full items-center gap-3 rounded-[18px] p-3.5 text-left transition-all duration-200 ${selectedFilter === index ? "bg-white shadow-lg ring-2 ring-brand-mid/20" : "bg-white/60 hover:bg-white/90"}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${selectedFilter === index ? "bg-brand-mid text-white shadow-md" : "bg-[#edf3ef] text-brand-mid"}`}>
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs text-[#808682]">{text}</p>
                  </div>
                  <span className={`h-4 w-4 shrink-0 rounded-full border-2 transition-all ${selectedFilter === index ? "border-brand-mid bg-brand-mid" : "border-black/10 bg-white"}`} />
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-black/[0.05] pt-3">
              <span className="flex items-center gap-1.5 text-xs text-[#75807a]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />6 ejes de convivencia
              </span>
              <Link href="/register" className="flex items-center gap-1 rounded-full bg-brand-mid px-3 py-2 text-xs font-semibold text-white">
                Crear perfil <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section ref={testiRef} className="bg-[#f2f4f2] px-4 py-12">
          <Eyebrow>Lo que dicen</Eyebrow>
          <Title>Experiencias reales</Title>
          <div className="mt-5 space-y-3">
            {testimonials.map((t, i) => (
              <div key={i}
                className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all duration-700 ${testiIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-[#3a423e]">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-2 border-t border-black/[0.05] pt-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-bold text-brand-mid">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className="text-[11px] text-[#7a817d]">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── OWNERS ── */}
        <section id="propietarios" className="bg-white px-4 py-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.035] px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#65706a]">
            <Sparkles size={9} />Para propietarios · Gratis
          </span>
          <Title>Tu patrimonio en manos cuidadosas</Title>
          <Copy>Publica tu vivienda y conoce las preferencias de convivencia antes de responder a nadie.</Copy>
          <div className="mt-5 overflow-hidden rounded-[28px] shadow-[0_16px_48px_rgba(31,58,47,0.1)] ring-1 ring-black/[0.05]">
            <div className="relative aspect-[1.75] overflow-hidden">
              <Image src="/images/owners-malaga-apartment-v2.png" alt="Vivienda en Málaga" fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium backdrop-blur-sm">Málaga</span>
              </div>
            </div>
            <div className="bg-white p-5">
              <div className="space-y-2.5">
                <CheckLine>Presupuesto y preferencias visibles antes de responder</CheckLine>
                <CheckLine>Solicitudes desde Málaga con perfil completo</CheckLine>
                <CheckLine>Control directo de cada conversación</CheckLine>
                <CheckLine>Publicación gratuita · Sin tarjeta · Sin permanencia</CheckLine>
              </div>
              <Link href="/register?role=owner"
                className="mt-5 flex h-12 items-center justify-center rounded-full bg-brand-mid text-sm font-semibold text-white shadow-[0_8px_24px_rgba(49,95,75,0.28)]">
                Publicar mi vivienda gratis <ArrowRight className="ml-1.5" size={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative overflow-hidden bg-[#0b1a11] px-4 py-16 text-center">
          <Grain opacity={0.045} />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="hero-orb-2 absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-[#1a3f28] opacity-65 blur-[72px]" />
            <div className="hero-orb-3 absolute -left-16 bottom-0 h-[220px] w-[220px] rounded-full bg-[#234f35] opacity-55 blur-[60px]" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-2xl backdrop-blur-sm">
              🏠
            </div>
            <h2 className="optical-display text-[clamp(32px,9vw,48px)] font-semibold leading-[1.04] tracking-[-0.045em] text-white">
              Comienza una nueva<br />etapa residencial
            </h2>
            <p className="mx-auto mt-4 max-w-[310px] text-sm leading-6 text-[#7ab898]">
              Únete a una comunidad donde la convivencia armónica sea una realidad cotidiana.
            </p>
            <Link href="/register"
              className="mx-auto mt-7 flex h-12 max-w-xs items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(52,211,153,0.42)]">
              Crear cuenta gratuita
            </Link>
            <p className="mt-3 text-xs text-[#4d7a60]">Sin tarjeta · Sin permanencia</p>
            <p className="mt-5 text-xs text-[#3d6050]">
              ¿Dudas? <a href="mailto:soporte@coflowapp.es" className="text-emerald-400 underline underline-offset-2">Escríbenos</a>
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-black/5 bg-[#eeeff2] px-4 py-10">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2"><Logo /><span className="text-sm font-semibold">CoFlow</span></Link>
            <p className="mt-3 text-xs text-[#8b918e]">Convivir en armonía. Alquilar con serenidad.</p>
            <div className="mt-7 grid grid-cols-2 gap-6 text-left">
              <FCol title="Para particulares" links={[["Compañeros de piso en Málaga", "/companeros-de-piso"], ["Explorar comunidades", "/comunidades"], ["Crear perfil", "/register"]]} />
              <FCol title="Para propietarios" links={[["Publicar vivienda", "/para-propietarios"], ["Cómo funciona", "/para-propietarios#como-funciona"], ["Contacto", "mailto:soporte@coflowapp.es"]]} />
            </div>
            <div className="mt-7 rounded-full bg-white px-3 py-2 text-xs text-[#68716c]">
              <ShieldCheck className="mr-1 inline" size={10} />Respeto mutuo, afinidad real y convivencia transparente.
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-[#8b918e]">
              <Link href="/legal/privacidad">Privacidad</Link>
              <Link href="/legal/terminos">Términos</Link>
              <a href="mailto:soporte@coflowapp.es">Contacto</a>
            </div>
            <p className="mt-3 text-xs text-[#9a9f9c]">© {new Date().getFullYear()} CoFlow</p>
          </div>
        </footer>

      </div>
    </main>
  );
}

// ── Tiny components ───────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#69736e]">{children}</p>;
}
function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-2 text-4xl font-semibold leading-[1.04] tracking-[-0.045em]">{children}</h2>;
}
function Copy({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 max-w-[600px] text-sm leading-6 text-[#777e7a]">{children}</p>;
}
function CheckLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-[#3a4440]">
      <Check className="mt-0.5 shrink-0 text-emerald-600" size={14} />{children}
    </p>
  );
}
function FCol({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em]">{title}</h3>
      <div className="mt-3 space-y-2">
        {links.map(([label, href]) => <Link key={label} href={href} className="block text-xs text-[#707874]">{label}</Link>)}
      </div>
    </div>
  );
}
