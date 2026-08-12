"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock3, Eye, Laptop, PawPrint, Sparkles, Users, Volume2, CigaretteOff } from "lucide-react";
import { getMyOnboarding, saveOnboarding } from "@/services/onboarding";
import { toast } from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import type { OnboardingAnswers } from "@/types/onboarding";

const WORK_FROM_HOME_KEY = "coflow_work_from_home";
type HabitKey = "cleanliness" | "wake_up" | "smoking" | "pets" | "visits" | "noise" | "lifestyle";
type Habit = { key: HabitKey; title: string; icon: ReactNode; options: Array<{ label: string; value: string }> };

const HABITS: Habit[] = [
  { key: "cleanliness", title: "Orden y limpieza", icon: <Sparkles />, options: [
    { label: "Muy ordenado", value: "Nivel de limpieza muy alto" }, { label: "Normal", value: "Limpieza frecuente y organizada" }, { label: "Flexible", value: "Muy relajado" },
  ] },
  { key: "wake_up", title: "Horarios", icon: <Clock3 />, options: [
    { label: "Mañanero", value: "Antes de las 7:00" }, { label: "Flexible", value: "Entre las 7:00 y las 9:00" }, { label: "Nocturno", value: "Después de las 11:00" },
  ] },
  { key: "smoking", title: "Fumar", icon: <CigaretteOff />, options: [
    { label: "No fumo", value: "No quiero convivir con fumadores" }, { label: "Solo fuera", value: "Está bien si se fuma únicamente fuera" }, { label: "Fumo", value: "Yo fumo" },
  ] },
  { key: "pets", title: "Mascotas", icon: <PawPrint />, options: [
    { label: "Me gustan", value: "Me encantan las mascotas" }, { label: "Depende", value: "Depende del animal" }, { label: "Prefiero que no", value: "Prefiero vivir sin mascotas" },
  ] },
  { key: "visits", title: "Visitas en casa", icon: <Users />, options: [
    { label: "A veces", value: "Prefiero que avisen con tiempo" }, { label: "Frecuentes", value: "Me encantan las visitas espontáneas" }, { label: "Prefiero pocas", value: "Siempre deberían avisar" },
  ] },
  { key: "noise", title: "Ruido / tranquilidad", icon: <Volume2 />, options: [
    { label: "Tranquilo", value: "Muy tranquilo y silencioso" }, { label: "Equilibrado", value: "Tranquilo, con algunos momentos sociales" }, { label: "Animado", value: "Social y con bastante actividad" },
  ] },
  { key: "lifestyle", title: "Vida social en casa", icon: <Users />, options: [
    { label: "Me gusta convivir", value: "Crear una amistad y una comunidad" }, { label: "Equilibrado", value: "Hacer algunos planes juntos" }, { label: "Más independiente", value: "Compartir gastos y mantener independencia" },
  ] },
];

