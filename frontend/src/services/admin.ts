import { api } from "./api";
import type {
  AdminCommunitySummary,
  AdminUserDetail,
  AdminUserListResponse,
  AdminUserStatus,
  CommunityFormationStatus,
  MatchReviewStatus,
} from "@/types/admin";

export async function getAdminUsers(filters: { q?: string; status?: AdminUserStatus } = {}) {
  const { data } = await api.get<AdminUserListResponse>("/admin/users", { params: filters });
  return data;
}

export async function getAdminUser(userId: string) {
  const { data } = await api.get<AdminUserDetail>(`/admin/users/${userId}`);
  return data;
}

export async function updateAdminUserStatus(userId: string, status: AdminUserStatus) {
  const { data } = await api.patch(`/admin/users/${userId}/status`, { status });
  return data;
}

export async function reviewAdminMatch(userId: string, candidateId: string, action: "SAVE" | "DISMISS" | "PROPOSE") {
  const { data } = await api.put<{ status: MatchReviewStatus }>(`/admin/users/${userId}/matches/${candidateId}`, { action });
  return data;
}

export async function getAdminCommunities() {
  const { data } = await api.get<AdminCommunitySummary[]>("/admin/communities");
  return data;
}

export async function updateAdminCommunityStatus(communityId: number, status: CommunityFormationStatus) {
  const { data } = await api.patch<AdminCommunitySummary>(`/admin/communities/${communityId}/status`, { status });
  return data;
}
