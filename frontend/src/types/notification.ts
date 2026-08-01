export type NotificationType =
  | "COMMUNITY_APPLICATION_RECEIVED"
  | "COMMUNITY_APPLICATION_ACCEPTED"
  | "COMMUNITY_APPLICATION_REJECTED"
  | "COMMUNITY_INVITATION_ACCEPTED"
  | "CONNECTION_REQUEST_RECEIVED"
  | "CONNECTION_REQUEST_ACCEPTED"
  | "COMMUNITY_MEMBER_JOINED"
  | "COMMUNITY_MEMBER_LEFT"
  | "PRIVATE_MESSAGE_RECEIVED";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
