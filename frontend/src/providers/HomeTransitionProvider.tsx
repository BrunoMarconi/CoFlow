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
import { setArrivingHome } from "@/lib/homeTransitionState";
import { MOTION_HOME_PORTAL_EXIT_MS } from "@/lib/motionTokens";

interface HomeTransitionContextValue {
  /** true mientras la pantalla actual está jugando su animación de
   * salida hacia Tu Comunidad, justo antes de navegar de verdad. */
  leavingHome: boolean;
  /** Reemplaza la navegación normal del icono de la casita: deja que
   * la pantalla actual se aleje (ver AppShell) y solo entonces navega. */
  requestHomeNavigate: (target: string) => void;
}

const HomeTransitionContext =
  createContext<HomeTransitionContextValue | null>(null);

export default function HomeTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [leavingHome, setLeavingHome] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const requestHomeNavigate = useCallback(
    (target: string) => {
      // Una petición nueva siempre reemplaza a la anterior — igual
      // que ExplorerTransitionProvider, para que no se pueda quedar
      // bloqueado esperando una navegación anterior.
      clearPendingTimeout();

      if (reducedMotion) {
        setArrivingHome();
        router.push(target);
        return;
      }

      setLeavingHome(true);

      timeoutRef.current = window.setTimeout(() => {
        setArrivingHome();
        router.push(target);
        setLeavingHome(false);
        timeoutRef.current = null;
      }, MOTION_HOME_PORTAL_EXIT_MS);
    },
    [clearPendingTimeout, reducedMotion, router]
  );

  // Red de seguridad: si la ruta cambia por cualquier otro motivo
  // mientras una salida seguía pendiente, cancela el router.push
  // diferido — nunca debe navegar "tarde" a un sitio que ya no toca.
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    clearPendingTimeout();
    setLeavingHome(false);
  }, [pathname, clearPendingTimeout]);

  return (
    <HomeTransitionContext.Provider
      value={{ leavingHome, requestHomeNavigate }}
    >
      {children}
    </HomeTransitionContext.Provider>
  );
}

export function useHomeTransition() {
  const context = useContext(HomeTransitionContext);

  if (!context) {
    throw new Error(
      "useHomeTransition debe usarse dentro de <HomeTransitionProvider>"
    );
  }

  return context;
}
