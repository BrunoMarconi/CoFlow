import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  chips,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Píldoras informativas con datos reales (ej. recuentos ya cargados
   * en la página). Se omiten las que no tengan dato disponible. */
  chips?: string[];
  className?: string;
}) {
  return (
    <header className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-brand/5 blur-3xl"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="type-overline text-brand">{eyebrow}</p>}

          <h1
            className={cn(
              // El rol trae tamaño, peso, interlineado y tracking como
              // conjunto; arriba solo se sube de escalón, y el tracking
              // óptico de cada tamaño lo pone la curva de globals.css.
              "type-title font-rounded text-brand-dark md:text-3xl lg:text-4xl",
              eyebrow && "mt-1.5"
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="type-body mt-3 max-w-[62ch] text-secondary sm:text-base">
              {subtitle}
            </p>
          )}

          {chips && chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-primary-dark shadow-soft"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
