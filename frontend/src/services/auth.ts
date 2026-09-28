import { api } from "./api";
import {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  RegisterResponse,
  GenericMessageResponse,
  ChangePasswordRequest,
  ResetPasswordRequest,
  User,
  AuthSession,
} from "@/types/auth";
import { attributionPayload } from "@/lib/attribution";

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

export async function requestPasswordReset(
  email: string
): Promise<GenericMessageResponse> {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(
  data: ResetPasswordRequest
): Promise<GenericMessageResponse> {
  const response = await api.post("/auth/reset-password", data);
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
  // La atribucion se manda aqui y no en GoogleAuthButton porque el boton
  // es el mismo en /login y /register: el backend decide si la cuenta ya
  // existe o hay que crearla, y solo guarda el origen cuando la crea. En
  // un inicio de sesion normal estos campos se ignoran.
  const response = await api.post("/auth/google", {
    id_token: idToken,
    ...attributionPayload(),
  });
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

export async function getAuthSessions(): Promise<AuthSession[]> {
  const response = await api.get<AuthSession[]>("/auth/sessions");
  return response.data;
}

export async function closeAuthSession(sessionId: string): Promise<void> {
  await api.delete(`/auth/sessions/${sessionId}`);
}

export async function closeOtherAuthSessions(): Promise<void> {
  await api.delete("/auth/sessions/others");
}
