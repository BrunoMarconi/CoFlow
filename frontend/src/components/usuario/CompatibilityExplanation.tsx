import MatchScoreBadge from "@/components/usuario/MatchScoreBadge";
import type { CompatibilityScore } from "@/types/compatibilityScore";
import type { ReactNode } from "react";

export default function CompatibilityExplanation({
  score,
  breakdown,
  compact = false,
  actions,
}: {
  score: number;
  breakdown: CompatibilityScore;
  compact?: boolean;
  actions?: ReactNode;
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
    <section className="overflow-hidden rounded-[1.75rem] bg-brand-dark p-5 text-white shadow-modal sm:p-7" aria-labelledby="compatibility-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xs font-bold uppercase tracking-[0.14em] text-white/50">Compatibilidad contigo</p>
            <MatchScoreBadge score={score} className="!bg-white !text-brand-dark" />
          </div>
          <h2 id="compatibility-title" className="mt-3 font-rounded text-2xl font-semibold tracking-[-0.03em] text-white">
            Por qué podéis encajar
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
            Coincidís especialmente en {strengths.map((item) => item.label.toLowerCase()).join(" y ")}.
            {friction && friction.score < 70
              ? ` ${friction.label} puede ser un buen tema para vuestra primera conversación.`
              : " No aparece ninguna diferencia destacada."}
          </p>
        </div>
        {actions}
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
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

      <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/50">
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
    <div className="rounded-14 border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
      <p className={`text-3xs font-bold uppercase tracking-[0.08em] ${positive ? "text-[#9ad4b4]" : "text-white/50"}`}>
        {label}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-white">{category}</p>
        <span className="text-xs font-bold tabular-nums text-white/70">{score}%</span>
      </div>
      <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <span className="block h-full rounded-full bg-[#91c8aa]" style={{ width: `${Math.max(4, Math.min(100, score))}%` }} />
      </span>
    </div>
  );
}
