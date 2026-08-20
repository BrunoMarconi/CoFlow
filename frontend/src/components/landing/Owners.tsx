import Image from "next/image";
import Link from "next/link";
import { CheckItem } from "./shared";
import { ArrowRightIcon, BuildingIcon } from "./icons";

const ownerPoints = [
  "Publicación gratuita, sin tarjeta ni permanencia",
  "Perfiles con presupuesto, horarios y hábitos de convivencia",
  "Tú decides con quién hablar: menos mensajes que no encajan",
] as const;

export default function Owners() {
  return (
    <section
      id="propietarios"
      className="scroll-mt-24 px-5 py-12 sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-line bg-surface-soft">
        <div className="grid items-center gap-10 p-7 sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
          <div>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
              <BuildingIcon />
            </span>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-brand">
              Propietarios en Málaga
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.03em] text-brand-dark sm:text-4xl lg:text-5xl">
              Encuentra inquilinos que encajen con tu vivienda.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              Publica gratis tu piso o habitación y recibe solicitudes de
              personas que ya han indicado su presupuesto y cómo conviven. Sin
              llamadas comerciales, sin tarjeta y sin exclusividad.
            </p>

            <div className="mt-7 space-y-3 text-brand-dark">
              {ownerPoints.map((point) => (
                <CheckItem key={point} text={point} />
              ))}
            </div>

            <Link
              href="/register?role=owner"
              className="mt-9 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-green-400"
            >
              Publicar gratis en Málaga
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="relative mx-auto h-56 w-full max-w-sm sm:h-72">
            <Image
              src="/images/profile-owner-house-3d.webp"
              alt="Ilustración de una vivienda"
              fill
              sizes="(max-width: 640px) 80vw, 420px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
