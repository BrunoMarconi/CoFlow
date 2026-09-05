"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Banknote, ChevronRight, Clock3, Home, PawPrint, Sparkles, SprayCan, Users, Wind } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getMyOnboarding, saveOnboarding } from "@/services/onboarding";
import { updateProfile } from "@/services/users";
import Spinner from "@/components/ui/Spinner";
import BottomSheet from "@/components/ui/BottomSheet";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { OnboardingAnswers } from "@/types/onboarding";

type PreferenceKey = keyof OnboardingAnswers;
type Field = { key: PreferenceKey; title: string; description: string; options: string[]; icon: (props: { className?: string }) => ReactNode };

const preferenceFields: Field[] = [
  { key: "noise", title: "Ambiente en casa", description: "El nivel de actividad que te resulta cómodo.", options: ["Muy tranquilo y silencioso", "Tranquilo, con algunos momentos sociales", "Social y con bastante actividad", "Muy animado y abierto"], icon: Wind },
  { key: "cleanliness", title: "Limpieza", description: "Cómo esperas cuidar las zonas comunes.", options: ["Muy relajado", "Limpieza básica semanal", "Limpieza frecuente y organizada", "Nivel de limpieza muy alto"], icon: SprayCan },
  { key: "smoking", title: "Tabaco", description: "Tu postura sobre fumar dentro o fuera de casa.", options: ["No quiero convivir con fumadores", "Está bien si se fuma únicamente fuera", "Me da igual", "Yo fumo"], icon: Wind },
  { key: "pets", title: "Mascotas", description: "Cómo te sentirías viviendo con animales.", options: ["Prefiero vivir sin mascotas", "Depende del animal", "Me encantan las mascotas", "Tengo mascota"], icon: PawPrint },
  { key: "visits", title: "Visitas", description: "Cómo prefieres organizar las visitas.", options: ["Siempre deberían avisar", "Prefiero que avisen con tiempo", "No me importa alguna visita espontánea", "Me encantan las visitas espontáneas"], icon: Users },
  { key: "wake_up", title: "Horarios", description: "La hora a la que normalmente empieza tu día.", options: ["Antes de las 7:00", "Entre las 7:00 y las 9:00", "Entre las 9:00 y las 11:00", "Después de las 11:00"], icon: Clock3 },
  { key: "space", title: "Espacio personal", description: "Cuánta vida en común quieres hacer en casa.", options: ["Necesito mucho tiempo a solas", "Necesito bastante espacio personal", "Busco un equilibrio", "Me encanta hacer vida en común"], icon: Home },
  { key: "lifestyle", title: "Convivencia ideal", description: "La relación que buscas con tus compañeros.", options: ["Compartir gastos y mantener independencia", "Tener una relación cordial", "Hacer algunos planes juntos", "Crear una amistad y una comunidad"], icon: Sparkles },
];

