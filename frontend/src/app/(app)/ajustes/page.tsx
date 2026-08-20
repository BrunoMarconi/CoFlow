"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, KeyRound, LoaderCircle, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { stripePromise } from "@/lib/stripe";
import { clearToken } from "@/lib/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SecondaryButton from "@/components/ui/SecondaryButton";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/ui/StatusBadge";
import BottomSheet from "@/components/ui/BottomSheet";
import { changePassword, deleteAccount } from "@/services/auth";
import {
  confirmPaymentMethod,
  createSetupIntent,
  getPaymentMethodSummary,
  type PaymentMethodSummary,
} from "@/services/billing";
import { getMyProperties } from "@/services/properties";
import type { PropertySummary, PropertySubscriptionStatus } from "@/types/property";

export default function AjustesPage() {
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold text-brand-dark">Ajustes</h1>

      <PasswordSection />

      <DangerSection onLogout={logout} />
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-18 border border-border bg-surface p-6">
      <h2 className="text-lg font-bold text-brand-dark">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (reason) {
      const status = (reason as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? "La contraseña actual no es correcta." : "No pudimos actualizar tu contraseña. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Contraseña">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Contraseña actual"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          leftElement={<KeyRound className="h-5 w-5" />}
          autoComplete="current-password"
          required
        />
        <Input
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          leftElement={<KeyRound className="h-5 w-5" />}
          autoComplete="new-password"
          minLength={8}
          helperText="Mínimo 8 caracteres."
          required
        />
        <Input
          label="Confirma la nueva contraseña"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          leftElement={<KeyRound className="h-5 w-5" />}
          autoComplete="new-password"
          minLength={8}
          required
        />

        {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
        {success && <p className="text-sm font-semibold text-primary-dark">{success}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Actualizar contraseña"}
        </Button>
      </form>
    </SectionCard>
  );
}

function BillingSection() {
  const { ownerProfile, ownerProfileLoading } = useAuth();

  const [summary, setSummary] = useState<PaymentMethodSummary | null>(null);
  const [properties, setProperties] = useState<PropertySummary[] | null>(null);
  const [editingCard, setEditingCard] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerProfile) return;
    getPaymentMethodSummary().then(setSummary).catch(() => setSummary(null));
    getMyProperties().then(setProperties).catch(() => setProperties([]));
  }, [ownerProfile]);

  useEffect(() => {
    if (editingCard && !clientSecret) {
      createSetupIntent().then((data) => setClientSecret(data.client_secret));
    }
  }, [editingCard, clientSecret]);

  if (ownerProfileLoading) return null;
  if (!ownerProfile) return null;

  async function handleCardSaved() {
    const updated = await getPaymentMethodSummary();
    setSummary(updated);
    setEditingCard(false);
    setClientSecret(null);
  }

  return (
    <SectionCard title="Métodos de pago">
      <p className="text-sm leading-6 text-muted">
        Cada piso publicado tiene su propia cuota de 23,99 €/mes, cobrada por separado.
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-14 border border-border bg-surface-soft p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft">
          <CreditCard className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          {summary === null ? (
            <p className="text-sm text-muted">Cargando…</p>
          ) : summary.has_payment_method ? (
            <p className="text-sm font-bold text-foreground">
              {summary.card_brand ? capitalize(summary.card_brand) : "Tarjeta"} terminada en {summary.card_last4}
            </p>
          ) : (
            <p className="text-sm font-bold text-foreground">Sin tarjeta guardada</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditingCard((value) => !value)}
          className="text-sm font-bold text-primary-dark"
        >
          {summary?.has_payment_method ? "Cambiar" : "Añadir"}
        </button>
      </div>

      {editingCard && (
        <div className="mt-4">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <UpdateCardForm onSaved={handleCardSaved} />
            </Elements>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Preparando el formulario de pago…
            </div>
          )}
        </div>
      )}

      {properties && properties.length > 0 && (
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-bold text-secondary">Cuotas por piso</h3>
          {properties.map((property) => (
            <div
              key={property.id}
              className="flex items-center justify-between gap-3 rounded-14 border border-border bg-surface px-4 py-3"
            >
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                {property.title}
              </span>
              <SubscriptionBadge status={property.subscription_status} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function UpdateCardForm({ onSaved }: { onSaved: () => void | Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!stripe || !elements) return;

    setSaving(true);
    try {
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (confirmError || !setupIntent?.payment_method) {
        setError(confirmError?.message ?? "No hemos podido guardar la tarjeta.");
        return;
      }

      await confirmPaymentMethod(setupIntent.payment_method as string);
      await onSaved();
    } catch {
      setError("No hemos podido guardar la tarjeta. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-14 border border-border bg-surface p-4">
        <PaymentElement />
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "Guardando..." : "Guardar tarjeta"}
      </Button>
    </form>
  );
}

function SubscriptionBadge({ status }: { status: PropertySubscriptionStatus }) {
  const map: Record<PropertySubscriptionStatus, { label: string; variant: "success" | "warning" | "info" | "neutral" }> = {
    NONE: { label: "Sin suscripción", variant: "neutral" },
    TRIALING: { label: "En prueba", variant: "info" },
    ACTIVE: { label: "Activa", variant: "success" },
    PAST_DUE: { label: "Pago pendiente", variant: "warning" },
    CANCELED: { label: "Cancelada", variant: "neutral" },
  };
  const { label, variant } = map[status];
  return <StatusBadge variant={variant}>{label}</StatusBadge>;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DangerSection({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setError("");
    setDeleting(true);
    try {
      await deleteAccount(password);
      clearToken();
      router.replace("/");
    } catch (reason) {
      const response = (reason as { response?: { status?: number; data?: { detail?: unknown } } })?.response;
      const detail = response?.data?.detail;
      setError(
        response?.status === 401
          ? "La contraseña no es correcta."
          : typeof detail === "string"
            ? detail
            : "No hemos podido eliminar tu cuenta. Inténtalo de nuevo."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="rounded-18 border border-red-200 bg-surface p-6">
        <h2 className="text-lg font-bold text-red-600">Zona de riesgo</h2>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 text-sm font-bold text-foreground"
        >
          Cerrar sesión
        </button>

        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-sm font-bold text-red-600"
          >
            Eliminar cuenta
          </button>
        </div>
      </section>

      {showDelete && (
        <BottomSheet
          onClose={() => !deleting && setShowDelete(false)}
          ariaLabel="Eliminar cuenta"
          className="sm:max-w-sm"
          closeOnOutsideClick={!deleting}
        >
          <div className="p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-brand-dark">Eliminar cuenta</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Esta acción no se puede deshacer. Se borrarán tu perfil, tus comunidades, mensajes y pisos publicados. Confirma con tu contraseña.
            </p>

            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              className="mt-4"
              required
            />

            {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{error}</p>}

            <div className="mt-6 flex gap-3">
              <SecondaryButton onClick={() => setShowDelete(false)} disabled={deleting} className="flex-1">
                Cancelar
              </SecondaryButton>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || !password}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-14 bg-red-600 px-5 text-sm font-bold text-white shadow-button transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
