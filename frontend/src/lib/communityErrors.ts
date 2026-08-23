import axios from "axios";

const KNOWN_ERRORS: Record<string, string> = {
  "You already have an active community":
    "Ya tienes una comunidad activa. Solo puedes administrar una a la vez.",
  "You already belong to another active community":
    "Ya perteneces a otra comunidad activa. Solo puedes formar parte de una a la vez.",
  "Open spots cannot exceed the available capacity after adding the owner":
    "Las plazas abiertas no pueden superar la capacidad disponible una vez que tú ya ocupas una plaza. Con esta capacidad máxima, el número más alto posible es la capacidad menos uno.",
  "Open spots cannot exceed the currently available community capacity":
    "Las plazas abiertas no pueden superar el espacio que realmente queda libre (capacidad máxima menos miembros actuales).",
  "Maximum members cannot be lower than the current member count":
    "No puedes bajar la capacidad máxima por debajo del número de miembros que ya forman parte de la comunidad.",
  "Only the owner can update this community":
    "Solo el administrador que creó la comunidad puede editarla.",
  "Only the owner can delete this community":
    "Solo el administrador que creó la comunidad puede eliminarla.",
  "Community not found":
    "No hemos encontrado esta comunidad.",
  "Owner must transfer ownership or close the community before leaving":
    "Antes de abandonar la comunidad debes transferir la administración o cerrar la comunidad.",
  "You are not a member of this community":
    "No formas parte de esta comunidad.",
  "This invitation is no longer available":
    "Esta invitación ya no está disponible.",
  "The owner cannot accept their own invitation":
    "No puedes aceptar tu propia invitación.",
  "This community has reached its maximum capacity":
    "Esta comunidad ya ha alcanzado su capacidad máxima.",
  "Only the owner can manage invitations":
    "Solo el administrador puede gestionar las invitaciones.",
  "You cannot invite yourself":
    "No puedes enviarte una invitación a ti mismo.",
  "This person already belongs to an active community":
    "Esta persona ya pertenece a una comunidad activa.",
  "This person already has a pending invitation to this community":
    "Esta persona ya tiene una invitación pendiente para esta comunidad.",
  "This invitation belongs to another person":
    "Esta invitación está dirigida a otra persona.",
  "This invitation is for another person":
    "Esta invitación está dirigida a otra persona.",
  "Only the owner can remove members":
    "Solo la persona administradora puede quitar miembros.",
  "The owner cannot remove themselves":
    "No puedes quitarte a ti mismo. Transfiere la administración o cierra la comunidad.",
  "Member not found":
    "Esta persona ya no forma parte de la comunidad.",
  "Only the owner can transfer ownership":
    "Solo la persona administradora puede transferir la comunidad.",
  "This person is already the owner":
    "Esta persona ya administra la comunidad.",
  "The new owner must be an active community member":
    "Solo puedes transferir la administración a un miembro actual.",
  "Invitation not found":
    "No hemos encontrado esta invitación.",
  "Only pending invitations can be cancelled":
    "Solo se pueden cancelar invitaciones pendientes.",
  "This community does not require an application":
    "Esta comunidad no requiere solicitud para entrar.",
  "This community is not currently looking for members":
    "Esta comunidad no está buscando nuevos miembros ahora mismo.",
  "This community is full":
    "Esta comunidad ya está completa.",
  "You already own this community":
    "Ya eres el administrador de esta comunidad.",
  "You already have a pending application for this community":
    "Ya tienes una solicitud pendiente para esta comunidad.",
  "Only the owner can view applications":
    "Solo el administrador puede ver las solicitudes.",
  "Only the owner can accept applications":
    "Solo el administrador puede aceptar solicitudes.",
  "Only the owner can reject applications":
    "Solo el administrador puede rechazar solicitudes.",
  "This application is no longer pending":
    "Esta solicitud ya ha sido revisada.",
  "Only the applicant can cancel this application":
    "Solo quien envió la solicitud puede cancelarla.",
  "The applicant already belongs to an active community":
    "Esta persona ya pertenece a otra comunidad activa.",
  "Application not found":
    "No hemos encontrado esta solicitud.",
  "You cannot save your own profile":
    "No puedes guardar tu propio perfil.",
  "You cannot connect with yourself":
    "No puedes conectar contigo mismo.",
  "You are already connected with this person":
    "Ya estás conectado con esta persona.",
  "There is already a pending connection request between you":
    "Ya existe una solicitud de conexión pendiente entre vosotros.",
  "There is already a connection between you":
    "Ya existe una conexión entre vosotros.",
  "Connection not found":
    "No hemos encontrado esta conexión.",
  "Only the recipient can accept this request":
    "Solo quien recibió la solicitud puede aceptarla.",
  "Only the recipient can reject this request":
    "Solo quien recibió la solicitud puede rechazarla.",
  "Only the requester can cancel this request":
    "Solo quien envió la solicitud puede cancelarla.",
  "This connection request is no longer pending":
    "Esta solicitud de conexión ya ha sido respondida.",
  "You are not part of this connection":
    "No formas parte de esta conexión.",
  "Only accepted connections can be removed":
    "Solo se pueden eliminar conexiones ya aceptadas.",
  "This connection is not active":
    "Esta conexión ya no está activa.",
  "User not found":
    "No hemos encontrado a esta persona.",
  "This interaction is not available":
    "Esta interacción ya no está disponible.",
  "This person is not looking for roommates right now":
    "Esta persona no está buscando compañeros actualmente.",
  "Only JPEG, PNG or WebP images are allowed":
    "Solo se aceptan imágenes en formato JPEG, PNG o WebP.",
  "A profile can have at most 9 photos":
    "Tu perfil puede tener como máximo 9 fotos. Elimina alguna antes de añadir más.",
};

