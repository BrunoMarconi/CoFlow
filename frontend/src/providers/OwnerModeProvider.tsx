"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
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
  activateOwnerMode: () => void;
  completeModeSwitch: () => CoFlowMode | null;
};

export const OwnerModeContext = createContext<OwnerModeContextValue | undefined>(
  undefined
);

export default function OwnerModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
  const hasPublishedProperties = properties.some((property) =>
    ["READY", "PUBLISHED", "PAUSED", "RENTED"].includes(property.status)
  );

  const isOwnerRoute = pathname.startsWith("/propietarios");
  const isOwnerMode =
    hasPublishedProperties &&
    (ownerModeUserId === (user?.id ?? null) || isOwnerRoute);

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

  const activateOwnerMode = useCallback(() => {
    if (!user) return;
    setOwnerModeUserId(user.id);
  }, [user]);

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
      activateOwnerMode,
      completeModeSwitch,
    }),
    [
      completeModeSwitch,
      hasPublishedProperties,
      isOwnerMode,
      propertiesLoading,
      requestModeSwitch,
      activateOwnerMode,
      transitionTarget,
    ]
  );

  return (
    <OwnerModeContext.Provider value={value}>
      {children}
    </OwnerModeContext.Provider>
  );
}
