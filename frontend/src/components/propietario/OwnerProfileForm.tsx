"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Building2, Check, ChevronLeft, ChevronRight, Mail, Phone, UserRound } from "lucide-react";
import ViewportPortal from "@/components/ui/ViewportPortal";
import type { OwnerProfile, OwnerProfileCreate, OwnerType } from "@/types/owner";

const OWNER_TYPES: Array<{ value: OwnerType; label: string; description: string; icon: React.ReactNode }> = [
  { value: "INDIVIDUAL", label: "Particular", description: "Gestionas tus propias viviendas.", icon: <UserRound /> },
  { value: "COMPANY", label: "Empresa", description: "Publicas en nombre de una empresa.", icon: <Building2 /> },
  { value: "AGENCY", label: "Agencia", description: "Gestionas viviendas de terceros.", icon: <Building2 /> },
];

type OwnerStep = "owner_type" | "display_name" | "phone" | "contact_email" | "company_name" | "tax_id";
const ALL_STEPS: OwnerStep[] = ["owner_type", "display_name", "phone", "contact_email", "company_name", "tax_id"];

export type OwnerProfileFormValues = OwnerProfileCreate;

export default function OwnerProfileForm({ mode = "create", initialValues, submitting = false, serverError = "", onSubmit, onCancel }: {
  mode?: "create" | "edit";
  initialValues?: OwnerProfile | null;
  submitting?: boolean;
  serverError?: string;
  onSubmit: (values: OwnerProfileFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [createIndex, setCreateIndex] = useState(0);
  const [editStep, setEditStep] = useState<OwnerStep | null>(null);
  const [values, setValues] = useState<OwnerProfileFormValues>({
    owner_type: initialValues?.owner_type ?? "INDIVIDUAL",
    display_name: initialValues?.display_name ?? "",
    phone: initialValues?.phone ?? "",
    contact_email: initialValues?.contact_email ?? "",
    company_name: initialValues?.company_name ?? null,
    tax_id: initialValues?.tax_id ?? null,
  });
  const [validationError, setValidationError] = useState("");
  const createSteps = useMemo(() => values.owner_type === "INDIVIDUAL" ? ALL_STEPS.filter((item) => item !== "company_name") : ALL_STEPS, [values.owner_type]);
  const step = mode === "create" ? createSteps[createIndex] : editStep;

  async function saveStep(value: string) {
    if (!step) return;
    const error = validate(step, value);
    if (error) return setValidationError(error);
    setValidationError("");
    const next = { ...values, [step]: step === "owner_type" ? value as OwnerType : value.trim() || null } as OwnerProfileFormValues;
    if (step === "display_name" || step === "phone" || step === "contact_email") next[step] = value.trim();
    setValues(next);

    if (mode === "edit") {
      await onSubmit(next);
      setEditStep(null);
      return;
    }

    if (createIndex < createSteps.length - 1) {
      setCreateIndex((index) => index + 1);
      return;
    }
    await onSubmit(next);
  }

  if (step) {
    return (
      <OwnerStepScreen
        key={step}
        step={step}
        value={String(values[step] ?? "")}
        submitting={submitting}
        error={validationError || serverError}
        progress={mode === "create" ? `${createIndex + 1} de ${createSteps.length}` : undefined}
        onBack={() => {
          setValidationError("");
          if (mode === "create" && createIndex > 0) setCreateIndex((index) => index - 1);
          else if (mode === "edit") setEditStep(null);
          else onCancel?.();
        }}
        onSave={saveStep}
      />
    );
  }

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-6 pb-12 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-4xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Identidad profesional</p>
          <h1 className="mt-1 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">Editar perfil</h1>
          <p className="mt-2 text-sm leading-6 text-secondary">Mantén actualizada la información asociada a tus viviendas.</p>
        </div>
        {onCancel ? <button type="button" onClick={onCancel} className="min-h-11 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button">Listo</button> : null}
      </header>

      <section className="mt-6 overflow-hidden rounded-[26px] bg-surface p-2 shadow-soft sm:p-3">
        <OwnerRow icon={<Building2 />} onClick={() => setEditStep("owner_type")} title="Tipo de propietario" value={OWNER_TYPES.find((item) => item.value === values.owner_type)?.label ?? "Particular"} />
        <OwnerRow icon={<UserRound />} onClick={() => setEditStep("display_name")} title="Nombre visible" value={values.display_name} />
        <OwnerRow icon={<Phone />} onClick={() => setEditStep("phone")} title="Teléfono" value={values.phone} />
        <OwnerRow icon={<Mail />} onClick={() => setEditStep("contact_email")} title="Email de contacto" value={values.contact_email} />
        {values.owner_type !== "INDIVIDUAL" ? <OwnerRow icon={<Building2 />} onClick={() => setEditStep("company_name")} title="Empresa" value={values.company_name || "Sin indicar"} /> : null}
        <OwnerRow icon={<BadgeCheck />} onClick={() => setEditStep("tax_id")} title="Identificación fiscal" value={values.tax_id || "Sin indicar"} />
      </section>

      <section className="mt-4 flex items-start gap-3 rounded-[22px] bg-mint-50 p-4 sm:p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft"><Check className="h-4 w-4" /></span>
        <div><h2 className="text-sm font-bold text-brand-dark">Tú controlas la información</h2><p className="mt-1 text-xs leading-5 text-secondary">Los datos fiscales son privados. Solo tu nombre profesional y las señales de confianza podrán acompañar a tus anuncios.</p></div>
      </section>
    </div>
  );
}

function OwnerStepScreen({ step, value: initialValue, submitting, error, progress, onBack, onSave }: {
  step: OwnerStep;
  value: string;
  submitting: boolean;
  error: string;
  progress?: string;
  onBack: () => void;
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initialValue);
  const meta = STEP_META[step];
  return (
    <ViewportPortal>
      <div className="fixed inset-0 z-60 overflow-y-auto bg-surface-soft">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10">
          <header className="flex items-center justify-between gap-4"><button type="button" onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-brand-dark shadow-soft transition hover:bg-mint-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" aria-label="Volver"><ChevronLeft className="h-5 w-5" /></button>{progress ? <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-secondary shadow-soft">{progress}</span> : <span />}</header>
          {progress && <div className="mt-5 h-1 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary transition-transform duration-300" style={{ width: `${(Number(progress.split(" ")[0]) / Number(progress.split(" ")[2])) * 100}%` }} /></div>}
          <main className="flex flex-1 flex-col justify-center py-8 sm:py-12">
            <div className="rounded-[28px] bg-surface p-5 shadow-soft sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Perfil de propietario</p>
            <h1 className="mt-2 font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">{meta.title}</h1>
            <p className="mt-3 text-base leading-7 text-secondary">{meta.description}</p>
            {step === "owner_type" ? (
              <div className="mt-8 grid gap-3">
                {OWNER_TYPES.map((option) => <button key={option.value} type="button" onClick={() => setValue(option.value)} aria-pressed={value === option.value} className={`flex min-h-24 items-center gap-4 rounded-[20px] border p-4 text-left transition sm:p-5 ${value === option.value ? "border-primary/30 bg-mint-50 ring-2 ring-primary/10" : "border-border hover:bg-surface-soft"}`}><span className={`flex h-11 w-11 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5 ${value === option.value ? "bg-primary text-white" : "bg-surface-soft text-muted"}`}>{option.icon}</span><span className="flex-1"><span className="block font-bold text-brand-dark">{option.label}</span><span className="mt-1 block text-sm text-secondary">{option.description}</span></span>{value === option.value && <Check className="h-5 w-5 text-primary" />}</button>)}
              </div>
            ) : (
              <><label htmlFor={`owner-${step}`} className="sr-only">{meta.title}</label><input id={`owner-${step}`} autoFocus autoComplete={step === "contact_email" ? "email" : step === "phone" ? "tel" : step === "display_name" ? "name" : "off"} type={step === "contact_email" ? "email" : step === "phone" ? "tel" : "text"} value={value} onChange={(event) => setValue(event.target.value)} className="mt-8 h-14 w-full rounded-16 border border-border bg-surface-soft px-5 text-base font-semibold text-brand-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:h-16 sm:text-lg" /></>
            )}
            {error ? <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
            </div>
          </main>
          <footer className="sticky bottom-0 bg-surface-soft/95 py-4 backdrop-blur-xl"><button type="button" onClick={() => onSave(value)} disabled={submitting} className="flex h-14 w-full items-center justify-center gap-2 rounded-16 bg-brand-dark px-6 text-base font-bold text-white shadow-button transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Guardando…" : progress ? "Continuar" : "Guardar"}{!submitting && progress && <ChevronRight className="h-5 w-5" />}</button></footer>
        </div>
      </div>
    </ViewportPortal>
  );
}

