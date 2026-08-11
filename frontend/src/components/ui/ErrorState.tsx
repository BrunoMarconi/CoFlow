import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import SecondaryButton from "@/components/ui/SecondaryButton";

/** Hermano de EmptyState para bloques/pantallas que fallaron al
 * cargar — borde sólido (no discontinuo) para que un vacío nunca se
 * confunda con un error, tal como pide el sistema de diseño. */
export default function ErrorState({
  title = "No hemos podido cargar esto",
  description,
  icon,
  action,
  onRetry,
  retryLabel = "Reintentar",
  className,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  /** Slot completo si el CTA por defecto ("Reintentar") no encaja. */
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-18 border border-border bg-surface p-8 text-center sm:p-12",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 [&>svg]:h-6 [&>svg]:w-6">
        {icon ?? <AlertIcon />}
      </div>

      <h3 className="text-lg font-bold text-foreground">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-secondary">{description}</p>
      )}

      {(action ?? onRetry) && (
        <div className="mt-5">
          {action ?? (
            <SecondaryButton onClick={onRetry}>{retryLabel}</SecondaryButton>
          )}
        </div>
      )}
    </div>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
