export type CommunityInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "EXPIRED";

export interface CommunityInvitation {
  id: number;
  community_id: number;
  invited_by_id: string;
  invited_user_id: string | null;
  token: string;
  status: CommunityInvitationStatus;
  expires_at: string;
  accepted_by_id: string | null;
  created_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
}

export interface CommunityInvitationCommunity {
  id: number;
  name: string;
  city: string;
  member_count: number;
  owner_first_name: string;
  owner_last_name: string;
  max_members: number;
  open_spots: number;
}

export interface CommunityInvitationDetail {
  status: CommunityInvitationStatus;
  expires_at: string;
  community: CommunityInvitationCommunity;
}

export interface CommunityInvitationInboxItem {
  id: number;
  token: string;
  status: CommunityInvitationStatus;
  expires_at: string;
  created_at: string;
  community: CommunityInvitationCommunity;
}
