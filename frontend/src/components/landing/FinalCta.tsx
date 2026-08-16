import Link from "next/link";
import { ArrowRightIcon } from "./icons";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-brand-dark px-5 py-16 text-center text-white sm:px-8 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/15 sm:-right-24 sm:-top-24 sm:h-96 sm:w-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 hidden h-40 w-40 rounded-full border border-white/10 sm:block"
      />

      <div className="relative mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-300">
          Empieza cuando quieras
        </p>

        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
          Encuentra una convivencia que tenga sentido para ti.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-green-50/80">
          Explora comunidades, conoce personas y escríbeles en privado antes
          de decidir.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#personas"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-green-400"
          >
            Explorar personas
            <ArrowRightIcon />
          </a>

          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/30 px-7 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Crear mi perfil
          </Link>
        </div>
      </div>
    </section>
  );
}
