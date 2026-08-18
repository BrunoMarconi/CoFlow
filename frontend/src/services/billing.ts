import { api } from "./api";

export interface SetupIntentResponse {
  client_secret: string;
  publishable_key: string;
}

export interface PaymentMethodSummary {
  has_payment_method: boolean;
  card_brand: string | null;
  card_last4: string | null;
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

export async function getPaymentMethodSummary() {
  const { data } = await api.get<PaymentMethodSummary>(
    "/billing/payment-method"
  );
  return data;
}

export async function getPaymentMethodStatus() {
  const data = await getPaymentMethodSummary();
  return data.has_payment_method;
}
