import { api } from "./api";
import type { UpdateProfileRequest } from "@/types/user";
import type { User } from "@/types/auth";
import type {
  GetPublicUsersParams,
  UserPublicProfile,
} from "@/types/userPublic";
import type { UserConnection } from "@/types/connection";
import type {
  BlockedUser,
  UserReportPayload,
} from "@/types/userSafety";

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

export async function getBlockedUsers() {
  const { data } = await api.get<BlockedUser[]>("/users/blocked");
  return data;
}

export async function blockUser(id: string) {
  const { data } = await api.post<{ blocked: boolean }>(
    `/users/${id}/block`
  );
  return data;
}

export async function unblockUser(id: string) {
  const { data } = await api.delete<{ blocked: boolean }>(
    `/users/${id}/block`
  );
  return data;
}

export async function reportUser(id: string, payload: UserReportPayload) {
  const { data } = await api.post<{
    id: number;
    created_at: string;
    submitted: boolean;
  }>(`/users/${id}/report`, payload);
  return data;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<User>("/auth/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function deleteAvatar() {
  const { data } = await api.delete<User>("/auth/me/avatar");
  return data;
}

export async function uploadUserPhotos(files: File[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await api.post<User>("/auth/me/photos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function deleteUserPhoto(photoId: number) {
  const { data } = await api.delete<User>(`/auth/me/photos/${photoId}`);
  return data;
}

export async function reorderUserPhotos(photoIds: number[]) {
  const { data } = await api.put<User>("/auth/me/photos/order", {
    photo_ids: photoIds,
  });

  return data;
}
