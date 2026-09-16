export type AdminUserStatus =
  | "NEW"
  | "INCOMPLETE"
  | "LOOKING"
  | "MATCH_FOUND"
  | "CONTACTED"
  | "IN_COMMUNITY"
  | "PAUSED";

export type CommunityFormationStatus = "FORMING" | "FORMED";
export type MatchReviewStatus = "SAVED" | "DISMISSED" | "PROPOSED";

export interface AdminUserSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  age: number | null;
  occupation: string | null;
  rental_budget: number | null;
  admin_status: AdminUserStatus;
  onboarding_completed: boolean;
  profile_completion: number;
  suggested_matches: number;
  community_name: string | null;
  created_at: string;
}

export interface AdminUserListResponse {
  items: AdminUserSummary[];
  total: number;
  status_counts: Record<AdminUserStatus, number>;
}

export interface AdminHardFilter {
  key: string;
  label: string;
  passed: boolean | null;
  detail: string;
}

export interface AdminScoreFactor {
  key: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface AdminMatchSuggestion {
  user: AdminUserSummary;
  score: number;
  eligible: boolean;
  hard_filters: AdminHardFilter[];
  factors: AdminScoreFactor[];
  shared_interests: string[];
  review_status: MatchReviewStatus | null;
}

export interface AdminUserDetail {
  user: AdminUserSummary;
  phone: string | null;
  bio: string | null;
  interests: string[];
  habits: Record<string, string>;
  hard_filter_data: Record<string, string | number | null>;
  matches: AdminMatchSuggestion[];
}

export interface AdminCommunityMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: string;
}

export interface AdminCommunityCandidate {
  user: AdminUserSummary;
  score: number;
  eligible: boolean;
  reasons: string[];
}

export interface AdminCommunitySummary {
  id: number;
  name: string;
  city: string;
  neighborhood: string | null;
  max_members: number;
  open_spots: number;
  move_in_date: string | null;
  monthly_rent: number | null;
  formation_status: CommunityFormationStatus;
  members: AdminCommunityMember[];
  candidates: AdminCommunityCandidate[];
  created_at: string;
}
