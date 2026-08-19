import type { User } from "@/types/auth";

export interface ProfileCompletionItem {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

/** Única fuente de verdad de qué cuenta como "perfil completo" — antes
 * vivía duplicado (con criterios distintos) en el banner de aviso y en
 * la página de Perfil, así que el banner podía decir "incompleto" sin
 * decir nunca qué faltaba exactamente. */
export function getProfileCompletionChecklist(user: User): ProfileCompletionItem[] {
  return [
    { key: "avatar", label: "Foto de perfil", done: Boolean(user.avatar_url), href: "/perfil" },
    { key: "bio", label: "Una breve biografía", done: Boolean(user.bio), href: "/perfil/editar" },
    { key: "phone", label: "Teléfono de contacto", done: Boolean(user.phone), href: "/perfil/editar" },
    { key: "age", label: "Tu edad", done: user.age !== null, href: "/perfil/editar" },
    { key: "occupation", label: "Tu ocupación", done: Boolean(user.occupation), href: "/perfil/editar" },
    { key: "budget", label: "Presupuesto de alquiler", done: user.rental_budget !== null, href: "/perfil/editar" },
    { key: "email", label: "Correo verificado", done: user.is_email_verified, href: "/perfil" },
    { key: "onboarding", label: "Cuestionario de convivencia", done: user.onboarding_completed, href: "/onboarding" },
    { key: "photos", label: "Al menos una foto adicional", done: user.photos.length > 0, href: "/perfil/fotos" },
  ];
}

export function computeProfileCompletion(user: User): number {
  const checklist = getProfileCompletionChecklist(user);
  return Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100
  );
}
