"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";

// Únicas rutas accesibles para un usuario logueado pero sin verificar:
// la propia pantalla de verificación pendiente, y cambiar de correo por
// si se registró con uno equivocado. Todo lo demás redirige a
// /verificacion-pendiente — no se puede "entrar" a CoFlow sin verificar.
const ALLOWED_WHILE_UNVERIFIED = ["/verificacion-pendiente", "/perfil/editar"];

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const needsVerification =
    !!user &&
    user.email_verification_enabled &&
    !user.is_email_verified &&
    !ALLOWED_WHILE_UNVERIFIED.includes(pathname);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (needsVerification) {
      router.replace("/verificacion-pendiente");
    }
  }, [loading, user, needsVerification, router]);

  if (loading || !user || needsVerification) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
