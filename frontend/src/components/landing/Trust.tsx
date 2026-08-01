import { SectionHeader } from "./shared";
import { ChatIcon, ClipboardIcon, EyeIcon, LockIcon } from "./icons";
import { trustPoints } from "./content";

const ICONS = {
  eye: EyeIcon,
  chat: ChatIcon,
  clipboard: ClipboardIcon,
  lock: LockIcon,
} as const;

export default function Trust() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-dark px-6 py-12 text-white sm:px-12 sm:py-16">
        <SectionHeader
          eyebrow="Antes de decidir"
          title="Más información antes de tomar una decisión importante."
          tone="dark"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => {
            const Icon = ICONS[point.icon as keyof typeof ICONS];

            return (
              <div
                key={point.title}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.07] p-6 backdrop-blur"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-400 text-brand-dark">
                  <Icon />
                </span>

                <p className="mt-5 text-lg font-bold text-white">
                  {point.title}
                </p>

                <p className="mt-2 text-sm leading-6 text-green-50/75">
                  {point.description}
                </p>
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
