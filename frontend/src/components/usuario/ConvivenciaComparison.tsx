"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CompatibilityCategoryScore } from "@/types/compatibilityScore";

/* Comparación eje a eje entre esta persona y tú.
 *
 * Sustituye al radar en el perfil público (CompatibilityRadar se sigue
 * usando en /perfil y en el resultado del onboarding). El radar dibuja
 * bien una silueta, pero para decidir si vas a convivir con alguien lo
 * que importa es el contraste eje a eje: aquí cada barra es su
 * puntuación y el círculo blanco marca dónde estás tú en la misma
 * escala, así que la distancia entre ambos se lee de un vistazo. */

/** A partir de aquí la coincidencia en ese eje se considera buena. */
const GOOD_MATCH = 70;
/** Por debajo de aquí es una diferencia que conviene hablar. */
const WEAK_MATCH = 50;

function matchTone(score: number) {
  if (score >= GOOD_MATCH) return "bg-primary/10 text-primary-dark";
  if (score >= WEAK_MATCH) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function ConvivenciaComparison({
  categories,
  mine,
  breakdown,
  firstName,
  className,
}: {
  /** Puntuaciones de la otra persona (profile.compatibility.categories). */
  categories: CompatibilityCategoryScore[];
  /** Las tuyas, para situar el círculo. Undefined mientras cargan o si
   * no has completado el test: entonces solo se ve su barra. */
  mine?: CompatibilityCategoryScore[];
  /** Coincidencia relativa por eje (profile.match_breakdown.categories). */
  breakdown?: CompatibilityCategoryScore[];
  firstName: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const name = firstName || "esta persona";
  const hasComparison = Boolean(mine && mine.length > 0);

  return (
    <section className={cn("rounded-[2rem] bg-[#f1f3ed] p-6 sm:p-8", className)} aria-labelledby="convivencia-comparison-title">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-primary">Comparación</p>
        <h2 id="convivencia-comparison-title" className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-brand-dark">
          {/* Sin tus puntuaciones no hay comparación que prometer: la
              tarjeta pasa a describir solo su estilo. */}
          {hasComparison ? `${name} y tú, eje a eje` : `Cómo convive ${name}`}
        </h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          {hasComparison
            ? "Dónde coincidís y dónde no. Las diferencias no son un problema: son lo que conviene hablar antes de vivir juntos."
            : "Su estilo personal en cada aspecto de la convivencia."}
        </p>
      </div>

      {/* Leyenda: sin ella, el círculo blanco no se entiende. */}
      {hasComparison && <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-secondary">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-6 rounded-full bg-primary" aria-hidden="true" />
          {name}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary-dark bg-white" aria-hidden="true" />
          Tú
        </span>
      </div>}

      <ul className="mt-6 space-y-6">
        {categories.map((category, index) => {
          const myScore = mine?.find((item) => item.key === category.key)?.score;
          const match = breakdown?.find((item) => item.key === category.key);

          return (
            <li key={category.key}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                {/* Minúsculas normales: el eje es una palabra corriente
                    ("limpieza"), no una etiqueta de sistema. */}
                <h3 className="text-sm font-bold text-brand-dark">{category.label}</h3>
                {match && (
                  <span className={cn("rounded-full px-2.5 py-1 text-2xs font-bold", matchTone(match.score))}>
                    {match.description}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs leading-5 text-secondary">{category.description}</p>

              {/* role="img" + aria-label: la barra y el círculo son
                  geometría pura, así que un lector de pantalla necesita
                  que alguien le lea las dos cifras y la coincidencia. */}
              <div
                role="img"
                aria-label={[
                  `${name}: ${category.score} sobre 100`,
                  myScore !== undefined ? `tú: ${myScore} sobre 100` : null,
                  match ? `coincidencia: ${match.description}` : null,
                ]
                  .filter(Boolean)
                  .join(". ")}
                className="relative mt-3 h-2 rounded-full bg-white"
              >
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${category.score}%` }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.5,
                    ease: [0.4, 0, 0.2, 1],
                    delay: prefersReducedMotion ? 0 : index * 0.04,
                  }}
                />
                {myScore !== undefined && (
                  <span
                    // Sobre la misma escala que la barra, así que la
                    // distancia horizontal ES la diferencia entre ambos.
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-dark bg-white shadow-soft"
                    style={{ left: `${myScore}%` }}
                    aria-hidden="true"
                  />
                )}
              </div>

              <p className="mt-2 text-xs font-semibold text-muted" aria-hidden="true">
                {name}: {category.score}
                {myScore !== undefined && ` · Tú: ${myScore}`}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs text-muted">Cada eje va de 0 a 100 según las respuestas al test de convivencia.</p>
    </section>
  );
}
