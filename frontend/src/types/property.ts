export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "STUDIO"
  | "SHARED_APARTMENT"
  | "OTHER";

export type PropertyStatus =
  | "DRAFT"
  | "READY"
  | "PAUSED"
  | "PUBLISHED"
  | "RENTED"
  | "ARCHIVED";

export type PropertySubscriptionStatus =
  | "NONE"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED";

export interface Amenity {
  id: number;
  key: string;
  label: string;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  position: number;
  is_cover: boolean;
  created_at: string;
}

export interface Property {
  id: number;
  owner_profile_id: number;
  title: string;
  description: string;
  property_type: PropertyType;
  status: PropertyStatus;

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

  ready_at: string | null;
  rented_at: string | null;
  archived_at: string | null;

  subscription_status: PropertySubscriptionStatus;
  trial_ends_at: string | null;

  created_at: string;
  updated_at: string;

  images: PropertyImage[];
  amenities: Amenity[];
}

export interface PropertySummary {
  id: number;
  title: string;
  status: PropertyStatus;
  property_type: PropertyType;
  city: string;
  neighborhood: string | null;
  total_monthly_rent: number | null;
  bedrooms: number;
  max_tenants: number;
  cover_image_url: string | null;
  subscription_status: PropertySubscriptionStatus;
  trial_ends_at: string | null;
  updated_at: string;
}

export interface PropertyCreate {
  title: string;
  description: string;
  property_type: PropertyType;

  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  neighborhood?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  surface_m2?: number | null;
  bedrooms: number;
  bathrooms: number;
  floor?: string | null;
  has_elevator: boolean;
  furnished: boolean;
  max_tenants: number;

  total_monthly_rent?: number | null;
  deposit?: number | null;
  utilities_included: boolean;

  available_from?: string | null;
  minimum_stay_months?: number | null;

  pets_allowed?: boolean | null;
  smoking_allowed?: boolean | null;
  couples_allowed?: boolean | null;
  students_allowed?: boolean | null;
  registration_allowed?: boolean | null;
  additional_requirements?: string | null;

  amenity_ids: number[];
}

export type PropertyUpdate = Partial<PropertyCreate>;

export interface PropertyReadyCheck {
  ready: boolean;
  missing_fields: string[];
}