const STEP_META: Record<OwnerStep, { title: string; description: string }> = {
  owner_type: { title: "¿Qué tipo de propietario eres?", description: "Esto nos ayuda a adaptar tu espacio de gestión." },
  display_name: { title: "¿Cómo quieres aparecer?", description: "Este es el nombre que verán las comunidades interesadas." },
  phone: { title: "¿Cuál es tu teléfono?", description: "Lo usaremos únicamente para gestionar tus viviendas." },
  contact_email: { title: "¿Qué email usas para tus pisos?", description: "Aquí recibirás la información importante." },
  company_name: { title: "¿Cómo se llama tu empresa?", description: "Indica el nombre comercial o legal." },
  tax_id: { title: "Identificación fiscal", description: "Es opcional y podrás completarla más adelante." },
};

function validate(step: OwnerStep, value: string) {
  if (step === "display_name" && value.trim().length < 2) return "Indica un nombre visible válido.";
  if (step === "phone" && value.trim().length < 6) return "Indica un teléfono válido.";
  if (step === "contact_email" && !value.trim().includes("@")) return "Indica un email válido.";
  if (step === "company_name" && value.trim().length < 2) return "Indica el nombre de la empresa.";
  return "";
}

function OwnerRow({ icon, onClick, title, value }: { icon: React.ReactNode; onClick: () => void; title: string; value: string }) {
  return <button type="button" onClick={onClick} className="flex min-h-20 w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-primary [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-brand-dark">{title}</span><span className="mt-0.5 block truncate text-xs text-secondary sm:text-sm">{value}</span></span><ChevronRight className="h-4 w-4 text-muted" /></button>;
}
