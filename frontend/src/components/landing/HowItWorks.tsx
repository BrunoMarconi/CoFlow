import { SectionHeader } from "./shared";
import { howItWorksSteps } from "./content";

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-24 px-4 py-8 sm:py-10"
    >
      <div className="mx-auto max-w-xl">
        <SectionHeader
          eyebrow="Cómo funciona"
          title="De desconocidos a compañeros compatibles"
          description="Un proceso sencillo para entender qué busca cada persona antes de compartir vivienda."
          align="left"
        />

        <div className="mt-8 sm:mt-12">
          <div className="grid gap-2.5">
            {howItWorksSteps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex gap-3 rounded-[1.35rem] bg-white p-4 ring-1 ring-black/[0.035]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ef] text-[10px] font-bold text-brand">
                  {index + 1}
                </span>

                <div>
                  <h3 className="text-base font-semibold text-brand-dark sm:text-lg">
                    {step.title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-muted">
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
