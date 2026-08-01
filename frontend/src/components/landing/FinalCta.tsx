import Link from "next/link";
import { ArrowRightIcon } from "./icons";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-brand px-4 py-16 text-center text-white sm:px-6 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:radial-gradient(circle,white_1.5px,transparent_1.5px)] [background-size:22px_22px]"
      />

      <div className="relative mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
          Empieza cuando quieras
        </p>

        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
          Encuentra una convivencia que tenga sentido para ti.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/85">
          Explora comunidades, conoce personas y habla con ellas antes de
          decidir.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#comunidades"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-dark px-7 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#214F3F]"
          >
            Explorar comunidades
            <ArrowRightIcon />
          </a>

          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/40 px-7 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Crear mi perfil
          </Link>
        </div>
      </div>
    </section>
  );
}
