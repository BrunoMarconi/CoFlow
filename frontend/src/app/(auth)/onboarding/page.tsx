"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, Check, Clock3, Coins, Home, Leaf, MessageCircle, Sparkles, UserRound, Users } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { AVATAR_ACCEPTED_TYPES, AVATAR_MAX_SIZE_BYTES, AVATAR_PRESETS } from "@/lib/avatarPresets";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { getMyOnboarding, saveOnboarding } from "@/services/onboarding";
import { selectAvatarPreset, updateProfile, uploadAvatar } from "@/services/users";
import type { User } from "@/types/auth";
import type { OnboardingAnswers } from "@/types/onboarding";
import styles from "./Onboarding.module.css";

const DRAFT_KEY = "coflow_onboarding_v3";
/* La misma que acepta el registro (MINIMUM_REGISTRATION_AGE en el
 * backend): en CoFlow hay menores de edad y el perfil tiene que poder
 * decirlo, no rechazarlo. */
const MIN_AGE = 14;
const MAX_AGE = 99;
const OCCUPATION_OPTIONS = ["Estudiante", "Trabajo presencial", "Teletrabajo", "Jornada parcial", "Busco empleo"];
const OCCUPATION_OTHER = "__otra__";

/* El recorrido son nueve pantallas seguidas y, hasta ahora, cada una
 * sustituía a la anterior de golpe. El desplazamiento es corto (28px) a
 * propósito: son nueve pasos y una animación de viaje largo, repetida
 * nueve veces, se convierte en una espera. */
const STAGE_VARIANTS = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -28 }),
};

type DraftAnswers = Partial<OnboardingAnswers>;
type Draft = { answers: DraftAnswers; age: string; occupation: string; rentalBudget: string };
type Question = { key: keyof OnboardingAnswers; title: string; options: string[] };
type StageKind = "about" | "questions" | "photo";
type Stage = { kind: StageKind; eyebrow: string; title: string; description: string; icon: ReactNode; questions: Question[] };

