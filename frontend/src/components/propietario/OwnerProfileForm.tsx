"use client";

import { FormEvent, useState } from "react";
import { Building2, UserRound } from "lucide-react";
import Input from "@/components/ui/Input";
import type { OwnerProfile, OwnerProfileCreate, OwnerType } from "@/types/owner";

const OWNER_TYPES: Array<{ value: OwnerType; label: string; icon: React.ReactNode }> = [
  { value: "INDIVIDUAL", label: "Particular", icon: <UserRound /> },
  { value: "COMPANY", label: "Empresa", icon: <Building2 /> },
  { value: "AGENCY", label: "Agencia", icon: <Building2 /> },
];

export type OwnerProfileFormValues = OwnerProfileCreate;

export default function OwnerProfileForm({ mode = "create", initialValues, submitting = false, serverError = "", onSubmit, onCancel }: { mode?: "create" | "edit"; initialValues?: OwnerProfile | null; submitting?: boolean; serverError?: string; onSubmit: (values: OwnerProfileFormValues) => Promise<void>; onCancel?: () => void }) {
  const [ownerType, setOwnerType] = useState<OwnerType>(initialValues?.owner_type ?? "INDIVIDUAL");
  const [displayName, setDisplayName] = useState(initialValues?.display_name ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(initialValues?.contact_email ?? "");
  const [companyName, setCompanyName] = useState(initialValues?.company_name ?? "");
  const [taxId, setTaxId] = useState(initialValues?.tax_id ?? "");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (displayName.trim().length < 2) return setValidationError("Indica un nombre visible válido.");
    if (phone.trim().length < 6) return setValidationError("Indica un teléfono de contacto válido.");
    if (!contactEmail.trim().includes("@")) return setValidationError("Indica un email de contacto válido.");
    setValidationError("");
    await onSubmit({ owner_type: ownerType, display_name: displayName.trim(), phone: phone.trim(), contact_email: contactEmail.trim(), company_name: companyName.trim() || null, tax_id: taxId.trim() || null });
  }

  const visibleError = validationError || serverError;

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <header><p className="text-sm font-bold text-primary">Espacio propietario</p><h1 className="mt-1 font-rounded text-4xl font-bold tracking-[-0.04em] text-brand-dark sm:text-5xl">{mode === "create" ? "Tu perfil de propietario" : "Editar perfil"}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-secondary">Los datos que usaremos para gestionar tus viviendas y contactar contigo.</p></header>

      <form onSubmit={handleSubmit} className="mt-8 rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-8">
        <fieldset><legend className="text-sm font-bold text-brand-dark">¿Qué tipo de propietario eres?</legend><div className="mt-3 grid grid-cols-3 gap-3">{OWNER_TYPES.map((option) => <button key={option.value} type="button" onClick={() => setOwnerType(option.value)} className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-18 border text-sm font-bold transition ${ownerType === option.value ? "border-primary text-brand-dark ring-1 ring-primary" : "border-border text-secondary"}`}><span className="text-primary [&>svg]:h-6 [&>svg]:w-6">{option.icon}</span>{option.label}</button>)}</div></fieldset>

        <div className="mt-7 space-y-5">
          <Input label="Nombre visible" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ej. María García" maxLength={120} required />
          <div className="grid gap-5 sm:grid-cols-2"><Input label="Teléfono" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="600 123 456" required /><Input label="Email de contacto" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="maria@email.com" required /></div>
          {ownerType !== "INDIVIDUAL" ? <Input label="Nombre de la empresa" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Inmobiliaria Sol S.L." /> : null}
          <Input label="Identificación fiscal" helperText="Opcional" value={taxId} onChange={(event) => setTaxId(event.target.value)} placeholder="B12345678" />
        </div>

        {visibleError ? <p role="alert" className="mt-5 rounded-18 border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{visibleError}</p> : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="submit" disabled={submitting} className="h-13 flex-1 rounded-full bg-brand px-6 font-bold text-white shadow-button disabled:opacity-50">{submitting ? "Guardando…" : "Guardar cambios"}</button>{mode === "edit" && onCancel ? <button type="button" onClick={onCancel} disabled={submitting} className="h-13 rounded-full border border-border bg-surface px-6 font-bold text-brand-dark">Cancelar</button> : null}</div>
      </form>
    </div>
  );
}
