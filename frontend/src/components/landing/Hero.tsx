import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, CheckIcon } from "./icons";

export default function Hero() {
  return (
    <section className="px-4 pb-8 pt-5 sm:pt-8">
      <div className="mx-auto max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.035] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Lanzamiento en Málaga
        </div>
        <h1 className="mt-4 text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.06em] text-brand-dark sm:text-[3.5rem]">Encuentra compañeros de piso compatibles.</h1>
        <p className="mt-4 max-w-lg text-[15px] leading-6 text-secondary">Conoce hábitos, presupuesto y forma de convivir antes de decidir compartir piso.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href="/register" className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-brand-dark shadow-sm ring-1 ring-black/5">Crear mi perfil</Link>
          <Link href="/para-propietarios" className="inline-flex h-10 items-center justify-center rounded-full bg-black/[0.045] px-4 text-xs font-semibold text-secondary">Soy propietario</Link>
        </div>
        <article className="mt-6 overflow-hidden rounded-[1.65rem] bg-white p-2 shadow-[0_14px_40px_rgba(18,49,38,0.08)] ring-1 ring-black/[0.045]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem]">
            <Image src="/images/lifestyle/barcelona-home.webp" alt="Interior luminoso de una vivienda compartida" fill priority sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-black/10" />
            <span className="absolute left-3 top-3 rounded-full bg-brand-dark/80 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-lg">Comunidad</span>
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-brand-dark backdrop-blur-lg"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Málaga</span>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-3 py-1.5 text-[10px] text-white backdrop-blur-lg">Plazas disponibles</span>
          </div>
          <div className="px-2 pb-2 pt-3">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-[15px] font-semibold tracking-[-0.025em] text-brand-dark">Comunidades en Málaga</h2><p className="mt-1 text-[11px] leading-4 text-muted">Conoce las preferencias de convivencia y las condiciones de cada plaza antes de decidir.</p></div>
              <span className="shrink-0 rounded-full bg-black/[0.035] px-2.5 py-1 text-[9px] text-secondary">Málaga</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-medium text-brand-dark"><span className="rounded-full bg-[#f1f4ef] px-2.5 py-1.5">Preferencias</span><span className="rounded-full bg-[#f1f4ef] px-2.5 py-1.5">Presupuesto</span><span className="rounded-full bg-[#f1f4ef] px-2.5 py-1.5">Plazas abiertas</span></div>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
              <span className="text-[10px] font-medium text-secondary">Explora antes de decidir</span>
              <Link href="/comunidades" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-[10px] font-semibold text-white">Ver comunidades <ArrowRightIcon /></Link>
            </div>
          </div>
        </article>
        <div className="mt-4 flex justify-center gap-4 text-[10px] font-medium text-secondary"><span className="flex items-center gap-1"><CheckIcon /> Perfil gratis</span><span className="flex items-center gap-1"><CheckIcon /> Sin compromiso</span></div>
      </div>
    </section>
  );
}
