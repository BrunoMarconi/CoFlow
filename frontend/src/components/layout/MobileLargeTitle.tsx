"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  TITLE_HANDOFF_DISTANCE,
  useMobilePageTitle,
} from "@/hooks/useMobilePageTitle";
import { cn } from "@/lib/utils";

/* Título grande estilo iOS: ocupa su sitio arriba del todo y, al
 * desplazarse, se encoge y se desvanece mientras la barra superior
 * adopta el mismo texto en pequeño (ver Navbar).
 *
 * Solo existe en móvil: en escritorio hay sidebar y espacio de sobra, y
 * el título se comporta como un encabezado normal. */

export default function MobileLargeTitle({
  title,
  eyebrow,
  action,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMobilePageTitle(title);

  const opacity = useTransform(scrollY, [0, TITLE_HANDOFF_DISTANCE], [1, 0]);
  const y = useTransform(scrollY, [0, TITLE_HANDOFF_DISTANCE], [0, -10]);
  const scale = useTransform(scrollY, [0, TITLE_HANDOFF_DISTANCE], [1, 0.94]);

  return (
    <header className={cn("md:hidden", className)}>
      <motion.div
        style={prefersReducedMotion ? undefined : { opacity, y, scale }}
        className="flex origin-left items-end justify-between gap-4"
      >
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-3xs font-bold uppercase tracking-[0.18em] text-muted">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 font-rounded text-3xl font-extrabold tracking-[-0.04em] text-brand-dark">
            {title}
          </h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </motion.div>
    </header>
  );
}
