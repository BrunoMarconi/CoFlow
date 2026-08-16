import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckIcon } from "@/components/landing/icons";
import { BlockIcon, ChatIcon, FlagIcon, LockIcon, MailCheckIcon } from "@/components/landing/icons";
import { compatibilityAxes, howItWorksSteps, safetyPoints } from "@/components/landing/content";
import { seoCities, type SeoCity } from "@/lib/seoCities";

const SAFETY_ICONS = {
  block: BlockIcon,
  flag: FlagIcon,
  lock: LockIcon,
  chat: ChatIcon,
  mail: MailCheckIcon,
} as const;

/* Server Component 100% estático (sin "use client", sin framer-motion):
 * estas páginas existen para indexarse y cargar rápido, no para
 * animarse — la home ya cubre la experiencia interactiva de marca. */
export default function CityLandingPage({ city }: { city: SeoCity }) {
  const otherCities = seoCities.filter((item) => item.slug !== city.slug);

  return (
    <main className="min-h-dvh overflow-hidden bg-background text-brand-dark">
      <Navbar />

      {/* Hero */}
      <section className="relative px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.13em] text-brand-dark shadow-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
              {city.region}
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.05] tracking-[-0.04em] text-brand-dark sm:text-5xl lg:text-6xl">
              Compañeros de piso en{" "}
              <span className="text-brand">{city.name}</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              {city.intro}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-sm font-bold text-white shadow-[0_16px_35px_rgba(22,163,74,0.28)] transition hover:-translate-y-1 hover:bg-brand-dark"
              >
                Crear mi perfil gratis
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-7 text-sm font-bold text-brand-dark shadow-sm transition hover:-translate-y-1 hover:border-brand/30"
              >
                Ver cómo funciona
              </a>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
              CoFlow está disponible en toda España, no solo en {city.name}.
            </p>
          </div>

          <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-[0_25px_70px_rgba(22,59,46,0.18)]">
            <Image
              src={city.image}
              alt={`Vista de ${city.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-brand-dark/50 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-24 bg-white px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Cómo funciona</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.03em] text-brand-dark sm:text-4xl">
            De desconocidos a compañeros compatibles en {city.name}
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {howItWorksSteps.map((step) => (
              <div key={step.number}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
                  {step.number}
                </span>
                <h3 className="mt-4 text-xl font-bold text-brand-dark">{step.title}</h3>
                <p className="mt-2 text-base leading-7 text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compatibilidad */}
      <section className="bg-brand-dark px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-300">
            Más que buscar una habitación
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            Tu perfil de convivencia, en un vistazo.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-green-50/80">
            CoFlow convierte tus respuestas a un test breve en un perfil visual con 6 ejes, para que quien viva en{" "}
            {city.name} pueda ver de un vistazo cómo convives, antes de escribirte.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {compatibilityAxes.map((axis) => (
              <span
                key={axis}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-400 text-brand-dark">
                  <CheckIcon />
                </span>
                {axis}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Seguridad y confianza */}
      <section className="bg-white px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-dark px-6 py-12 text-white sm:px-12 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-300">Seguridad y confianza</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            Tú decides con quién compartes piso.
          </h2>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {safetyPoints.map((point) => {
              const Icon = SAFETY_ICONS[point.icon];
              return (
                <div key={point.title} className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-400/15 text-green-300">
                    <Icon />
                  </span>
                  <p className="mt-4 text-base font-bold text-white">{point.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-green-50/70">{point.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Otras ciudades + enlaces internos */}
      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Toda España</p>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-brand-dark sm:text-3xl">
            CoFlow también está en otras ciudades
          </h2>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {otherCities.map((item) => (
              <Link
                key={item.slug}
                href={`/companeros-de-piso/${item.slug}`}
                className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-bold text-brand-dark shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30"
              >
                Compañeros de piso en {item.name}
              </Link>
            ))}
            <Link
              href="/companeros-de-piso"
              className="rounded-full border border-line bg-surface-soft px-4 py-2.5 text-sm font-bold text-secondary transition hover:-translate-y-0.5 hover:border-brand/30"
            >
              Ver todas las ciudades
            </Link>
          </div>

          <p className="mt-6 text-sm leading-7 text-muted">
            ¿Tienes dudas sobre cómo funciona CoFlow? Consulta las{" "}
            <Link href="/#preguntas" className="font-bold text-primary-dark underline underline-offset-2">
              preguntas frecuentes
            </Link>{" "}
            o revisa las{" "}
            <Link href="/legal/normas-comunidad" className="font-bold text-primary-dark underline underline-offset-2">
              normas de la comunidad
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-dark px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <h2 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            Encuentra tu compañero de piso ideal en {city.name}.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-green-50/80">
            Crear tu perfil y explorar personas compatibles no tiene coste en CoFlow.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-8 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-green-400"
          >
            Crear mi perfil gratis
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