const STAGES: Stage[] = [
  { kind: "about", eyebrow: "Sobre ti", title: "Empecemos por lo básico", description: "Dos datos que tus futuros compañeros verán en tu perfil.", icon: <UserRound />, questions: [] },
  { kind: "questions", eyebrow: "Tu casa", title: "¿Cómo eres en casa?", description: "Esto nos ayuda a encontrar personas compatibles contigo.", icon: <Home />, questions: [
    { key: "cleanliness", title: "Orden y limpieza", options: ["Muy relajado", "Limpieza básica semanal", "Limpieza frecuente y organizada", "Nivel de limpieza muy alto"] },
    { key: "dishes", title: "Platos y cocina", options: ["Los lavo justo después de usarlos", "Los limpio durante el mismo día", "Pueden quedarse hasta el día siguiente", "No me importa que se acumulen"] },
    { key: "common_objects", title: "Zonas comunes", options: ["Prefiero las zonas comunes despejadas", "Acepto algunos objetos personales", "Me da bastante igual", "Me gusta que la casa se sienta vivida"] },
  ] },
  { kind: "questions", eyebrow: "El ambiente", title: "¿Qué energía buscas?", description: "Cuéntanos qué hace que una casa se sienta como hogar.", icon: <Users />, questions: [
    { key: "noise", title: "Ambiente ideal", options: ["Muy tranquilo y silencioso", "Tranquilo, con algunos momentos sociales", "Social y con bastante actividad", "Muy animado y abierto"] },
    { key: "visits", title: "Visitas", options: ["Siempre deberían avisar", "Prefiero que avisen con tiempo", "No me importa alguna visita espontánea", "Me encantan las visitas espontáneas"] },
    { key: "sleepovers", title: "Personas que se quedan a dormir", options: ["Solo en ocasiones especiales", "Está bien si se avisa antes", "No me importa mientras sea razonable", "No tengo ningún problema"] },
  ] },
  { kind: "questions", eyebrow: "Tu ritmo", title: "¿Qué horarios llevas?", description: "Los ritmos parecidos hacen más fácil la convivencia.", icon: <Clock3 />, questions: [
    { key: "wake_up", title: "Hora de levantarte", options: ["Antes de las 7:00", "Entre las 7:00 y las 9:00", "Entre las 9:00 y las 11:00", "Después de las 11:00"] },
    { key: "night_noise", title: "Ruido después de las 22:00", options: ["Necesito silencio", "Acepto un poco de ruido", "Me adapto bastante bien", "Normalmente no me afecta"] },
  ] },
  { kind: "questions", eyebrow: "Estilo de vida", title: "Tus imprescindibles", description: "No hay respuestas correctas, solo maneras distintas de convivir.", icon: <Leaf />, questions: [
    { key: "smoking", title: "Tabaco", options: ["No quiero convivir con fumadores", "Está bien si se fuma únicamente fuera", "Me da igual", "Yo fumo"] },
    { key: "alcohol", title: "Alcohol en casa", options: ["Prefiero evitarlo", "Solo ocasionalmente", "Me da igual", "Forma parte de mi vida social"] },
    { key: "pets", title: "Mascotas", options: ["Prefiero vivir sin mascotas", "Depende del animal", "Me encantan las mascotas", "Tengo mascota"] },
  ] },
  { kind: "questions", eyebrow: "Organización", title: "¿Cómo compartís?", description: "Las pequeñas decisiones del día a día también cuentan.", icon: <Coins />, questions: [
    { key: "bills", title: "Facturas", options: ["Dividir todos los gastos exactamente", "Una persona paga y después se compensa", "Crear un fondo común", "Me adapto al sistema del piso"] },
    { key: "food", title: "Comida", options: ["Cada persona compra su comida", "Compartir solo productos básicos", "Hacer algunas compras juntos", "Compartir la mayoría de la comida"] },
  ] },
  { kind: "questions", eyebrow: "Comunicación", title: "Cuando algo no encaja", description: "Conocer cómo habláis las cosas evita muchos roces.", icon: <MessageCircle />, questions: [
    { key: "communication", title: "Comunicar un problema", options: ["Hablarlo en el momento", "Esperar a estar tranquilos", "Hablarlo en una reunión de convivencia", "Prefiero escribirlo por mensaje"] },
    { key: "conflicts", title: "Resolver conflictos", options: ["Hablando directamente", "Buscando un acuerdo intermedio", "Necesito tiempo antes de hablar", "Intento evitar las discusiones"] },
    { key: "rules", title: "Reglas de convivencia", options: ["Deben estar muy claras y cumplirse", "Son importantes, pero pueden adaptarse", "Solo necesitamos algunas reglas básicas", "Prefiero una convivencia espontánea"] },
  ] },
  { kind: "questions", eyebrow: "Tu forma de convivir", title: "¿Qué te hace sentir cómodo?", description: "El equilibrio entre compartir y tener espacio es muy personal.", icon: <Sparkles />, questions: [
    { key: "culture", title: "Culturas y costumbres", options: ["Me encanta conocer culturas diferentes", "Soy bastante abierto", "Depende de las costumbres", "Prefiero convivir con personas parecidas a mí"] },
    { key: "space", title: "Espacio personal", options: ["Necesito mucho tiempo a solas", "Necesito bastante espacio personal", "Busco un equilibrio", "Me encanta hacer vida en común"] },
    { key: "lifestyle", title: "Convivencia ideal", options: ["Compartir gastos y mantener independencia", "Tener una relación cordial", "Hacer algunos planes juntos", "Crear una amistad y una comunidad"] },
  ] },
  { kind: "photo", eyebrow: "Tu perfil", title: "Ponle cara a tu perfil", description: "Sube una foto tuya o elige un personaje de CoFlow. Sin una de las dos cosas tu perfil no se publica.", icon: <Camera />, questions: [] },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";
  const { user, loading: authLoading, refresh } = useAuth();
  const [stage, setStage] = useState(0);
  // 1 al avanzar, -1 al volver: el paso entra por el lado del que viene,
  // así el gesto de "atrás" se siente como deshacer y no como otro avance.
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [age, setAge] = useState("");
  // Solo decide el texto de ayuda: si la edad la hemos calculado
  // nosotros hay que decirlo, o parece que nos la hemos inventado.
  const [ageIsSuggested, setAgeIsSuggested] = useState(false);
  const [occupationChoice, setOccupationChoice] = useState<string | null>(null);
  const [occupationOther, setOccupationOther] = useState("");
  const [rentalBudget, setRentalBudget] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [presetId, setPresetId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  /* Los valores iniciales se cargan una sola vez: AuthProvider vuelve a
   * emitir un objeto `user` nuevo cuando resuelve su refresh de arranque,
   * y sin esta guarda ese segundo render pisaría la edad o la ocupación
   * que la persona estuviera escribiendo. */
  const initializedRef = useRef(false);

  const current = STAGES[stage];
  const isLastStage = stage === STAGES.length - 1;
  const uploadedPreview = useMemo(() => avatarFile ? URL.createObjectURL(avatarFile) : null, [avatarFile]);
  const presetSrc = AVATAR_PRESETS.find((preset) => preset.id === presetId)?.src ?? null;
  const avatarPreview = uploadedPreview ?? presetSrc ?? user?.avatar_url ?? null;
  const hasAvatar = Boolean(avatarFile || presetId || user?.avatar_url);

  const occupation = occupationChoice === OCCUPATION_OTHER ? occupationOther.trim() : occupationChoice ?? "";
  const ageNumber = Number(age.trim());
  const ageValid = /^\d{1,3}$/.test(age.trim()) && ageNumber >= MIN_AGE && ageNumber <= MAX_AGE;

  const stageComplete = current.kind === "about" ? ageValid && occupation.length > 0
    : current.kind === "photo" ? hasAvatar
    : current.questions.every((question) => Boolean(answers[question.key]));
  const answersComplete = STAGES.flatMap((item) => item.questions).every((question) => Boolean(answers[question.key]));

  useEffect(() => () => { if (uploadedPreview) URL.revokeObjectURL(uploadedPreview); }, [uploadedPreview]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.onboarding_completed && !isEditing) { router.replace("/comunidades"); return; }
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = readDraft();
    applyProfileDefaults(user, draft);

    let active = true;
    getMyOnboarding().then((profile) => {
      if (!active) return;
      setAnswers(toAnswers(profile));
    }).catch(() => {
      if (!active || !draft) return;
      setAnswers(draft.answers ?? {});
    }).finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };

    /* Lo que ya está guardado en el perfil manda sobre el borrador local,
     * y la edad calculada a partir de la fecha de nacimiento es el último
     * recurso: es una propuesta nuestra, no un dato que él haya dado. */
    function applyProfileDefaults(user: User | null, draft: Draft | null) {
      const savedAge = user?.age != null ? String(user.age) : draft?.age || "";
      const suggestedAge = user?.age_from_birth_date != null ? String(user.age_from_birth_date) : "";
      setAge(savedAge || suggestedAge);
      setAgeIsSuggested(!savedAge && Boolean(suggestedAge));

      const savedOccupation = user?.occupation || draft?.occupation || "";
      if (!savedOccupation) setOccupationChoice(null);
      else if (OCCUPATION_OPTIONS.includes(savedOccupation)) setOccupationChoice(savedOccupation);
      else { setOccupationChoice(OCCUPATION_OTHER); setOccupationOther(savedOccupation); }

      setRentalBudget(user?.rental_budget != null ? String(user.rental_budget) : draft?.rentalBudget || "");
    }
  }, [authLoading, isEditing, router, user]);

  useEffect(() => {
    if (initializing) return;
    const draft: Draft = { answers, age, occupation, rentalBudget };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [answers, age, occupation, rentalBudget, initializing]);

  function next() {
    if (!stageComplete) { setError(incompleteMessage(current.kind)); return; }
    setError("");
    if (isLastStage) { void finish(); return; }
    setDirection(1);
    setStage((value) => Math.min(value + 1, STAGES.length - 1));
  }

  function back() {
    if (stage === 0) { router.back(); return; }
    setError("");
    setDirection(-1);
    setStage((value) => value - 1);
  }

  async function finish() {
    if (!answersComplete || !ageValid || !occupation || !hasAvatar || submitting) return;
    setSubmitting(true); setError("");
    try {
      /* El perfil y el avatar se guardan antes que las respuestas: dar el
       * onboarding por terminado es lo último y el backend solo lo acepta
       * si edad, ocupación y avatar ya están en su sitio. */
      if (user) await updateProfile({
        first_name: user.first_name, last_name: user.last_name, phone: user.phone,
        rental_budget: rentalBudget.trim() ? Number(rentalBudget) : null,
        is_looking_for_roommates: user.is_looking_for_roommates,
        age: ageNumber, occupation, bio: user.bio, interests: user.interests,
      });
      if (avatarFile) await uploadAvatar(avatarFile);
      else if (presetId) {
        await selectAvatarPreset(presetId);
      }
      await saveOnboarding(answers as OnboardingAnswers);
      window.localStorage.removeItem(DRAFT_KEY);
      await refresh();
      router.replace(isEditing ? "/perfil/editar" : "/onboarding/resultado");
    } catch (submitError) {
      setError(getCommunityErrorMessage(submitError, "No pudimos guardar tu perfil. Inténtalo de nuevo."));
      setSubmitting(false);
    }
  }

  function choosePhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!AVATAR_ACCEPTED_TYPES.includes(file.type) || file.size > AVATAR_MAX_SIZE_BYTES) { setError("La foto debe ser JPEG, PNG o WebP y pesar menos de 5 MB."); return; }
    setError(""); setPresetId(null); setAvatarFile(file);
  }

  function choosePreset(id: string) {
    setError(""); setAvatarFile(null); setPresetId(id);
  }

  if (initializing) return <main className="flex min-h-dvh items-center justify-center bg-surface"><Spinner /></main>;

  return <main className={styles.shell}>
    <div className={styles.frame}>
      <header className={styles.topbar}>
        <button type="button" onClick={back} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full text-brand-dark transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/30"><ArrowLeft className="h-6 w-6" /></button>
        <div className="flex items-center gap-2"><Logo size="sm" /><span className="text-xl font-bold text-brand-dark">CoFlow</span></div>
        <span className="min-w-16 text-right text-sm font-semibold text-secondary">{stage + 1} de {STAGES.length}</span>
      </header>
      {/* Cada segmento se rellena desde la izquierda en vez de cambiar de
          color de golpe: el progreso se ve avanzar, que es lo único que
          sostiene al que va por el paso 5 de 9. */}
      <div className={styles.progress} style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))` }} aria-label={`Paso ${stage + 1} de ${STAGES.length}`}>
        {STAGES.map((_, index) => (
          <span key={index} className="h-1.5 overflow-hidden rounded-full bg-border">
            <motion.span
              className="block h-full origin-left rounded-full bg-primary"
              initial={false}
              animate={{ scaleX: index <= stage ? 1 : 0 }}
              transition={MOTION_SPRING.snappy}
            />
          </span>
        ))}
      </div>

      <div className={styles.layout}>
        <aside className={styles.contextCard} aria-label="Sobre este paso">
          <span className={styles.stageIcon}>{current.icon}</span>
          <p className={styles.contextEyebrow}>Perfil de convivencia</p>
          <h2 className={styles.contextTitle}>Encuentra personas con las que vivir encaje de verdad.</h2>
          <p className={styles.contextText}>No hay respuestas correctas. Cuanto más sincero seas, más útiles serán tus compatibilidades.</p>
          <p className={styles.contextMeta}>Paso {stage + 1} de {STAGES.length} · borrador guardado</p>
        </aside>

        <div className={styles.stage}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.section
          key={stage}
          custom={direction}
          variants={STAGE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
          className={styles.stagePanel}
        >
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">{current.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-brand-dark sm:text-5xl">{current.title}</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-secondary">{current.description}</p>

        {current.kind === "about" ? <AboutStage
          age={age}
          ageIsSuggested={ageIsSuggested}
          onAgeChange={(value) => { setAge(value); setAgeIsSuggested(false); }}
          occupationChoice={occupationChoice}
          onOccupationChoice={setOccupationChoice}
          occupationOther={occupationOther}
          onOccupationOther={setOccupationOther}
          rentalBudget={rentalBudget}
          onBudgetChange={setRentalBudget}
        /> : current.kind === "photo" ? <PhotoStage
          avatarUrl={avatarPreview}
          presetId={presetId}
          hasOwnPhoto={Boolean(avatarFile)}
          inputRef={avatarInputRef}
          onFiles={choosePhoto}
          onPreset={choosePreset}
        /> : <div className="mt-7 space-y-6">
          {current.questions.map((question) => <fieldset key={question.key} className="rounded-24 border border-border bg-surface p-4 shadow-soft sm:p-5">
            <legend className="px-1 text-base font-bold text-foreground">{question.title}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, index) => {
              const selected = answers[question.key] === option;
              return <motion.button key={option} type="button" onClick={() => setAnswers((value) => ({ ...value, [question.key]: option }))} aria-pressed={selected} whileTap={{ scale: 0.97 }} transition={MOTION_SPRING.snappy} className={`flex min-h-16 items-center gap-3 rounded-14 border p-3 text-left text-sm font-semibold transition-colors ${selected ? "border-primary text-primary-dark shadow-[inset_0_0_0_1px_var(--brand)]" : "border-border text-secondary hover:border-primary/30 hover:text-foreground"}`}>
                <OptionIllustration index={index} active={selected} icon={current.icon} />
                <span className="min-w-0 flex-1 leading-5">{option}</span>
                {/* El check entra con spring: elegir es la única acción de
                    esta pantalla y hasta ahora no devolvía nada. */}
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={MOTION_SPRING.snappy}
                      className="shrink-0"
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>;
            })}</div>
          </fieldset>)}
        </div>}

        {error && <p role="alert" className="mt-5 rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
        <button type="button" onClick={next} disabled={submitting || !stageComplete} className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-14 bg-primary px-6 text-base font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">{submitting ? "Guardando..." : isLastStage ? (isEditing ? "Guardar cambios" : "Terminar") : "Continuar"}<ArrowRight className="h-5 w-5" /></button>
        {!isLastStage && <p className="mt-4 text-center text-xs text-muted">Tus respuestas se guardan mientras avanzas</p>}
      </motion.section>
      </AnimatePresence>
      </div>
      </div>
    </div>
  </main>;
}

function incompleteMessage(kind: StageKind) {
  if (kind === "about") return `Necesitamos tu edad (entre ${MIN_AGE} y ${MAX_AGE} años) y tu ocupación para continuar.`;
  if (kind === "photo") return "Sube una foto o elige un personaje de CoFlow para terminar.";
  return "Elige una opción en cada bloque para continuar.";
}

function readDraft(): Draft | null {
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Draft; } catch { window.localStorage.removeItem(DRAFT_KEY); return null; }
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

function AboutStage({ age, ageIsSuggested, onAgeChange, occupationChoice, onOccupationChoice, occupationOther, onOccupationOther, rentalBudget, onBudgetChange }: { age: string; ageIsSuggested: boolean; onAgeChange: (value: string) => void; occupationChoice: string | null; onOccupationChoice: (value: string) => void; occupationOther: string; onOccupationOther: (value: string) => void; rentalBudget: string; onBudgetChange: (value: string) => void }) {
  return <div className="mt-7 space-y-6">
    <fieldset className="rounded-24 border border-border bg-surface p-4 shadow-soft sm:p-5">
      <legend className="px-1 text-base font-bold text-foreground">¿Cuántos años tienes?</legend>
      <div className="mt-3 flex items-baseline gap-3">
        <input id="onboarding-age" type="number" inputMode="numeric" min={MIN_AGE} max={MAX_AGE} value={age} onChange={(event) => onAgeChange(event.target.value)} placeholder="18" aria-describedby="onboarding-age-hint" className="h-14 w-28 rounded-14 border border-border bg-surface px-4 text-2xl font-bold text-brand-dark shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
        <span className="text-lg font-semibold text-secondary">años</span>
      </div>
      <p id="onboarding-age-hint" className="mt-3 text-xs leading-5 text-secondary">{ageIsSuggested ? "La hemos calculado con la fecha de nacimiento que nos diste al registrarte. Puedes corregirla." : "Mostramos tu edad en el perfil, nunca tu fecha de nacimiento."}</p>
    </fieldset>

    <fieldset className="rounded-24 border border-border bg-surface p-4 shadow-soft sm:p-5">
      <legend className="px-1 text-base font-bold text-foreground">¿A qué te dedicas?</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {[...OCCUPATION_OPTIONS, OCCUPATION_OTHER].map((option) => {
          const selected = occupationChoice === option;
          return <motion.button key={option} type="button" onClick={() => onOccupationChoice(option)} aria-pressed={selected} whileTap={{ scale: 0.97 }} transition={MOTION_SPRING.snappy} className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${selected ? "border-primary bg-primary/6 text-primary-dark" : "border-border text-secondary hover:border-primary/30 hover:text-foreground"}`}>{option === OCCUPATION_OTHER ? "Otra…" : option}</motion.button>;
        })}
      </div>
      {/* El campo libre solo aparece al elegir "Otra": el resto del tiempo
          sería una caja vacía compitiendo con los botones. */}
      <AnimatePresence initial={false}>
        {occupationChoice === OCCUPATION_OTHER && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }} className="overflow-hidden">
          <input autoFocus type="text" maxLength={100} value={occupationOther} onChange={(event) => onOccupationOther(event.target.value)} placeholder="Ej. Fotógrafa freelance" aria-label="Escribe tu ocupación" className="mt-4 h-12 w-full rounded-14 border border-border bg-surface px-4 text-base shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
        </motion.div>}
      </AnimatePresence>
    </fieldset>

    <fieldset className="rounded-24 border border-border bg-surface p-4 shadow-soft sm:p-5">
      <legend className="px-1 text-base font-bold text-foreground">Presupuesto mensual <span className="font-semibold text-muted">· opcional</span></legend>
      <p className="mt-1 px-1 text-xs leading-5 text-secondary">Tu parte aproximada del alquiler.</p>
      <div className="relative mt-4 max-w-56"><span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-secondary">€</span><input id="rental-budget" type="number" min={0} max={20000} value={rentalBudget} onChange={(event) => onBudgetChange(event.target.value)} placeholder="Ej. 600" aria-label="Presupuesto mensual en euros" className="h-12 w-full rounded-14 border border-border bg-surface pl-10 pr-4 text-base shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></div>
    </fieldset>
  </div>;
}

