import { SectionHeader } from "./shared";
import { howItWorksSteps } from "./content";

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-24 px-4 py-12 sm:px-6 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Cómo funciona"
          title="De desconocidos a compañeros compatibles"
          description="Un proceso sencillo para entender qué busca cada persona antes de compartir vivienda."
        />

        <div className="relative mt-10 sm:mt-14">
          {/* Vertical connector (mobile/tablet) */}
          <div
            aria-hidden="true"
            className="absolute left-6 top-6 bottom-6 w-px bg-brand/20 lg:hidden"
          />

          {/* Horizontal connector (desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-[16.666%] right-[16.666%] top-6 hidden h-px bg-brand/20 lg:block"
          />

          <div className="flex flex-col gap-10 lg:flex-row lg:gap-6">
            {howItWorksSteps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex gap-5 lg:flex-1 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
              >
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
                  {index + 1}
                </span>

                <div className="lg:mt-6">
                  <h3 className="text-xl font-bold text-brand-dark sm:text-2xl">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-base leading-7 text-muted lg:mx-auto lg:max-w-60">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
