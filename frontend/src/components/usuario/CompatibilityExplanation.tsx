import Link from "next/link";
import MatchScoreBadge from "@/components/usuario/MatchScoreBadge";
import type { CompatibilityCategoryScore, CompatibilityScore } from "@/types/compatibilityScore";
import type { ReactNode } from "react";

/* Preguntas concretas para romper el hielo sobre el eje en el que más os
 * diferenciáis. Son el único contenido redactado de la tarjeta: el resto
 * sale del test, así que si aparece una clave nueva en el backend este
 * mapa simplemente no la cubre y el bloque cae al texto genérico. */
const CONVERSATION_STARTERS: Record<string, string> = {
  cleanliness: "cómo le gusta organizar la limpieza",
  social_energy: "cuántas visitas y planes en casa le apetecen",
  schedule: "qué horarios hace entre semana",
  financial: "cómo prefiere organizar los gastos comunes",
  conflict: "cómo prefiere resolver los desacuerdos",
  tolerance: "qué cosas le molestan en casa",
};

/** A partir de aquí un eje cuenta como coincidencia. */
const GOOD_MATCH = 70;

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function ringColor(score: number) {
  if (score >= 75) return "#91c8aa";
  if (score >= 50) return "#fcd34d";
  return "rgba(255,255,255,0.55)";
}

function headline(score: number, hasPendingTopic: boolean) {
  if (score >= 80) return "Pinta muy bien";
  if (score >= 60) {
    return hasPendingTopic ? "Buena base, con algo que hablar" : "Buena base para convivir";
  }
  return "Tenéis estilos distintos";
}

export default function CompatibilityExplanation({
  score,
  breakdown,
  compact = false,
  actions,
  firstName,
  theirs,
  mine,
  conversationHref,
}: {
  score: number;
  breakdown: CompatibilityScore;
  compact?: boolean;
  actions?: ReactNode;
  firstName?: string;
  /** Categorías de la otra persona, para contar su lado del tema pendiente. */
  theirs?: CompatibilityCategoryScore[];
  /** Las tuyas, para contar el tuyo. */
  mine?: CompatibilityCategoryScore[];
  /** Conversación ya abierta: convierte la idea en un enlace al chat. */
  conversationHref?: string | null;
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
          {friction && friction.score < GOOD_MATCH
            ? ` Conviene hablar sobre ${friction.label.toLowerCase()}.`
            : " No aparece ninguna diferencia destacada."}
        </p>
      </div>
    );
  }

  const name = firstName || "esta persona";
  const pendingTopic = friction && friction.score < GOOD_MATCH ? friction : null;
  // Como mucho tres: con más, la fila de chips deja de leerse de un vistazo.
  const matches = ordered.filter((item) => item.score >= GOOD_MATCH).slice(0, 3);

  const mySide = pendingTopic ? mine?.find((item) => item.key === pendingTopic.key) : undefined;
  const theirSide = pendingTopic ? theirs?.find((item) => item.key === pendingTopic.key) : undefined;
  const starter = pendingTopic ? CONVERSATION_STARTERS[pendingTopic.key] : undefined;

  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-brand-dark p-5 text-white shadow-modal sm:p-7" aria-labelledby="compatibility-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} />
            <div className="min-w-0">
              <p className="text-xs text-white/70">Compatibilidad contigo</p>
              <h2 id="compatibility-title" className="mt-1 font-rounded text-2xl font-semibold tracking-[-0.03em] text-white">
                {headline(score, Boolean(pendingTopic))}
              </h2>
            </div>
          </div>

          {matches.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {matches.map((item) => (
                <li
                  key={item.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#91c8aa]/15 px-3 py-1.5 text-xs font-semibold text-[#bfe3cd]"
                >
                  <span aria-hidden="true">✓</span>
                  {item.label}
                </li>
              ))}
            </ul>
          )}

          {pendingTopic && (
            <div className="mt-4 rounded-14 border border-amber-300/25 bg-amber-300/10 p-4">
              <p className="text-xs font-semibold text-amber-200">Para hablar: {pendingTopic.label}</p>
              <p className="mt-1.5 text-sm leading-6 text-white/80">
                {mySide && theirSide
                  ? `Tú: ${lowerFirst(mySide.description)} · ${name}: ${lowerFirst(theirSide.description)}`
                  : "Es el aspecto en el que más os diferenciáis."}
              </p>
              {starter &&
                (conversationHref ? (
                  <Link
                    href={conversationHref}
                    className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-amber-200 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                  >
                    Pregúntale {starter} →
                  </Link>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-white/60">
                    Idea para empezar: pregúntale {starter}.
                  </p>
                ))}
            </div>
          )}
        </div>
        {actions}
      </div>

      {/* El aviso importa, pero no tanto como para ocupar cinco líneas
          fijas: plegado está disponible sin competir con el contenido. */}
      <details className="mt-5 border-t border-white/10 pt-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-xs text-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
          <span aria-hidden="true" className="mr-1.5">ⓘ</span>
          Cómo se calcula
        </summary>
        <p className="pb-1 text-xs leading-5 text-white/50">
          Comparamos por igual seis aspectos de convivencia. Es una orientación para iniciar una conversación, no una garantía de convivencia.
        </p>
      </details>
    </section>
  );
}

/* Anillo de 64px: el porcentaje se lee en el centro y el arco da la
 * lectura rápida. El SVG va rotado -90° para que el trazo empiece
 * arriba en vez de a las tres en punto. */
function ScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <span className="relative flex h-16 w-16 shrink-0 items-center justify-center" role="img" aria-label={`Compatibilidad contigo: ${safeScore} sobre 100`}>
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={ringColor(safeScore)}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safeScore / 100)}
        />
      </svg>
      <span className="absolute text-sm font-extrabold tabular-nums text-white" aria-hidden="true">
        {safeScore}%
      </span>
    </span>
  );
}
