import { cn } from "@/lib/utils";

export default function SkeletonCard({
  withCover = false,
  coverClassName = "h-28 sm:h-32",
  className,
}: {
  /** Reserva una franja superior, para imitar cards con imagen de
   * cabecera (ej. CommunityCard). */
  withCover?: boolean;
  /** Alto de la franja de portada, para adaptarse a cards con cover
   * más grande (ej. CommunityCard rediseñada). */
  coverClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "skeleton-shimmer overflow-hidden rounded-18 border border-border bg-surface shadow-soft",
        className
      )}
    >
      {withCover && <div className={cn("bg-[#eef0f2]", coverClassName)} />}

      <div className="space-y-3 p-5 sm:p-6">
        <div className="h-3 w-1/3 rounded-full bg-[#e7eaed]" />
        <div className="h-5 w-2/3 rounded-full bg-[#e7eaed]" />
        <div className="h-3 w-full rounded-full bg-[#e7eaed]" />
        <div className="h-3 w-4/5 rounded-full bg-[#e7eaed]" />
      </div>
    </div>
  );
}
