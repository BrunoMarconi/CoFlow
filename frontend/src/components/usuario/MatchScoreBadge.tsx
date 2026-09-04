import { cn } from "@/lib/utils";

/* Insignia visual del % de compatibilidad real entre el usuario actual
 * y la persona de la tarjeta (ver match_score en UserPublicProfile,
 * calculado en backend a partir de los 6 ejes de convivencia de
 * ambos). Nunca se renderiza con un valor inventado: quien la usa debe
 * comprobar antes que `score` no es null. */
export default function MatchScoreBadge({
  score,
  size = "lg",
  className,
}: {
  score: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const tone =
    score >= 75
      ? "text-primary-dark"
      : score >= 50
        ? "text-amber-700"
        : "text-secondary";
  const dot = score >= 75 ? "bg-primary" : score >= 50 ? "bg-amber-500" : "bg-muted";
  const explanation = `Coincidencia global del ${score}% en seis aspectos de convivencia con el mismo peso.`;

  if (size === "sm") {
    return (
      <span
        aria-label={explanation}
        title={explanation}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-2 py-1 text-[11px] font-bold shadow-soft",
          tone,
          className
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
        {score}%
      </span>
    );
  }

  return (
    <span
      aria-label={explanation}
      title={explanation}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold shadow-soft backdrop-blur",
        tone,
        className
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
      {score}% compatible
    </span>
  );
}
