"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  setArrivingHomeDirection,
  type HomeDirection,
} from "@/lib/homeTransitionState";
import { MOTION_HOME_EXIT_MS } from "@/lib/motionTokens";

interface HomeTransitionContextValue {
  /** No-null mientras la pantalla actual está jugando su salida —
   * "enter" si vamos hacia Tu Comunidad, "exit" si salimos de ella.
   * Lo consume AppShell para animar el slide vertical. */
  homeDirection: HomeDirection;
  /** true si `href` es "Tu comunidad" (/mi-comunidad o la ficha
   * pública de tu propia comunidad) — para decidir si un click debe
   * pasar por esta transición o comportarse como un <Link> normal. */
  isHomeRoute: (href: string) => boolean;
  /** Sustituye la navegación normal de un link: deja que la pantalla
   * actual baje/suba y solo entonces navega de verdad. */
  requestHomeNavigate: (target: string, direction: "enter" | "exit") => void;
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
  const { community } = useAuth();
  const [homeDirection, setHomeDirection] = useState<HomeDirection>(null);
  const timeoutRef = useRef<number | null>(null);

  const ownCommunityHref = community ? `/comunidades/${community.id}` : null;

  const isHomeRoute = useCallback(
    (href: string) => href === "/mi-comunidad" || href === ownCommunityHref,
    [ownCommunityHref]
  );

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const requestHomeNavigate = useCallback(
    (target: string, direction: "enter" | "exit") => {
      // Una petición nueva siempre reemplaza a la anterior — para que
      // no se pueda quedar bloqueado esperando una navegación previa.
      clearPendingTimeout();

      if (reducedMotion) {
        setArrivingHomeDirection(direction);
        router.push(target);
        return;
      }

      setHomeDirection(direction);

      timeoutRef.current = window.setTimeout(() => {
        setArrivingHomeDirection(direction);
        router.push(target);
        setHomeDirection(null);
        timeoutRef.current = null;
      }, MOTION_HOME_EXIT_MS);
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
    setHomeDirection(null);
  }, [pathname, clearPendingTimeout]);

  const value = useMemo(
    () => ({ homeDirection, isHomeRoute, requestHomeNavigate }),
    [homeDirection, isHomeRoute, requestHomeNavigate]
  );

  return (
    <HomeTransitionContext.Provider value={value}>
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
