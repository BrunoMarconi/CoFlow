// El backend no guarda ningún estado de lectura por conversación (ni
// mensajes leídos/no leídos, ni "última vez visto"), así que no hay
// forma honesta de mostrar un CONTADOR exacto de mensajes sin leer.
// Esto sustituye eso por una marca local (por navegador, no
// sincronizada entre dispositivos): recuerda cuándo se vio por última
// vez cada conversación (privada o de comunidad) y compara contra la
// fecha del último mensaje para saber si hay algo nuevo — suficiente
// para el punto de "no leído" de la lista, sin inventar un número que
// no existe.
const PREFIX = "coflow:lastReadAt:";

export type ConversationKey = `connection:${number}` | "community";

export function getLastReadAt(key: ConversationKey): number {
  if (typeof window === "undefined") return 0;

  const raw = window.localStorage.getItem(`${PREFIX}${key}`);
  return raw ? Number(raw) : 0;
}

export function markConversationReadNow(key: ConversationKey) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(`${PREFIX}${key}`, String(Date.now()));
}

export function isConversationUnread(
  key: ConversationKey,
  lastMessage:
    | { created_at: string; sender: { id: string } }
    | undefined
    | null,
  currentUserId: string
): boolean {
  if (!lastMessage) return false;
  if (lastMessage.sender.id === currentUserId) return false;

  const lastMessageAt = new Date(lastMessage.created_at).getTime();
  if (Number.isNaN(lastMessageAt)) return false;

  return lastMessageAt > getLastReadAt(key);
}
