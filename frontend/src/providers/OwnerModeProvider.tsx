"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getMyProperties } from "@/services/properties";

export type CoFlowMode = "member" | "owner";

type OwnerModeContextValue = {
  isOwnerMode: boolean;
  hasPublishedProperties: boolean;
  propertiesLoading: boolean;
  transitionTarget: CoFlowMode | null;
  requestModeSwitch: (target: CoFlowMode) => void;
  completeModeSwitch: () => CoFlowMode | null;
};

const OWNER_MODE_STORAGE_PREFIX = "coflow:mode";

export const OwnerModeContext = createContext<OwnerModeContextValue | undefined>(
  undefined
);

function getStorageKey(userId: number) {
  return `${OWNER_MODE_STORAGE_PREFIX}:${userId}`;
}

export default function OwnerModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, ownerProfile, ownerProfileLoading } = useAuth();
  const [mode, setMode] = useState<CoFlowMode>("member");
  const [transitionTarget, setTransitionTarget] = useState<CoFlowMode | null>(
    null
  );

  const { data: properties = [], isLoading: propertiesQueryLoading } = useQuery({
    queryKey: ["my-properties"],
    queryFn: () => getMyProperties(),
    enabled: Boolean(ownerProfile),
    staleTime: 30_000,
  });

  const propertiesLoading =
    ownerProfileLoading || (Boolean(ownerProfile) && propertiesQueryLoading);
  const hasPublishedProperties = properties.some(
    (property) => property.status === "PUBLISHED"
  );

  const persistMode = useCallback(
    (nextMode: CoFlowMode) => {
      if (!user || typeof window === "undefined") return;

      window.localStorage.setItem(getStorageKey(user.id), nextMode);
    },
    [user]
  );

  // El modo es personal a cada cuenta y se recupera solo cuando ya sabemos
  // si esa cuenta conserva algún piso publicado. Así no se filtra el modo de
  // propietario a otra sesión que use el mismo navegador.
  useEffect(() => {
    if (propertiesLoading) return;

    if (!user || !hasPublishedProperties) {
      setMode("member");
      setTransitionTarget(null);
      return;
    }

    const storedMode = window.localStorage.getItem(getStorageKey(user.id));
    setMode(storedMode === "owner" ? "owner" : "member");
  }, [hasPublishedProperties, propertiesLoading, user]);

  // Si el usuario entra directamente en una ruta de propietario, la
  // navegación se adapta de inmediato sin obligarle a volver antes al Perfil.
  useEffect(() => {
    if (
      propertiesLoading ||
      !hasPublishedProperties ||
      !pathname.startsWith("/propietarios")
    ) {
      return;
    }

    setMode("owner");
    persistMode("owner");
  }, [hasPublishedProperties, pathname, persistMode, propertiesLoading]);

  const requestModeSwitch = useCallback(
    (target: CoFlowMode) => {
      if (target === mode || (target === "owner" && !hasPublishedProperties)) {
        return;
      }

      setTransitionTarget(target);
    },
    [hasPublishedProperties, mode]
  );

  const completeModeSwitch = useCallback(() => {
    if (!transitionTarget) return null;

    setMode(transitionTarget);
    persistMode(transitionTarget);
    setTransitionTarget(null);
    return transitionTarget;
  }, [persistMode, transitionTarget]);

  const value = useMemo(
    () => ({
      isOwnerMode: mode === "owner",
      hasPublishedProperties,
      propertiesLoading,
      transitionTarget,
      requestModeSwitch,
      completeModeSwitch,
    }),
    [completeModeSwitch, hasPublishedProperties, mode, propertiesLoading, requestModeSwitch, transitionTarget]
  );

  return (
    <OwnerModeContext.Provider value={value}>
      {children}
    </OwnerModeContext.Provider>
  );
}
