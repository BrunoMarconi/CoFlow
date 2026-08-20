"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
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

const OWNER_MODE_STORAGE_KEY = "coflow-owner-mode-user";
const OWNER_MODE_EVENT = "coflow-owner-mode-change";

function subscribeToOwnerMode(onStoreChange: () => void) {
  window.addEventListener(OWNER_MODE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(OWNER_MODE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readOwnerModeUserId() {
  return window.sessionStorage.getItem(OWNER_MODE_STORAGE_KEY);
}

function writeOwnerModeUserId(userId: string | null) {
  if (userId) {
    window.sessionStorage.setItem(OWNER_MODE_STORAGE_KEY, userId);
  } else {
    window.sessionStorage.removeItem(OWNER_MODE_STORAGE_KEY);
  }
  window.dispatchEvent(new Event(OWNER_MODE_EVENT));
}

export default function OwnerModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, ownerProfile, ownerProfileLoading } = useAuth();
  const ownerModeUserId = useSyncExternalStore(
    subscribeToOwnerMode,
    readOwnerModeUserId,
    () => null
  );
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
    Boolean(ownerProfile) &&
    (ownerModeUserId === (user?.id ?? null) || isOwnerRoute);

  const requestModeSwitch = useCallback(
    (target: CoFlowMode) => {
      if (
        target === (isOwnerMode ? "owner" : "member") ||
        (target === "owner" && !ownerProfile)
      ) {
        return;
      }

      setTransitionTarget(target);
    },
    [isOwnerMode, ownerProfile]
  );

  const activateOwnerMode = useCallback(() => {
    if (!user) return;
    writeOwnerModeUserId(user.id);
  }, [user]);

  const completeModeSwitch = useCallback(() => {
    if (!transitionTarget) return null;

    const nextUserId = transitionTarget === "owner" ? user?.id ?? null : null;
    writeOwnerModeUserId(nextUserId);
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
