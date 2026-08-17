import { api } from "./api";

export interface SetupIntentResponse {
  client_secret: string;
  publishable_key: string;
}

export async function createSetupIntent() {
  const { data } = await api.post<SetupIntentResponse>(
    "/billing/setup-intent"
  );
  return data;
}

export async function confirmPaymentMethod(paymentMethodId: string) {
  await api.post("/billing/payment-method", {
    payment_method_id: paymentMethodId,
  });
}

export async function getPaymentMethodStatus() {
  const { data } = await api.get<{ has_payment_method: boolean }>(
    "/billing/payment-method"
  );
  return data.has_payment_method;
}
