"use client";

import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { MOTION_SPRING } from "@/lib/motionTokens";

/* Los handlers de arrastre y animación del DOM chocan con los que
 * framer-motion define con el mismo nombre; ningún botón de la app los
 * usa, así que se omiten en vez de castear. */
type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export default function Button({
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  // El transform lo lleva framer-motion (ver PrimaryButton): en CSS
  // quedan solo el color y la sombra.
  const gestures = disabled
    ? {}
    : {
        whileHover: { y: -2 },
        whileTap: { scale: 0.97, y: 0 },
        transition: MOTION_SPRING.snappy,
      };

  return (
    <motion.button
      disabled={disabled}
      className={clsx(
        "rounded-14 bg-primary px-7 py-4 font-semibold text-white shadow-button transition-colors duration-180 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...gestures}
      {...props}
    >
      {children}
    </motion.button>
  );
}
