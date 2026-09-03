import Image from "next/image";
import { CheckIcon } from "./icons";
import { compatibilityAxes } from "./content";

export default function Compatibility() {
  return (
    <section
      id="compatibilidad"
      className="scroll-mt-24 px-4 py-8 sm:py-10"
    >
      <div className="mx-auto max-w-xl">
        <div className="grid items-center gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
              Más que buscar una habitación
            </p>

            <h2 className="mt-3 max-w-xl text-[2rem] font-semibold leading-[1.08] tracking-[-0.045em] text-brand-dark sm:text-[2.35rem]">
              Tu perfil de convivencia, en un vistazo.
            </h2>

            <p className="mt-3 max-w-xl text-[13px] leading-5 text-muted">
              Al terminar el test de convivencia, CoFlow convierte tus
              respuestas en un perfil visual con 6 ejes: limpieza, energía
              social, horario, economía, forma de resolver conflictos y
              tolerancia. Se muestra en tu perfil y como media en cada
              comunidad (el grupo con el que compartirías piso), para que se
              entienda de un vistazo cómo se convive ahí antes de hablar con
              nadie.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-[1.45rem] bg-white p-2 ring-1 ring-black/[0.035] sm:grid-cols-3">
              {compatibilityAxes.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f5f6f5] px-3 py-2.5 text-[10px] font-semibold text-brand-dark"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <CheckIcon />
                  </span>
                  {item}
                </span>
              ))}
            </div>

            <p className="mt-4 max-w-xl text-[11px] font-semibold leading-5 text-brand-dark">
              CoFlow no decide por ti. Te ayuda a decidir con más información.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[1.65rem] border-[5px] border-brand-dark shadow-[0_18px_45px_rgba(20,55,42,0.16)]">
            <Image
              src="/images/landing-compatibility-radar.png"
              alt="Ejemplo real del perfil de convivencia de CoFlow, con seis ejes: limpieza, energía social, horario, financiero, conflictos y tolerancia"
              width={1144}
              height={1962}
              className="h-auto w-full"
              sizes="(max-width: 640px) 90vw, 420px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
