// Guarda, solo en el navegador, la intención elegida al registrarse
// ("quiero publicar mi piso") para poder enrutar al propietario a crear
// su perfil justo después de verificar el correo, en vez de dejarlo en
// la landing pública sin ninguna pista de por dónde seguir.
export const POST_VERIFICATION_INTENT_KEY = "coflow:post-verification-intent";

export function consumePostVerificationOwnerIntent(): boolean {
  if (typeof window === "undefined") return false;

  const value = window.localStorage.getItem(POST_VERIFICATION_INTENT_KEY);
  if (value === "owner") {
    window.localStorage.removeItem(POST_VERIFICATION_INTENT_KEY);
    return true;
  }

  return false;
}
