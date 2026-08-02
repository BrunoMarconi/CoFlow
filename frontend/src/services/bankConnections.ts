import { api } from "./api";
import type {
  BankConnectionCallbackResponse,
  BankConnectionStartResponse,
  BankConnectionSummary,
  BankConnectionSyncResponse,
} from "@/types/bankConnection";

export async function startBankConnection() {
  const { data } = await api.post<BankConnectionStartResponse>(
    "/bank-connections/start"
  );
  return data;
}

export async function submitBankConnectionCallback(code: string, state: string) {
  const { data } = await api.post<BankConnectionCallbackResponse>(
    "/bank-connections/callback",
    { code, state }
  );
  return data;
}

export async function getMyBankConnection() {
  const { data } = await api.get<BankConnectionSummary>("/bank-connections/me");
  return data;
}

export async function syncBankConnection(connectionId: string) {
  const { data } = await api.post<BankConnectionSyncResponse>(
    `/bank-connections/${connectionId}/sync`
  );
  return data;
}

export async function disconnectBankConnection(connectionId: string) {
  await api.delete(`/bank-connections/${connectionId}`);
}
