"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
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
      <h1 className="text-3xl font-bold text-[#163B2E]">Conexiones</h1>
      <p className="mt-2 text-gray-600">
        Gestiona tus conexiones y solicitudes con otras personas de
        CoFlow.
      </p>

      <div
        role="tablist"
        aria-label="Secciones de conexiones"
        className="mt-6 flex gap-2 overflow-x-auto scroll-px-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`min-h-11 flex shrink-0 snap-start scroll-ml-2 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition active:scale-95 ${
              tab === item.key
                ? "bg-green-500 text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {item.label}
            {item.count > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  tab === item.key
                    ? "bg-white/20 text-white"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
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
                        <Link
                          href={`/mensajes/${connection.id}`}
                          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white transition hover:bg-green-600"
                        >
                          Enviar mensaje
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(connection.id)}
                          disabled={actioningId === connection.id}
                          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-red-200 bg-white text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Eliminar conexión
                        </button>
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
                      <button
                        type="button"
                        onClick={() => handleAccept(connection.id)}
                        disabled={actioningId === connection.id}
                        className="flex h-11 flex-1 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Aceptar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(connection.id)}
                        disabled={actioningId === connection.id}
                        className="flex h-11 flex-1 items-center justify-center rounded-xl border border-red-200 bg-white text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Rechazar
                      </button>
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
                      <span className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-500">
                        Pendiente de respuesta
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCancel(connection.id)}
                        disabled={actioningId === connection.id}
                        className="flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-[#163B2E] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancelar
                      </button>
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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <Link
        href={`/personas/${person.id}`}
        className="flex items-center gap-3"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-sm font-bold text-white">
          {initials || "CF"}
        </div>

        <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#163B2E]">
          {fullName || "Persona de CoFlow"}
        </p>
      </Link>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">{children}</div>
    </div>
  );
}
