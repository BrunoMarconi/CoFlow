"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import { getPaymentMethodSummary, type PaymentMethodSummary } from "@/services/billing";
import { cancelPropertyRenewal } from "@/services/properties";
import type { Property, PropertySubscriptionStatus } from "@/types/property";

const SUBSCRIPTION_PRICE_LABEL = "23,99 €/mes";

const STATUS_MAP: Record<PropertySubscriptionStatus, { label: string; variant: "success" | "warning" | "info" | "neutral" }> = {
  NONE: { label: "Sin suscripción", variant: "neutral" },
  TRIALING: { label: "En prueba", variant: "info" },
  ACTIVE: { label: "Activa", variant: "success" },
  PAST_DUE: { label: "Pago pendiente", variant: "warning" },
  CANCELED: { label: "Cancelada", variant: "neutral" },
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default function BillingPlanCard({
  property,
  onUpdated,
}: {
  property: Property;
  onUpdated: (property: Property) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<PaymentMethodSummary | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!expanded) return;
    getPaymentMethodSummary().then(setSummary).catch(() => setSummary(null));
  }, [expanded]);

  if (property.subscription_status === "NONE") return null;

  const status = STATUS_MAP[property.subscription_status];
  const trialEndLabel = formatDate(property.trial_ends_at);

  async function handleCancelRenewal() {
    setCanceling(true);
    setError("");
    try {
      const updated = await cancelPropertyRenewal(property.id);
      onUpdated(updated);
      setShowCancelConfirm(false);
    } catch {
      setError("No hemos podido cancelar la renovación. Inténtalo de nuevo.");
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="mt-5 rounded-[1.15rem] border border-[#dddddd] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
          {property.subscription_status === "TRIALING" && trialEndLabel ? (
            <p className="mt-2 text-sm font-semibold text-[#191919]">
              Prueba gratuita hasta: {trialEndLabel}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-[#717171]">Después: {SUBSCRIPTION_PRICE_LABEL}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="h-10 shrink-0 rounded-full border border-[#cfcfcf] bg-white px-4 text-sm font-bold text-[#191919]"
        >
          Gestionar plan
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-[#eee] pt-4">
          <Row label="Próximo cobro" value={property.subscription_status === "CANCELED" ? "No habrá más cobros" : trialEndLabel ?? "—"} />
          <Row label="Precio" value={SUBSCRIPTION_PRICE_LABEL} />
          <Row
            label="Método de pago"
            value={
              summary === null
                ? "Cargando…"
                : summary.has_payment_method
                  ? `${summary.card_brand ?? "Tarjeta"} •••• ${summary.card_last4}`
                  : "Sin tarjeta guardada"
            }
            icon={<CreditCard className="h-4 w-4" />}
          />
          <Row label="Estado" value={status.label} />

          {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}

          {property.subscription_status !== "CANCELED" ? (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="mt-2 text-sm font-bold text-red-600"
            >
              Cancelar renovación
            </button>
          ) : null}
        </div>
      ) : null}

      {showCancelConfirm ? (
        <ConfirmDialog
          title="Cancelar renovación"
          description="No se te cobrará de nuevo por este piso. Seguirá publicado hasta el final del periodo ya cubierto (prueba gratis o mes ya pagado) y después se pausará."
          confirmLabel="Cancelar renovación"
          destructive
          pending={canceling}
          onConfirm={handleCancelRenewal}
          onClose={() => setShowCancelConfirm(false)}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-[#717171]">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-bold text-[#191919]">
        {icon}
        {value}
      </span>
    </div>
  );
}
