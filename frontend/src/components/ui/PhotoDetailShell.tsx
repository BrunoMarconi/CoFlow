"use client";

import { useRef, ViewTransition, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/* Parallax de la portada en las pantallas de detalle (persona, piso,
 * comunidad). El media se desplaza más despacio que la página, así que
 * la ficha parece deslizarse por encima de la foto.
 *
 * El contenedor interno sobresale un 12% por arriba y por abajo para que
 * el recorrido (±8%) nunca destape un borde vacío. */
const PARALLAX_TRAVEL = ["-8%", "8%"];

export default function PhotoDetailShell({
  transitionName,
  media,
  actions,
  children,
  mediaClassName,
  contentClassName,
}: {
  transitionName: string;
  media: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  mediaClassName?: string;
  contentClassName?: string;
}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: mediaRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], PARALLAX_TRAVEL);

  return (
    <div className="-mx-6 sm:mx-auto sm:w-full sm:max-w-6xl">
      <div className="relative">
        <ViewTransition name={transitionName} share="coflow-detail-morph">
          <div
            ref={mediaRef}
            className={cn(
              "relative h-[52svh] min-h-[22rem] max-h-[40rem] overflow-hidden bg-[#eceeea] sm:h-[38rem] sm:rounded-[1.75rem]",
              mediaClassName
            )}
          >
            {prefersReducedMotion ? (
              media
            ) : (
              <motion.div
                style={{ y }}
                className="absolute inset-x-0 inset-y-[-12%] will-change-transform"
              >
                {media}
              </motion.div>
            )}
          </div>
        </ViewTransition>

        {actions ? (
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
            {actions}
          </div>
        ) : null}
      </div>

      <section
        className={cn(
          "relative z-10 -mt-7 min-h-64 rounded-t-[1.75rem] bg-[#fbfcfa] px-6 pb-8 pt-8 shadow-[0_-12px_40px_rgba(20,42,32,0.07)] sm:mx-8 sm:-mt-12 sm:rounded-[1.5rem] sm:border sm:border-black/[0.06] sm:px-10 sm:pb-11 sm:pt-10",
          contentClassName
        )}
      >
        {children}
      </section>
    </div>
  );
}
