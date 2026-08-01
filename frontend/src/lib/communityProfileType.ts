import type { CommunityProfileType } from "@/types/community";

export const COMMUNITY_PROFILE_TYPE_LABELS: Record<
  CommunityProfileType,
  string
> = {
  STUDENTS: "Estudiantes",
  YOUNG_PROFESSIONALS: "Jóvenes profesionales",
  DIGITAL_NOMADS: "Nómadas digitales",
  WORKERS: "Trabajadores",
  EXAM_CANDIDATES: "Opositores",
  INTERNATIONAL_STUDENTS: "Estudiantes internacionales",
  MIXED: "Comunidad mixta",
  OTHER: "Otro",
};

export const COMMUNITY_PROFILE_TYPE_OPTIONS: {
  value: CommunityProfileType;
  label: string;
}[] = (
  Object.entries(COMMUNITY_PROFILE_TYPE_LABELS) as [
    CommunityProfileType,
    string,
  ][]
).map(([value, label]) => ({ value, label }));

export function getProfileTypeLabel(type: CommunityProfileType): string {
  return COMMUNITY_PROFILE_TYPE_LABELS[type] ?? "Otro";
}
