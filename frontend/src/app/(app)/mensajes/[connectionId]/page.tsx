"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import PrivateChat from "@/components/mensajes/PrivateChat";
import { getConnections } from "@/services/connections";
import type { UserConnection } from "@/types/connection";

export default function MensajesPage() {
  const params = useParams<{ connectionId: string }>();
  const { user } = useAuth();

  const [connection, setConnection] = useState<UserConnection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const connectionId = Number(params.connectionId);

  useEffect(() => {
    let active = true;

    getConnections()
      .then((connections) => {
        if (!active) return;

        const match = connections.find(
          (item) => item.id === connectionId
        );

        if (match) {
          setConnection(match);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [connectionId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !connection || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-600">
          Conversación no disponible
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#163B2E]">
          No hemos encontrado esta conversación
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-gray-500">
          Puede que la conexión haya sido eliminada o que no formes
          parte de ella.
        </p>

        <Link
          href="/conexiones"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-green-500 px-6 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-600"
        >
          Volver a conexiones
        </Link>
      </div>
    );
  }

  const other =
    connection.requester.id === user.id
      ? connection.recipient
      : connection.requester;

  const fullName = `${other.first_name} ${other.last_name}`.trim();

  const initials = [other.first_name, other.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/conexiones"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-[#163B2E]"
      >
        <ArrowLeftIcon />
        Volver a conexiones
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <Link
          href={`/personas/${other.id}`}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-sm font-bold text-white">
            {initials || "CF"}
          </div>

          <div>
            <p className="text-base font-bold text-[#163B2E]">
              {fullName || "Persona de CoFlow"}
            </p>
            <p className="text-xs font-semibold text-gray-400">
              Ver perfil
            </p>
          </div>
        </Link>
      </div>

      <PrivateChat connectionId={connection.id} currentUserId={user.id} />
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
