import { api } from "./api";
import type { AppNotification, NotificationSnapshot } from "@/types/notification";

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

export async function getNotificationSnapshot(limit = 40) {
  const { data } = await api.get<NotificationSnapshot>(
    "/notifications/snapshot",
    { params: { limit } }
  );

  return data;
}

export async function markNotificationRead(notificationId: number) {
  const { data } = await api.post<AppNotification>(
    `/notifications/${notificationId}/read`
  );

  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post<{ unread_count: number }>(
    "/notifications/read-all"
  );

  return data;
}

export async function markNotificationsForLinkRead(link: string) {
  const { data } = await api.post<{
    marked_count: number;
    unread_count: number;
    unread_message_count: number;
  }>(
    "/notifications/read-by-link",
    { link }
  );
  return data;
}
