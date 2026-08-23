import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, CheckIcon, SearchIcon } from "./icons";

export default function Hero() {
  return (
    <section className="relative min-h-130 overflow-hidden sm:min-h-152 lg:min-h-176">
      <Image
        src="/images/hero/city-night.webp"
        alt="Vista panorámica de una ciudad de noche"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div className="absolute inset-0 bg-linear-to-t from-brand-dark via-brand-dark/75 to-brand-dark/25" />
      <div className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent to-transparent" />

      <div className="relative mx-auto flex min-h-130 max-w-7xl flex-col justify-end px-5 pb-9 pt-24 sm:min-h-[38rem] sm:px-8 sm:pb-16 lg:min-h-[44rem] lg:pb-20">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-300" />
          Lanzamiento en Málaga
        </div>

        <h1 className="mt-4 max-w-xs text-4xl font-black leading-[1.05] tracking-[-0.035em] text-white min-[375px]:text-[2.6rem] min-[375px]:leading-[1.05] sm:max-w-2xl sm:text-6xl lg:text-7xl">
          Encuentra compañeros de piso{" "}
          <span className="text-green-300">compatibles</span>
        </h1>

        <p className="mt-4 max-w-xs text-base leading-7 text-white/85 sm:mt-5 sm:max-w-xl sm:text-xl sm:leading-8">
          Conoce hábitos, presupuesto y forma de convivir antes de decidir
          compartir piso.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-sm font-bold text-white shadow-[0_16px_35px_rgba(0,0,0,0.25)] transition active:scale-[0.98] sm:hover:-translate-y-1 sm:hover:bg-brand-dark"
          >
            Crear mi perfil gratis
            <ArrowRightIcon />
          </Link>

          <a
            href="#personas"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-7 text-sm font-bold text-white backdrop-blur transition active:scale-[0.98] sm:hover:-translate-y-1"
          >
            Explorar personas
            <SearchIcon />
          </a>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/80 sm:mt-7 sm:text-sm">
          <HeroCheckItem text="Perfil gratis" />
          <HeroCheckItem text="Sin compromiso" />
        </div>
      </div>
    </section>
  );
}

function HeroCheckItem({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
        <CheckIcon />
      </span>
      {text}
    </span>
  );
}
