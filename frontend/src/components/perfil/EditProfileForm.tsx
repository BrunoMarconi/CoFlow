"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { User } from "@/types/auth";
import type { UpdateProfileRequest } from "@/types/user";

type ProfileStep = "bio" | "name" | "age" | "phone" | "occupation" | "interests" | "looking" | "budget";
const STEPS: ProfileStep[] = ["bio", "name", "age", "phone", "occupation", "interests", "looking", "budget"];
const INTEREST_OPTIONS = ["Leer", "Entrenar", "Cocinar", "Viajar", "Música", "Cine", "Estudiar", "Videojuegos", "Naturaleza", "Fotografía", "Arte", "Deporte"];

export default function EditProfileForm({ user, onSubmit }: { user: User; onSubmit: (data: UpdateProfileRequest) => Promise<void> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("step");
  const step = STEPS.includes(requested as ProfileStep) ? requested as ProfileStep : null;
  const [loading, setLoading] = useState(false);
  const base = "/perfil/editar";

  async function save(patch: Partial<UpdateProfileRequest>) {
    setLoading(true);
    try {
      await onSubmit({
        first_name: patch.first_name ?? user.first_name,
        last_name: patch.last_name ?? user.last_name,
        phone: patch.phone !== undefined ? patch.phone : user.phone,
        rental_budget: patch.rental_budget !== undefined ? patch.rental_budget : user.rental_budget,
        is_looking_for_roommates: patch.is_looking_for_roommates ?? user.is_looking_for_roommates,
        age: patch.age !== undefined ? patch.age : user.age,
        occupation: patch.occupation !== undefined ? patch.occupation : user.occupation,
        bio: patch.bio !== undefined ? patch.bio : user.bio,
        interests: patch.interests !== undefined ? patch.interests : user.interests,
      });
      router.replace(base, { scroll: false });
    } finally { setLoading(false); }
  }

  if (step) return <ProfileStepScreen step={step} user={user} loading={loading} onBack={() => router.replace(base, { scroll: false })} onSave={save} />;

  return <div className="space-y-6">
    <ProfileGroup title="Tu presentación">
      <NavigationRow href="/perfil/fotos" icon={<PhotosIcon />} title="Fotos" subtitle={`${user.photos.length} ${user.photos.length === 1 ? "foto añadida" : "fotos añadidas"}`} />
      <NavigationRow href={`${base}?step=bio`} icon={<BioIcon />} title="Bio" subtitle={user.bio || "Cuéntales algo sobre ti"} />
    </ProfileGroup>
    <ProfileGroup title="Información personal">
      <NavigationRow href={`${base}?step=name`} icon={<UserIcon />} title="Nombre" subtitle={`${user.first_name} ${user.last_name}`.trim()} />
      <NavigationRow href={`${base}?step=age`} icon={<UserIcon />} title="Edad" subtitle={user.age === null ? "Sin indicar" : `${user.age} años`} />
      <NavigationRow href={`${base}?step=phone`} icon={<PhoneIcon />} title="Teléfono" subtitle={user.phone || "Sin indicar"} />
      <NavigationRow href={`${base}?step=occupation`} icon={<BriefcaseIcon />} title="Ocupación" subtitle={user.occupation || "Sin indicar"} />
      <NavigationRow href={`${base}?step=interests`} icon={<SparklesIcon />} title="Gustos e intereses" subtitle={user.interests.length ? user.interests.join(" · ") : "Elige lo que te representa"} />
    </ProfileGroup>
    <ProfileGroup title="Convivencia">
      <NavigationRow href="/perfil/habitos" icon={<LeafIcon />} title="Hábitos y estilo de vida" subtitle="Limpieza, convivencia y normas" />
      <NavigationRow href={`${base}?step=looking`} icon={<PeopleIcon />} title="Búsqueda de compañeros" subtitle={user.is_looking_for_roommates ? "Buscando compañeros" : "No busca compañeros"} />
    </ProfileGroup>
    <ProfileGroup title="Preferencias">
      <NavigationRow href={`${base}?step=budget`} icon={<BudgetIcon />} title="Presupuesto" subtitle={user.rental_budget === null ? "Sin indicar" : `${user.rental_budget.toLocaleString("es-ES")} € / mes`} />
      <NavigationRow href="/perfil/preferencias" icon={<HomeIcon />} title="Preferencias de vivienda" subtitle="Ciudad, vivienda y convivencia" />
    </ProfileGroup>
  </div>;
}

function ProfileStepScreen({ step, user, loading, onBack, onSave }: { step: ProfileStep; user: User; loading: boolean; onBack: () => void; onSave: (patch: Partial<UpdateProfileRequest>) => Promise<void> }) {
  const initial = profileInitial(step, user);
  const [value, setValue] = useState(initial.value);
  const [secondary, setSecondary] = useState(initial.secondary);
  const meta = PROFILE_META[step];
  async function submit() {
    if (step === "name") return onSave({ first_name: value.trim(), last_name: secondary.trim() });
    if (step === "bio") return onSave({ bio: value.trim() || null });
    if (step === "age") return onSave({ age: value.trim() ? Number(value) : null });
    if (step === "phone") return onSave({ phone: value.trim() || null });
    if (step === "occupation") return onSave({ occupation: value.trim() || null });
    if (step === "interests") return onSave({ interests: value ? value.split("|").filter(Boolean) : [] });
    if (step === "budget") return onSave({ rental_budget: value.trim() ? Number(value) : null });
    return onSave({ is_looking_for_roommates: value === "yes" });
  }
  return <div className="fixed inset-0 z-60 flex flex-col bg-white px-6 pb-[calc(1.25rem+var(--safe-bottom))] pt-[calc(1.25rem+var(--safe-top))] sm:absolute sm:inset-x-0 sm:top-0 sm:min-h-[42rem] sm:rounded-[2rem] sm:border sm:border-[#dddddd] sm:p-8">
    <header className="flex items-center gap-4"><button type="button" onClick={onBack} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd]"><ChevronLeft className="h-6 w-6" /></button><span className="text-sm text-[#717171]">Editar perfil</span></header>
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8"><h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#191919] sm:text-5xl">{meta.title}</h1><p className="mt-3 text-base leading-7 text-[#717171]">{meta.subtitle}</p><div className="mt-10">{step === "looking" ? <div className="grid gap-3">{[["yes", "Sí, estoy buscando"], ["no", "Ahora mismo no"]].map(([key, label]) => <button key={key} type="button" onClick={() => setValue(key)} className={`flex min-h-20 items-center justify-between rounded-[1.25rem] border px-5 text-left font-semibold ${value === key ? "border-black ring-1 ring-black" : "border-[#dddddd]"}`}>{label}<span className={`h-5 w-5 rounded-full border ${value === key ? "border-[6px] border-black" : "border-[#b0b0b0]"}`} /></button>)}</div> : step === "interests" ? <InterestPicker value={value} onChange={setValue} /> : step === "bio" ? <textarea autoFocus value={value} onChange={(event) => setValue(event.target.value)} rows={6} maxLength={160} placeholder={meta.placeholder} className="w-full resize-none border-0 border-b-2 border-black bg-transparent px-0 py-4 text-xl leading-8 outline-none placeholder:text-[#b0b0b0]" /> : step === "name" ? <div className="grid gap-7 sm:grid-cols-2"><AirInput label="Nombre" value={value} onChange={setValue} placeholder="Nombre" /><AirInput label="Apellidos" value={secondary} onChange={setSecondary} placeholder="Apellidos" /></div> : <AirInput value={value} onChange={setValue} placeholder={meta.placeholder} type={meta.numeric ? "number" : "text"} suffix={meta.suffix} />}</div></main>
    <div className="mx-auto w-full max-w-xl"><button type="button" onClick={submit} disabled={loading} className="h-14 w-full rounded-full bg-black text-base font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] disabled:opacity-50">{loading ? "Guardando…" : "Guardar"}</button></div>
  </div>;
}

function AirInput({ label, value, onChange, placeholder, type = "text", suffix }: { label?: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; suffix?: string }) { return <label><span className="mb-2 block text-sm font-semibold">{label}</span><span className="flex items-baseline border-b-2 border-black py-3"><input autoFocus={!label || label === "Nombre"} type={type} inputMode={type === "number" ? "numeric" : "text"} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-2xl font-semibold outline-none placeholder:text-[#b0b0b0]" />{suffix ? <span className="ml-3 text-lg font-semibold text-[#717171]">{suffix}</span> : null}</span></label>; }
function ProfileGroup({ title, children }: { title: string; children: ReactNode }) { return <section><h2 className="mb-3 px-1 text-base font-semibold text-[#191919]">{title}</h2><div className="divide-y divide-[#e7e7e7] overflow-hidden rounded-[1.5rem] border border-[#dddddd] bg-white">{children}</div></section>; }
function NavigationRow({ href, icon, title, subtitle }: { href: string; icon: ReactNode; title: string; subtitle: string }) { return <Link href={href} transitionTypes={["nav-forward"]} scroll={false} className="flex min-h-20 items-center gap-4 px-5 py-4 transition hover:bg-[#f7f7f7]"><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#191919]">{title}</span><span className="mt-1 block truncate text-xs text-[#717171]">{subtitle}</span></span><ChevronRight className="h-5 w-5 text-[#717171]" /></Link>; }
function InterestPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) { const selected = value ? value.split("|").filter(Boolean) : []; return <div className="flex flex-wrap gap-2.5">{INTEREST_OPTIONS.map((interest) => { const active = selected.includes(interest); return <button key={interest} type="button" onClick={() => onChange((active ? selected.filter((item) => item !== interest) : [...selected, interest]).slice(0, 12).join("|"))} className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${active ? "border-black bg-black text-white" : "border-[#dddddd] bg-white text-[#191919] hover:border-[#b0b0b0]"}`}>{interest}</button>; })}</div>; }
function BaseIcon({ children }: { children: ReactNode }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">{children}</svg>; }
function PhotosIcon() { return <BaseIcon><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></BaseIcon>; } function BioIcon() { return <BaseIcon><circle cx="9" cy="7" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 8h5M16 12h4M16 16h3" /></BaseIcon>; } function UserIcon() { return <BaseIcon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></BaseIcon>; } function PhoneIcon() { return <BaseIcon><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z" /></BaseIcon>; } function BriefcaseIcon() { return <BaseIcon><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></BaseIcon>; } function LeafIcon() { return <BaseIcon><path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-7 10-16Z" /><path d="M4 21c3-6 7-9 12-12" /></BaseIcon>; } function PeopleIcon() { return <BaseIcon><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" /></BaseIcon>; } function BudgetIcon() { return <BaseIcon><path d="M18 7a6 6 0 1 0 0 10M4 10h10M4 14h9" /></BaseIcon>; } function HomeIcon() { return <BaseIcon><path d="m3 11 9-8 9 8M5 10v11h14V10" /></BaseIcon>; }
function SparklesIcon() { return <BaseIcon><path d="m12 3 1.5 5.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5Z" /></BaseIcon>; }
function profileInitial(step: ProfileStep, user: User) { if (step === "name") return { value: user.first_name, secondary: user.last_name }; if (step === "bio") return { value: user.bio ?? "", secondary: "" }; if (step === "age") return { value: user.age === null ? "" : String(user.age), secondary: "" }; if (step === "phone") return { value: user.phone ?? "", secondary: "" }; if (step === "occupation") return { value: user.occupation ?? "", secondary: "" }; if (step === "interests") return { value: user.interests.join("|"), secondary: "" }; if (step === "budget") return { value: user.rental_budget === null ? "" : String(user.rental_budget), secondary: "" }; return { value: user.is_looking_for_roommates ? "yes" : "no", secondary: "" }; }
const PROFILE_META: Record<ProfileStep, { title: string; subtitle: string; placeholder: string; numeric?: boolean; suffix?: string }> = { bio: { title: "Cuéntales quién eres", subtitle: "Una presentación breve y natural ayuda a encontrar personas afines.", placeholder: "Soy una persona tranquila y ordenada…" }, name: { title: "¿Cómo te llamas?", subtitle: "Este será el nombre que verán otras personas.", placeholder: "" }, age: { title: "¿Qué edad tienes?", subtitle: "Mostramos tu edad, nunca tu fecha de nacimiento.", placeholder: "Edad", numeric: true }, phone: { title: "Tu teléfono", subtitle: "Solo lo usaremos para proteger tu cuenta.", placeholder: "Número de teléfono" }, occupation: { title: "¿A qué te dedicas?", subtitle: "Puede ser tu trabajo, estudios o actividad principal.", placeholder: "Ej. Programador" }, interests: { title: "¿Qué te gusta?", subtitle: "Elige hasta 12 intereses. Ayudan a romper el hielo y encontrar personas afines.", placeholder: "" }, looking: { title: "¿Buscas compañeros?", subtitle: "Puedes cambiar esta opción cuando quieras.", placeholder: "" }, budget: { title: "¿Cuál es tu presupuesto?", subtitle: "Indica el máximo mensual que quieres pagar.", placeholder: "0", numeric: true, suffix: "€ / mes" } };
