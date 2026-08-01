import Link from "next/link";
import { ArrowRightIcon } from "./icons";

export default function FinalCta() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-linear-to-br from-green-400 to-brand px-6 py-14 text-center text-white sm:px-12 sm:py-18">
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-36 -right-20 h-96 w-96 rounded-full bg-brand-dark/15" />

        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Encuentra una convivencia que tenga sentido para ti.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">
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
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/40 bg-white/15 px-7 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              Crear mi perfil
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
