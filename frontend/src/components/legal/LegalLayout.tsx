import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export const LEGAL_LINKS = [
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/terminos", label: "Términos y condiciones" },
  { href: "/legal/normas-comunidad", label: "Normas de la comunidad" },
  { href: "/legal/reportar", label: "Denunciar contenido ilegal" },
  { href: "/legal/condiciones-propietarios", label: "Condiciones para propietarios" },
  { href: "/legal/condiciones-contratacion", label: "Condiciones de contratación" },
] as const;

export default function LegalLayout({
  eyebrow = "Legal",
  title,
  updated,
  children,
}: {
  eyebrow?: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-line px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-lg font-bold text-brand-dark">CoFlow</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-secondary transition hover:text-brand-dark">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.02em] text-brand-dark sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-secondary">Última actualización: {updated}</p>

        <div className="mt-9 space-y-7 text-sm leading-7 text-secondary sm:text-[15px]">{children}</div>
      </main>

      <footer className="border-t border-line px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-muted">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-brand-dark">
                {link.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">© {new Date().getFullYear()} CoFlow.</p>
        </div>
      </footer>
    </div>
  );
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-lg font-extrabold tracking-[-0.01em] text-brand-dark sm:text-xl">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-brand-dark sm:text-base">{children}</h3>;
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <H2 id={id}>{title}</H2>
      {children}
    </section>
  );
}

export function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
