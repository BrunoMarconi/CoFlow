"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, Check, Clock3, Coins, Home, Leaf, MessageCircle, PawPrint, Sparkles, Users } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { getMyOnboarding, saveOnboarding } from "@/services/onboarding";
import { updateProfile, uploadAvatar } from "@/services/users";
import type { OnboardingAnswers } from "@/types/onboarding";

const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const DRAFT_KEY = "coflow_onboarding_v2";

type DraftAnswers = Partial<OnboardingAnswers>;
type Question = { key: keyof OnboardingAnswers; title: string; options: string[] };
type Stage = { eyebrow: string; title: string; description: string; icon: ReactNode; questions: Question[] };

const STAGES: Stage[] = [
  { eyebrow: "Tu casa", title: "¿Cómo eres en casa?", description: "Esto nos ayuda a encontrar personas compatibles contigo.", icon: <Home />, questions: [
    { key: "cleanliness", title: "Orden y limpieza", options: ["Muy relajado", "Limpieza básica semanal", "Limpieza frecuente y organizada", "Nivel de limpieza muy alto"] },
    { key: "dishes", title: "Platos y cocina", options: ["Los lavo justo después de usarlos", "Los limpio durante el mismo día", "Pueden quedarse hasta el día siguiente", "No me importa que se acumulen"] },
    { key: "common_objects", title: "Zonas comunes", options: ["Prefiero las zonas comunes despejadas", "Acepto algunos objetos personales", "Me da bastante igual", "Me gusta que la casa se sienta vivida"] },
  ] },
  { eyebrow: "El ambiente", title: "¿Qué energía buscas?", description: "Cuéntanos qué hace que una casa se sienta como hogar.", icon: <Users />, questions: [
    { key: "noise", title: "Ambiente ideal", options: ["Muy tranquilo y silencioso", "Tranquilo, con algunos momentos sociales", "Social y con bastante actividad", "Muy animado y abierto"] },
    { key: "visits", title: "Visitas", options: ["Siempre deberían avisar", "Prefiero que avisen con tiempo", "No me importa alguna visita espontánea", "Me encantan las visitas espontáneas"] },
    { key: "sleepovers", title: "Personas que se quedan a dormir", options: ["Solo en ocasiones especiales", "Está bien si se avisa antes", "No me importa mientras sea razonable", "No tengo ningún problema"] },
  ] },
  { eyebrow: "Tu ritmo", title: "¿Qué horarios llevas?", description: "Los ritmos parecidos hacen más fácil la convivencia.", icon: <Clock3 />, questions: [
    { key: "wake_up", title: "Hora de levantarte", options: ["Antes de las 7:00", "Entre las 7:00 y las 9:00", "Entre las 9:00 y las 11:00", "Después de las 11:00"] },
    { key: "night_noise", title: "Ruido después de las 22:00", options: ["Necesito silencio", "Acepto un poco de ruido", "Me adapto bastante bien", "Normalmente no me afecta"] },
  ] },
  { eyebrow: "Estilo de vida", title: "Tus imprescindibles", description: "No hay respuestas correctas, solo maneras distintas de convivir.", icon: <Leaf />, questions: [
    { key: "smoking", title: "Tabaco", options: ["No quiero convivir con fumadores", "Está bien si se fuma únicamente fuera", "Me da igual", "Yo fumo"] },
    { key: "alcohol", title: "Alcohol en casa", options: ["Prefiero evitarlo", "Solo ocasionalmente", "Me da igual", "Forma parte de mi vida social"] },
    { key: "pets", title: "Mascotas", options: ["Prefiero vivir sin mascotas", "Depende del animal", "Me encantan las mascotas", "Tengo mascota"] },
  ] },
  { eyebrow: "Organización", title: "¿Cómo compartís?", description: "Las pequeñas decisiones del día a día también cuentan.", icon: <Coins />, questions: [
    { key: "bills", title: "Facturas", options: ["Dividir todos los gastos exactamente", "Una persona paga y después se compensa", "Crear un fondo común", "Me adapto al sistema del piso"] },
    { key: "food", title: "Comida", options: ["Cada persona compra su comida", "Compartir solo productos básicos", "Hacer algunas compras juntos", "Compartir la mayoría de la comida"] },
  ] },
  { eyebrow: "Comunicación", title: "Cuando algo no encaja", description: "Conocer cómo habláis las cosas evita muchos roces.", icon: <MessageCircle />, questions: [
    { key: "communication", title: "Comunicar un problema", options: ["Hablarlo en el momento", "Esperar a estar tranquilos", "Hablarlo en una reunión de convivencia", "Prefiero escribirlo por mensaje"] },
    { key: "conflicts", title: "Resolver conflictos", options: ["Hablando directamente", "Buscando un acuerdo intermedio", "Necesito tiempo antes de hablar", "Intento evitar las discusiones"] },
    { key: "rules", title: "Reglas de convivencia", options: ["Deben estar muy claras y cumplirse", "Son importantes, pero pueden adaptarse", "Solo necesitamos algunas reglas básicas", "Prefiero una convivencia espontánea"] },
  ] },
  { eyebrow: "Tu forma de convivir", title: "¿Qué te hace sentir cómodo?", description: "El equilibrio entre compartir y tener espacio es muy personal.", icon: <Sparkles />, questions: [
    { key: "culture", title: "Culturas y costumbres", options: ["Me encanta conocer culturas diferentes", "Soy bastante abierto", "Depende de las costumbres", "Prefiero convivir con personas parecidas a mí"] },
    { key: "space", title: "Espacio personal", options: ["Necesito mucho tiempo a solas", "Necesito bastante espacio personal", "Busco un equilibrio", "Me encanta hacer vida en común"] },
    { key: "lifestyle", title: "Convivencia ideal", options: ["Compartir gastos y mantener independencia", "Tener una relación cordial", "Hacer algunos planes juntos", "Crear una amistad y una comunidad"] },
  ] },
  { eyebrow: "Tu perfil", title: "Ponle cara a tu perfil", description: "Una foto real genera más confianza. Puedes añadirla ahora o más tarde.", icon: <Camera />, questions: [] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";
  const { user, loading: authLoading, refresh } = useAuth();
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rentalBudget, setRentalBudget] = useState(() => user?.rental_budget != null ? String(user.rental_budget) : "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const current = STAGES[stage];
  const isLastStage = stage === STAGES.length - 1;
  const preview = useMemo(() => avatarFile ? URL.createObjectURL(avatarFile) : null, [avatarFile]);
  const stageComplete = current.questions.every((question) => Boolean(answers[question.key]));
  const allComplete = STAGES.flatMap((item) => item.questions).every((question) => Boolean(answers[question.key]));

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.onboarding_completed && !isEditing) { router.replace("/comunidades"); return; }
    let active = true;
    getMyOnboarding().then((profile) => {
      if (!active) return;
      setAnswers(toAnswers(profile));
    }).catch(() => {
      if (!active) return;
      const draft = window.localStorage.getItem(DRAFT_KEY);
      if (draft) try { setAnswers(JSON.parse(draft) as DraftAnswers); } catch { window.localStorage.removeItem(DRAFT_KEY); }
    }).finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, [authLoading, isEditing, router, user?.onboarding_completed]);

  useEffect(() => {
    if (!initializing) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
  }, [answers, initializing]);

  function next() {
    if (!stageComplete) { setError("Elige una opción en cada bloque para continuar."); return; }
    setError("");
    if (isLastStage) { void finish(); return; }
    setStage((value) => Math.min(value + 1, STAGES.length - 1));
  }

  async function finish() {
    if (!allComplete || submitting) return;
    setSubmitting(true); setError("");
    try {
      await saveOnboarding(answers as OnboardingAnswers);
      if (user) await updateProfile({ first_name: user.first_name, last_name: user.last_name, phone: user.phone, rental_budget: rentalBudget.trim() ? Number(rentalBudget) : null, is_looking_for_roommates: user.is_looking_for_roommates });
      if (avatarFile) await uploadAvatar(avatarFile);
      window.localStorage.removeItem(DRAFT_KEY);
      await refresh();
      router.replace(isEditing ? "/perfil/editar" : "/comunidades");
    } catch { setError("No pudimos guardar tu perfil. Inténtalo de nuevo."); setSubmitting(false); }
  }

  function choosePhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!AVATAR_ACCEPTED_TYPES.includes(file.type) || file.size > AVATAR_MAX_SIZE_BYTES) { setError("La foto debe ser JPEG, PNG o WebP y pesar menos de 5 MB."); return; }
    setError(""); setAvatarFile(file);
  }

  if (initializing) return <main className="flex min-h-dvh items-center justify-center bg-surface"><Spinner /></main>;

  return <main className="min-h-dvh bg-surface px-5 pb-8 pt-[calc(var(--safe-top)+1.5rem)] sm:px-8">
    <div className="mx-auto w-full max-w-3xl">
      <header className="flex items-center justify-between">
        <button type="button" onClick={() => stage > 0 ? setStage((value) => value - 1) : router.back()} aria-label="Volver" className="flex h-11 w-11 items-center justify-start text-brand-dark"><ArrowLeft className="h-6 w-6" /></button>
        <div className="flex items-center gap-2"><Logo size="sm" /><span className="text-xl font-bold text-brand-dark">CoFlow</span></div>
        <span className="min-w-16 text-right text-sm font-semibold text-secondary">{stage + 1} de {STAGES.length}</span>
      </header>
      <div className="mt-5 grid grid-cols-8 gap-2" aria-label={`Paso ${stage + 1} de ${STAGES.length}`}>{STAGES.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-colors ${index <= stage ? "bg-primary" : "bg-border"}`} />)}</div>

      <section key={stage} className="animate-fade-in-up mt-9">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">{current.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-brand-dark sm:text-5xl">{current.title}</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-secondary">{current.description}</p>

        {isLastStage ? <PhotoStage avatarUrl={preview ?? user?.avatar_url ?? null} inputRef={avatarInputRef} rentalBudget={rentalBudget} onBudgetChange={setRentalBudget} onFiles={choosePhoto} /> : <div className="mt-7 space-y-6">
          {current.questions.map((question) => <fieldset key={question.key} className="rounded-24 border border-border bg-surface p-4 shadow-soft sm:p-5">
            <legend className="px-1 text-base font-bold text-foreground">{question.title}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, index) => {
              const selected = answers[question.key] === option;
              return <button key={option} type="button" onClick={() => setAnswers((value) => ({ ...value, [question.key]: option }))} aria-pressed={selected} className={`flex min-h-16 items-center gap-3 rounded-14 border p-3 text-left text-sm font-semibold transition ${selected ? "border-primary text-primary-dark shadow-[inset_0_0_0_1px_var(--brand)]" : "border-border text-secondary hover:border-primary/30 hover:text-foreground"}`}>
                <OptionIllustration index={index} active={selected} icon={current.icon} />
                <span className="min-w-0 flex-1 leading-5">{option}</span>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>;
            })}</div>
          </fieldset>)}
        </div>}

        {error && <p role="alert" className="mt-5 rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
        <button type="button" onClick={next} disabled={submitting || (!isLastStage && !stageComplete)} className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-14 bg-primary px-6 text-base font-bold text-white shadow-button transition hover:bg-primary-hover disabled:opacity-45">{submitting ? "Guardando..." : isLastStage ? (isEditing ? "Guardar cambios" : "Terminar") : "Continuar"}<ArrowRight className="h-5 w-5" /></button>
        {isLastStage && !avatarFile && <button type="button" onClick={next} disabled={submitting} className="mx-auto mt-4 block text-sm font-bold text-primary">Continuar sin foto</button>}
        {!isLastStage && <p className="mt-4 text-center text-xs text-muted">Tus respuestas se guardan mientras avanzas</p>}
      </section>
    </div>
  </main>;
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

function OptionIllustration({ index, active, icon }: { index: number; active: boolean; icon: ReactNode }) {
  return <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border [&>svg]:h-5 [&>svg]:w-5 ${active ? "border-primary text-primary" : "border-border text-secondary"}`}><span style={{ transform: `rotate(${(index - 1.5) * 5}deg)` }}>{icon}</span></span>;
}

