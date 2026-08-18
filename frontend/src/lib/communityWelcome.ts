// Recuerda, solo en este navegador, si ya se le mostró a la persona el
// aviso de "conoceos antes por videollamada" al crear o entrar por
// primera vez a una comunidad. Se guarda por id de comunidad porque el
// mismo usuario puede pertenecer a varias a lo largo del tiempo.
const STORAGE_PREFIX = "coflow:community-welcome-seen:";

export function hasSeenCommunityWelcome(communityId: number): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(`${STORAGE_PREFIX}${communityId}`) === "1";
}

export function markCommunityWelcomeSeen(communityId: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${communityId}`, "1");
}
