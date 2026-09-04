import type { UserPhoto } from "./userPhoto";
import type { CompatibilityScore } from "./compatibilityScore";

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
  compatibility: CompatibilityScore | null;
  /** Similitud 0-100 entre tu perfil de convivencia y el de esta
   * persona. Null si tú o ella no habéis completado el test todavía. */
  match_score: number | null;
  /** Coincidencia relativa por eje; `compatibility` describe solo a la otra persona. */
  match_breakdown: CompatibilityScore | null;
  community: PublicUserCommunity | null;
  is_saved: boolean;
  connection_status: UserConnectionStatusLabel;
  connection_id: number | null;
  is_owner: boolean;
  is_looking_for_roommates: boolean;
  avatar_url: string | null;
  photos: UserPhoto[];
  age: number | null;
  occupation: string | null;
  bio: string | null;
  interests: string[];
  is_verified: boolean;
  is_online: boolean;
}

export interface GetPublicUsersParams {
  max_budget?: number;
  city?: string;
  community_status?: "HAS_COMMUNITY" | "LOOKING";
  skip?: number;
  limit?: number;
}
