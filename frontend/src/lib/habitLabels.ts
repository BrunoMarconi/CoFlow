import type { PublicUserPreferences } from "@/types/userPublic";

/* Las respuestas del test de convivencia son frases completas (ver
 * QUESTION_OPTIONS en backend/app/services/compatibility_score_service.py),
 * pensadas para leerse en el radar de compatibilidad, no en un chip de
 * tarjeta. Este mapeo cubre solo los 4 ejes más "decisivos" a primera
 * vista (tabaco, orden, ambiente, mascotas) con una versión corta —
 * mismo texto de origen, nunca inventado. Si una respuesta no está en
 * el mapeo (copy desincronizado con el backend), se ignora en vez de
 * mostrar la frase larga sin recortar.
 */
const SHORT_LABELS: Partial<
  Record<keyof PublicUserPreferences, Record<string, string>>
> = {
  smoking: {
    "No quiero convivir con fumadores": "No fuma",
    "Está bien si se fuma únicamente fuera": "Fuma solo fuera",
    "Me da igual": "Tabaco: indiferente",
    "Yo fumo": "Fumador/a",
  },
  cleanliness: {
    "Muy relajado": "Relajado/a con el orden",
    "Limpieza básica semanal": "Orden básico",
    "Limpieza frecuente y organizada": "Ordenado/a",
    "Nivel de limpieza muy alto": "Muy ordenado/a",
  },
  noise: {
    "Muy tranquilo y silencioso": "Ambiente muy tranquilo",
    "Tranquilo, con algunos momentos sociales": "Ambiente tranquilo",
    "Social y con bastante actividad": "Ambiente social",
    "Muy animado y abierto": "Ambiente animado",
  },
  pets: {
    "Prefiero vivir sin mascotas": "Sin mascotas",
    "Depende del animal": "Mascotas: depende",
    "Me encantan las mascotas": "Le encantan las mascotas",
    "Tengo mascota": "Tiene mascota",
  },
};

const HABIT_PRIORITY: (keyof PublicUserPreferences)[] = [
  "smoking",
  "cleanliness",
  "noise",
  "pets",
];

/** Hasta 4 chips de hábito cortos y ya conocidos por el backend, en un
 * orden fijo (tabaco, orden, ambiente, mascotas) — nunca más de los
 * ejes que realmente tengan una etiqueta corta mapeada. */
export function getHabitChips(
  preferences: PublicUserPreferences | null
): string[] {
  if (!preferences) return [];

  const chips: string[] = [];
  for (const field of HABIT_PRIORITY) {
    const value = preferences[field];
    const label = SHORT_LABELS[field]?.[value];
    if (label) chips.push(label);
  }
  return chips;
}
