"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import UserAvatar from "@/components/ui/UserAvatar";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import {
  createConnectionRequest,
  saveUserProfile,
  unsaveUserProfile,
} from "@/services/users";
import { deleteConnection } from "@/services/connections";
import type {
  PublicUserPreferences,
  UserConnectionStatusLabel,
} from "@/types/userPublic";

const PREFERENCE_LABELS: Record<keyof PublicUserPreferences, string> = {
  cleanliness: "Limpieza",
  dishes: "Platos y cocina",
  common_objects: "Zonas comunes",
  noise: "Ambiente",
  visits: "Visitas",
  sleepovers: "Invitados a dormir",
  wake_up: "Hora de despertar",
  night_noise: "Ruido nocturno",
  smoking: "Tabaco",
  alcohol: "Alcohol",
  pets: "Mascotas",
  bills: "Gastos y facturas",
  food: "Comida",
  communication: "Comunicación",
  conflicts: "Resolución de conflictos",
  rules: "Reglas de convivencia",
  culture: "Cultura",
  space: "Espacio personal",
  lifestyle: "Convivencia ideal",
};

export default function PersonaPublicaPage() {
  const params = useParams<{ id: string }>();
  const { profile, loading, notFound } = usePublicProfile(params.id);

  const [saved, setSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState<UserConnectionStatusLabel>("NONE");
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    function syncFromProfile() {
      if (!profile) return;

      setSaved(profile.is_saved);
      setConnectionStatus(profile.connection_status);
      setConnectionId(profile.connection_id);
    }

    syncFromProfile();
  }, [profile]);

  async function handleToggleSave() {
    if (!profile || savingToggle) return;

    setSavingToggle(true);

    try {
      if (saved) {
        await unsaveUserProfile(profile.id);
        setSaved(false);
      } else {
        await saveUserProfile(profile.id);
        setSaved(true);
      }
    } catch {
      // Si falla, el usuario puede volver a intentarlo.
    } finally {
      setSavingToggle(false);
    }
  }

  async function handleConnect() {
    if (!profile || connecting) return;

    setConnecting(true);
    setConnectionError("");

    try {
      const connection = await createConnectionRequest(profile.id);
      setConnectionStatus("PENDING_SENT");
      setConnectionId(connection.id);
    } catch (error) {
      setConnectionError(
        getCommunityErrorMessage(
          error,
          "No pudimos enviar la solicitud de conexión."
        )
      );
    } finally {
      setConnecting(false);
    }
  }

  async function handleRemoveConnection() {
    if (!connectionId || connecting) return;

    setConnecting(true);
    setConnectionError("");

    try {
      await deleteConnection(connectionId);
      setConnectionStatus("NONE");
      setConnectionId(null);
    } catch (error) {
      setConnectionError(
        getCommunityErrorMessage(
          error,
          "No pudimos eliminar la conexión."
        )
      );
    } finally {
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-dark">
          Perfil no encontrado
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          No hemos encontrado a esta persona
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-muted">
          Puede que el enlace no sea correcto o que el perfil ya no esté
          disponible.
        </p>

        <Link
          href="/usuarios"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          Volver a personas
        </Link>
      </div>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  const budgetLabel =
    profile.rental_budget !== null
      ? `Hasta ${profile.rental_budget.toLocaleString("es-ES")} €/mes`
      : "Presupuesto no indicado";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/usuarios"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-foreground"
      >
        <ArrowLeftIcon />
        Volver a personas
      </Link>

      <header className="rounded-[1.5rem] border border-line bg-surface p-5 shadow-sm sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <UserAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            userId={profile.id}
            imageUrl={profile.avatar_url}
            size="xl"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {fullName || "Persona de CoFlow"}
              </h1>

              {profile.is_owner && (
                <Badge variant="info">Propietario</Badge>
              )}
            </div>

            <p className="mt-2 text-sm font-semibold text-muted">
              {profile.is_owner ? "Propietario · " : ""}
              {profile.is_looking_for_roommates
                ? "Busca compañeros de piso"
                : "No busca compañeros actualmente"}
            </p>

            <p className="mt-1 text-sm font-semibold text-muted">
              {profile.community ? `${profile.community.city} · ` : ""}
              {budgetLabel}
            </p>

            {profile.community && (
              <p className="mt-1 text-sm text-muted">
                Vive en{" "}
                <Link
                  href={`/comunidades/${profile.community.id}`}
                  className="font-bold text-brand-dark hover:underline"
                >
                  {profile.community.name}
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={savingToggle}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-5 text-sm font-bold text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <SaveIcon />
            {saved ? "Quitar de guardados" : "Guardar perfil"}
          </button>

          {connectionStatus === "NONE" && profile.is_looking_for_roommates && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <ConnectIcon />
              {connecting ? "Enviando..." : "Conectar"}
            </button>
          )}

          {connectionStatus === "PENDING_SENT" && (
            <button
              type="button"
              disabled
              className="flex h-12 w-full cursor-default items-center justify-center gap-2 rounded-2xl bg-surface-soft px-5 text-sm font-bold text-muted sm:w-auto"
            >
              Solicitud enviada
            </button>
          )}

          {connectionStatus === "PENDING_RECEIVED" && (
            <Link
              href="/conexiones"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark sm:w-auto"
            >
              Responder solicitud
            </Link>
          )}

          {connectionStatus === "ACCEPTED" && connectionId !== null && (
            <>
              <Link
                href={`/mensajes/${connectionId}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark sm:w-auto"
              >
                Conectados · Enviar mensaje
              </Link>

              <button
                type="button"
                onClick={handleRemoveConnection}
                disabled={connecting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-surface px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Eliminar conexión
              </button>
            </>
          )}
        </div>

        {connectionError && (
          <p className="mt-3 text-sm font-semibold text-red-600">
            {connectionError}
          </p>
        )}

        {connectionStatus === "NONE" &&
          (profile.is_looking_for_roommates ? (
            <p className="mt-3 text-xs leading-5 text-muted">
              Envía una solicitud para mantener el contacto dentro de
              CoFlow. Si la acepta, podréis hablar por privado.
            </p>
          ) : (
            <p className="mt-3 text-sm font-semibold text-muted">
              Esta persona no está buscando compañeros actualmente.
            </p>
          ))}
      </header>

      {profile.photos.length > 0 && (
        <section className="mt-5 rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">
            Fotos
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[...profile.photos]
              .sort((a, b) => a.position - b.position)
              .map((photo) => (
                <div
                  key={photo.id}
                  className="relative h-28 w-full overflow-hidden rounded-18 border border-line sm:h-32"
                >
                  <Image
                    src={photo.image_url}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
          </div>
        </section>
      )}

      <div className="mt-5 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
        {profile.preferences ? (
          <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">
              Preferencias de convivencia
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(() => {
                const preferences = profile.preferences;

                return (
                  Object.keys(PREFERENCE_LABELS) as Array<
                    keyof PublicUserPreferences
                  >
                ).map((key) => (
                  <div
                    key={key}
                    className="rounded-xl bg-surface-soft px-4 py-3"
                  >
                    <p className="text-xs font-semibold text-muted">
                      {PREFERENCE_LABELS[key]}
                    </p>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {preferences[key]}
                    </p>
                  </div>
                ));
              })()}
            </div>
          </section>
        ) : (
          <div />
        )}

        <aside className="mt-5 rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm sm:p-6 lg:mt-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">
            Resumen
          </p>

          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs font-semibold text-muted">
                Presupuesto de alquiler
              </dt>
              <dd className="mt-1 text-sm font-bold text-foreground">
                {budgetLabel}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-muted">
                Comunidad actual
              </dt>
              <dd className="mt-1 text-sm font-bold text-foreground">
                {profile.community ? (
                  <Link
                    href={`/comunidades/${profile.community.id}`}
                    className="text-brand-dark hover:underline"
                  >
                    {profile.community.name}
                  </Link>
                ) : (
                  "Todavía no tiene comunidad"
                )}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M14 14.5a4.5 4.5 0 0 1 7.5 3.5" />
    </svg>
  );
}
