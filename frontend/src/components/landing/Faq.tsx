import { PlusIcon } from "./icons";
import { faqItems } from "./content";

export default function Faq() {
  return (
    <section
      id="preguntas"
      className="scroll-mt-24 px-4 py-8 sm:py-10"
    >
      <div className="mx-auto grid max-w-xl gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
            Preguntas frecuentes
          </p>

          <h2 className="mt-3 text-[2rem] font-bold tracking-[-0.045em] text-brand-dark sm:text-4xl">
            Antes de empezar
          </h2>

          <p className="mt-4 max-w-md text-base leading-8 text-muted">
            Estas son algunas de las dudas más habituales sobre el
            funcionamiento de CoFlow.
          </p>
        </div>

        <div className="space-y-2">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group overflow-hidden rounded-[1.2rem] bg-white ring-1 ring-black/[0.035]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-[12px] font-semibold text-brand-dark">
                {item.question}

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm transition group-open:rotate-45">
                  <PlusIcon />
                </span>
              </summary>

              <p className="border-t border-black/5 bg-white/55 px-5 py-5 text-sm leading-7 text-muted sm:px-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
