"use client";

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { me as fetchMe } from "@/services/auth";
import { getMyCommunity } from "@/services/communities";
import { getMyOwnerProfile } from "@/services/owners";
import { getUnreadNotificationCount } from "@/services/notifications";
import { getToken, clearToken } from "@/lib/auth";
import type { User } from "@/types/auth";
import type { Community } from "@/types/community";
import type { OwnerProfile } from "@/types/owner";

const UNREAD_POLL_INTERVAL_MS = 30000;

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[auth]", ...args);
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  community: Community | null;
  communityLoading: boolean;
  ownerProfile: OwnerProfile | null;
  ownerProfileLoading: boolean;
  unreadCount: number;
  refresh: () => Promise<User | null>;
  refreshCommunity: () => Promise<Community | null>;
  refreshOwnerProfile: () => Promise<OwnerProfile | null>;
  refreshUnreadCount: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<Community | null>(null);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [ownerProfileLoading, setOwnerProfileLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const userRef = useRef<User | null>(null);

  // AuthProvider vive una sola vez para toda la sesión de navegación (no
  // se remonta al navegar de /login a /comunidades). Eso significa que
  // la llamada a refresh() del montaje inicial (con el token que hubiera
  // en localStorage al cargar la página, o ninguno) puede seguir en
  // vuelo cuando el login dispara su propio refresh(). Sin esta guarda,
  // la respuesta que llegue más tarde —aunque sea la más antigua y ya
  // no relevante— pisa el estado más reciente y correcto, dejando al
  // usuario con user=null tras un login que sí funcionó. Solo se aplica
  // el resultado de la llamada más reciente.
  const refreshRequestIdRef = useRef(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!userRef.current) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Silencioso: el contador se reintentará en el siguiente polling.
    }
  }, []);

  const refreshCommunity = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setCommunity(null);
      setCommunityLoading(false);
      return null;
    }

    try {
      const currentCommunity = await getMyCommunity();
      setCommunity(currentCommunity);
      return currentCommunity;
    } catch {
      setCommunity(null);
      return null;
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  const refreshOwnerProfile = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setOwnerProfile(null);
      setOwnerProfileLoading(false);
      return null;
    }

    try {
      const currentOwnerProfile = await getMyOwnerProfile();
      setOwnerProfile(currentOwnerProfile);
      return currentOwnerProfile;
    } catch {
      setOwnerProfile(null);
      return null;
    } finally {
      setOwnerProfileLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const requestId = ++refreshRequestIdRef.current;
    const isCurrent = () => requestId === refreshRequestIdRef.current;
    const token = getToken();

    if (!token) {
      devLog("refresh(): sin token");

      if (isCurrent()) {
        setUser(null);
        setLoading(false);
        setCommunity(null);
        setCommunityLoading(false);
        setOwnerProfile(null);
        setOwnerProfileLoading(false);
      }
      return null;
    }

    try {
      const currentUser = await fetchMe(token);
      devLog("refresh(): /auth/me respondió", {
        userId: currentUser.id,
        stale: !isCurrent(),
      });

      if (isCurrent()) {
        setUser(currentUser);
        devLog("refresh(): user actualizado en el contexto");
      }
      return currentUser;
    } catch (error) {
      devLog("refresh(): /auth/me falló", { stale: !isCurrent(), error });

      if (isCurrent()) {
        clearToken();
        setUser(null);
        setCommunity(null);
        setCommunityLoading(false);
        setOwnerProfile(null);
        setOwnerProfileLoading(false);
      }
      return null;
    } finally {
      if (isCurrent()) {
        setLoading(false);
        devLog("refresh(): loading actualizado a false");
      }
    }
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let active = true;

    refresh().then((currentUser) => {
      if (!active) return;

      if (currentUser) {
        refreshCommunity();
        refreshOwnerProfile();
        refreshUnreadCount();
      } else {
        setCommunityLoading(false);
        setOwnerProfileLoading(false);
      }
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      if (intervalId) return;

      intervalId = setInterval(() => {
        refreshUnreadCount();
      }, UNREAD_POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshUnreadCount();
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [user, refreshUnreadCount]);

  function logout() {
    clearToken();
    setUser(null);
    setCommunity(null);
    setOwnerProfile(null);
    setUnreadCount(0);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        community,
        communityLoading,
        ownerProfile,
        ownerProfileLoading,
        unreadCount,
        refresh,
        refreshCommunity,
        refreshOwnerProfile,
        refreshUnreadCount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
