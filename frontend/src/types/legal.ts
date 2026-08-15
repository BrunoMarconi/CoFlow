export type LegalReportContentType = "PROFILE" | "PROPERTY" | "COMMUNITY" | "OTHER";

export interface LegalReportPayload {
  content_type: LegalReportContentType;
  url_or_location: string;
  reason: string;
  additional_info?: string;
  reporter_name?: string;
  reporter_email?: string;
  good_faith_declared: boolean;
  evidence?: File | null;
}

export interface LegalReportResponse {
  id: number;
  content_type: LegalReportContentType;
  created_at: string;
}
