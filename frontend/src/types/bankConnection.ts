export type BankConnectionStatus =
  | "PENDING"
  | "CONNECTED"
  | "EXPIRED"
  | "REVOKED"
  | "FAILED";

export interface BankConnectionStartResponse {
  authorization_url: string;
  connection_id: string;
}

export interface BankConnectionCallbackResponse {
  status: string;
  connection_id: string;
  accounts_found: number;
  transactions_found: number;
}

export interface BankConnectionSyncResponse {
  status: string;
  connection_id: string;
  accounts_found: number;
  transactions_found: number;
  last_synced_at: string | null;
}

export interface BankConnectionSummary {
  connected: boolean;
  connection_id: string | null;
  provider_name: string | null;
  status: BankConnectionStatus | null;
  connected_at: string | null;
  last_synced_at: string | null;
  consent_expires_at: string | null;
  accounts_count: number;
  transactions_count: number;
}
