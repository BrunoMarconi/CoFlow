import { SectionHeader } from "./shared";
import { CheckIcon, CloseIcon } from "./icons";
import { trustPoints } from "./content";

export default function Trust() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-dark px-6 py-12 text-white sm:px-12 sm:py-16">
        <SectionHeader
          eyebrow="Antes de decidir"
          title="Más información antes de tomar una decisión importante."
          tone="dark"
        />

        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/10 sm:mt-12">
          <div className="grid sm:grid-cols-2">
            <p className="border-b border-white/10 bg-white/4 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white/50 sm:border-b-0 sm:border-r">
              Sin CoFlow
            </p>
            <p className="border-b border-white/10 bg-green-400/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-green-300">
              Con CoFlow
            </p>
          </div>

          {trustPoints.map((point) => {
            return (
              <div
                key={point.title}
                className="grid border-t border-white/10 sm:grid-cols-2"
              >
                <div className="flex items-start gap-3 border-b border-white/10 px-5 py-5 sm:border-b-0 sm:border-r">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/50">
                    <CloseIcon />
                  </span>
                  <p className="text-sm leading-6 text-white/50">
                    {point.without}
                  </p>
                </div>

                <div className="flex items-start gap-3 px-5 py-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-400 text-brand-dark">
                    <CheckIcon />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {point.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-green-50/75">
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-7 text-green-50/70">
          Aun así, antes de compartir vivienda comprueba la identidad de las
          personas, visita el inmueble y revisa las condiciones económicas
          directamente con la comunidad.
        </p>
      </div>
    </section>
  );
}
