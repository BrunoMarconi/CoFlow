import { api } from "./api";

export interface AssistedListingResult {
  property_id: number;
  owner_email: string;
  claim_url: string;
}

export async function createAssistedListing(payload: Record<string, unknown>) {
  const { data } = await api.post<AssistedListingResult>("/assisted-listings", payload);
  return data;
}

export async function uploadAssistedListingImages(propertyId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const { data } = await api.post(`/assisted-listings/${propertyId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function markAssistedListingReady(propertyId: number) {
  const { data } = await api.post(`/assisted-listings/${propertyId}/ready`);
  return data;
}

export async function getOwnerClaim(token: string) {
  const { data } = await api.get<{ first_name: string; property_title: string; property_city: string; expires_at: string }>(`/assisted-listings/claim/${token}`);
  return data;
}

export async function claimOwnerAccount(token: string, payload: { password: string; birth_date: string; terms_accepted: boolean }) {
  const { data } = await api.post<{ message: string }>(`/assisted-listings/claim/${token}`, payload);
  return data;
}
