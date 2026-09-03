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
    <section className="px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-xl overflow-hidden rounded-[1.65rem] bg-brand-dark px-5 py-7 text-white shadow-[0_18px_45px_rgba(17,49,37,0.15)]">
        <SectionHeader
          eyebrow="Seguridad y confianza"
          title="Tú decides con quién compartes piso."
          description="Herramientas reales para que mantengas el control en cada paso, no promesas vacías."
          tone="dark"
          align="left"
        />

        <div className="mt-6 grid gap-2">
          {safetyPoints.map((point) => {
            const Icon = ICONS[point.icon];
            return (
              <div
                key={point.title}
                className="flex gap-3 rounded-[1.15rem] border border-white/10 bg-white/6 p-3.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-green-300">
                  <Icon />
                </span>
                <div><p className="text-[12px] font-semibold text-white">{point.title}</p><p className="mt-1 text-[10px] leading-4 text-green-50/65">{point.description}</p></div>
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
