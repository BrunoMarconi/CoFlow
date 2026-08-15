import { api } from "./api";
import type { LegalReportPayload, LegalReportResponse } from "@/types/legal";

export async function submitLegalReport(payload: LegalReportPayload) {
  const formData = new FormData();
  formData.append("content_type", payload.content_type);
  formData.append("url_or_location", payload.url_or_location);
  formData.append("reason", payload.reason);
  if (payload.additional_info) formData.append("additional_info", payload.additional_info);
  if (payload.reporter_name) formData.append("reporter_name", payload.reporter_name);
  if (payload.reporter_email) formData.append("reporter_email", payload.reporter_email);
  formData.append("good_faith_declared", String(payload.good_faith_declared));
  if (payload.evidence) formData.append("evidence", payload.evidence);

  const { data } = await api.post<LegalReportResponse>("/legal/reports", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}
