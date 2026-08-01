"use client";

import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";

export default function AjustesPage() {
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold text-[#163B2E]">Ajustes</h1>

      <section className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-bold text-[#163B2E]">Sesión</h2>
        <p className="mt-2 text-sm text-gray-500">
          Cierra tu sesión en este dispositivo.
        </p>
        <Button onClick={logout} className="mt-4">
          Cerrar sesión
        </Button>
      </section>
    </div>
  );
}
