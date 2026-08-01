"use client";

import { useEffect, useState } from "react";
import PersonasTabs from "@/components/usuario/PersonasTabs";
import UserGrid from "@/components/usuario/UserGrid";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { getSavedProfiles } from "@/services/users";
import type { UserPublicProfile } from "@/types/userPublic";

export default function PersonasGuardadasPage() {
  const [profiles, setProfiles] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getSavedProfiles()
      .then((data) => {
        if (active) setProfiles(data);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar tus perfiles guardados.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Personas
      </h1>
      <p className="mt-2 max-w-lg text-base leading-7 text-muted">
        Guarda perfiles para encontrarlos fácilmente más adelante. La
        otra persona no recibirá ninguna notificación.
      </p>

      <div className="mt-6">
        <PersonasTabs />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : profiles.length === 0 ? (
          <EmptyState
            title="Todavía no tienes perfiles guardados"
            description="Cuando guardes un perfil desde /usuarios, aparecerá aquí para que lo encuentres fácilmente."
          />
        ) : (
          <UserGrid users={profiles} />
        )}
      </div>
    </div>
  );
}
