"use client";

import { cn } from "@/lib/utils";

/** Extraído tal cual del toggle que ya existía en RoommateSearchCard —
 * mismo tamaño, mismos colores, sin cambios visuales — para que las
 * futuras pantallas de Cuenta/Privacidad no lo reinventen. */
export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Nombre accesible del control (no hay label visible propio). */
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-primary" : "bg-border",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-6 w-6 transform rounded-full bg-surface shadow-soft transition",
          checked ? "translate-x-7" : "translate-x-1"
        )}
      />
    </button>
  );
}