const SIZE_LIMIT_PATTERN = /^Each image must be smaller than (\d+)MB$/;

const FIELD_LABELS: Record<string, string> = {
  name: "el nombre",
  description: "la descripción",
  city: "la ciudad",
  province: "la provincia",
  neighborhood: "el barrio",
  max_members: "la capacidad máxima",
  open_spots: "las plazas abiertas",
  join_type: "la forma de acceso",
  urgency: "la urgencia",
  monthly_rent: "el alquiler mensual",
  deposit: "la fianza",
  move_in_date: "la fecha de entrada",
  room_description: "la descripción de la habitación",
  cleanliness: "la preferencia de limpieza",
  atmosphere: "la preferencia de ambiente",
  visits: "la preferencia de visitas",
  sleepovers: "la preferencia de invitados a dormir",
  smoking: "la preferencia de tabaco",
  pets: "la preferencia de mascotas",
  rules: "la preferencia de reglas",
  lifestyle: "la preferencia de convivencia",
};

function describeValidationField(loc: unknown): string | null {
  if (!Array.isArray(loc) || loc.length === 0) return null;

  const key = loc[loc.length - 1];

  if (typeof key !== "string") return null;

  return FIELD_LABELS[key] ?? null;
}

/** Algunas rutas sensibles (crear comunidad, conectar banco...)
 * devuelven un detail estructurado `{code, message}` en
 * vez de un string plano — ver `require_verified_email` en el backend.
 * Se comprueba explícitamente en vez de asumir que todo detail es
 * string o array. */
export function isEmailNotVerifiedError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const detail = error.response?.data?.detail;

  return Boolean(
    detail &&
      typeof detail === "object" &&
      !Array.isArray(detail) &&
      (detail as { code?: unknown }).code === "EMAIL_NOT_VERIFIED"
  );
}

export function getCommunityErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (!axios.isAxiosError(error)) return fallback;

  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    const sizeLimitMatch = detail.match(SIZE_LIMIT_PATTERN);
    if (sizeLimitMatch) {
      return `Cada imagen debe pesar menos de ${sizeLimitMatch[1]}MB.`;
    }

    return KNOWN_ERRORS[detail] ?? detail;
  }

  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const [first] = detail;
    const field = describeValidationField(first?.loc);

    if (field) {
      return `Revisa ${field}: el valor introducido no es válido.`;
    }

    return "Revisa los datos introducidos: alguno de los campos no es válido.";
  }

  return fallback;
}
