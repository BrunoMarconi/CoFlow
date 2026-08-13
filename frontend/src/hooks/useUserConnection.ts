"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import {
  createConnectionRequest,
  saveUserProfile,
  unsaveUserProfile,
} from "@/services/users";
import { deleteConnection } from "@/services/connections";
import {
  refreshConnectionQueries,
  setCachedProfileConnection,
} from "@/lib/connectionQueryState";
import type {
  UserConnectionStatusLabel,
  UserPublicProfile,
} from "@/types/userPublic";

/** Guardar/conectar/eliminar conexión para un perfil público — misma
 * lógica que antes vivía solo en personas/[id]/page.tsx, ahora
 * compartida con la tarjeta de la lista y el panel de vista rápida. */
export function useUserConnection(profile: UserPublicProfile | null) {
  const queryClient = useQueryClient();
  // Semilla el estado local desde el perfil recién cargado, pero
  // permite que las acciones del usuario (guardar/conectar) lo
  // sobrescriban después. Se ajusta durante el render (no en un
  // efecto) cuando cambia de perfil — patrón documentado de React
  // para "derived state que luego se puede sobrescribir", sin el
  // renderizado en cascada de sincronizarlo vía useEffect.
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);
  const [syncedConnectionFingerprint, setSyncedConnectionFingerprint] =
    useState("");
  const [saved, setSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState<UserConnectionStatusLabel>("NONE");
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  if (profile && profile.id !== syncedProfileId) {
    setSyncedProfileId(profile.id);
    setSaved(profile.is_saved);
  }

  const connectionFingerprint = profile
    ? `${profile.id}:${profile.connection_status}:${profile.connection_id ?? "none"}`
    : "";

  if (profile && connectionFingerprint !== syncedConnectionFingerprint) {
    setSyncedConnectionFingerprint(connectionFingerprint);
    setConnectionStatus(profile.connection_status);
    setConnectionId(profile.connection_id);
  }

  async function toggleSave() {
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
      // El usuario puede reintentar si falla.
    } finally {
      setSavingToggle(false);
    }
  }

  async function connect() {
    if (!profile || connecting) return;

    setConnecting(true);
    setConnectionError("");

    try {
      const connection = await createConnectionRequest(profile.id);
      setConnectionStatus("PENDING_SENT");
      setConnectionId(connection.id);
      setCachedProfileConnection(
        queryClient,
        profile.id,
        "PENDING_SENT",
        connection.id
      );
      refreshConnectionQueries(queryClient);
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

  async function removeConnection() {
    if (!connectionId || connecting) return;

    setConnecting(true);
    setConnectionError("");

    try {
      await deleteConnection(connectionId);
      setConnectionStatus("NONE");
      setConnectionId(null);
      if (profile) {
        setCachedProfileConnection(queryClient, profile.id, "NONE", null);
      }
      refreshConnectionQueries(queryClient);
    } catch (error) {
      setConnectionError(
        getCommunityErrorMessage(error, "No pudimos eliminar la conexión.")
      );
    } finally {
      setConnecting(false);
    }
  }

  return {
    saved,
    savingToggle,
    toggleSave,
    connectionStatus,
    connectionId,
    connecting,
    connectionError,
    connect,
    removeConnection,
  };
}
