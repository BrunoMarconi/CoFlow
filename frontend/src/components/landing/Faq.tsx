import { PlusIcon } from "./icons";
import { faqItems } from "./content";

export default function Faq() {
  return (
    <section
      id="preguntas"
      className="scroll-mt-24 bg-white px-5 py-12 sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
            Preguntas frecuentes
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-brand-dark sm:text-4xl lg:text-5xl">
            Antes de empezar
          </h2>

          <p className="mt-4 max-w-md text-base leading-8 text-muted">
            Estas son algunas de las dudas más habituales sobre el
            funcionamiento de CoFlow.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group overflow-hidden rounded-2xl border border-line bg-background"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 text-base font-bold text-brand-dark sm:px-6">
                {item.question}

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm transition group-open:rotate-45">
                  <PlusIcon />
                </span>
              </summary>

              <p className="border-t border-line bg-white px-5 py-5 text-sm leading-7 text-muted sm:px-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
