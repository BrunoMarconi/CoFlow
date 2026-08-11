"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import {
  setArrivingDirection,
  type ExplorerDirection,
} from "@/lib/explorerTransitionState";
import { MOTION_DURATION } from "@/lib/motionTokens";

type ExplorerRoute = "/comunidades" | "/usuarios";

interface ExplorerTransitionContextValue {
  /** No-null mientras la página actual está jugando su animación de
   * salida, justo antes de navegar de verdad. */
  leaving: ExplorerDirection;
  /** Reemplaza la navegación normal del Link para el par
   * Personas/Comunidades: deja que la página actual anime su salida
   * (ExplorerGridMotion) y solo entonces navega. */
  requestNavigate: (target: ExplorerRoute) => void;
}

const ExplorerTransitionContext =
  createContext<ExplorerTransitionContextValue | null>(null);

// Personas -> Comunidades se lee como "agrupamiento"; Comunidades ->
// Personas como "dispersión" — independiente del orden de las rutas.
function directionFor(target: ExplorerRoute): ExplorerDirection {
  return target === "/comunidades" ? "group" : "spread";
}

export default function ExplorerTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [leaving, setLeaving] = useState<ExplorerDirection>(null);
  const pendingRef = useRef(false);

  const requestNavigate = useCallback(
    (target: ExplorerRoute) => {
      if (pendingRef.current) return;

      const direction = directionFor(target);

      if (reducedMotion) {
        setArrivingDirection(direction);
        router.push(target);
        return;
      }

      pendingRef.current = true;
      setLeaving(direction);

      window.setTimeout(() => {
        setArrivingDirection(direction);
        router.push(target);
        setLeaving(null);
        pendingRef.current = false;
      }, MOTION_DURATION.fast * 1000);
    },
    [reducedMotion, router]
  );

  return (
    <ExplorerTransitionContext.Provider value={{ leaving, requestNavigate }}>
      {children}
    </ExplorerTransitionContext.Provider>
  );
}

export function useExplorerTransition() {
  const context = useContext(ExplorerTransitionContext);

  if (!context) {
    throw new Error(
      "useExplorerTransition debe usarse dentro de <ExplorerTransitionProvider>"
    );
  }

  return context;
}
