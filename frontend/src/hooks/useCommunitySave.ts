"use client";

import { useState } from "react";
import { saveCommunity, unsaveCommunity } from "@/services/communities";
import type { Community } from "@/types/community";

/** Guardar/quitar de favoritos una comunidad desde su tarjeta — mismo
 * patrón que useUserConnection.toggleSave para personas. */
export function useCommunitySave(community: Community) {
  const [syncedCommunityId, setSyncedCommunityId] = useState<number | null>(
    null
  );
  const [saved, setSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  if (community.id !== syncedCommunityId) {
    setSyncedCommunityId(community.id);
    setSaved(community.is_saved);
  }

  async function toggleSave() {
    if (savingToggle) return;

    setSavingToggle(true);

    try {
      if (saved) {
        await unsaveCommunity(community.id);
        setSaved(false);
      } else {
        await saveCommunity(community.id);
        setSaved(true);
      }
    } catch {
      // El usuario puede reintentar si falla.
    } finally {
      setSavingToggle(false);
    }
  }

  return { saved, savingToggle, toggleSave };
}
