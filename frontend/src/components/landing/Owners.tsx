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
      className="scroll-mt-24 px-5 py-12 sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-line bg-white shadow-[0_24px_70px_-45px_rgba(12,54,39,0.35)]">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16 xl:p-20">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
                <BuildingIcon />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                Para propietarios en Málaga
              </p>
            </div>

            <h2 className="mt-7 max-w-xl text-3xl font-black tracking-[-0.04em] text-brand-dark sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              Encuentra a la persona adecuada para tu piso.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Publica tu vivienda gratis y recibe solicitudes de personas que
              ya han contado qué buscan, cuánto pueden pagar y cómo conviven.
            </p>

            <div className="mt-7 space-y-3.5 text-sm text-brand-dark sm:text-base">
              {ownerPoints.map((point) => (
                <CheckItem key={point} text={point} />
              ))}
            </div>

            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Link
                href="/register?role=owner"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-7 text-sm font-bold text-white shadow-button transition duration-200 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
              >
                Publicar mi vivienda gratis
                <ArrowRightIcon />
              </Link>
              <span className="text-sm text-secondary">
                Sin tarjeta · Sin permanencia
              </span>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden sm:min-h-[480px] lg:min-h-[620px]">
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
