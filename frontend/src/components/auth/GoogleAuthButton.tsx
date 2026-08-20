"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google";
import { loginWithGoogle } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/** Botón "Continuar con Google" compartido por /login y /register.
 * Sirve para las dos cosas a la vez (entrar o crear cuenta): el
 * backend decide si la cuenta ya existe (por google_id o por email) o
 * hay que crearla, así que aquí solo hace falta enviar el credential y
 * navegar según lo que devuelva — igual que tras un login normal.
 *
 * No se renderiza nada si la variable de entorno no está puesta (en
 * vez de romper la pantalla de login/registro por un botón que no
 * puede funcionar de todas formas). */
export default function GoogleAuthButton() {
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleAuthButtonInner />
    </GoogleOAuthProvider>
  );
}

function GoogleAuthButtonInner() {
  const router = useRouter();
  const { applyAuthenticatedUser, refreshCommunity, refreshOwnerProfile } = useAuth();
  const [error, setError] = useState("");

  async function handleSuccess(response: CredentialResponse) {
    if (!response.credential) return;
    setError("");

    try {
      const data = await loginWithGoogle(response.credential);
      setToken(data.access_token);
      applyAuthenticatedUser(data.user);
      const currentUser = data.user;

      if (currentUser?.role === "OWNER") {
        const ownerProfile = await refreshOwnerProfile();
        router.replace(ownerProfile ? "/comunidades" : "/propietarios/perfil");
        return;
      }

      if (currentUser?.onboarding_completed) void refreshCommunity();
      router.replace(currentUser?.onboarding_completed ? "/comunidades" : "/onboarding");
    } catch {
      setError("No hemos podido continuar con Google. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex w-full justify-center [&>div]:w-full">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError("No hemos podido continuar con Google. Inténtalo de nuevo.")}
          text="continue_with"
          shape="pill"
          width="100%"
        />
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
