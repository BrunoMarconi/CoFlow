import { api } from "./api";
import {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  RegisterResponse,
  GenericMessageResponse,
  ChangePasswordRequest,
  User,
} from "@/types/auth";

export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function verifyEmail(
  token: string
): Promise<GenericMessageResponse> {
  const response = await api.post("/auth/verify-email", { token });
  return response.data;
}

export async function resendVerification(
  email: string
): Promise<GenericMessageResponse> {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
}

export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  const response = await api.post("/auth/login", data);
  return response.data;
}

export async function loginWithGoogle(
  idToken: string
): Promise<LoginResponse> {
  const response = await api.post("/auth/google", { id_token: idToken });
  return response.data;
}

export async function me(
  token: string
): Promise<User> {
  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function changePassword(
  data: ChangePasswordRequest
): Promise<GenericMessageResponse> {
  const response = await api.put("/auth/me/password", data);
  return response.data;
}

export async function deleteAccount(
  password: string
): Promise<GenericMessageResponse> {
  const response = await api.delete("/auth/me", { data: { password } });
  return response.data;
}