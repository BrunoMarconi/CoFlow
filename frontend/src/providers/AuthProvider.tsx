"use client";

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { me as fetchMe } from "@/services/auth";
import { getMyCommunity } from "@/services/communities";
import { getMyOwnerProfile } from "@/services/owners";
import {
  getNotificationSnapshot,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
  markNotificationsForLinkRead as markNotificationsForLinkReadRequest,
} from "@/services/notifications";
import { toast } from "@/components/ui/Toast";
import { getToken, clearToken } from "@/lib/auth";
import type { User } from "@/types/auth";
import type { Community } from "@/types/community";
import type { OwnerProfile } from "@/types/owner";
import type { AppNotification } from "@/types/notification";

const UNREAD_POLL_INTERVAL_MS = 5000;

function notificationPath(link: string | null) {
  return link?.split("?", 1)[0].replace(/\/$/, "") || "";
}

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
  hasUnreadMessages: boolean;
  notifications: AppNotification[];
  notificationsLoading: boolean;
  refresh: () => Promise<User | null>;
  refreshCommunity: () => Promise<Community | null>;
  refreshOwnerProfile: () => Promise<OwnerProfile | null>;
  refreshUnreadCount: () => Promise<boolean>;
  markNotificationAsRead: (notificationId: number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  markNotificationsForLinkAsRead: (link: string) => Promise<void>;
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
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const notificationsRef = useRef<AppNotification[]>([]);
  const unreadMessageCountRef = useRef(0);
  const notificationsInitializedRef = useRef(false);
  const notificationRequestIdRef = useRef(0);
  const notificationRefreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const notificationMutationCountRef = useRef(0);

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

  const refreshUnreadCount = useCallback((): Promise<boolean> => {
    if (!getToken()) {
      notificationsRef.current = [];
      unreadMessageCountRef.current = 0;
      notificationsInitializedRef.current = false;
      setNotifications([]);
      setUnreadCount(0);
      setHasUnreadMessages(false);
      setNotificationsLoading(false);
      return Promise.resolve(true);
    }

    if (notificationRefreshPromiseRef.current) {
      return notificationRefreshPromiseRef.current;
    }

    const requestId = ++notificationRequestIdRef.current;
    const mutationCount = notificationMutationCountRef.current;
    const request = getNotificationSnapshot(40)
      .then((snapshot) => {
        if (
          requestId !== notificationRequestIdRef.current ||
          mutationCount !== notificationMutationCountRef.current
        ) {
          return false;
        }

        const currentPathname =
          typeof window !== "undefined" ? window.location.pathname : "";
        const alreadyVisible = snapshot.items.filter(
          (notification) =>
            !notification.is_read && notificationPath(notification.link) === notificationPath(currentPathname)
        );
        const alreadyVisibleMessageCount = alreadyVisible.filter(
          (notification) => notification.type === "PRIVATE_MESSAGE_RECEIVED"
        ).length;
        const nextItems =
          alreadyVisible.length === 0
            ? snapshot.items
            : snapshot.items.map((notification) =>
                notificationPath(notification.link) === notificationPath(currentPathname)
                  ? { ...notification, is_read: true }
                  : notification
              );

        if (alreadyVisible.length > 0) {
          void markNotificationsForLinkReadRequest(currentPathname).catch(() => {});
        }

        if (notificationsInitializedRef.current) {
          const knownIds = new Set(
            notificationsRef.current.map((notification) => notification.id)
          );
          const incoming = nextItems.filter(
            (notification) =>
              !notification.is_read && !knownIds.has(notification.id)
          );

          if (
            incoming.length > 0 &&
            typeof document !== "undefined" &&
            document.visibilityState === "visible" &&
            !currentPathname.startsWith("/propietarios") &&
            currentPathname !== "/notificaciones"
          ) {
            toast.show(
              incoming.length === 1
                ? incoming[0].title
                : `Tienes ${incoming.length} novedades`
            );
          }
        }

        notificationsInitializedRef.current = true;
        notificationsRef.current = nextItems;
        unreadMessageCountRef.current = Math.max(
          0,
          snapshot.unread_message_count - alreadyVisibleMessageCount
        );
        setNotifications(nextItems);
        setUnreadCount(
          Math.max(0, snapshot.unread_count - alreadyVisible.length)
        );
        setHasUnreadMessages(unreadMessageCountRef.current > 0);
        setNotificationsLoading(false);
        return true;
      })
      .catch(() => {
        if (requestId === notificationRequestIdRef.current) {
          setNotificationsLoading(false);
        }
        return false;
      })
      .finally(() => {
        if (notificationRefreshPromiseRef.current === request) {
          notificationRefreshPromiseRef.current = null;
        }
      });

    notificationRefreshPromiseRef.current = request;
    return request;
  }, []);

  const optimisticallyMarkNotificationsRead = useCallback(
    (matches: (notification: AppNotification) => boolean) => {
      let changedCount = 0;
      let changedMessageCount = 0;
      const next = notificationsRef.current.map((notification) => {
        if (notification.is_read || !matches(notification)) return notification;
        changedCount += 1;
        if (notification.type === "PRIVATE_MESSAGE_RECEIVED") {
          changedMessageCount += 1;
        }
        return { ...notification, is_read: true };
      });

      if (changedCount === 0) return 0;

      notificationsRef.current = next;
      unreadMessageCountRef.current = Math.max(
        0,
        unreadMessageCountRef.current - changedMessageCount
      );
      setNotifications(next);
      setUnreadCount((current) => Math.max(0, current - changedCount));
      setHasUnreadMessages(unreadMessageCountRef.current > 0);
      return changedCount;
    },
    []
  );

  const markNotificationAsRead = useCallback(
    async (notificationId: number) => {
      notificationMutationCountRef.current += 1;
      notificationRequestIdRef.current += 1;
      notificationRefreshPromiseRef.current = null;
      const changedCount = optimisticallyMarkNotificationsRead(
        (notification) => notification.id === notificationId
      );
      try {
        await markNotificationReadRequest(notificationId);
        if (changedCount === 0) await refreshUnreadCount();
      } catch (error) {
        await refreshUnreadCount();
        throw error;
      }
    },
    [optimisticallyMarkNotificationsRead, refreshUnreadCount]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    notificationMutationCountRef.current += 1;
    notificationRequestIdRef.current += 1;
    notificationRefreshPromiseRef.current = null;
    const changedCount = optimisticallyMarkNotificationsRead(() => true);
    try {
      await markAllNotificationsReadRequest();
      if (changedCount === 0) await refreshUnreadCount();
    } catch (error) {
      await refreshUnreadCount();
      throw error;
    }
  }, [optimisticallyMarkNotificationsRead, refreshUnreadCount]);

  const markNotificationsForLinkAsRead = useCallback(
    async (link: string) => {
      notificationMutationCountRef.current += 1;
      notificationRequestIdRef.current += 1;
      notificationRefreshPromiseRef.current = null;
      const changedCount = optimisticallyMarkNotificationsRead(
        (notification) => notificationPath(notification.link) === notificationPath(link)
      );
      try {
        const result = await markNotificationsForLinkReadRequest(link);
        setUnreadCount(result.unread_count);
        unreadMessageCountRef.current = result.unread_message_count;
        setHasUnreadMessages(result.unread_message_count > 0);
        if (changedCount === 0) await refreshUnreadCount();
      } catch (error) {
        await refreshUnreadCount();
        throw error;
      }
    },
    [optimisticallyMarkNotificationsRead, refreshUnreadCount]
  );

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
        void refreshUnreadCount();
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
  }, [refreshUnreadCount]);

  useEffect(() => {
    let active = true;

    // El proveedor arranca la única sincronización de sesión al montarse.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().then((currentUser) => {
      if (!active) return;

      if (currentUser) {
        refreshCommunity();
        refreshOwnerProfile();
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

    function handleForegroundRefresh() {
      refreshUnreadCount();
    }

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleForegroundRefresh);
    window.addEventListener("online", handleForegroundRefresh);

    return () => {
      stopPolling();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("focus", handleForegroundRefresh);
      window.removeEventListener("online", handleForegroundRefresh);
    };
  }, [user, refreshUnreadCount]);

  function logout() {
    clearToken();
    setUser(null);
    setCommunity(null);
    setOwnerProfile(null);
    setUnreadCount(0);
    setHasUnreadMessages(false);
    setNotifications([]);
    setNotificationsLoading(false);
    notificationsRef.current = [];
    unreadMessageCountRef.current = 0;
    notificationsInitializedRef.current = false;
    notificationRequestIdRef.current += 1;
    notificationRefreshPromiseRef.current = null;
    notificationMutationCountRef.current = 0;
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
        hasUnreadMessages,
        notifications,
        notificationsLoading,
        refresh,
        refreshCommunity,
        refreshOwnerProfile,
        refreshUnreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        markNotificationsForLinkAsRead,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
