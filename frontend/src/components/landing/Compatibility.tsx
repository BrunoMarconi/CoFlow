import { CheckIcon } from "./icons";
import { compatibilityExamples, preferenceItems } from "./content";

const COMPATIBILITY_PERCENT = 92;

export default function Compatibility() {
  return (
    <section
      id="compatibilidad"
      className="scroll-mt-24 bg-brand-dark px-4 py-12 text-white sm:px-6 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
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

          <CompatibilityGauge />
        </div>
      </div>
    </section>
  );
}

function CompatibilityGauge() {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - COMPATIBILITY_PERCENT / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-44 w-44 sm:h-52 sm:w-52">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="white"
            strokeOpacity="0.12"
            strokeWidth="12"
          />

          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#4ADE80"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-black text-white sm:text-5xl">
            {COMPATIBILITY_PERCENT}%
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-green-300">
            Compatible
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-xs font-semibold uppercase tracking-wider text-green-50/60">
        Ejemplo ilustrativo de compatibilidad
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {compatibilityExamples.map((item) => (
          <span
            key={item.label}
            className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white"
          >
            {item.label}: <span className="text-green-300">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
