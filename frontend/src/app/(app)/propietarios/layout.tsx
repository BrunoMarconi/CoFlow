"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_LINKS = [
  { href: "/propietarios", label: "Resumen" },
  { href: "/propietarios/pisos", label: "Mis pisos" },
  { href: "/propietarios/pisos/nuevo", label: "Añadir piso" },
  { href: "/propietarios/perfil", label: "Perfil de propietario" },
  { href: "/propietarios/ayuda", label: "Ayuda" },
];

export default function PropietariosLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/propietarios/pisos/nuevo") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          Panel de propietarios
        </p>

        <Link
          href="/comunidades"
          className="text-xs font-bold text-muted transition hover:text-brand-dark"
        >
          ← Volver a CoFlow
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 sm:px-5">
        CoFlow todavía está preparando el lanzamiento público de
        viviendas. Tus pisos quedarán guardados en tu cuenta, pero no
        serán visibles para quienes buscan alojamiento.
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {NAV_LINKS.map((link) => {
          const active =
            link.href === "/propietarios"
              ? pathname === "/propietarios"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-brand text-white"
                  : "bg-surface-soft text-muted hover:bg-line"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
