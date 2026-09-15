import type { Property, PropertyStatus, PropertyType } from "./property";

export type OwnerType = "INDIVIDUAL" | "COMPANY" | "AGENCY";

export interface TeamOwner {
  owner_profile_id: number;
  user_id: string;
  owner_type: OwnerType;
  display_name: string;
  company_name: string | null;
  first_name: string;
  last_name: string;
  /** null si el alta se hizo sin email real. */
  email: string | null;
  phone: string | null;
  account_activated: boolean;
  /** Solo en el buscador de clientes. */
  property_count: number | null;
}

export interface TeamPropertySummary {
  id: number;
  title: string;
  status: PropertyStatus;
  property_type: PropertyType;
  address_line: string;
  city: string;
  neighborhood: string | null;
  postal_code: string;
  total_monthly_rent: number | null;
  deposit: number | null;
  bedrooms: number;
  bathrooms: number;
  max_tenants: number;
  surface_m2: number | null;
  available_from: string | null;
  cover_image_url: string | null;
  image_count: number;
  missing_fields: string[];
  created_at: string;
  updated_at: string;
  ready_at: string | null;
  owner: TeamOwner;
}

export interface TeamPropertyDetail extends Property {
  owner: TeamOwner;
  missing_fields: string[];
}

/** Todo opcional: el equipo guarda borradores a medias. */
export type TeamPropertyUpdate = Partial<{
  title: string;
  description: string;
  property_type: PropertyType;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  surface_m2: number | null;
  bedrooms: number;
  bathrooms: number;
  floor: string | null;
  has_elevator: boolean;
  furnished: boolean;
  max_tenants: number;
  total_monthly_rent: number | null;
  deposit: number | null;
  utilities_included: boolean;
  available_from: string | null;
  minimum_stay_months: number | null;
  pets_allowed: boolean | null;
  smoking_allowed: boolean | null;
  couples_allowed: boolean | null;
  students_allowed: boolean | null;
  registration_allowed: boolean | null;
  additional_requirements: string | null;
  amenity_ids: number[];
}>;

export interface NewOwnerInput {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  owner_type: OwnerType;
  company_name: string | null;
}

export interface AssistedListingCreate {
  owner?: NewOwnerInput;
  owner_profile_id?: number;
  property: TeamPropertyUpdate;
  owner_consent: boolean;
}

export interface AssistedListingResult {
  property_id: number;
  owner_profile_id: number;
  owner_display_name: string;
  owner_email: string;
  is_new_owner: boolean;
  claim_url: string | null;
}
