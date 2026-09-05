import type { UserPhoto } from "./userPhoto";

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: "USER" | "OWNER";
  birth_date: string;
  terms_accepted: boolean;
  marketing_consent?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  is_email_verified: boolean;
  email_verification_enabled: boolean;
  user: User;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  onboarding_completed: boolean;
  rental_budget: number | null;
  is_looking_for_roommates: boolean;
  is_email_verified: boolean;
  email_verification_enabled: boolean;
  avatar_url: string | null;
  photos: UserPhoto[];
  age: number | null;
  occupation: string | null;
  bio: string | null;
  interests: string[];
  profile_visibility: "PUBLIC" | "CONNECTIONS";
}

export interface RegisterResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: User;
  debug_token?: string | null;
}

export interface GenericMessageResponse {
  message: string;
  debug_token?: string | null;
}

export interface AuthSession {
  id: string;
  device_label: string;
  browser_label: string;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}
