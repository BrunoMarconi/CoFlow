import { api } from "./api";
import type { PropertyStatus } from "@/types/property";
import type {
  TeamOwner,
  TeamPropertyDetail,
  TeamPropertySummary,
  TeamPropertyUpdate,
} from "@/types/team";

/* Herramientas internas del equipo fundador. El backend exige
 * require_team_member en cada ruta: aunque alguien llegue a estas
 * pantallas, sin rol ADMIN + email del equipo solo recibe 403. */

export async function getTeamProperties(filters: {
  q?: string;
  status?: PropertyStatus;
  ownerProfileId?: number;
} = {}) {
  const { data } = await api.get<TeamPropertySummary[]>("/team/properties", {
    params: {
      q: filters.q || undefined,
      status: filters.status,
      owner_profile_id: filters.ownerProfileId,
    },
  });
  return data;
}

export async function getTeamProperty(propertyId: number) {
  const { data } = await api.get<TeamPropertyDetail>(
    `/team/properties/${propertyId}`
  );
  return data;
}

export async function updateTeamProperty(
  propertyId: number,
  payload: TeamPropertyUpdate
) {
  const { data } = await api.put<TeamPropertyDetail>(
    `/team/properties/${propertyId}`,
    payload
  );
  return data;
}

export async function markTeamPropertyReady(propertyId: number) {
  const { data } = await api.post<TeamPropertyDetail>(
    `/team/properties/${propertyId}/ready`
  );
  return data;
}

export async function uploadTeamPropertyImages(
  propertyId: number,
  files: File[],
  onProgress?: (percent: number) => void
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await api.post<TeamPropertyDetail>(
    `/team/properties/${propertyId}/images`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (event) => {
            if (!event.total) return;
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        : undefined,
    }
  );
  return data;
}

export async function deleteTeamPropertyImage(propertyId: number, imageId: number) {
  const { data } = await api.delete<TeamPropertyDetail>(
    `/team/properties/${propertyId}/images/${imageId}`
  );
  return data;
}

export async function setTeamPropertyCover(propertyId: number, imageId: number) {
  const { data } = await api.post<TeamPropertyDetail>(
    `/team/properties/${propertyId}/images/${imageId}/cover`
  );
  return data;
}

export async function reorderTeamPropertyImages(propertyId: number, imageIds: number[]) {
  const { data } = await api.put<TeamPropertyDetail>(
    `/team/properties/${propertyId}/images/order`,
    { image_ids: imageIds }
  );
  return data;
}

export async function searchTeamOwners(q: string) {
  const { data } = await api.get<TeamOwner[]>("/team/owners", {
    params: { q: q || undefined },
  });
  return data;
}

export async function getTeamOwner(ownerProfileId: number) {
  const { data } = await api.get<TeamOwner>(`/team/owners/${ownerProfileId}`);
  return data;
}
