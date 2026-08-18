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

  // Los propietarios entran directo a su panel sin el test de
  // convivencia (ver register/page.tsx) — solo se exige a quien busca
  // compañero de piso. Sin esto, alguien podía abandonar el
  // onboarding a medias y aun así entrar a explorar/aplicar a
  // comunidades con un perfil de compatibilidad vacío. /onboarding en
  // sí vive fuera de este layout (grupo de rutas (auth)), así que
  // nunca hace falta excluirlo aquí explícitamente.
  const needsOnboarding =
    !!user &&
    !needsVerification &&
    user.role !== "OWNER" &&
    !user.onboarding_completed;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (needsVerification) {
      router.replace("/verificacion-pendiente");
      return;
    }

    if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [loading, user, needsVerification, needsOnboarding, router]);

  if (loading || !user || needsVerification || needsOnboarding) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
