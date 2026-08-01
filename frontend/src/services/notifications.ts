import { api } from "./api";
import type { AppNotification } from "@/types/notification";

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

  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post<{ unread_count: number }>(
    "/notifications/read-all"
  );

  return data;
}
