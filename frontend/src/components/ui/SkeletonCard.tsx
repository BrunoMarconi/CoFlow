import { cn } from "@/lib/utils";

export default function SkeletonCard({
  withCover = false,
  className,
}: {
  /** Reserva una franja superior, para imitar cards con imagen de
   * cabecera (ej. CommunityCard). */
  withCover?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse overflow-hidden rounded-18 border border-border bg-surface shadow-soft",
        className
      )}
    >
      {withCover && <div className="h-28 bg-surface-muted sm:h-32" />}

      <div className="space-y-3 p-5 sm:p-6">
        <div className="h-3 w-1/3 rounded-full bg-surface-muted" />
        <div className="h-5 w-2/3 rounded-full bg-surface-muted" />
        <div className="h-3 w-full rounded-full bg-surface-muted" />
        <div className="h-3 w-4/5 rounded-full bg-surface-muted" />
      </div>
    </div>
  );
}
