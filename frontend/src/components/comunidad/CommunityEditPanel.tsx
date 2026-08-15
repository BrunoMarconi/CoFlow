"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ViewportPortal from "@/components/ui/ViewportPortal";
import { preferenceQuestions, type PreferenceKey } from "./CommunityForm";
import { COMMUNITY_PROFILE_TYPE_OPTIONS } from "@/lib/communityProfileType";
import type { Community, CommunityCreate, CommunityCoverColor } from "@/types/community";

type EditStep =
  | "name" | "description" | "city" | "province" | "neighborhood" | "max_members"
  | "join_type" | "profile_type" | "profile_description" | "monthly_rent" | "deposit"
  | "move_in_date" | "room_description" | "urgency" | "cover_color" | PreferenceKey;

const PREFERENCE_KEYS = preferenceQuestions.map((question) => question.key);
const STEPS: EditStep[] = [
  "name", "description", "city", "province", "neighborhood", "max_members", "join_type",
  "profile_type", "profile_description", "monthly_rent", "deposit", "move_in_date",
  "room_description", "urgency", "cover_color", ...PREFERENCE_KEYS,
];

export default function CommunityEditPanel({
  community,
  values,
  submitting,
  serverError,
  onSubmit,
}: {
  community: Community;
  values: CommunityCreate;
  submitting: boolean;
  serverError: string;
  onSubmit: (values: CommunityCreate) => Promise<void>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("step");
  const step = STEPS.includes(requested as EditStep) ? requested as EditStep : null;
  const base = `/comunidades/${community.id}/editar`;

  async function save(stepToSave: EditStep, value: string) {
    const next: CommunityCreate = {
      ...values,
      preferences: { ...values.preferences },
    };

    if (PREFERENCE_KEYS.includes(stepToSave as PreferenceKey)) {
      next.preferences[stepToSave as PreferenceKey] = value;
    } else if (stepToSave === "max_members") {
      next.max_members = Number(value);
      next.open_spots = Math.max(Number(value) - community.member_count, 0);
    } else if (stepToSave === "monthly_rent" || stepToSave === "deposit") {
      next[stepToSave] = value.trim() ? Number(value) : null;
    } else if (stepToSave === "province" || stepToSave === "neighborhood" || stepToSave === "profile_description" || stepToSave === "move_in_date" || stepToSave === "room_description") {
      next[stepToSave] = value.trim() || null;
    } else if (stepToSave === "join_type") {
      next.join_type = value as CommunityCreate["join_type"];
    } else if (stepToSave === "profile_type") {
      next.profile_type = value as CommunityCreate["profile_type"];
    } else if (stepToSave === "urgency") {
      next.urgency = value as CommunityCreate["urgency"];
    } else if (stepToSave === "cover_color") {
      next.cover_color = value as CommunityCoverColor;
    } else if (stepToSave === "name" || stepToSave === "description" || stepToSave === "city") {
      next[stepToSave] = value.trim();
    }

    await onSubmit(next);
    router.replace(base, { scroll: false });
  }

  if (step) {
    return (
      <CommunityEditStep
        step={step}
        values={values}
        submitting={submitting}
        error={serverError}
        onBack={() => router.replace(base, { scroll: false })}
        onSave={(value) => save(step, value)}
      />
    );
  }

  const preferenceByKey = new Map(preferenceQuestions.map((question) => [question.key, question]));

  return (
    <div className="space-y-7">
      <EditGroup title="Información principal">
        <EditRow href={`${base}?step=name`} title="Nombre" value={values.name} />
        <EditRow href={`${base}?step=description`} title="Descripción" value={values.description} />
        <EditRow href={`${base}?step=profile_type`} title="Tipo de comunidad" value={COMMUNITY_PROFILE_TYPE_OPTIONS.find((option) => option.value === values.profile_type)?.label ?? "Comunidad"} />
        <EditRow href={`${base}?step=profile_description`} title="Algo importante para vosotros" value={values.profile_description || "Sin indicar"} />
      </EditGroup>

      <EditGroup title="Ubicación y capacidad">
        <EditRow href={`${base}?step=city`} title="Ciudad" value={values.city} />
        <EditRow href={`${base}?step=province`} title="Provincia" value={values.province || "Sin indicar"} />
        <EditRow href={`${base}?step=neighborhood`} title="Barrio" value={values.neighborhood || "Sin indicar"} />
        <EditRow href={`${base}?step=max_members`} title="Tamaño de la comunidad" value={`${values.max_members} personas`} />
      </EditGroup>

      <EditGroup title="Vivienda y acceso">
        <EditRow href={`${base}?step=monthly_rent`} title="Alquiler por persona" value={values.monthly_rent === null ? "Sin indicar" : `${values.monthly_rent} € / mes`} />
        <EditRow href={`${base}?step=deposit`} title="Fianza" value={values.deposit === null ? "Sin indicar" : `${values.deposit} €`} />
        <EditRow href={`${base}?step=move_in_date`} title="Fecha de entrada" value={values.move_in_date || "Sin indicar"} />
        <EditRow href={`${base}?step=room_description`} title="Habitación" value={values.room_description || "Sin indicar"} />
        <EditRow href={`${base}?step=join_type`} title="Cómo puede unirse alguien" value={values.join_type === "OPEN" ? "Entrada abierta" : "Mediante solicitud"} />
        <EditRow href={`${base}?step=urgency`} title="Urgencia" value={values.urgency === "URGENT" ? "Urgente" : values.urgency === "SOON" ? "Pronto" : "Sin prisa"} />
        <EditRow href={`${base}?step=cover_color`} title="Color de portada" value="Personalizar" />
      </EditGroup>

      <EditGroup title="Cómo queréis convivir">
        {PREFERENCE_KEYS.map((key) => (
          <EditRow key={key} href={`${base}?step=${key}`} title={preferenceByKey.get(key)?.title.replace(/^¿|\?$/g, "") ?? key} value={values.preferences[key]} />
        ))}
      </EditGroup>
    </div>
  );
}

function CommunityEditStep({ step, values, submitting, error, onBack, onSave }: {
  step: EditStep;
  values: CommunityCreate;
  submitting: boolean;
  error: string;
  onBack: () => void;
  onSave: (value: string) => Promise<void>;
}) {
  const meta = getStepMeta(step, values);
  const [value, setValue] = useState(meta.value);
  const [localError, setLocalError] = useState("");

  async function submit() {
    const validation = validateStep(step, value);
    if (validation) {
      setLocalError(validation);
      return;
    }
    setLocalError("");
    await onSave(value);
  }

  return (
    <ViewportPortal>
    <div className="fixed inset-0 z-60 overflow-y-auto bg-surface">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-10">
        <header className="flex items-center gap-4">
          <button type="button" onClick={onBack} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition hover:bg-surface-soft"><ChevronLeft className="h-6 w-6" /></button>
          <span className="text-sm font-semibold text-secondary">Editar comunidad</span>
        </header>

        <main className="flex flex-1 flex-col justify-center py-10">
          <p className="text-sm font-semibold text-primary-dark">Un dato cada vez</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-brand-dark sm:text-4xl">{meta.title}</h1>
          {meta.description && <p className="mt-3 text-base leading-7 text-secondary">{meta.description}</p>}

          {meta.options ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {meta.options.map((option) => {
                const selected = value === option.value;
                return <button key={option.value} type="button" onClick={() => setValue(option.value)} className={`min-h-20 rounded-18 border p-5 text-left text-base font-semibold transition ${selected ? "border-primary bg-primary/6 ring-1 ring-primary text-brand-dark" : "border-border bg-surface text-foreground hover:border-primary/40"}`}>{option.label}</button>;
              })}
            </div>
          ) : meta.multiline ? (
            <textarea autoFocus value={value} onChange={(event) => setValue(event.target.value)} rows={7} maxLength={meta.maxLength} className="mt-8 w-full resize-none rounded-18 border border-border bg-surface px-5 py-4 text-lg leading-7 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
          ) : (
            <input autoFocus type={meta.type ?? "text"} value={value} onChange={(event) => setValue(event.target.value)} min={meta.min} max={meta.max} className="mt-8 h-16 w-full rounded-full border border-border bg-surface px-6 text-lg font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
          )}

          {(localError || error) && <p className="mt-4 text-sm font-semibold text-red-600">{localError || error}</p>}
        </main>

        <footer className="sticky bottom-0 border-t border-border bg-surface py-4">
          <button type="button" onClick={submit} disabled={submitting} className="h-14 w-full rounded-14 bg-primary text-base font-semibold text-white shadow-button transition hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50">{submitting ? "Guardando…" : "Guardar"}</button>
        </footer>
      </div>
    </div>
    </ViewportPortal>
  );
}

