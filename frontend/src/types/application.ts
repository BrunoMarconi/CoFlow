export type CommunityApplicationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

export interface CommunityApplicationApplicantPreferences {
  cleanliness: string;
  lifestyle: string;
  smoking: string;
  pets: string;
}

export interface CommunityApplicationApplicant {
  id: string;
  first_name: string;
  last_name: string;
  rental_budget: number | null;
  preferences: CommunityApplicationApplicantPreferences | null;
}

export interface CommunityApplication {
  id: number;
  community_id: number;
  status: CommunityApplicationStatus;
  message: string;
  created_at: string;
  reviewed_at: string | null;
  cancelled_at: string | null;
  applicant: CommunityApplicationApplicant;
}

export interface CommunityApplicationCreate {
  message: string;
}
