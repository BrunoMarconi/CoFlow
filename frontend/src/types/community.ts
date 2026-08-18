import type { CompatibilityScore } from "./compatibilityScore";

export interface CommunityPreferences {
  id: number;
  community_id: number;
  cleanliness: string;
  atmosphere: string;
  visits: string;
  sleepovers: string;
  smoking: string;
  pets: string;
  rules: string;
  lifestyle: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityPreferencesCreate {
  cleanliness: string;
  atmosphere: string;
  visits: string;
  sleepovers: string;
  smoking: string;
  pets: string;
  rules: string;
  lifestyle: string;
}

export interface CommunityPreferencesUpdate {
  cleanliness?: string;
  atmosphere?: string;
  visits?: string;
  sleepovers?: string;
  smoking?: string;
  pets?: string;
  rules?: string;
  lifestyle?: string;
}

export type CommunityCoverColor =
  | "sage"
  | "cream"
  | "stone"
  | "sand"
  | "smoke"
  | "forest";

export interface Community {
  id: number;
  name: string;
  description: string;
  city: string;
  province: string | null;
  neighborhood: string | null;
  max_members: number;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  preferences: CommunityPreferences | null;
  join_type: CommunityJoinType;
  open_spots: number;
  urgency: CommunityUrgency;
  profile_type: CommunityProfileType;
  profile_description: string | null;
  monthly_rent: number | null;
  total_monthly_rent: number | null;
  deposit: number | null;
  move_in_date: string | null;
  room_description: string | null;
  cover_color: CommunityCoverColor;
  cover_image_url: string | null;
  member_count: number;
  is_member: boolean;
  current_user_role: CommunityMemberRole | null;
  is_full: boolean;
  is_saved: boolean;
  members: CommunityMember[];
  average_compatibility: CompatibilityScore | null;
}

export interface CommunityCreate {
  name: string;
  description: string;
  city: string;
  province?: string | null;
  neighborhood?: string | null;
  max_members: number;
  preferences: CommunityPreferencesCreate;
  join_type: CommunityJoinType;
  open_spots: number;
  urgency: CommunityUrgency;
  profile_type: CommunityProfileType;
  profile_description?: string | null;
  monthly_rent?: number | null;
  deposit?: number | null;
  move_in_date?: string | null;
  room_description?: string | null;
  cover_color?: CommunityCoverColor;
}

export interface CommunityUpdate {
  name?: string;
  description?: string;
  city?: string;
  province?: string | null;
  neighborhood?: string | null;
  max_members?: number;
  preferences?: CommunityPreferencesUpdate;
  join_type?: CommunityJoinType;
  open_spots?: number;
  urgency?: CommunityUrgency;
  profile_type?: CommunityProfileType;
  profile_description?: string | null;
  monthly_rent?: number | null;
  deposit?: number | null;
  move_in_date?: string | null;
  room_description?: string | null;
  cover_color?: CommunityCoverColor;
}

export type CommunityProfileType =
  | "STUDENTS"
  | "YOUNG_PROFESSIONALS"
  | "DIGITAL_NOMADS"
  | "WORKERS"
  | "EXAM_CANDIDATES"
  | "INTERNATIONAL_STUDENTS"
  | "MIXED"
  | "OTHER";

export interface GetCommunitiesParams {
  city?: string;
  province?: string;
  profile_type?: CommunityProfileType;
  skip?: number;
  limit?: number;
}

export interface CommunityMemberUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  age: number | null;
  is_email_verified: boolean;
}

export interface CommunityMember {
  id: number;
  user_id: string;
  role: CommunityMemberRole;
  joined_at: string;
  user: CommunityMemberUser;
}

export type CommunityJoinType = "OPEN" | "REQUEST";
export type CommunityMemberRole = "OWNER" | "MEMBER";
export type CommunityUrgency = "NORMAL" | "SOON" | "URGENT";

export interface CommunityMessageSender {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export interface CommunityMessageReplyPreview {
  id: number;
  content: string;
  sender_id: string;
  sender_first_name: string;
}

export interface CommunityMessage {
  id: number;
  community_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  sender: CommunityMessageSender;
  reply_to: CommunityMessageReplyPreview | null;
  like_count: number;
  liked_by_me: boolean;
}

export interface CommunityMessageCreate {
  content: string;
  reply_to_id?: number | null;
}

export interface GetCommunityMessagesParams {
  skip?: number;
  limit?: number;
}

export interface CommunityMemberContribution {
  member_id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  role: CommunityMemberRole;
  monthly_contribution: number | null;
  contribution_percentage: number | null;
}

export interface CommunityRentSplit {
  total_monthly_rent: number | null;
  total_configured: number;
  remaining_amount: number | null;
  contributions: CommunityMemberContribution[];
}

export interface CommunityRentContributionUpdate {
  member_id: number;
  monthly_contribution: number | null;
}

export interface CommunityRentSplitUpdate {
  total_monthly_rent: number | null;
  contributions: CommunityRentContributionUpdate[];
}