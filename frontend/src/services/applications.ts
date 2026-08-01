import { api } from "./api";
import type {
  CommunityApplication,
  CommunityApplicationCreate,
} from "@/types/application";

export async function createCommunityApplication(
  communityId: number | string,
  payload: CommunityApplicationCreate
) {
  const { data } = await api.post<CommunityApplication>(
    `/communities/${communityId}/applications`,
    payload
  );

  return data;
}

export async function getCommunityApplications(
  communityId: number | string
) {
  const { data } = await api.get<CommunityApplication[]>(
    `/communities/${communityId}/applications`
  );

  return data;
}

export async function getMyApplications() {
  const { data } = await api.get<CommunityApplication[]>(
    "/applications/me"
  );

  return data;
}

export async function acceptApplication(applicationId: number) {
  const { data } = await api.post<CommunityApplication>(
    `/applications/${applicationId}/accept`
  );

  return data;
}

export async function rejectApplication(applicationId: number) {
  const { data } = await api.post<CommunityApplication>(
    `/applications/${applicationId}/reject`
  );

  return data;
}

export async function cancelApplication(applicationId: number) {
  const { data } = await api.post<CommunityApplication>(
    `/applications/${applicationId}/cancel`
  );

  return data;
}
