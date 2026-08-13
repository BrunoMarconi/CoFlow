"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const base = "/propietarios/perfil";
  const requested = searchParams.get("step") as OwnerStep | null;
  const requestedStep = requested && ALL_STEPS.includes(requested) ? requested : null;
  const [createIndex, setCreateIndex] = useState(0);
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
  const step = mode === "create" ? createSteps[createIndex] : requestedStep;

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
      router.replace(base, { scroll: false });
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
          else if (mode === "edit") router.replace(base, { scroll: false });
          else onCancel?.();
        }}
        onSave={saveStep}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#717171]">Espacio propietario</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-[#191919]">Editar perfil</h1>
        </div>
        {onCancel ? <button type="button" onClick={onCancel} className="text-sm font-semibold underline underline-offset-4">Listo</button> : null}
      </header>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#dddddd] bg-white">
        <OwnerRow href={`${base}?step=owner_type`} title="Tipo de propietario" value={OWNER_TYPES.find((item) => item.value === values.owner_type)?.label ?? "Particular"} />
        <OwnerRow href={`${base}?step=display_name`} title="Nombre visible" value={values.display_name} />
        <OwnerRow href={`${base}?step=phone`} title="Teléfono" value={values.phone} />
        <OwnerRow href={`${base}?step=contact_email`} title="Email de contacto" value={values.contact_email} />
        {values.owner_type !== "INDIVIDUAL" ? <OwnerRow href={`${base}?step=company_name`} title="Empresa" value={values.company_name || "Sin indicar"} /> : null}
        <OwnerRow href={`${base}?step=tax_id`} title="Identificación fiscal" value={values.tax_id || "Sin indicar"} />
      </div>
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
    <div className="fixed inset-0 z-60 overflow-y-auto bg-white">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-10">
        <header className="flex items-center justify-between gap-4"><button type="button" onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd]" aria-label="Volver"><ChevronLeft className="h-6 w-6" /></button>{progress ? <span className="text-sm font-semibold text-[#717171]">{progress}</span> : <span />}</header>
        <main className="flex flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-[#191919] sm:text-4xl">{meta.title}</h1>
          <p className="mt-3 text-base leading-7 text-[#717171]">{meta.description}</p>
          {step === "owner_type" ? (
            <div className="mt-8 grid gap-3">
              {OWNER_TYPES.map((option) => <button key={option.value} type="button" onClick={() => setValue(option.value)} className={`flex min-h-24 items-center gap-4 rounded-2xl border p-5 text-left ${value === option.value ? "border-black bg-[#f7f7f7] ring-1 ring-black" : "border-[#dddddd]"}`}><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f7f7] [&>svg]:h-6 [&>svg]:w-6">{option.icon}</span><span className="flex-1"><span className="block font-semibold text-[#191919]">{option.label}</span><span className="mt-1 block text-sm text-[#717171]">{option.description}</span></span></button>)}
            </div>
          ) : (
            <input autoFocus type={step === "contact_email" ? "email" : step === "phone" ? "tel" : "text"} value={value} onChange={(event) => setValue(event.target.value)} className="mt-8 h-16 w-full rounded-full border border-[#b0b0b0] px-6 text-lg font-medium outline-none transition focus:border-black focus:ring-2 focus:ring-black/10" />
          )}
          {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
        </main>
        <footer className="sticky bottom-0 border-t border-[#ebebeb] bg-white py-4"><button type="button" onClick={() => onSave(value)} disabled={submitting} className="h-14 w-full rounded-xl bg-black text-base font-semibold text-white disabled:opacity-50">{submitting ? "Guardando…" : progress ? "Continuar" : "Guardar"}</button></footer>
      </div>
    </div>
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

function OwnerRow({ href, title, value }: { href: string; title: string; value: string }) {
  const router = useRouter();
  return <button type="button" onClick={() => router.push(href, { scroll: false })} className="flex min-h-20 w-full items-center gap-4 border-b border-[#ebebeb] px-5 py-4 text-left last:border-b-0 hover:bg-[#f7f7f7]"><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#191919]">{title}</span><span className="mt-1 block truncate text-sm text-[#717171]">{value}</span></span><ChevronRight className="h-5 w-5 text-[#717171]" /></button>;
}
