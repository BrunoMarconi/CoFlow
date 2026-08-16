import Link from "next/link";
import { SectionHeader } from "./shared";
import { BlockIcon, ChatIcon, FlagIcon, LockIcon, MailCheckIcon } from "./icons";
import { safetyPoints } from "./content";

const ICONS = {
  block: BlockIcon,
  flag: FlagIcon,
  lock: LockIcon,
  chat: ChatIcon,
  mail: MailCheckIcon,
} as const;

const legalLinks = [
  { href: "/legal/privacidad", label: "Política de privacidad" },
  { href: "/legal/normas-comunidad", label: "Normas de la comunidad" },
  { href: "/legal/reportar", label: "Cómo denunciar contenido" },
] as const;

export default function Trust() {
  return (
    <section className="px-5 py-12 sm:px-8 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-dark px-6 py-12 text-white sm:px-12 sm:py-16">
        <SectionHeader
          eyebrow="Seguridad y confianza"
          title="Tú decides con quién compartes piso."
          description="Herramientas reales para que mantengas el control en cada paso, no promesas vacías."
          tone="dark"
        />

        <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {safetyPoints.map((point) => {
            const Icon = ICONS[point.icon];
            return (
              <div
                key={point.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5 transition hover:bg-white/7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-400/15 text-green-300">
                  <Icon />
                </span>
                <p className="mt-4 text-base font-bold text-white">
                  {point.title}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-green-50/70">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-center">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-semibold text-green-50/60 underline decoration-white/20 underline-offset-4 transition hover:text-green-50/90"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
