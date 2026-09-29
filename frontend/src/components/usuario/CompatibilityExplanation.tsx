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
    <section className="rounded-card border border-primary/15 bg-[#f2f7f4] p-5 shadow-soft sm:p-6" aria-labelledby="compatibility-title">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="max-w-2xl">
          <p className="text-2xs font-bold uppercase tracking-[0.12em] text-primary">Compatibilidad contigo</p>
          <h2 id="compatibility-title" className="mt-1 font-rounded text-xl font-semibold text-brand-dark">
            Por qué podéis encajar
          </h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Coincidís especialmente en {strengths.map((item) => item.label.toLowerCase()).join(" y ")}.
            {friction && friction.score < 70
              ? ` ${friction.label} puede ser un buen tema para vuestra primera conversación.`
              : " No aparece ninguna diferencia destacada."}
          </p>
        </div>
        <MatchScoreBadge score={score} className="justify-self-start sm:justify-self-end" />
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
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

      <p className="mt-4 border-t border-primary/10 pt-3 text-xs leading-5 text-secondary">
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
    <div className="rounded-14 border border-white/80 bg-white/80 p-3.5">
      <p className={`text-3xs font-bold uppercase tracking-[0.08em] ${positive ? "text-primary" : "text-secondary"}`}>
        {label}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-foreground">{category}</p>
        <span className="text-xs font-bold tabular-nums text-secondary">{score}%</span>
      </div>
      <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-primary/10" aria-hidden="true">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.min(100, score))}%` }} />
      </span>
    </div>
  );
}
