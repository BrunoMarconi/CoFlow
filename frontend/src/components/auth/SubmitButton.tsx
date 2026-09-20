"use client";

import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import s from "./Auth.module.css";

export type SubmitState = "idle" | "loading" | "done";

/**
 * El botón cuenta en qué punto está: al enviarse se recoge en un círculo
 * con un spinner, y al salir bien dibuja un visto. Así el usuario sabe
 * que su clic ha entrado sin tener que leer un cambio de texto, y el
 * visto se queda a la vista mientras carga la pantalla siguiente.
 */
export default function SubmitButton({
  state = "idle",
  children,
  ...props
}: { state?: SubmitState; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  return (
    <button
      type="submit"
      disabled={state !== "idle"}
      data-state={state}
      aria-busy={state === "loading"}
      className={s.submit}
      {...props}
    >
      <span className={s.submitLabel}>
        {children}
        <ArrowRight />
      </span>

      <span className={`${s.submitState} ${s.submitSpinner}`} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="42" strokeDashoffset="12" />
        </svg>
      </span>

      <span className={`${s.submitState} ${s.submitCheck}`} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
