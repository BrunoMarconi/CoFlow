"use client";

import { FormEvent, useState } from "react";
import Input from "@/components/ui/Input";
import type {
  OwnerProfile,
  OwnerProfileCreate,
  OwnerType,
} from "@/types/owner";

const OWNER_TYPE_OPTIONS: { value: OwnerType; label: string }[] = [
  { value: "INDIVIDUAL", label: "Particular" },
  { value: "COMPANY", label: "Empresa" },
  { value: "AGENCY", label: "Agencia" },
];

export type OwnerProfileFormValues = OwnerProfileCreate;

export default function OwnerProfileForm({
  mode = "create",
  initialValues,
  submitting = false,
  serverError = "",
  onSubmit,
  onCancel,
}: {
  mode?: "create" | "edit";
  initialValues?: OwnerProfile | null;
  submitting?: boolean;
  serverError?: string;
  onSubmit: (values: OwnerProfileFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [ownerType, setOwnerType] = useState<OwnerType>(
    initialValues?.owner_type ?? "INDIVIDUAL"
  );
  const [displayName, setDisplayName] = useState(
    initialValues?.display_name ?? ""
  );
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(
    initialValues?.contact_email ?? ""
  );
  const [companyName, setCompanyName] = useState(
    initialValues?.company_name ?? ""
  );
  const [taxId, setTaxId] = useState(initialValues?.tax_id ?? "");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    if (displayName.trim().length < 2) {
      setValidationError("Indica un nombre visible válido.");
      return;
    }

    if (phone.trim().length < 6) {
      setValidationError("Indica un teléfono de contacto válido.");
      return;
    }

    if (!contactEmail.trim().includes("@")) {
      setValidationError("Indica un email de contacto válido.");
      return;
    }

    setValidationError("");

    await onSubmit({
      owner_type: ownerType,
      display_name: displayName.trim(),
      phone: phone.trim(),
      contact_email: contactEmail.trim(),
      company_name: companyName.trim() || null,
      tax_id: taxId.trim() || null,
    });
  }

  const visibleError = validationError || serverError;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
        Panel de propietarios
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {mode === "create"
          ? "Crea tu perfil de propietario"
          : "Edita tu perfil de propietario"}
      </h1>

      <p className="mt-3 max-w-xl text-base leading-7 text-muted">
        {mode === "create"
          ? "Registra tus viviendas y déjalas preparadas para el futuro lanzamiento de pisos en CoFlow."
          : "Actualiza los datos de contacto de tu perfil de propietario."}
      </p>

      {mode === "create" && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
          Tus pisos todavía no serán visibles públicamente. Quedarán
          guardados en tu cuenta hasta que CoFlow abra el marketplace de
          viviendas.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            ¿Qué tipo de propietario eres?
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {OWNER_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setOwnerType(option.value)}
                className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${
                  ownerType === option.value
                    ? "border-brand bg-brand/10 text-brand-dark"
                    : "border-line bg-surface text-muted hover:border-brand/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Nombre visible"
          helperText="Así te verás cuando el marketplace esté activo."
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Ej. María García"
          maxLength={120}
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Teléfono"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Ej. 600 123 456"
            maxLength={30}
            required
          />

          <Input
            label="Email de contacto"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="Ej. maria@email.com"
            maxLength={255}
            required
          />
        </div>

        {ownerType !== "INDIVIDUAL" && (
          <Input
            label="Nombre de la empresa"
            helperText="Opcional"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Ej. Inmobiliaria Sol S.L."
            maxLength={150}
          />
        )}

        <Input
          label="Identificación fiscal"
          helperText="Opcional. Podrás añadirla más adelante."
          value={taxId}
          onChange={(event) => setTaxId(event.target.value)}
          placeholder="Ej. B12345678"
          maxLength={50}
        />

        {visibleError && (
          <p
            role="alert"
            className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {visibleError}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Guardando..."
              : mode === "create"
                ? "Crear perfil de propietario"
                : "Guardar cambios"}
          </button>

          {mode === "edit" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="h-14 rounded-2xl border border-line bg-surface px-6 text-sm font-bold text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
