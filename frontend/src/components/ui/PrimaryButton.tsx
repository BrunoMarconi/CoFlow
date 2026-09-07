"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { MOTION_SPRING } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

/* El hover y el press se animan con framer-motion, no con clases CSS de
 * transform: `transition-all` + `hover:-translate-y-*` le pelearían el
 * transform al spring y se perdería el rebote al soltar. El CSS aquí
 * solo se ocupa del color. */
const MotionLink = motion.create(Link);

type PrimaryButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  // Los handlers de arrastre y animación del DOM chocan con los que
  // framer-motion define con el mismo nombre; ningún botón los usa.
  | "className"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
> & {
  children: ReactNode;
  className?: string;
  /** Si se pasa, se renderiza como <Link> en vez de <button> (mismos
   * estilos). No combina con los handlers/atributos de <button>. */
  href?: string;
};

export default function PrimaryButton({
  children,
  className,
  href,
  type = "button",
  disabled,
  ...props
}: PrimaryButtonProps) {
  const classes = cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button",
    "transition-colors duration-180 ease-out hover:bg-primary-hover",
    "disabled:cursor-not-allowed disabled:opacity-60",
    className
  );

  const gestures = disabled
    ? {}
    : {
        whileHover: { y: -2 },
        whileTap: { scale: 0.97, y: 0 },
        transition: MOTION_SPRING.snappy,
      };

  if (href) {
    return (
      <MotionLink href={href} className={classes} {...gestures}>
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={classes}
      {...gestures}
      {...props}
    >
      {children}
    </motion.button>
  );
}
