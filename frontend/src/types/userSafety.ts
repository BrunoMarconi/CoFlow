export type UserReportReason =
  | "HARASSMENT"
  | "SPAM"
  | "IMPERSONATION"
  | "UNSAFE_BEHAVIOUR"
  | "INAPPROPRIATE_CONTENT"
  | "OTHER";

export interface BlockedUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  blocked_at: string;
}

export interface UserReportPayload {
  reason: UserReportReason;
  details?: string;
}
