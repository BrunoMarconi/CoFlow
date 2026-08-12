"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
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

export const OwnerModeContext = createContext<OwnerModeContextValue | undefined>(
  undefined
);

export default function OwnerModeProvider({ children }: { children: ReactNode }) {
  const { user, ownerProfile, ownerProfileLoading } = useAuth();
  const [ownerModeUserId, setOwnerModeUserId] = useState<string | null>(null);
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

  // El cambio vive durante la sesión actual y queda ligado a la cuenta que lo
  // activó. Al cerrar sesión, ninguna cuenta posterior hereda este modo.
  const isOwnerMode =
    hasPublishedProperties && ownerModeUserId === (user?.id ?? null);

  const requestModeSwitch = useCallback(
    (target: CoFlowMode) => {
      if (
        target === (isOwnerMode ? "owner" : "member") ||
        (target === "owner" && !hasPublishedProperties)
      ) {
        return;
      }

      setTransitionTarget(target);
    },
    [hasPublishedProperties, isOwnerMode]
  );

  const completeModeSwitch = useCallback(() => {
    if (!transitionTarget) return null;

    setOwnerModeUserId(transitionTarget === "owner" ? user?.id ?? null : null);
    setTransitionTarget(null);
    return transitionTarget;
  }, [transitionTarget, user?.id]);

  const value = useMemo(
    () => ({
      isOwnerMode,
      hasPublishedProperties,
      propertiesLoading,
      transitionTarget,
      requestModeSwitch,
      completeModeSwitch,
    }),
    [
      completeModeSwitch,
      hasPublishedProperties,
      isOwnerMode,
      propertiesLoading,
      requestModeSwitch,
      transitionTarget,
    ]
  );

  return (
    <OwnerModeContext.Provider value={value}>
      {children}
    </OwnerModeContext.Provider>
  );
}
