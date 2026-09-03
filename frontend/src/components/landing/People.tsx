import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";
import { SectionHeader } from "./shared";
import { peopleExamples } from "./content";

export default function People() {
  return (
    <section
      id="personas"
      className="scroll-mt-24 px-4 py-8 sm:py-10"
    >
      <div className="mx-auto max-w-xl">
        <SectionHeader
          eyebrow="Encuentra personas"
          title="Encuentra personas con las que compartir vivienda."
          description="Cada perfil muestra ciudad, presupuesto y preferencias de convivencia para que sepas si podríais encajar antes de hablar."
          align="left"
        />

        <p className="mt-3 max-w-2xl text-left text-[9px] font-semibold uppercase tracking-wider text-muted">
          Ejemplo ilustrativo de cómo se ve un perfil
        </p>

        <div className="mt-5 grid gap-2.5">
          {peopleExamples.map((person, index) => (
            <article
              key={person.id}
              className="rounded-[1.35rem] bg-white p-4 ring-1 ring-black/[0.035]"
            >
              <div className="flex items-center gap-4">
                <UserAvatar
                  firstName={`Persona ${index + 1}`}
                  userId={person.id}
                  size="lg"
                />

                <div>
                  <p className="text-lg font-bold text-brand-dark">
                    {person.role}
                  </p>
                  <p className="text-sm font-semibold text-muted">
                    {person.city}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm font-bold text-brand-dark">
                {person.budget}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {person.preferences.map((preference) => (
                  <span
                    key={preference}
                    className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-dark"
                  >
                    {preference}
                  </span>
                ))}
              </div>

              <Link
                href="/register"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-brand/8 text-sm font-semibold text-brand-dark transition hover:bg-brand/13"
              >
                Ver perfil
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