function PhotoStage({ avatarUrl, inputRef, rentalBudget, onBudgetChange, onFiles }: { avatarUrl: string | null; inputRef: React.RefObject<HTMLInputElement | null>; rentalBudget: string; onBudgetChange: (value: string) => void; onFiles: (files: FileList | null) => void }) {
  return <div className="mt-7 grid gap-4 sm:grid-cols-2">
    <input ref={inputRef} type="file" accept={AVATAR_ACCEPTED_TYPES.join(",")} onChange={(event) => onFiles(event.target.files)} className="hidden" />
    <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-64 flex-col items-center justify-center rounded-24 border border-border bg-surface p-6 shadow-soft">
      {avatarUrl ? <Image src={avatarUrl} alt="Vista previa de tu foto" width={144} height={144} unoptimized={avatarUrl.startsWith("blob:")} className="h-36 w-36 rounded-full object-cover" /> : <span className="flex h-36 w-36 items-center justify-center rounded-full border border-border text-primary"><PawPrint className="h-12 w-12" /></span>}
      <span className="mt-4 text-sm font-bold text-primary-dark">{avatarUrl ? "Cambiar foto" : "Añadir foto"}</span>
      <span className="mt-1 text-xs text-muted">JPEG, PNG o WebP · máximo 5 MB</span>
    </button>
    <div className="rounded-24 border border-border bg-surface p-5 shadow-soft">
      <span className="flex h-11 w-11 items-center justify-center text-primary"><Coins className="h-6 w-6" /></span>
      <label htmlFor="rental-budget" className="mt-3 block text-base font-bold text-foreground">Presupuesto mensual</label>
      <p className="mt-1 text-xs leading-5 text-secondary">Tu parte aproximada del alquiler. Es opcional.</p>
      <div className="relative mt-5"><span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-secondary">€</span><input id="rental-budget" type="number" min={0} max={20000} value={rentalBudget} onChange={(event) => onBudgetChange(event.target.value)} placeholder="Ej. 600" className="h-12 w-full rounded-14 border border-border bg-surface pl-10 pr-4 text-base shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></div>
    </div>
  </div>;
}