export default function HousingPreferencesPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [budgetOverride, setBudgetOverride] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    getMyOnboarding()
      .then((profile) => {
        const metadataKeys = new Set(["id", "user_id", "created_at", "updated_at"]);
        setAnswers(Object.fromEntries(Object.entries(profile).filter(([key]) => !metadataKeys.has(key))) as unknown as OnboardingAnswers);
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoadingPreferences(false));
  }, [user?.id]);

  const budget = budgetOverride ?? (user?.rental_budget == null ? "" : String(user.rental_budget));

  if (loading || loadingPreferences || !user) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;

  async function handleSave() {
    if (!answers || !user || saving) return;
    const parsedBudget = budget.trim() ? Number(budget) : null;
    if (parsedBudget !== null && (!Number.isFinite(parsedBudget) || parsedBudget < 0 || parsedBudget > 20000)) {
      toast.error("Introduce un presupuesto válido entre 0 y 20.000 €");
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        saveOnboarding(answers),
        updateProfile({ first_name: user.first_name, last_name: user.last_name, phone: user.phone, rental_budget: parsedBudget, is_looking_for_roommates: user.is_looking_for_roommates, age: user.age, occupation: user.occupation, bio: user.bio }),
      ]);
      await refresh();
      toast.success("Preferencias guardadas");
      router.push("/ajustes");
    } catch { toast.error("No pudimos guardar los cambios"); }
    finally { setSaving(false); }
  }

  function select(key: PreferenceKey, value: string) {
    setAnswers((current) => current ? { ...current, [key]: value } : current);
    setActiveField(null);
  }

  return (
    <div className="mx-auto max-w-3xl pb-24 sm:pb-10">
      <header className="flex items-start gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 shrink-0 items-center justify-start text-brand-dark"><ArrowLeftIcon /></button>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Tu búsqueda</p><h1 className="font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">Preferencias de vivienda</h1><p className="mt-2 max-w-lg text-sm leading-6 text-secondary">Ajusta lo que buscas para mejorar tus recomendaciones y comparaciones de convivencia.</p></div>
      </header>

      {loadFailed || !answers ? (
        <section className="mt-7 rounded-[22px] border border-black/[0.06] bg-[#fbfcfa] p-6 text-center"><p className="text-base font-bold text-brand-dark">Completa primero tu perfil de convivencia</p><p className="mt-2 text-sm leading-6 text-muted">Necesitamos tus respuestas iniciales antes de poder editar estas preferencias.</p><button type="button" onClick={() => router.push("/onboarding")} className="mt-5 h-12 rounded-full bg-primary px-6 text-sm font-bold text-white">Completar cuestionario</button></section>
      ) : <>
        <section className="mt-7 rounded-[22px] border border-black/[0.06] bg-[#fbfcfa] p-4 shadow-[0_10px_30px_rgba(20,42,32,.04)] sm:p-5">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e8eeea] text-primary-dark"><Banknote className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-brand-dark">Presupuesto mensual máximo</h2><p className="mt-0.5 text-xs text-secondary">Tu parte aproximada del alquiler.</p></div></div>
          <div className="mt-4 grid grid-cols-4 gap-2">{[400, 600, 800, 1000].map((amount) => <button key={amount} type="button" onClick={() => setBudgetOverride(String(amount))} className={cn("h-10 rounded-full border text-xs font-bold transition", budget === String(amount) ? "border-brand-dark bg-brand-dark text-white" : "border-black/[0.07] bg-white text-secondary")}>{amount} €</button>)}</div>
          <label className="mt-3 flex h-12 items-center rounded-[14px] border border-black/[0.07] bg-white px-4 focus-within:border-primary/40 focus-within:ring-3 focus-within:ring-primary/8"><span className="text-sm font-bold text-primary-dark">€</span><input aria-label="Presupuesto mensual" type="number" inputMode="numeric" min={0} max={20000} value={budget} onChange={(event) => setBudgetOverride(event.target.value)} placeholder="Otra cantidad" className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none" /><span className="text-xs text-muted">al mes</span></label>
        </section>

        <section className="mt-5"><div className="mb-2 flex items-end justify-between gap-3 px-1"><div><h2 className="font-rounded text-xl font-semibold tracking-[-0.02em] text-brand-dark">Convivencia</h2><p className="mt-1 text-xs text-secondary">Toca una preferencia para cambiarla.</p></div><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{preferenceFields.length} preferencias</span></div>
          <div className="divide-y divide-black/[0.055] overflow-hidden rounded-[22px] border border-black/[0.06] bg-[#fbfcfa] shadow-[0_10px_30px_rgba(20,42,32,.04)]">{preferenceFields.map((field) => { const Icon = field.icon; return <button key={field.key} type="button" onClick={() => setActiveField(field)} className="flex min-h-18 w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f4f7f4] sm:px-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#e8eeea] text-primary-dark"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-brand-dark">{field.title}</span><span className="mt-0.5 block truncate text-xs text-secondary">{String(answers[field.key] || "Sin definir")}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted" /></button>; })}</div>
        </section>

        <div className="fixed inset-x-0 bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom))] z-30 border-t border-black/[0.06] bg-white/95 p-3 backdrop-blur-xl sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0"><button type="button" onClick={handleSave} disabled={saving} className="mx-auto flex h-13 w-full max-w-3xl items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white shadow-[0_8px_22px_rgba(20,55,41,.16)] disabled:opacity-60">{saving ? "Guardando cambios…" : "Guardar preferencias"}</button></div>

        <AnimatePresence>{activeField && <BottomSheet onClose={() => setActiveField(null)} ariaLabel={`Editar ${activeField.title}`} className="sm:max-w-md"><div className="overflow-y-auto p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Preferencia</p><h2 className="mt-1 font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">{activeField.title}</h2><p className="mt-1 text-sm leading-6 text-secondary">{activeField.description}</p></div><button type="button" onClick={() => setActiveField(null)} aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1ee] text-brand-dark">×</button></div><div className="mt-5 grid gap-2">{activeField.options.map((option) => { const selected = answers[activeField.key] === option; return <button key={option} type="button" onClick={() => select(activeField.key, option)} aria-pressed={selected} className={cn("flex min-h-14 items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-left text-sm font-semibold transition", selected ? "border-primary/35 bg-[#edf5f0] text-primary-dark ring-1 ring-primary/15" : "border-black/[0.07] bg-white text-secondary hover:bg-[#f5f7f4]")}><span>{option}</span><span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-white" : "border-black/20")}>{selected ? <CheckIcon /> : null}</span></button>; })}</div></div></BottomSheet>}</AnimatePresence>
      </>}
    </div>
  );
}

function ArrowLeftIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg>; }
