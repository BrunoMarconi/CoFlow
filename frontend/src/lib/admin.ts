import type { AdminUserStatus, CommunityFormationStatus } from "@/types/admin";

export const ADMIN_USER_STATUS_LABELS: Record<AdminUserStatus, string> = {
  NEW: "Nuevo",
  INCOMPLETE: "Perfil incompleto",
  LOOKING: "Buscando comunidad",
  MATCH_FOUND: "Match encontrado",
  CONTACTED: "Contacto iniciado",
  IN_COMMUNITY: "En comunidad",
  PAUSED: "Pausado",
};

export const ADMIN_USER_STATUSES = Object.keys(ADMIN_USER_STATUS_LABELS) as AdminUserStatus[];

export const COMMUNITY_STATUS_LABELS: Record<CommunityFormationStatus, string> = {
  FORMING: "En formación",
  FORMED: "Formada",
};

export const HABIT_LABELS: Record<string, string> = {
  cleanliness: "Limpieza",
  dishes: "Vajilla",
  common_objects: "Zonas comunes",
  noise: "Ambiente en casa",
  visits: "Visitas",
  sleepovers: "Invitados a dormir",
  wake_up: "Horario de mañana",
  night_noise: "Ruido nocturno",
  smoking: "Tabaco",
  alcohol: "Alcohol",
  pets: "Mascotas",
  bills: "Gastos",
  food: "Comida",
  communication: "Comunicación",
  conflicts: "Conflictos",
  rules: "Normas",
  culture: "Diversidad cultural",
  space: "Espacio personal",
  lifestyle: "Estilo de convivencia",
};

export function adminStatusTone(status: AdminUserStatus) {
  if (status === "IN_COMMUNITY") return "bg-[#dfece5] text-[#3f6352]";
  if (status === "MATCH_FOUND" || status === "CONTACTED") return "bg-[#e7ead9] text-[#687044]";
  if (status === "INCOMPLETE") return "bg-[#f5ead8] text-[#8b6128]";
  if (status === "PAUSED") return "bg-[#ececec] text-[#666]";
  return "bg-[#e5eeeb] text-[#4f6d60]";
}
