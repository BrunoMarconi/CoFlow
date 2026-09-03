import Link from "next/link";
import { ArrowRightIcon } from "./icons";

export default function FinalCta() {
  return (
    <section className="px-4 py-8 sm:py-10">
      <div
        aria-hidden="true"
        className="hidden"
      />
      <div
        aria-hidden="true"
        className="hidden"
      />

      <div className="relative mx-auto max-w-xl rounded-[1.65rem] bg-white px-5 py-10 text-center ring-1 ring-black/[0.035]">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
          Empieza cuando quieras
        </p>

        <h2 className="mx-auto mt-4 max-w-lg text-[2rem] font-semibold leading-[1.08] tracking-[-0.045em] text-brand-dark sm:text-[2.5rem]">
          Encuentra una convivencia que tenga sentido para ti.
        </h2>

        <p className="mx-auto mt-4 max-w-md text-[12px] leading-5 text-muted">
          Explora comunidades, conoce personas y escríbeles en privado antes
          de decidir.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#personas"
            className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(20,66,49,0.18)] transition hover:bg-brand-dark"
          >
            Explorar personas
            <ArrowRightIcon />
          </a>

          <Link
            href="/register"
            className="inline-flex h-13 items-center justify-center rounded-full border border-black/8 bg-white px-7 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-black/3"
          >
            Crear mi perfil
          </Link>
        </div>
      </div>
    </section>
  );
}
