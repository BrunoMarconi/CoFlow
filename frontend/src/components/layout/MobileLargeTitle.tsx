"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { cn } from "@/lib/utils";

/* Título grande estilo iOS: ocupa su sitio arriba del todo y, al
 * desplazarse, se encoge y se desvanece mientras la barra superior
 * adopta el mismo texto en pequeño (ver Navbar). El relevo entre los dos
 * se coordina por el provider de chrome móvil.
 *
 * Solo existe en móvil: en escritorio hay sidebar y espacio de sobra, y
 * el título se comporta como un encabezado normal. */

/** Scroll (px) en el que el título grande acaba de ceder el relevo. */
const HANDOFF_DISTANCE = 44;

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
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { setPageTitle, setTitleCollapsed } = useMobileChrome();

  const { scrollY } = useScroll();

  const opacity = useTransform(scrollY, [0, HANDOFF_DISTANCE], [1, 0]);
  const y = useTransform(scrollY, [0, HANDOFF_DISTANCE], [0, -10]);
  const scale = useTransform(scrollY, [0, HANDOFF_DISTANCE], [1, 0.94]);

  useEffect(() => {
    setPageTitle(title);

    return () => setPageTitle(null);
  }, [title, setPageTitle]);

  useEffect(() => {
    // El relevo se decide por la posición real de scroll, no por un
    // observer sobre el título: así la barra no parpadea cuando el
    // contenido de la página cambia de alto al cargar.
    function sync() {
      setTitleCollapsed(window.scrollY > HANDOFF_DISTANCE);
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });

    return () => window.removeEventListener("scroll", sync);
  }, [setTitleCollapsed]);

  return (
    <header ref={ref} className={cn("md:hidden", className)}>
      <motion.div
        style={
          prefersReducedMotion ? undefined : { opacity, y, scale }
        }
        className="flex origin-left items-end justify-between gap-4"
      >
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 font-rounded text-[28px] font-extrabold tracking-[-0.04em] text-brand-dark">
            {title}
          </h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </motion.div>
    </header>
  );
}
