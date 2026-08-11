import Image from "next/image";
import { ArrowRightIcon } from "./icons";

export default function CityBanner() {
  return (
    <section className="px-5 pb-16 sm:px-8 sm:pb-24 lg:pb-28">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-dark lg:grid-cols-2">
        <div className="relative min-h-70 lg:min-h-95">
          <Image
            src="/images/lifestyle/barcelona-home.webp"
            alt="Edificios y hogares en Barcelona"
            fill
            loading="lazy"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-linear-to-t from-brand-dark/60 to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-brand-dark/40" />
        </div>

        <div className="flex items-center px-7 py-10 text-white sm:px-12 lg:py-12">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl">
              Vivir en la misma ciudad no significa querer vivir de la misma
              manera.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-green-50/80">
              Encuentra personas que encajen con tus horarios, presupuesto y
              forma de convivir.
            </p>

            <a
              href="#ciudades"
              className="mt-7 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-white hover:text-brand-dark"
            >
              Ver comunidades
              <ArrowRightIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

