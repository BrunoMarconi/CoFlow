import type { User } from "./auth";

export type { User };

export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
  phone?: string | null;
  rental_budget?: number | null;
  is_looking_for_roommates: boolean;
  age?: number | null;
  occupation?: string | null;
  bio?: string | null;
  interests?: string[];
}

export type ProfileVisibility = "PUBLIC" | "CONNECTIONS";
