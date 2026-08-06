"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SoftButton from "@/components/ui/SoftButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import {
  acceptConnection,
  cancelConnection,
  deleteConnection,
  getConnectionRequests,
  getConnections,
  rejectConnection,
} from "@/services/connections";
import type { UserConnection } from "@/types/connection";

type Tab = "conectados" | "recibidas" | "enviadas";

const VALID_TABS: Tab[] = ["conectados", "recibidas", "enviadas"];

function isValidTab(value: string | null): value is Tab {
  return value !== null && (VALID_TABS as string[]).includes(value);
}

export default function ConexionesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab");

  const [tab, setTab] = useState<Tab>(
    isValidTab(initialTab) ? initialTab : "conectados"
  );

  const [connected, setConnected] = useState<UserConnection[]>([]);
  const [received, setReceived] = useState<UserConnection[]>([]);
  const [sent, setSent] = useState<UserConnection[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([getConnections(), getConnectionRequests()])
      .then(([connections, requests]) => {
        if (!active) return;

        setConnected(connections);
        setReceived(requests.received);
        setSent(requests.sent);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar tus conexiones.");
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
      const updated = await acceptConnection(connectionId);
      setReceived((current) =>
        current.filter((item) => item.id !== connectionId)
      );
      setConnected((current) => [updated, ...current]);
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

  async function handleDelete(connectionId: number) {
    if (actioningId) return;
    setActioningId(connectionId);

    try {
      await deleteConnection(connectionId);
      setConnected((current) =>
        current.filter((item) => item.id !== connectionId)
      );
    } catch {
      // El usuario puede reintentar desde la lista.
    } finally {
      setActioningId(null);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "conectados", label: "Conectados", count: connected.length },
    { key: "recibidas", label: "Recibidas", count: received.length },
    { key: "enviadas", label: "Enviadas", count: sent.length },
  ];

  return (
    <div>
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
            {tab === "conectados" &&
              (connected.length === 0 ? (
                <EmptyState
                  title="Todavía no tienes conexiones"
                  description="Cuando conectes con alguien y acepte tu solicitud, aparecerá aquí."
                />
              ) : (
                <div className="space-y-3">
                  {connected.map((connection) => {
                    const other =
                      connection.requester.id === user?.id
                        ? connection.recipient
                        : connection.requester;

                    return (
                      <ConnectionRow key={connection.id} person={other}>
                        <PrimaryButton
                          href={`/mensajes?c=${connection.id}`}
                          className="flex-1"
                        >
                          Enviar mensaje
                        </PrimaryButton>

                        <SecondaryButton
                          destructive
                          onClick={() => handleDelete(connection.id)}
                          disabled={actioningId === connection.id}
                          className="flex-1"
                        >
                          Eliminar conexión
                        </SecondaryButton>
                      </ConnectionRow>
                    );
                  })}
                </div>
              ))}

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
                        Aceptar
                      </PrimaryButton>

                      <SecondaryButton
                        destructive
                        onClick={() => handleReject(connection.id)}
                        disabled={actioningId === connection.id}
                        className="flex-1"
                      >
                        Rechazar
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
                      <span className="flex h-11 flex-1 items-center justify-center rounded-14 bg-surface-muted text-sm font-bold text-muted">
                        Pendiente de respuesta
                      </span>

                      <SecondaryButton
                        onClick={() => handleCancel(connection.id)}
                        disabled={actioningId === connection.id}
                        className="flex-1"
                      >
                        Cancelar
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
  person: { id: string; first_name: string; last_name: string };
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {initials || "CF"}
        </div>

        <p className="min-w-0 flex-1 truncate text-sm font-bold text-brand-dark">
          {fullName || "Persona de CoFlow"}
        </p>
      </Link>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">{children}</div>
    </div>
  );
}
