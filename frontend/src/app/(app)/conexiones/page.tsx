"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SoftButton from "@/components/ui/SoftButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import {
  acceptConnection,
  cancelConnection,
  getConnectionRequests,
  rejectConnection,
} from "@/services/connections";
import type { UserConnection } from "@/types/connection";

type Tab = "recibidas" | "enviadas";

const VALID_TABS: Tab[] = ["recibidas", "enviadas"];

function isValidTab(value: string | null): value is Tab {
  return value !== null && (VALID_TABS as string[]).includes(value);
}

export default function ConexionesPage() {
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab");

  const [tab, setTab] = useState<Tab>(
    isValidTab(initialTab) ? initialTab : "recibidas"
  );

  const [received, setReceived] = useState<UserConnection[]>([]);
  const [sent, setSent] = useState<UserConnection[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    getConnectionRequests()
      .then((requests) => {
        if (!active) return;

        setReceived(requests.received);
        setSent(requests.sent);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar tus solicitudes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleAccept(connectionId: number) {
    if (actioningId) return;
    setActioningId(connectionId);

    try {
      await acceptConnection(connectionId);
      setReceived((current) =>
        current.filter((item) => item.id !== connectionId)
      );
    } catch {
      // El usuario puede reintentar desde la lista.
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(connectionId: number) {
    if (actioningId) return;
    setActioningId(connectionId);

    try {
      await rejectConnection(connectionId);
      setReceived((current) =>
        current.filter((item) => item.id !== connectionId)
      );
    } catch {
      // El usuario puede reintentar desde la lista.
    } finally {
      setActioningId(null);
    }
  }

  async function handleCancel(connectionId: number) {
    if (actioningId) return;
    setActioningId(connectionId);

    try {
      await cancelConnection(connectionId);
      setSent((current) =>
        current.filter((item) => item.id !== connectionId)
      );
    } catch {
      // El usuario puede reintentar desde la lista.
    } finally {
      setActioningId(null);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "recibidas", label: "Recibidas", count: received.length },
    { key: "enviadas", label: "Enviadas", count: sent.length },
  ];

  return (
    <div>
      <Link
        href="/mensajes"
        className="mb-4 inline-flex h-9 items-center gap-1.5 text-sm font-bold text-muted transition-colors duration-180 hover:text-brand-dark"
      >
        <ArrowLeftIcon />
        Volver a mensajes
      </Link>

      <PageHeader
        title="Conexiones"
        subtitle="Gestiona tus conexiones y solicitudes con otras personas de CoFlow."
      />

      <div
        role="tablist"
        aria-label="Secciones de conexiones"
        className="mt-6 flex gap-2 overflow-x-auto scroll-px-2 rounded-18 border border-border bg-surface p-2 shadow-soft [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((item) => (
          <SoftButton
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            active={tab === item.key}
            className="shrink-0 snap-start scroll-ml-2"
          >
            {item.label}
            {item.count > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  tab === item.key
                    ? "bg-white/20 text-white"
                    : "bg-mint-100 text-primary-dark"
                }`}
              >
                {item.count}
              </span>
            )}
          </SoftButton>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="rounded-18 border border-red-100 bg-red-50 p-6 text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : (
          <>
            {tab === "recibidas" &&
              (received.length === 0 ? (
                <EmptyState
                  title="No tienes solicitudes recibidas"
                  description="Aquí verás las solicitudes de conexión que te envíen otras personas."
                />
              ) : (
                <div className="space-y-3">
                  {received.map((connection) => (
                    <ConnectionRow
                      key={connection.id}
                      person={connection.requester}
                    >
                      <PrimaryButton
                        onClick={() => handleAccept(connection.id)}
                        disabled={actioningId === connection.id}
                        className="flex-1"
                      >
                        <CheckIcon />
                        <span className="truncate">Aceptar</span>
                      </PrimaryButton>

                      <SecondaryButton
                        destructive
                        onClick={() => handleReject(connection.id)}
                        disabled={actioningId === connection.id}
                        className="flex-1"
                      >
                        <CloseIcon />
                        <span className="truncate">Rechazar</span>
                      </SecondaryButton>
                    </ConnectionRow>
                  ))}
                </div>
              ))}

            {tab === "enviadas" &&
              (sent.length === 0 ? (
                <EmptyState
                  title="No tienes solicitudes enviadas"
                  description="Aquí verás las solicitudes de conexión que hayas enviado, mientras esperan respuesta."
                />
              ) : (
                <div className="space-y-3">
                  {sent.map((connection) => (
                    <ConnectionRow
                      key={connection.id}
                      person={connection.recipient}
                    >
                      <span className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-14 bg-surface-muted px-2 text-sm font-bold text-muted">
                        <ClockIcon />
                        <span className="truncate">Pendiente</span>
                      </span>

                      <SecondaryButton
                        onClick={() => handleCancel(connection.id)}
                        disabled={actioningId === connection.id}
                        className="flex-1"
                      >
                        <CloseIcon />
                        <span className="truncate">Cancelar</span>
                      </SecondaryButton>
                    </ConnectionRow>
                  ))}
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function ConnectionRow({
  person,
  children,
}: {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  };
  children: React.ReactNode;
}) {
  const fullName = `${person.first_name} ${person.last_name}`.trim();

  const initials = [person.first_name, person.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-18 border border-border bg-surface p-4 shadow-soft">
      <Link
        href={`/personas/${person.id}`}
        className="flex items-center gap-3"
      >
        {person.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.avatar_url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {initials || "CF"}
          </div>
        )}

        <p className="min-w-0 flex-1 truncate text-sm font-bold text-brand-dark">
          {fullName || "Persona de CoFlow"}
        </p>
      </Link>

      <div className="mt-3 flex gap-2">{children}</div>
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
