import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./shared";

const productLinks = [
  { href: "#comunidades", label: "Comunidades" },
  { href: "#personas", label: "Personas" },
  { href: "#como-funciona", label: "Cómo funciona" },
] as const;

const accountLinks = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/register", label: "Crear cuenta" },
] as const;

// Sin páginas legales publicadas todavía: se muestran como próximamente en vez de enlazar a rutas inexistentes.
const infoItems = ["Privacidad", "Términos", "Contacto"] as const;

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo />
              <span className="text-xl font-black tracking-tight text-brand-dark">
                CoFlow
              </span>
            </Link>

            <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
              Encuentra personas y comunidades compatibles para compartir
              vivienda de una forma más clara.
            </p>
          </div>

          <FooterColumn title="Producto">
            {productLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-muted hover:text-brand-dark"
              >
                {link.label}
              </a>
            ))}
          </FooterColumn>

          <FooterColumn title="Cuenta">
            {accountLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-muted hover:text-brand-dark"
              >
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Información">
            {infoItems.map((label) => (
              <span
                key={label}
                className="text-sm font-semibold text-muted/60"
                title="Próximamente"
              >
                {label}
              </span>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} CoFlow.</p>
          <p>Compartir hogar empieza por encontrar a las personas adecuadas.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {title}
      </p>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}
