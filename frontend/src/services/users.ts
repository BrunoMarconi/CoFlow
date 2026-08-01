import { api } from "./api";
import type { UpdateProfileRequest } from "@/types/user";
import type {
  GetPublicUsersParams,
  UserPublicProfile,
} from "@/types/userPublic";
import type { UserConnection } from "@/types/connection";

export async function updateProfile(payload: UpdateProfileRequest) {
  const { data } = await api.put<{ message: string }>("/auth/me", payload);
  return data;
}

export async function getPublicUsers(params?: GetPublicUsersParams) {
  const { data } = await api.get<UserPublicProfile[]>("/users/public", {
    params,
  });

  return data;
}

export async function getPublicUserProfile(id: string) {
  const { data } = await api.get<UserPublicProfile>(`/users/${id}/public`);
  return data;
}

export async function getSavedProfiles() {
  const { data } = await api.get<UserPublicProfile[]>("/users/saved");
  return data;
}

export async function saveUserProfile(id: string) {
  const { data } = await api.post<{ saved: boolean }>(
    `/users/${id}/save`
  );

  return data;
}

export async function unsaveUserProfile(id: string) {
  const { data } = await api.delete<{ saved: boolean }>(
    `/users/${id}/save`
  );

  return data;
}

export async function createConnectionRequest(id: string) {
  const { data } = await api.post<UserConnection>(
    `/users/${id}/connections`
  );

  return data;
}
