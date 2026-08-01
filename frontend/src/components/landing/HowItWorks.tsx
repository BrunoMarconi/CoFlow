import { SectionHeader } from "./shared";
import { howItWorksSteps } from "./content";

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Cómo funciona"
          title="De desconocidos a compañeros compatibles"
          description="Un proceso sencillo para entender qué busca cada persona antes de compartir vivienda."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {howItWorksSteps.map((step, index) => (
            <article
              key={step.number}
              className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:p-8"
            >
              <span className="absolute -right-3 -top-8 text-[7rem] font-black leading-none text-brand/10">
                {step.number}
              </span>

              <div className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark text-sm font-bold text-white">
                  {index + 1}
                </span>

                <h3 className="mt-6 text-xl font-bold text-brand-dark sm:text-2xl">
                  {step.title}
                </h3>

                <p className="mt-3 text-base leading-7 text-muted">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
