"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import {
  setArrivingDirection,
  type ExplorerDirection,
} from "@/lib/explorerTransitionState";
import { MOTION_GROUP_TRAVEL_MS } from "@/lib/motionTokens";

type ExplorerRoute = "/comunidades" | "/usuarios";

interface ExplorerTransitionContextValue {
  /** No-null mientras la página actual está jugando su animación de
   * salida, justo antes de navegar de verdad. */
  leaving: ExplorerDirection;
  /** Reemplaza la navegación normal del Link para el par
   * Personas/Comunidades: deja que la página actual anime su salida
   * (ExplorerGridMotion/AvatarClusterLayer) y solo entonces navega. */
  requestNavigate: (target: ExplorerRoute) => void;
  /** Cancela una salida en curso sin navegar — para cuando el
   * usuario pulsa otra vez el link de la sección en la que ya está
   * (p. ej. Personas -> Comunidades -> Personas antes de que termine). */
  cancelLeaving: () => void;
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
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [leaving, setLeaving] = useState<ExplorerDirection>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancelLeaving = useCallback(() => {
    clearPendingTimeout();
    setLeaving(null);
  }, [clearPendingTimeout]);

  const requestNavigate = useCallback(
    (target: ExplorerRoute) => {
      const direction = directionFor(target);

      // Una petición nueva siempre reemplaza a la anterior — es lo
      // que permite que Personas -> Comunidades -> Personas revierta
      // de inmediato en vez de esperar a que termine la primera.
      clearPendingTimeout();

      if (reducedMotion) {
        setArrivingDirection(direction);
        router.push(target);
        return;
      }

      setLeaving(direction);

      timeoutRef.current = window.setTimeout(() => {
        setArrivingDirection(direction);
        router.push(target);
        setLeaving(null);
        timeoutRef.current = null;
      }, MOTION_GROUP_TRAVEL_MS);
    },
    [clearPendingTimeout, reducedMotion, router]
  );

  // Red de seguridad: si la ruta cambia por cualquier otro motivo
  // mientras una salida seguía pendiente (p. ej. el usuario navegó a
  // /mensajes desde el propio Sidebar), cancela el router.push
  // diferido — nunca debe navegar "tarde" a un sitio que ya no toca.
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    clearPendingTimeout();
    setLeaving(null);
  }, [pathname, clearPendingTimeout]);

  return (
    <ExplorerTransitionContext.Provider
      value={{ leaving, requestNavigate, cancelLeaving }}
    >
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
