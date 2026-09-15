import { api } from "./api";
import type { AssistedListingCreate, AssistedListingResult } from "@/types/team";

export type { AssistedListingResult } from "@/types/team";

export async function createAssistedListing(payload: AssistedListingCreate) {
  const { data } = await api.post<AssistedListingResult>("/assisted-listings", payload);
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
