export type NotificationType =
  | "COMMUNITY_APPLICATION_RECEIVED"
  | "COMMUNITY_APPLICATION_ACCEPTED"
  | "COMMUNITY_APPLICATION_REJECTED"
  | "COMMUNITY_INVITATION_ACCEPTED"
  | "COMMUNITY_INVITATION_RECEIVED"
  | "CONNECTION_REQUEST_RECEIVED"
  | "CONNECTION_REQUEST_ACCEPTED"
  | "COMMUNITY_MEMBER_JOINED"
  | "COMMUNITY_MEMBER_LEFT"
  | "COMMUNITY_MEMBER_REMOVED"
  | "COMMUNITY_OWNERSHIP_TRANSFERRED"
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

export interface NotificationSnapshot {
  items: AppNotification[];
  unread_count: number;
  unread_message_count: number;
}

export interface NotificationPreferences {
  in_app_enabled: boolean;
  email_enabled: boolean;
  messages: boolean;
  connections: boolean;
  communities: boolean;
  applications: boolean;
  email_frequency: "immediate" | "daily" | "never";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}
