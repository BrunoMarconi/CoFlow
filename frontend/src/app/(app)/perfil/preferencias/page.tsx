"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getMyOnboarding, saveOnboarding } from "@/services/onboarding";
import { updateProfile } from "@/services/users";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { OnboardingAnswers } from "@/types/onboarding";

type PreferenceKey = keyof OnboardingAnswers;

const preferenceFields: Array<{ key: PreferenceKey; title: string; description: string; options: string[] }> = [
  { key: "noise", title: "Ambiente en casa", description: "Elige el ambiente que mejor se adapta a ti.", options: ["Muy tranquilo y silencioso", "Tranquilo, con algunos momentos sociales", "Social y con bastante actividad", "Muy animado y abierto"] },
  { key: "cleanliness", title: "Limpieza", description: "¿Qué nivel de limpieza esperas en las zonas comunes?", options: ["Muy relajado", "Limpieza básica semanal", "Limpieza frecuente y organizada", "Nivel de limpieza muy alto"] },
  { key: "smoking", title: "Tabaco", description: "Tu postura sobre fumar dentro o fuera de casa.", options: ["No quiero convivir con fumadores", "Está bien si se fuma únicamente fuera", "Me da igual", "Yo fumo"] },
  { key: "pets", title: "Mascotas", description: "Indica cómo te sentirías viviendo con animales.", options: ["Prefiero vivir sin mascotas", "Depende del animal", "Me encantan las mascotas", "Tengo mascota"] },
  { key: "visits", title: "Visitas", description: "Cómo prefieres gestionar las visitas inesperadas.", options: ["Siempre deberían avisar", "Prefiero que avisen con tiempo", "No me importa alguna visita espontánea", "Me encantan las visitas espontáneas"] },
  { key: "wake_up", title: "Horarios", description: "La hora a la que sueles empezar el día.", options: ["Antes de las 7:00", "Entre las 7:00 y las 9:00", "Entre las 9:00 y las 11:00", "Después de las 11:00"] },
  { key: "space", title: "Espacio personal", description: "Cuánta vida en común quieres hacer en casa.", options: ["Necesito mucho tiempo a solas", "Necesito bastante espacio personal", "Busco un equilibrio", "Me encanta hacer vida en común"] },
  { key: "lifestyle", title: "Convivencia ideal", description: "Qué relación esperas tener con tus compañeros.", options: ["Compartir gastos y mantener independencia", "Tener una relación cordial", "Hacer algunos planes juntos", "Crear una amistad y una comunidad"] },
];

export default function HousingPreferencesPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [budget, setBudget] = useState("");
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (user?.rental_budget !== null && user?.rental_budget !== undefined) setBudget(String(user.rental_budget));
    getMyOnboarding()
      .then((profile) => {
        const { id: _id, user_id: _userId, created_at: _createdAt, updated_at: _updatedAt, ...storedAnswers } = profile;
        setAnswers(storedAnswers);
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoadingPreferences(false));
  }, [user]);

  if (loading || loadingPreferences || !user) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;

  async function handleSave() {
    if (!answers || !user || saving) return;
    setSaving(true);
    try {
      await Promise.all([
        saveOnboarding(answers),
        updateProfile({ first_name: user.first_name, last_name: user.last_name, phone: user.phone, rental_budget: budget.trim() ? Number(budget) : null, is_looking_for_roommates: user.is_looking_for_roommates, age: user.age, occupation: user.occupation, bio: user.bio }),
      ]);
      await refresh();
      toast.success("Preferencias guardadas");
      router.push("/perfil/editar");
    } catch {
      toast.error("No pudimos guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  function select(key: PreferenceKey, value: string) {
    setAnswers((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <div className="mx-auto max-w-2xl pb-4">
      <header className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2">
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-10 w-10 items-center justify-start text-brand-dark"><ArrowLeftIcon /></button>
        <h1 className="text-center text-xl font-bold text-brand-dark sm:text-2xl">Preferencias de vivienda</h1>
        <button type="button" onClick={handleSave} disabled={!answers || saving} className="text-sm font-bold text-primary disabled:opacity-50">{saving ? "Guardando" : "Guardar"}</button>
      </header>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-muted">Cuanta más información añadas, mejores serán tus recomendaciones.</p>

      {loadFailed || !answers ? (
        <section className="mt-7 rounded-24 border border-border bg-surface p-5 text-center">
          <p className="text-base font-bold text-brand-dark">Completa primero tu perfil de convivencia</p>
          <p className="mt-2 text-sm leading-6 text-muted">Necesitamos tus respuestas iniciales antes de poder editar estas preferencias.</p>
          <button type="button" onClick={() => router.push("/onboarding")} className="mt-5 h-12 rounded-18 bg-primary px-6 text-sm font-bold text-white">Completar cuestionario</button>
        </section>
      ) : (
        <div className="mt-7 space-y-4">
          <PreferenceCard title="Presupuesto mensual" description="Tu parte máxima aproximada del alquiler al mes.">
            <div className="grid grid-cols-4 gap-2">
              {[400, 600, 800, 1000].map((amount) => <button key={amount} type="button" onClick={() => setBudget(String(amount))} className={cn("h-11 rounded-14 border text-sm font-bold", budget === String(amount) ? "border-primary bg-mint-50 text-primary-dark" : "border-border text-secondary")}>{amount} €</button>)}
            </div>
            <div className="mt-3 flex h-12 items-center rounded-14 border border-border bg-surface px-4 shadow-soft focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
              <span className="text-sm font-bold text-primary">€</span>
              <input type="number" inputMode="numeric" min={0} max={20000} value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Otra cantidad" className="h-full flex-1 bg-transparent px-3 text-sm outline-none" />
              <span className="text-xs text-muted">/ mes</span>
            </div>
          </PreferenceCard>

          {preferenceFields.map((field) => (
            <PreferenceCard key={field.key} title={field.title} description={field.description}>
              <div className="grid gap-2 sm:grid-cols-2">
                {field.options.map((option) => <button key={option} type="button" onClick={() => select(field.key, option)} aria-pressed={answers[field.key] === option} className={cn("min-h-12 rounded-14 border px-3 py-2 text-left text-sm font-semibold transition", answers[field.key] === option ? "border-primary bg-mint-50 text-primary-dark" : "border-border bg-surface text-secondary hover:border-primary/40")}>{option}</button>)}
              </div>
            </PreferenceCard>
          ))}

          <button type="button" onClick={handleSave} disabled={saving} className="h-14 w-full rounded-18 bg-primary text-base font-bold text-white shadow-button disabled:opacity-60">{saving ? "Guardando cambios..." : "Guardar cambios"}</button>
          <p className="text-center text-xs text-muted">Los cambios se aplican al guardar</p>
        </div>
      )}
    </div>
  );
}

function PreferenceCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-24 border border-border bg-surface p-4 sm:p-5"><h2 className="text-base font-bold text-foreground">{title}</h2><p className="mt-1 text-xs leading-5 text-muted">{description}</p><div className="mt-4">{children}</div></section>;
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
}
