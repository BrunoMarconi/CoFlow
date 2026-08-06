import type { UserPhoto } from "./userPhoto";

export interface PublicUserCommunity {
  id: number;
  name: string;
  city: string;
}

export interface PublicUserPreferences {
  cleanliness: string;
  dishes: string;
  common_objects: string;
  noise: string;
  visits: string;
  sleepovers: string;
  wake_up: string;
  night_noise: string;
  smoking: string;
  alcohol: string;
  pets: string;
  bills: string;
  food: string;
  communication: string;
  conflicts: string;
  rules: string;
  culture: string;
  space: string;
  lifestyle: string;
}

export type UserConnectionStatusLabel =
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "ACCEPTED";

export interface UserPublicProfile {
  id: string;
  first_name: string;
  last_name: string;
  rental_budget: number | null;
  preferences: PublicUserPreferences | null;
  community: PublicUserCommunity | null;
  is_saved: boolean;
  connection_status: UserConnectionStatusLabel;
  connection_id: number | null;
  is_owner: boolean;
  is_looking_for_roommates: boolean;
  avatar_url: string | null;
  photos: UserPhoto[];
}

export interface GetPublicUsersParams {
  max_budget?: number;
  skip?: number;
  limit?: number;
}
