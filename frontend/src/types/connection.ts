export type UserConnectionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

export interface UserConnectionParticipant {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export interface UserConnection {
  id: number;
  status: UserConnectionStatus;
  created_at: string;
  responded_at: string | null;
  requester: UserConnectionParticipant;
  recipient: UserConnectionParticipant;
}

export interface UserConnectionRequests {
  received: UserConnection[];
  sent: UserConnection[];
}

export interface UserConnectionOverview extends UserConnectionRequests {
  accepted: UserConnection[];
}
