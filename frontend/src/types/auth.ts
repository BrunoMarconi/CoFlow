export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  is_email_verified: boolean;
  email_verification_enabled: boolean;
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
}

export interface RegisterResponse {
  message: string;
  debug_token?: string | null;
}

export interface GenericMessageResponse {
  message: string;
  debug_token?: string | null;
}