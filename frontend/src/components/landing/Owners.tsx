import Image from "next/image";
import Link from "next/link";
import { CheckItem } from "./shared";
import { ArrowRightIcon, BuildingIcon } from "./icons";

const ownerPoints = [
  "Conoce su presupuesto y forma de convivir antes de responder",
  "Recibe solicitudes directamente desde Málaga",
  "Tú mantienes siempre el control de la conversación",
] as const;

export default function Owners() {
  return (
    <section
      id="propietarios"
      className="scroll-mt-24 px-4 py-8 sm:py-10"
    >
      <div className="mx-auto max-w-xl overflow-hidden rounded-[1.65rem] bg-white ring-1 ring-black/[0.035]">
        <div className="grid">
          <div className="flex flex-col justify-center p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
                <BuildingIcon />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                Para propietarios en Málaga
              </p>
            </div>

            <h2 className="mt-5 max-w-xl text-[2rem] font-semibold leading-[1.08] tracking-[-0.045em] text-brand-dark sm:text-[2.35rem]">
              Encuentra a la persona adecuada para tu piso.
            </h2>

            <p className="mt-3 max-w-xl text-[13px] leading-5 text-muted">
              Publica tu vivienda gratis y recibe solicitudes de personas que
              ya han contado qué buscan, cuánto pueden pagar y cómo conviven.
            </p>

            <div className="mt-5 space-y-2.5 rounded-[1.25rem] bg-[#f3f6f3] p-4 text-[11px] leading-4 text-brand-dark">
              {ownerPoints.map((point) => (
                <CheckItem key={point} text={point} />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/register?role=owner"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-xs font-semibold text-white shadow-button transition duration-200 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
              >
                Publicar mi vivienda gratis
                <ArrowRightIcon />
              </Link>
              <span className="text-center text-[10px] text-secondary">
                Sin tarjeta · Sin permanencia
              </span>
            </div>
          </div>

          <div className="relative order-first min-h-[260px] overflow-hidden sm:min-h-[340px]">
            <Image
              src="/images/owners-malaga-apartment-v2.png"
              alt="Salón luminoso de una vivienda en Málaga"
              fill
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="object-cover"
              quality={88}
            />

            <div className="absolute inset-x-5 bottom-5 flex flex-wrap gap-2 sm:inset-x-8 sm:bottom-8">
              <span className="rounded-full border border-white/70 bg-white/95 px-4 py-2 text-xs font-bold text-brand-dark shadow-soft backdrop-blur-sm sm:text-sm">
                Publicación gratuita
              </span>
              <span className="rounded-full border border-white/70 bg-white/95 px-4 py-2 text-xs font-bold text-brand-dark shadow-soft backdrop-blur-sm sm:text-sm">
                Solo Málaga
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
