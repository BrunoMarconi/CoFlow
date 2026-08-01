export type OwnerType = "INDIVIDUAL" | "COMPANY" | "AGENCY";

export interface OwnerProfile {
  id: number;
  user_id: string;
  owner_type: OwnerType;
  display_name: string;
  phone: string;
  contact_email: string;
  company_name: string | null;
  tax_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerProfileCreate {
  owner_type: OwnerType;
  display_name: string;
  phone: string;
  contact_email: string;
  company_name?: string | null;
  tax_id?: string | null;
}

export interface OwnerProfileUpdate {
  owner_type?: OwnerType;
  display_name?: string;
  phone?: string;
  contact_email?: string;
  company_name?: string | null;
  tax_id?: string | null;
}
