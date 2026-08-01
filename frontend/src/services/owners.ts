import { api } from "./api";
import type {
  OwnerProfile,
  OwnerProfileCreate,
  OwnerProfileUpdate,
} from "@/types/owner";

export async function getMyOwnerProfile() {
  const { data } = await api.get<OwnerProfile | null>("/owners/me");
  return data;
}

export async function createOwnerProfile(payload: OwnerProfileCreate) {
  const { data } = await api.post<OwnerProfile>("/owners/me", payload);
  return data;
}

export async function updateOwnerProfile(payload: OwnerProfileUpdate) {
  const { data } = await api.put<OwnerProfile>("/owners/me", payload);
  return data;
}