function getStepMeta(step: EditStep, values: CommunityCreate) {
  const preference = preferenceQuestions.find((question) => question.key === step);
  if (preference) return { title: preference.title, description: "Elige la opción que mejor os representa.", value: values.preferences[preference.key], options: preference.options.map((option) => ({ value: option, label: option })) };
  const current = values[step as keyof CommunityCreate];
  const base = { value: current === null || current === undefined ? "" : String(current) };
  const metas: Record<Exclude<EditStep, PreferenceKey>, object> = {
    name: { title: "¿Cómo se llama vuestra comunidad?" },
    description: { title: "Describe vuestra comunidad", multiline: true, maxLength: 2000 },
    city: { title: "¿En qué ciudad estáis?" },
    province: { title: "¿En qué provincia?" },
    neighborhood: { title: "¿En qué barrio?" },
    max_members: { title: "¿Cuántas personas queréis ser?", type: "number", min: 2, max: 12 },
    join_type: { title: "¿Cómo puede unirse alguien?", options: [{ value: "REQUEST", label: "Mediante solicitud" }, { value: "OPEN", label: "Entrada abierta" }] },
    profile_type: { title: "¿Qué tipo de comunidad sois?", options: COMMUNITY_PROFILE_TYPE_OPTIONS },
    profile_description: { title: "¿Qué es importante para vosotros?", multiline: true, maxLength: 500 },
    monthly_rent: { title: "¿Cuál es el alquiler por persona?", type: "number", min: 0 },
    deposit: { title: "¿Cuál es la fianza?", type: "number", min: 0 },
    move_in_date: { title: "¿Cuándo se puede entrar?", type: "date" },
    room_description: { title: "Describe la habitación", multiline: true, maxLength: 1000 },
    urgency: { title: "¿Cuándo queréis completar la comunidad?", options: [{ value: "NORMAL", label: "Sin prisa" }, { value: "SOON", label: "Pronto" }, { value: "URGENT", label: "Urgente" }] },
    cover_color: { title: "Elige un color de portada", options: [{ value: "sage", label: "Verde salvia" }, { value: "cream", label: "Crema" }, { value: "stone", label: "Piedra" }, { value: "sand", label: "Arena" }, { value: "smoke", label: "Azul humo" }, { value: "forest", label: "Verde bosque" }] },
  };
  return { ...base, ...metas[step as Exclude<EditStep, PreferenceKey>] } as { title: string; description?: string; value: string; options?: Array<{ value: string; label: string }>; multiline?: boolean; maxLength?: number; type?: string; min?: number; max?: number };
}

function validateStep(step: EditStep, value: string) {
  if (step === "name" && value.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (step === "description" && value.trim().length < 20) return "La descripción debe tener al menos 20 caracteres.";
  if (step === "city" && !value.trim()) return "Indica una ciudad.";
  if (step === "max_members" && (Number(value) < 2 || Number(value) > 12)) return "Elige entre 2 y 12 personas.";
  return "";
}

function EditGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="mb-3 text-lg font-semibold text-brand-dark">{title}</h2><div className="overflow-hidden rounded-18 border border-border bg-surface shadow-soft">{children}</div></section>;
}

function EditRow({ href, title, value }: { href: string; title: string; value: string }) {
  return <Link href={href} scroll={false} className="flex min-h-20 items-center gap-4 border-b border-border px-5 py-4 transition last:border-b-0 hover:bg-surface-soft"><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{title}</span><span className="mt-1 block truncate text-sm text-secondary">{value}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-muted" /></Link>;
}
