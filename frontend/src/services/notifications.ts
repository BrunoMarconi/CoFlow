import { api } from "./api";
import type { AppNotification } from "@/types/notification";

export const NOTIFICATIONS_CHANGED_EVENT = "coflow:notifications-changed";

function announceNotificationChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}

export interface GetNotificationsParams {
  skip?: number;
  limit?: number;
}

export async function getNotifications(params?: GetNotificationsParams) {
  const { data } = await api.get<AppNotification[]>("/notifications", {
    params,
  });

  return data;
}

export async function getUnreadNotificationCount() {
  const { data } = await api.get<{ unread_count: number }>(
    "/notifications/unread-count"
  );

  return data.unread_count;
}

export async function markNotificationRead(notificationId: number) {
  const { data } = await api.post<AppNotification>(
    `/notifications/${notificationId}/read`
  );

  announceNotificationChange();
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post<{ unread_count: number }>(
    "/notifications/read-all"
  );

  announceNotificationChange();
  return data;
}

export async function markNotificationsForLinkRead(link: string) {
  const notifications = await getNotifications({ limit: 100 });
  const pending = notifications.filter(
    (notification) => !notification.is_read && notification.link === link
  );

  if (pending.length === 0) return;

  await Promise.all(
    pending.map((notification) =>
      api.post<AppNotification>(`/notifications/${notification.id}/read`)
    )
  );
  announceNotificationChange();
}
