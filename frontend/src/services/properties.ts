import { api } from "./api";
import type { Amenity } from "@/types/property";
import type {
  Property,
  PropertyCreate,
  PropertyReadyCheck,
  PropertySummary,
  PropertyUpdate,
} from "@/types/property";

export async function getMyProperties(includeArchived = false) {
  const { data } = await api.get<PropertySummary[]>("/owner/properties", {
    params: { include_archived: includeArchived },
  });
  return data;
}

export async function getMyProperty(propertyId: number) {
  const { data } = await api.get<Property>(
    `/owner/properties/${propertyId}`
  );
  return data;
}

export async function createProperty(payload: PropertyCreate) {
  const { data } = await api.post<Property>("/owner/properties", payload);
  return data;
}

export async function updateProperty(
  propertyId: number,
  payload: PropertyUpdate
) {
  const { data } = await api.put<Property>(
    `/owner/properties/${propertyId}`,
    payload
  );
  return data;
}

export async function checkPropertyReady(propertyId: number) {
  const { data } = await api.get<PropertyReadyCheck>(
    `/owner/properties/${propertyId}/ready-check`
  );
  return data;
}

export async function markPropertyReady(propertyId: number) {
  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/ready`
  );
  return data;
}

export async function subscribeProperty(propertyId: number, termsAccepted: boolean) {
  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/subscribe`,
    { terms_accepted: termsAccepted }
  );
  return data;
}

export async function cancelPropertyRenewal(propertyId: number) {
  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/cancel-renewal`
  );
  return data;
}

export async function pauseProperty(propertyId: number) {
  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/pause`
  );
  return data;
}

export async function resumeProperty(propertyId: number) {
  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/resume`
  );
  return data;
}

export async function markPropertyRented(propertyId: number) {
  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/mark-rented`
  );
  return data;
}

export async function archiveProperty(propertyId: number) {
  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/archive`
  );
  return data;
}

export async function uploadPropertyImages(
  propertyId: number,
  files: File[],
  onProgress?: (percent: number) => void
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/images`,
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

export async function deletePropertyImage(
  propertyId: number,
  imageId: number
) {
  const { data } = await api.delete<Property>(
    `/owner/properties/${propertyId}/images/${imageId}`
  );
  return data;
}

export async function setPropertyImageCover(
  propertyId: number,
  imageId: number
) {
  const { data } = await api.post<Property>(
    `/owner/properties/${propertyId}/images/${imageId}/cover`
  );
  return data;
}

export async function reorderPropertyImages(
  propertyId: number,
  imageIds: number[]
) {
  const { data } = await api.put<Property>(
    `/owner/properties/${propertyId}/images/order`,
    { image_ids: imageIds }
  );
  return data;
}

export async function getPropertyAmenities() {
  const { data } = await api.get<Amenity[]>("/property-amenities");
  return data;
}
