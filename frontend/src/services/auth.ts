import { api } from "./api";
import {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  User,
} from "@/types/auth";

export async function register(data: RegisterRequest) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  const response = await api.post("/auth/login", data);
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