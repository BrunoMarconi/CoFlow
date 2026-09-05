"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Bell, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, CreditCard, Home, KeyRound, LockKeyhole, LoaderCircle, LogOut, UserRound, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { stripePromise } from "@/lib/stripe";
import { clearToken } from "@/lib/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SecondaryButton from "@/components/ui/SecondaryButton";
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
  const { user, logout } = useAuth();

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] space-y-4 px-6 py-6 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-5xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="px-1 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Tu espacio</p>
        <h1 className="mt-0.5 font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
          Ajustes
        </h1>
      </header>

      {user && (
        <section className="relative overflow-hidden rounded-[26px] bg-brand-dark p-5 text-white shadow-[0_16px_40px_rgba(20,55,41,.16)] sm:p-6">
          <span className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-white/[0.04]" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">{[user.first_name, user.last_name].filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="font-rounded text-xl font-semibold tracking-[-0.02em]">{user.first_name} {user.last_name}</p>
              <p className="mt-0.5 truncate text-sm text-white/60">{user.email}</p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 sm:flex"><CheckCircle2 className="h-3.5 w-3.5" /> Sesión activa</span>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <SettingsGroup title="Cuenta y preferencias">
            <SettingsLink href="/perfil/editar" icon={<UserRound />} title="Información personal" subtitle="Nombre, biografía y datos de contacto" />
            <SettingsLink href="/perfil/preferencias" icon={<Home />} title="Preferencias de vivienda" subtitle="Presupuesto, hábitos y convivencia ideal" />
            <SettingsLink href="/notificaciones" icon={<Bell />} title="Notificaciones" subtitle="Actividad, mensajes y avisos" />
            <SettingsLink href="/ajustes/privacidad" icon={<LockKeyhole />} title="Privacidad" subtitle="Visibilidad del perfil y personas bloqueadas" />
          </SettingsGroup>

          <SettingsGroup title="Soporte">
            <SettingsLink href="/ayuda" icon={<CircleHelp />} title="Centro de ayuda" subtitle="Preguntas frecuentes y contacto" />
          </SettingsGroup>
        </div>

        <div className="space-y-4">
          <PasswordSection />
          <BillingSection />
          <DangerSection onLogout={logout} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-black/[0.06] bg-[#fbfcfa] p-5 shadow-[0_10px_30px_rgba(20,42,32,.04)] sm:p-6">
      <h2 className="font-rounded text-xl font-semibold tracking-[-0.02em] text-brand-dark">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">{title}</h2>
      <div className="divide-y divide-border/70 overflow-hidden rounded-[24px] bg-surface shadow-sm">
        {children}
      </div>
    </section>
  );
}

function SettingsLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-18 items-center gap-3 px-4 py-3 transition-colors duration-180 hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-12 bg-mint-50 text-primary [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-secondary">{subtitle}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}

function PasswordSection() {
  const [open, setOpen] = useState(false);
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
    <section className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#fbfcfa] shadow-[0_10px_30px_rgba(20,42,32,.04)]">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-20 w-full items-center gap-3 p-4 text-left transition hover:bg-[#f5f7f4] sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-mint-50 text-primary"><KeyRound className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-brand-dark">Contraseña</span><span className="mt-0.5 block text-xs leading-5 text-secondary">Actualiza tu clave de acceso de forma segura</span></span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <form onSubmit={submit} className="space-y-4 border-t border-black/[0.06] p-5">
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
      </form>}
    </section>
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

      <div className="mt-4 flex items-center gap-3 rounded-18 bg-surface-soft p-4">
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
          className="min-h-11 rounded-full px-3 text-sm font-bold text-primary-dark transition-colors duration-180 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
              className="flex items-center justify-between gap-3 rounded-14 bg-surface-soft px-4 py-3"
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
      <section className="rounded-[24px] border border-black/[0.06] bg-[#fbfcfa] p-4 shadow-[0_10px_30px_rgba(20,42,32,.04)] sm:p-5">
        <h2 className="font-rounded text-xl font-semibold tracking-[-0.02em] text-brand-dark">Sesión y cuenta</h2>

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex min-h-13 w-full items-center gap-3 rounded-14 px-3 text-left text-sm font-bold text-foreground transition-colors duration-180 hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <LogOut className="h-4.5 w-4.5 text-muted" /> Cerrar sesión
        </button>

        <div className="border-t border-border/70">
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex min-h-13 w-full items-center gap-3 rounded-14 px-3 text-left text-sm font-bold text-red-600 transition-colors duration-180 hover:bg-red-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <TriangleAlert className="h-4.5 w-4.5" /> Eliminar cuenta
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
