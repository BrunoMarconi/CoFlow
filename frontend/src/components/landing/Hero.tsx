import Image from "next/image";
import { CheckItem, Logo } from "./shared";
import { ArrowRightIcon, CommunityIcon, PlayIcon, SearchIcon, SparklesIcon } from "./icons";

export default function Hero() {
  return (
    <section className="relative px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:pb-24">
      <div className="pointer-events-none absolute left-[-8rem] top-10 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-24 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.13em] text-brand-dark">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Encuentra personas, no solo habitaciones
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.045em] text-brand-dark sm:text-6xl lg:text-[4.6rem]">
            No busques solo una habitación.
            <span className="block text-brand">
              Encuentra una convivencia que encaje contigo.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl">
            Descubre comunidades, conoce a tus futuros compañeros y habla con
            ellos antes de compartir vivienda.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#comunidades"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-sm font-bold text-white shadow-[0_16px_35px_rgba(22,163,74,0.28)] transition hover:-translate-y-1 hover:bg-brand-dark"
            >
              Explorar comunidades
              <ArrowRightIcon />
            </a>

            <a
              href="#personas"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-7 text-sm font-bold text-brand-dark shadow-sm transition hover:-translate-y-1 hover:border-brand/30"
            >
              Descubrir personas
              <PlayIcon />
            </a>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-muted">
            <CheckItem text="Crear cuenta gratis" />
            <CheckItem text="Sin compromisos" />
            <CheckItem text="Disponible en España" />
          </div>
        </div>

        <HeroProductMockup />
      </div>
    </section>
  );
}

function HeroProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[820px] pb-10 sm:pb-12">
      <div className="absolute bottom-0 right-0 top-0 w-[94%] overflow-hidden rounded-[2.5rem] shadow-[0_25px_70px_rgba(22,59,46,0.18)]">
        <Image
          src="/images/hero/madrid.webp"
          alt="Gran Vía de Madrid"
          fill
          priority
          sizes="(max-width: 1024px) 92vw, 42vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-linear-to-l from-transparent via-brand-dark/5 to-brand-dark/45" />

        <div className="absolute bottom-5 right-5 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-xs font-bold text-white backdrop-blur">
          Madrid · Encuentra dónde encajar
        </div>
      </div>

      <div className="absolute -left-6 top-16 z-20 hidden rounded-2xl border border-white bg-white p-4 shadow-xl sm:block">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <SparklesIcon />
          </span>

          <div>
            <p className="text-xs font-semibold text-muted">Compatibilidad</p>
            <p className="mt-1 text-sm font-bold text-brand-dark">
              Hábitos claros
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-[78%] -rotate-[1deg] rounded-[2.25rem] border border-white/80 bg-white p-3 shadow-[0_30px_90px_rgba(22,59,46,0.24)] sm:w-[76%]">
        <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface-soft">
          <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <Logo size="sm" />

              <div>
                <p className="text-xs font-semibold text-muted">Descubrir</p>
                <p className="text-sm font-bold text-brand-dark">
                  Comunidades y personas
                </p>
              </div>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
              <CommunityIcon />
            </span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              <SearchIcon />
              <span className="text-sm text-muted">
                Buscar por ciudad o barrio
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <MockCommunityCard
                name="Casa Teatinos"
                location="Teatinos, Málaga"
                initials="CT"
                type="Abierta"
                capacity="3 de 4"
              />

              <MockCommunityCard
                name="Piso Alameda"
                location="Centro, Málaga"
                initials="PA"
                type="Con solicitud"
                capacity="2 de 4"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand">
                    Preferencias
                  </p>
                  <p className="mt-2 text-base font-bold text-brand-dark">
                    Cómo queremos convivir
                  </p>
                </div>

                <span className="rounded-full bg-brand/10 px-3 py-2 text-xs font-bold text-brand-dark">
                  8 respuestas
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniPreference label="Limpieza" value="Organizada" />
                <MiniPreference label="Ambiente" value="Tranquilo" />
                <MiniPreference label="Mascotas" value="Aceptadas" />
                <MiniPreference label="Visitas" value="Con aviso" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCommunityCard({
  name,
  location,
  initials,
  type,
  capacity,
}: {
  name: string;
  location: string;
  initials: string;
  type: string;
  capacity: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="bg-linear-to-br from-brand-dark to-brand p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xs font-black text-white">
            {initials}
          </span>

          <span className="rounded-full bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white">
            {type}
          </span>
        </div>

        <p className="mt-6 text-base font-bold text-white">{name}</p>
        <p className="mt-1 text-xs text-green-100">{location}</p>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-semibold text-muted">Miembros</span>
        <span className="text-xs font-bold text-brand-dark">{capacity}</span>
      </div>
    </article>
  );
}

function MiniPreference({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-soft p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-xs font-bold text-brand-dark">{value}</p>
    </div>
  );
}
