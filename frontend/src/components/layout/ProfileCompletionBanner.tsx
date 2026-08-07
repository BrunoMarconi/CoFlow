"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const EXCLUDED_PATHS = ["/perfil", "/perfil/editar"];

export default function ProfileCompletionBanner() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  if (EXCLUDED_PATHS.includes(pathname)) return null;

  const missingPhoto = !user.avatar_url;
  const missingOtherFields = !user.phone || user.rental_budget === null;

  if (!missingPhoto && !missingOtherFields) return null;

  const message = missingPhoto
    ? "Añade una foto de perfil: genera más confianza y consigues más solicitudes de conexión."
    : "Tu perfil está incompleto. Complétalo para que las demás personas te conozcan mejor.";

  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-mint-50 px-4 py-3 text-sm sm:flex-row sm:items-center">
      <p className="font-semibold text-brand-dark">{message}</p>

      <Link
        href="/perfil"
        className="shrink-0 rounded-xl border border-primary/30 bg-white px-4 py-2 text-xs font-bold text-brand-dark transition hover:bg-mint-100"
      >
        Completar perfil
      </Link>
    </div>
  );
}
