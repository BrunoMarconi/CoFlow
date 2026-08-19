"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { CompatibilityCategoryScore } from "@/types/compatibilityScore";
import { cn } from "@/lib/utils";

const WIDTH = 300;
const HEIGHT = 260;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const MAX_RADIUS = 78;
const LABEL_RADIUS = MAX_RADIUS + 26;
const GRID_RINGS = [0.33, 0.66, 1];

function pointAt(index: number, total: number, radius: number) {
  const angle = (index * 360) / total;
  const rad = (angle * Math.PI) / 180;
  return { x: CENTER_X + radius * Math.sin(rad), y: CENTER_Y - radius * Math.cos(rad) };
}

function polygonPoints(categories: CompatibilityCategoryScore[], radiusFor: (score: number) => number) {
  return categories
    .map((category, index) => {
      const { x, y } = pointAt(index, categories.length, radiusFor(category.score));
      return `${x},${y}`;
    })
    .join(" ");
}

export default function CompatibilityRadar({
  categories,
  title,
  subtitle,
  icon,
  actions,
  actionsCaption,
  className,
}: {
  categories: CompatibilityCategoryScore[];
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  actionsCaption?: string;
  className?: string;
}) {
  if (categories.length === 0) return null;

  const scoreRadius = (score: number) => MAX_RADIUS * (0.1 + 0.9 * (Math.max(0, Math.min(100, score)) / 100));
  const gridPoints = (fraction: number) =>
    Array.from({ length: categories.length })
      .map((_, index) => {
        const { x, y } = pointAt(index, categories.length, MAX_RADIUS * fraction);
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <section className={cn("mx-auto w-full max-w-2xl rounded-24 bg-flat p-5 sm:p-6", className)}>
      {(title || subtitle || icon) && (
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-14 bg-primary/10 text-primary">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {title && <h2 className="truncate font-rounded text-lg font-bold tracking-[-0.02em] text-brand-dark sm:text-xl">{title}</h2>}
            {subtitle && <p className="truncate text-xs text-secondary">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className={cn("flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6", (title || subtitle || icon) && "mt-5")}>
        <div className="mx-auto w-full max-w-[220px] shrink-0 sm:max-w-[230px]">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Radar del perfil de convivencia"
        >
          {GRID_RINGS.map((fraction) => (
            <polygon key={fraction} points={gridPoints(fraction)} fill="none" stroke="var(--line)" strokeWidth={1} />
          ))}
          {categories.map((_, index) => {
            const outer = pointAt(index, categories.length, MAX_RADIUS);
            return <line key={index} x1={CENTER_X} y1={CENTER_Y} x2={outer.x} y2={outer.y} stroke="var(--line)" strokeWidth={1} />;
          })}

          <motion.polygon
            points={polygonPoints(categories, scoreRadius)}
            fill="var(--brand)"
            fillOpacity={0.22}
            stroke="var(--brand)"
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          />
          {categories.map((category, index) => {
            const point = pointAt(index, categories.length, scoreRadius(category.score));
            return (
              <motion.circle
                key={category.key}
                cx={point.x}
                cy={point.y}
                r={3.5}
                fill="var(--brand)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              />
            );
          })}

          {categories.map((category, index) => {
            const point = pointAt(index, categories.length, LABEL_RADIUS);
            const anchor = point.x < CENTER_X - 4 ? "end" : point.x > CENTER_X + 4 ? "start" : "middle";
            const words = category.label.split(" ");
            return (
              <text
                key={category.key}
                x={point.x}
                y={point.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-secondary text-[9px] font-bold uppercase tracking-[0.03em]"
              >
                {words.map((word, wordIndex) => (
                  <tspan key={word} x={point.x} dy={wordIndex === 0 ? (words.length > 1 ? "-0.5em" : 0) : "1.1em"}>
                    {word}
                  </tspan>
                ))}
              </text>
            );
          })}
        </svg>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {categories.map((category, index) => (
            <div key={category.key} className="flex items-center gap-2.5">
              <span className="w-24 shrink-0 truncate text-[11px] font-bold uppercase tracking-[0.03em] text-secondary sm:w-28">
                {category.label}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-soft">
                <motion.span
                  className="block h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, Math.min(100, category.score))}%` }}
                  transition={{ duration: 0.7, delay: 0.1 + index * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </span>
              <AnimatedScore value={category.score} delay={0.15 + index * 0.06} />
            </div>
          ))}
        </div>
      </div>

      {actions && (
        <div className="mt-5">
          {actionsCaption && (
            <p className="mb-3 text-center text-sm leading-6 text-secondary">
              {actionsCaption}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">{actions}</div>
        </div>
      )}
    </section>
  );
}

function AnimatedScore({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.8,
      delay,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, delay]);

  return (
    <span ref={ref} className="w-7 shrink-0 text-right text-xs font-bold tabular-nums text-brand-dark">
      {display}
    </span>
  );
}

export function CompatibilityRadarIcon() {
  return <Sparkles className="h-5 w-5" />;
}
