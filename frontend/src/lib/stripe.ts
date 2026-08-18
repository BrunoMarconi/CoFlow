import { loadStripe } from "@stripe/stripe-js";

// Instancia única compartida — Stripe recomienda llamar a loadStripe()
// una sola vez fuera de cualquier render, no una vez por componente
// que necesite Elements (PropertyPublishFlow, Ajustes, ...).
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);
