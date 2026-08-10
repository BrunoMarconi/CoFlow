"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
> & {
  className?: string;
  /** Si se pasa junto con un value no vacío, muestra un botón para
   * borrar la búsqueda. */
  onClear?: () => void;
  /** Sin caja propia (borde/fondo/sombra) — para incrustarlo dentro de
   * una barra compuesta (input + acciones) que ya aporta el contenedor. */
  bare?: boolean;
  /** La barra compuesta que lo envuelve ya renderiza su propio icono
   * (p. ej. uno con layoutId compartido) — evita duplicarlo. */
  showIcon?: boolean;
};

export default function SearchInput({
  className,
  onClear,
  value,
  bare = false,
  showIcon = true,
  ...props
}: SearchInputProps) {
  const showClear = Boolean(onClear && value);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-3",
        !bare &&
          "h-12 rounded-full border border-border bg-surface px-5 shadow-soft transition-all duration-180 focus-within:border-primary focus-within:ring-4 focus-within:ring-mint-100",
        className
      )}
    >
      {showIcon && <SearchIcon />}

      <input
        type="text"
        value={value}
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted"
        {...props}
      />

      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Borrar búsqueda"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-muted"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-muted"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}
