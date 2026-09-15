"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PageSkeleton from "@/components/ui/PageSkeleton";

/* Solo evita pintar las herramientas del equipo a quien no lo es. La
 * protección de los datos está en el backend (require_team_member): sin
 * acceso, cada petición a /team o /assisted-listings devuelve 403. */
export default function TeamGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) return <PageSkeleton variant="cards" />;

  if (!user.is_team_member) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-primary">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-5 font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Acceso restringido</h1>
        <p className="mt-2 text-sm leading-6 text-secondary">Esta sección es solo para el equipo fundador de CoFlow.</p>
        <Link href="/perfil" className="press-control mt-6 inline-flex min-h-11 items-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">
          Volver a mi perfil
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
