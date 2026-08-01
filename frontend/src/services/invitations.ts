import { api } from "./api";
import type {
  CommunityInvitation,
  CommunityInvitationDetail,
} from "@/types/invitation";

export async function createCommunityInvitation(
  communityId: number | string
) {
  const { data } = await api.post<CommunityInvitation>(
    `/communities/${communityId}/invitations`
  );

  return data;
}

export async function getCommunityInvitations(
  communityId: number | string
) {
  const { data } = await api.get<CommunityInvitation[]>(
    `/communities/${communityId}/invitations`
  );

  return data;
}

export async function cancelCommunityInvitation(
  communityId: number | string,
  invitationId: number
) {
  const { data } = await api.delete<CommunityInvitation>(
    `/communities/${communityId}/invitations/${invitationId}`
  );

  return data;
}

export async function getInvitationByToken(token: string) {
  const { data } = await api.get<CommunityInvitationDetail>(
    `/invitations/${token}`
  );

  return data;
}

export async function acceptInvitation(token: string) {
  const { data } = await api.post<CommunityInvitation>(
    `/invitations/${token}/accept`
  );

  return data;
}

export async function declineInvitation(token: string) {
  const { data } = await api.post<CommunityInvitation>(
    `/invitations/${token}/decline`
  );

  return data;
}
