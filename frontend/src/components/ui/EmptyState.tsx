import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  variant?: "search" | "community" | "saved" | "messages" | "invitations" | "notifications" | "generic";
  /** Sin tarjeta (borde/fondo/sombra) — para pantallas ya planas como
   * la lista de Mensajes, donde una tarjeta desentonaría. */
  flat?: boolean;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  variant = "generic",
  flat = false,
}: EmptyStateProps) {
  const resolvedVariant = variant === "generic" ? inferVariant(title) : variant;
  return (
    <div
      className={cn(
        flat
          ? "flex flex-col items-center justify-center p-7 text-center sm:p-10"
          : "flex flex-col items-center justify-center rounded-24 border border-border bg-surface p-7 text-center shadow-soft sm:p-10",
        className
      )}
      aria-live="polite"
    >
      <div className="mb-4 flex h-24 w-32 items-center justify-center text-primary">
        {icon ? (
          <span className="[&>svg]:h-12 [&>svg]:w-12">{icon}</span>
        ) : (
          <StateIllustration variant={resolvedVariant} />
        )}
      </div>

      <h3 className="text-lg font-bold text-foreground">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-secondary">{description}</p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function inferVariant(title: string): NonNullable<EmptyStateProps["variant"]> {
  const value = title.toLocaleLowerCase("es");
  if (value.includes("comunidad")) return "community";
  if (value.includes("guardad")) return "saved";
  if (value.includes("mensaje") || value.includes("conversaci")) return "messages";
  if (value.includes("invitaci") || value.includes("solicitud")) return "invitations";
  if (value.includes("notificaci") || value.includes("al día")) return "notifications";
  if (value.includes("persona") || value.includes("resultado") || value.includes("filtro")) return "search";
  return "generic";
}

function StateIllustration({ variant }: { variant: NonNullable<EmptyStateProps["variant"]> }) {
  const common = "M18 74c11-6 19-6 29 0M79 74c8-5 14-5 22 0M26 73c0-13-2-19-8-27M90 73c0-10 2-16 8-22";
  return (
    <svg viewBox="0 0 120 88" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full" aria-hidden="true">
      <path d={common} opacity=".35" />
      <path d="M19 47c6 1 8 5 8 12M99 52c-7 1-9 5-9 12M23 53c-5-4-8-4-10-3M95 58c5-4 9-4 12-2" opacity=".55" />
      {variant === "search" && <><circle cx="54" cy="38" r="17" /><path d="m67 51 13 13" /></>}
      {variant === "community" && <><path d="m34 39 25-21 26 21v30H34Z" /><path d="M47 68V49h24v19M42 31V21M77 31V20" /></>}
      {variant === "saved" && <path d="M43 18h34v52L60 59 43 70Z" />}
      {variant === "messages" && <><rect x="31" y="22" width="57" height="39" rx="10" /><path d="m46 61-9 10 1-14M47 41h.1M60 41h.1M73 41h.1" /></>}
      {(variant === "invitations" || variant === "notifications") && <><rect x="29" y="28" width="62" height="40" rx="5" /><path d="m30 33 30 23 30-23" />{variant === "invitations" && <path d="m78 23 6 6 11-13" />}{variant === "notifications" && <path d="M79 24c0-7 4-12 10-12s10 5 10 12c0 5 2 8 4 10H75c2-2 4-5 4-10Z" />}</>}
      {variant === "generic" && <><circle cx="60" cy="42" r="22" /><path d="M60 31v15M60 54h.1" /></>}
    </svg>
  );
}