function PhotoStage({ avatarUrl, presetId, hasOwnPhoto, inputRef, onFiles, onPreset }: { avatarUrl: string | null; presetId: string | null; hasOwnPhoto: boolean; inputRef: React.RefObject<HTMLInputElement | null>; onFiles: (files: FileList | null) => void; onPreset: (id: string) => void }) {
  return <div className="mt-7">
    <input ref={inputRef} type="file" accept={AVATAR_ACCEPTED_TYPES.join(",")} onChange={(event) => onFiles(event.target.files)} className="hidden" />

    <div className="flex flex-col items-center rounded-24 border border-border bg-surface p-6 shadow-soft">
      <span className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted text-secondary">
        {avatarUrl ? <Image src={avatarUrl} alt="Vista previa de tu foto de perfil" width={144} height={144} unoptimized={avatarUrl.startsWith("blob:")} className="h-36 w-36 object-cover" /> : <Camera className="h-12 w-12" />}
      </span>
      <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 flex h-12 items-center justify-center rounded-14 border border-border bg-surface px-5 text-sm font-bold text-primary-dark shadow-soft transition hover:border-primary/40">{hasOwnPhoto ? "Cambiar mi foto" : "Subir mi foto"}</button>
      <span className="mt-2 text-xs text-muted">JPEG, PNG o WebP · máximo 5 MB</span>
    </div>

    <div className="mt-7 flex items-center gap-4"><span className="h-px flex-1 bg-border" /><span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">o elige un personaje</span><span className="h-px flex-1 bg-border" /></div>

    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {AVATAR_PRESETS.map((preset) => {
        const selected = presetId === preset.id;
        return <motion.button key={preset.id} type="button" onClick={() => onPreset(preset.id)} aria-pressed={selected} whileTap={{ scale: 0.97 }} transition={MOTION_SPRING.snappy} className={`overflow-hidden rounded-18 border bg-surface text-left shadow-soft transition-colors ${selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
          <span className="relative block aspect-square overflow-hidden bg-surface-muted">
            <Image src={preset.src} alt={`Avatar ${preset.name}`} fill sizes="(max-width: 640px) 46vw, 180px" className="object-cover" />
            <AnimatePresence>
              {selected && <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={MOTION_SPRING.snappy} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-button"><Check className="h-4 w-4" /></motion.span>}
            </AnimatePresence>
          </span>
          <span className="block p-3"><span className="block text-sm font-extrabold text-foreground">{preset.name}</span><span className="mt-0.5 block text-xs text-secondary">{preset.description}</span></span>
        </motion.button>;
      })}
    </div>
  </div>;
}

// useSearchParams() necesita un límite de Suspense para que Next pueda
// prerenderizar la página (si no, el build falla). Antes lo ponía el
// app/loading.tsx global, que se quitó para que la landing no enseñara
// un spinner al cargar; el fallback es el mismo que tenía aquel.
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><Spinner /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
