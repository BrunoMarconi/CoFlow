import Image from "next/image";
import { CheckIcon } from "./icons";
import { compatibilityAxes } from "./content";

export default function Compatibility() {
  return (
    <section
      id="compatibilidad"
      className="scroll-mt-24 bg-brand-dark px-5 py-12 text-white sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-300">
              Más que buscar una habitación
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              Tu perfil de convivencia, en un vistazo.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-green-50/80">
              Al terminar el test de convivencia, CoFlow convierte tus
              respuestas en un perfil visual con 6 ejes: limpieza, energía
              social, horario, economía, forma de resolver conflictos y
              tolerancia. Se muestra en tu perfil y como media en cada
              comunidad, para que se entienda de un vistazo cómo se convive
              ahí antes de hablar con nadie.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {compatibilityAxes.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-400 text-brand-dark">
                    <CheckIcon />
                  </span>
                  {item}
                </span>
              ))}
            </div>

            <p className="mt-8 max-w-xl text-base font-semibold leading-7 text-green-50/90">
              CoFlow no decide por ti. Te ayuda a decidir con más información.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/10 sm:max-w-md">
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
