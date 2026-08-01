import { CheckIcon } from "./icons";
import { compatibilityExamples, preferenceItems } from "./content";

export default function Compatibility() {
  return (
    <section
      id="compatibilidad"
      className="scroll-mt-24 bg-brand-dark px-4 py-16 text-white sm:px-6 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-300">
              Más que buscar una habitación
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              La convivencia importa tanto como la vivienda.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-green-50/80">
              Compara hábitos, presupuesto y expectativas antes de tomar una
              decisión.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {preferenceItems.map((item) => (
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

          <div className="grid grid-cols-2 gap-4">
            {compatibilityExamples.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur transition hover:bg-white/10"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-green-300">
                  {item.label}
                </p>
                <p className="mt-3 text-lg font-bold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
