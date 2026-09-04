import MatchScoreBadge from "@/components/usuario/MatchScoreBadge";
import type { CompatibilityScore } from "@/types/compatibilityScore";

export default function CompatibilityExplanation({
  score,
  breakdown,
  compact = false,
}: {
  score: number;
  breakdown: CompatibilityScore;
  compact?: boolean;
}) {
  const ordered = [...breakdown.categories].sort((a, b) => b.score - a.score);
  const strengths = ordered.slice(0, 2);
  const friction = ordered.at(-1);

  if (compact) {
    return (
      <div className="rounded-14 border border-primary/15 bg-mint-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold text-brand-dark">Por qué podéis encajar</p>
          <MatchScoreBadge score={score} size="sm" />
        </div>
        <p className="mt-1.5 text-xs leading-5 text-secondary">
          Coincidís especialmente en {strengths.map((item) => item.label.toLowerCase()).join(" y ")}.
          {friction && friction.score < 70
            ? ` Conviene hablar sobre ${friction.label.toLowerCase()}.`
            : " No aparece ninguna diferencia destacada."}
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-18 border border-primary/15 bg-mint-50 p-4 shadow-soft sm:p-5" aria-labelledby="compatibility-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Compatibilidad contigo</p>
          <h2 id="compatibility-title" className="mt-1 font-rounded text-xl font-semibold text-brand-dark">
            Más que un porcentaje
          </h2>
        </div>
        <MatchScoreBadge score={score} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {strengths.map((item) => (
          <CompatibilityPoint key={item.key} label="Coincidencia" category={item.label} score={item.score} positive />
        ))}
        {friction && (
          <CompatibilityPoint
            label={friction.score < 70 ? "Para conversar" : "Menor coincidencia"}
            category={friction.label}
            score={friction.score}
          />
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-secondary">
        Comparamos por igual seis aspectos de convivencia. Es una orientación para iniciar una conversación, no una garantía de convivencia.
      </p>
    </section>
  );
}

function CompatibilityPoint({
  label,
  category,
  score,
  positive = false,
}: {
  label: string;
  category: string;
  score: number;
  positive?: boolean;
}) {
  return (
    <div className="rounded-14 border border-white/80 bg-white/75 p-3">
      <p className={`text-[10px] font-bold uppercase tracking-[0.08em] ${positive ? "text-primary" : "text-amber-700"}`}>
        {label}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-foreground">{category}</p>
        <span className="text-xs font-bold tabular-nums text-secondary">{score}%</span>
      </div>
    </div>
  );
}