export default function HabitsPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [workFromHome, setWorkFromHome] = useState("A veces");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyOnboarding()
      .then((profile) => {
        if (!active) return;
        const currentAnswers = toAnswers(profile);
        setAnswers(currentAnswers);
        const savedWorkPreference = window.localStorage.getItem(WORK_FROM_HOME_KEY);
        if (savedWorkPreference) setWorkFromHome(savedWorkPreference);
      })
      .catch(() => { if (active) setError("Completa primero el cuestionario Sobre ti para editar tus hábitos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function select(key: HabitKey, value: string) {
    setAnswers((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save() {
    if (!answers || saving) return;
    setSaving(true); setError("");
    try {
      await saveOnboarding(answers);
      window.localStorage.setItem(WORK_FROM_HOME_KEY, workFromHome);
      toast.success("Hábitos actualizados");
      router.push("/perfil/editar");
    } catch {
      setError("No pudimos guardar los cambios. Inténtalo de nuevo.");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex min-h-80 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 items-center justify-start text-brand-dark"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="min-w-0 flex-1 text-center text-xl font-bold text-brand-dark sm:text-2xl">Hábitos y estilo de vida</h1>
        <button type="button" onClick={save} disabled={!answers || saving} className="h-11 min-w-16 text-right text-sm font-bold text-primary disabled:opacity-50">{saving ? "Guardando" : "Guardar"}</button>
      </header>
      <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-6 text-secondary">Cuéntale a los demás cómo es convivir contigo.</p>

      {error && <div role="alert" className="mt-5 rounded-18 border border-red-200 bg-surface p-4 text-center text-sm font-semibold text-red-600 shadow-soft"><p>{error}</p>{!answers && <button type="button" onClick={() => router.push("/onboarding?edit=true")} className="mt-3 font-bold text-primary">Ir a Sobre ti</button>}</div>}

      {answers && <div className="mt-6 space-y-3">
        {HABITS.slice(0, 6).map((habit) => <HabitRow key={habit.key} habit={habit} value={answers[habit.key]} onChange={(value) => select(habit.key, value)} />)}
        <HabitRow habit={{ key: "lifestyle", title: "Trabajo o estudio en casa", icon: <Laptop />, options: [
          { label: "Sí, a menudo", value: "A menudo" }, { label: "A veces", value: "A veces" }, { label: "No", value: "No" },
        ] }} value={workFromHome} onChange={setWorkFromHome} />
        <HabitRow habit={HABITS[6]} value={answers.lifestyle} onChange={(value) => select("lifestyle", value)} />
      </div>}

      <button type="button" onClick={save} disabled={!answers || saving} className="mt-5 flex h-14 w-full items-center justify-center rounded-14 bg-primary px-6 text-base font-bold text-white shadow-button transition hover:bg-primary-hover disabled:opacity-50">{saving ? "Guardando cambios..." : "Guardar cambios"}</button>
      <button type="button" onClick={() => router.push("/perfil")} className="mx-auto mt-4 flex items-center gap-2 text-sm font-bold text-primary-dark"><Eye className="h-5 w-5" /> Ver cómo se verá en tu perfil</button>
    </div>
  );
}

function toAnswers(profile: Awaited<ReturnType<typeof getMyOnboarding>>): OnboardingAnswers {
  return {
    cleanliness: profile.cleanliness, dishes: profile.dishes, common_objects: profile.common_objects,
    noise: profile.noise, visits: profile.visits, sleepovers: profile.sleepovers,
    wake_up: profile.wake_up, night_noise: profile.night_noise, smoking: profile.smoking,
    alcohol: profile.alcohol, pets: profile.pets, bills: profile.bills, food: profile.food,
    communication: profile.communication, conflicts: profile.conflicts, rules: profile.rules,
    culture: profile.culture, space: profile.space, lifestyle: profile.lifestyle,
  };
}

function HabitRow({ habit, value, onChange }: { habit: Habit; value: string; onChange: (value: string) => void }) {
  return <section className="rounded-24 border border-border bg-surface p-4 shadow-soft sm:flex sm:items-center sm:gap-5 sm:p-5">
    <span className="flex h-12 w-12 shrink-0 items-center justify-center text-primary [&>svg]:h-6 [&>svg]:w-6">{habit.icon}</span>
    <div className="mt-2 min-w-0 flex-1 sm:mt-0"><h2 className="text-base font-bold text-foreground">{habit.title}</h2><div className="mt-3 grid grid-cols-3 overflow-hidden rounded-14 border border-border bg-surface">
      {habit.options.map((option) => { const active = option.value === value; return <button key={option.value} type="button" onClick={() => onChange(option.value)} aria-pressed={active} className={`min-h-11 border-r border-border px-2 py-2 text-xs font-semibold leading-4 transition last:border-r-0 sm:text-sm ${active ? "border-primary bg-surface text-primary-dark shadow-[inset_0_0_0_1px_var(--brand)]" : "text-secondary hover:text-foreground"}`}>{option.label}</button>; })}
    </div></div>
  </section>;
}
