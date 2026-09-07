"use client";

import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useEffect,
  useId,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import clsx from "clsx";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  leftElement?: ReactNode;
};

/** Sacudida corta al aparecer un error: llama la atención sobre el campo
 * que falla sin necesidad de mover el foco ni sacar un diálogo. */
const SHAKE_KEYFRAMES = { x: [0, -6, 5, -3, 0] };

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      leftElement,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const prefersReducedMotion = useReducedMotion();
    const shakeControls = useAnimationControls();
    const [focused, setFocused] = useState(false);

    useEffect(() => {
      if (!error || prefersReducedMotion) return;

      shakeControls.start(SHAKE_KEYFRAMES, {
        duration: 0.35,
        ease: MOTION_EASE.out,
      });
    }, [error, prefersReducedMotion, shakeControls]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              "mb-2 block text-sm font-semibold transition-colors duration-180",
              error
                ? "text-red-600"
                : focused
                  ? "text-primary"
                  : "text-foreground"
            )}
          >
            {label}

            {required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <motion.div className="relative" animate={shakeControls}>
          {leftElement && (
            <div
              className={clsx(
                "pointer-events-none absolute inset-y-0 left-4 flex items-center transition-colors duration-180",
                focused && !error ? "text-primary" : "text-muted"
              )}
            >
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            className={clsx(
              "h-11.5 w-full rounded-14 border bg-surface px-4 text-[15px] text-foreground shadow-soft",
              "outline-none transition-all duration-180",
              "placeholder:text-muted",
              "hover:border-secondary/40",
              "focus:border-primary focus:ring-4 focus:ring-primary/10",
              leftElement && "pl-11",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                : "border-border",
              className
            )}
            {...props}
          />
        </motion.div>

        {/* El mensaje despliega su alto en vez de empujar de golpe lo que
            tiene debajo, que en un formulario largo se lee como un salto. */}
        <AnimatePresence initial={false} mode="wait">
          {error ? (
            <motion.p
              key="error"
              id={`${inputId}-error`}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, height: 0, marginTop: 0 }
              }
              animate={{ opacity: 1, height: "auto", marginTop: 8 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, height: 0, marginTop: 0 }
              }
              transition={{
                duration: MOTION_DURATION.fast,
                ease: MOTION_EASE.out,
              }}
              className="overflow-hidden text-sm font-medium text-red-600"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <p
              key="helper"
              id={`${inputId}-helper`}
              className="mt-2 text-sm leading-5 text-muted"
            >
              {helperText}
            </p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
