"use client";

import Link from "next/link";

/** Fila de lista agrupada (Cuenta/Soporte). Sin `href`, la fila queda
 * inerte (sin ruta real todavía) — se muestra atenuada, sin chevron
 * interactivo ni feedback de tap, para no simular una acción que no
 * existe. */
export default function ListRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-12 ${
          href ? "text-primary" : "text-muted"
        }`}
      >
        {icon}
      </span>

      <span
        className={`min-w-0 flex-1 text-sm font-semibold ${
          href ? "text-foreground" : "text-muted"
        }`}
      >
        {label}
      </span>

      <ChevronIcon
        className={`h-4.5 w-4.5 shrink-0 ${href ? "text-muted" : "text-border"}`}
      />
    </div>
  );

  if (!href) return content;

  /* Antes la fila encogía al 94% al pulsarla. En una fila a todo el
   * ancho dentro de una tarjeta agrupada, ese 6% se ve: la fila se
   * despega de sus vecinas y los separadores del grupo dejan de
   * alinearse durante el toque. El realce de fondo dice lo mismo
   * ("te he oído") sin deformar el grupo — y es lo que hace iOS en
   * cualquier lista de ajustes. */
  return (
    <Link
      href={href}
      className="press-row block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
    >
      {content}
    </Link>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
