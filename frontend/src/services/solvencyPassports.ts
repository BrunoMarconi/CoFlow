import { api } from "./api";
import type {
  PublicSolvencyPassport,
  SolvencyPassport,
} from "@/types/solvencyPassport";

export async function issueSolvencyPassport() {
  const { data } = await api.post<SolvencyPassport>("/solvency-passports/issue");
  return data;
}

export async function getMySolvencyPassport() {
  const { data } = await api.get<SolvencyPassport>("/solvency-passports/me");
  return data;
}

export async function revokeSolvencyPassport(id: string) {
  const { data } = await api.post<SolvencyPassport>(
    `/solvency-passports/${id}/revoke`
  );
  return data;
}

export async function regenerateSolvencyPassportShareLink(id: string) {
  const { data } = await api.post<SolvencyPassport>(
    `/solvency-passports/${id}/regenerate-share-link`
  );
  return data;
}

export async function downloadSolvencyPassportPdf(id: string) {
  const { data } = await api.get(`/solvency-passports/${id}/pdf`, {
    responseType: "blob",
  });
  return data as Blob;
}

export async function getPublicSolvencyPassport(
  publicId: string,
  token: string
) {
  const { data } = await api.get<PublicSolvencyPassport>(
    `/public/solvency-passports/${publicId}`,
    { params: { token } }
  );
  return data;
}
