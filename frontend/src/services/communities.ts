import { api } from "./api";

import type {
  Community,
  CommunityCreate,
  CommunityMessage,
  CommunityMessageCreate,
  CommunityRentSplit,
  CommunityRentSplitUpdate,
  CommunityUpdate,
  GetCommunitiesParams,
  GetCommunityMessagesParams,
} from "@/types/community";

export async function getCommunities(
  params?: GetCommunitiesParams
) {
  const { data } = await api.get<Community[]>(
    "/communities",
    { params }
  );

  return data;
}

export async function getCommunity(
  id: number | string
) {
  const { data } = await api.get<Community>(
    `/communities/${id}`
  );

  return data;
}

export async function saveCommunity(id: number | string) {
  const { data } = await api.post<{ saved: boolean }>(
    `/communities/${id}/save`
  );

  return data;
}

export async function unsaveCommunity(id: number | string) {
  const { data } = await api.delete<{ saved: boolean }>(
    `/communities/${id}/save`
  );

  return data;
}

export async function getMyCommunity() {
  const { data } = await api.get<Community | null>(
    "/communities/me"
  );

  return data;
}

export async function createCommunity(
  payload: CommunityCreate
) {
  const { data } = await api.post<Community>(
    "/communities",
    payload
  );

  return data;
}

export async function updateCommunity(
  id: number | string,
  payload: CommunityUpdate
) {
  const { data } = await api.put<Community>(
    `/communities/${id}`,
    payload
  );

  return data;
}

export async function deleteCommunity(
  id: number | string
) {
  const { data } = await api.delete<Community>(
    `/communities/${id}`
  );

  return data;
}

export async function joinOpenCommunity(
  id: number | string
) {
  const { data } = await api.post<Community>(
    `/communities/${id}/join`
  );

  return data;
}

export async function leaveCommunity(
  id: number | string
) {
  const { data } = await api.delete<Community>(
    `/communities/${id}/members/me`
  );

  return data;
}

export async function removeCommunityMember(
  communityId: number | string,
  userId: string
) {
  const { data } = await api.delete<Community>(
    `/communities/${communityId}/members/${userId}`
  );
  return data;
}

export async function transferCommunityOwnership(
  communityId: number | string,
  newOwnerUserId: string
) {
  const { data } = await api.post<Community>(
    `/communities/${communityId}/transfer-ownership`,
    { new_owner_user_id: newOwnerUserId }
  );
  return data;
}

export async function getCommunityMessages(
  id: number | string,
  params?: GetCommunityMessagesParams
) {
  const { data } = await api.get<CommunityMessage[]>(
    `/communities/${id}/messages`,
    { params }
  );

  return data;
}

export async function sendCommunityMessage(
  id: number | string,
  payload: CommunityMessageCreate
) {
  const { data } = await api.post<CommunityMessage>(
    `/communities/${id}/messages`,
    payload
  );

  return data;
}

export async function deleteCommunityMessage(
  id: number | string,
  messageId: number | string
) {
  await api.delete(`/communities/${id}/messages/${messageId}`);
}

export async function likeCommunityMessage(
  id: number | string,
  messageId: number | string
) {
  const { data } = await api.post<CommunityMessage>(
    `/communities/${id}/messages/${messageId}/like`
  );

  return data;
}

export async function uploadCommunityCover(
  id: number | string,
  file: File
) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<Community>(
    `/communities/${id}/cover`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
}

export async function deleteCommunityCover(
  id: number | string
) {
  const { data } = await api.delete<Community>(
    `/communities/${id}/cover`
  );

  return data;
}

export async function getCommunityRentSplit(
  id: number | string
) {
  const { data } = await api.get<CommunityRentSplit>(
    `/communities/${id}/rent-split`
  );

  return data;
}

export async function updateCommunityRentSplit(
  id: number | string,
  payload: CommunityRentSplitUpdate
) {
  const { data } = await api.put<CommunityRentSplit>(
    `/communities/${id}/rent-split`,
    payload
  );

  return data;
}
