"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { CompatibilityCategoryScore } from "@/types/compatibilityScore";
import { cn } from "@/lib/utils";

const WIDTH = 380;
const HEIGHT = 320;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const MAX_RADIUS = 92;
const LABEL_RADIUS = MAX_RADIUS + 28;
const GRID_RINGS = [0.25, 0.5, 0.75, 1];

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
  className,
}: {
  categories: CompatibilityCategoryScore[];
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  if (categories.length === 0) return null;

  const scoreRadius = (score: number) => MAX_RADIUS * (0.08 + 0.92 * (Math.max(0, Math.min(100, score)) / 100));
  const gridPoints = (fraction: number) =>
    Array.from({ length: categories.length })
      .map((_, index) => {
        const { x, y } = pointAt(index, categories.length, MAX_RADIUS * fraction);
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <section className={cn("rounded-24 border border-border bg-surface p-6 shadow-soft sm:p-8", className)}>
      {(title || subtitle || icon) && (
        <div className="flex flex-col items-center text-center">
          {icon && (
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-18 bg-primary/10 text-primary">
              {icon}
            </span>
          )}
          {title && <h2 className="font-rounded text-2xl font-bold tracking-[-0.02em] text-brand-dark sm:text-3xl">{title}</h2>}
          {subtitle && <p className="mt-2 text-sm text-secondary">{subtitle}</p>}
        </div>
      )}

      <div className={cn("mt-6 rounded-24 bg-primary/5 p-4", (title || subtitle || icon) && "mt-7")}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mx-auto w-full max-w-md" role="img" aria-label="Radar del perfil de convivencia">
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
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          />
          {categories.map((category, index) => {
            const point = pointAt(index, categories.length, scoreRadius(category.score));
            return (
              <motion.circle
                key={category.key}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="var(--brand)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
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
                className="fill-secondary text-[11px] font-bold uppercase tracking-[0.04em]"
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

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category, index) => (
          <div key={category.key} className="rounded-18 bg-surface-soft p-4">
            <p className="text-xs font-bold uppercase tracking-[0.04em] text-secondary">{category.label}</p>
            <AnimatedScore value={category.score} delay={0.15 + index * 0.06} />
            <p className="mt-1 text-xs leading-5 text-secondary">{category.description}</p>
          </div>
        ))}
      </div>

      {actions && <div className="mt-7 grid gap-3 sm:grid-cols-2">{actions}</div>}
    </section>
  );
}

function AnimatedScore({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      delay,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, delay]);

  return (
    <p ref={ref} className="mt-1 text-2xl font-bold tracking-[-0.02em] text-brand-dark">
      {display}
    </p>
  );
}

export function CompatibilityRadarIcon() {
  return <Sparkles className="h-6 w-6" />;
}
