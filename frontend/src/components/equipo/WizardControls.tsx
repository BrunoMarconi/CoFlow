"use client";

import type { ReactNode } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TriState } from "@/lib/teamListing";

/* Piezas pequeñas del alta asistida. Todas priorizan el ritmo de una
 * llamada: un toque en vez de escribir (steppers, chips), objetivos de
 * 44px como mínimo y el estado activo siempre con icono, no solo color. */

export function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <h2 className="font-rounded text-2xl font-semibold tracking-[-0.035em] text-brand-dark sm:text-[1.75rem]">
        {title}
      </h2>
      <p className="mt-1.5 max-w-xl text-sm leading-6 text-secondary">{description}</p>
    </header>
  );
}

export function FieldGroup({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-black/[0.06] pt-5 first:border-t-0 first:pt-0", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-dark">{title}</h3>
          {description ? <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NumberStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex min-h-15 items-center justify-between gap-3 rounded-field border border-border bg-surface px-4">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Menos ${label.toLowerCase()}`}
          className="press-control flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-brand-dark transition hover:bg-black/[0.06] disabled:opacity-35"
        >
          <Minus className="h-4 w-4" />
        </button>
        <output aria-live="polite" className="w-8 text-center font-rounded text-lg font-semibold tabular-nums text-brand-dark">
          {value}
        </output>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Más ${label.toLowerCase()}`}
          className="press-control flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-brand-dark transition hover:bg-black/[0.06] disabled:opacity-35"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ChoiceCard({
  label,
  hint,
  icon,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "press relative flex min-h-18 w-full items-center gap-3 rounded-field border p-3 text-left transition-colors",
        active
          ? "border-brand-dark bg-surface ring-1 ring-brand-dark"
          : "border-border bg-surface hover:border-secondary/40"
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors [&>svg]:h-5 [&>svg]:w-5",
            active ? "bg-brand-dark text-white" : "bg-surface-soft text-primary"
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-bold text-brand-dark">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-4 text-secondary">{hint}</span> : null}
      </span>
      {active ? (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark text-white">
          <Check className="h-3 w-3" />
        </span>
      ) : null}
    </button>
  );
}

export function ToggleChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "press-control inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors [&>svg]:h-4 [&>svg]:w-4",
        active
          ? "border-brand-dark bg-brand-dark text-white"
          : "border-border bg-surface text-secondary hover:border-secondary/40 hover:text-brand-dark"
      )}
    >
      {active ? <Check /> : icon}
      {label}
    </button>
  );
}

export function QuickChip({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "press-control inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold transition-colors disabled:opacity-40",
        active ? "bg-primary text-white" : "bg-surface-soft text-brand-dark hover:bg-black/[0.06]"
      )}
    >
      {label}
    </button>
  );
}

const TRI_OPTIONS: { value: TriState; label: string }[] = [
  { value: true, label: "Sí" },
  { value: false, label: "No" },
  { value: null, label: "Sin definir" },
];

export function TriStateRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TriState;
  onChange: (value: TriState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-full bg-surface-soft p-1">
        {TRI_OPTIONS.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-8 rounded-full px-3 text-xs font-bold transition-colors",
              value === option.value ? "bg-surface text-brand-dark shadow-soft" : "text-secondary hover:text-brand-dark"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
