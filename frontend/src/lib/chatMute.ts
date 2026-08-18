// Silenciar un chat es una preferencia puramente local (por
// dispositivo, no sincronizada con el backend): solo deja de resaltar
// esa conversación como no leída en la lista. No existe (todavía) un
// mecanismo para dejar de recibir notificaciones push/servidor de un
// chat concreto.
const KEY = "coflow:chat-muted";
export const CHAT_MUTE_CHANGED_EVENT = "coflow:chat-mute-changed";

export interface ChatMuteChangedDetail {
  threadKey: string;
  muted: boolean;
}

function readMutedKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeMutedKeys(keys: Set<string>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...keys]));
  } catch {
    // El chat sigue funcionando aunque el navegador bloquee localStorage.
  }
}

export function isChatMuted(threadKey: string): boolean {
  return readMutedKeys().has(threadKey);
}

export function setChatMuted(threadKey: string, muted: boolean) {
  const keys = readMutedKeys();
  if (muted) keys.add(threadKey);
  else keys.delete(threadKey);
  writeMutedKeys(keys);

  window.dispatchEvent(
    new CustomEvent<ChatMuteChangedDetail>(CHAT_MUTE_CHANGED_EVENT, {
      detail: { threadKey, muted },
    })
  );
}
