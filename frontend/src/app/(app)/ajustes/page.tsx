"use client";

import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";

export default function AjustesPage() {
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold text-brand-dark">Ajustes</h1>

      <section className="rounded-18 border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-brand-dark">Sesión</h2>
        <p className="mt-2 text-sm text-muted">
          Cierra tu sesión en este dispositivo.
        </p>
        <Button onClick={logout} className="mt-4">
          Cerrar sesión
        </Button>
      </section>
    </div>
  );
}
