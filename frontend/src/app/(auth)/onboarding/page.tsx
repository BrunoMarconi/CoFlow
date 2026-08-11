"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getMyOnboarding, saveOnboarding } from "@/services/onboarding";
import { updateProfile, uploadAvatar } from "@/services/users";
import type { OnboardingAnswers } from "@/types/onboarding";

const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const DRAFT_KEY = "coflow_onboarding";

type Question = {
  key: keyof OnboardingAnswers;
  category: string;
  title: string;
  description: string;
  options: string[];
};

type DraftAnswers = Partial<OnboardingAnswers>;

const questions: Question[] = [
  {
    key: "cleanliness",
    category: "🏠 Hábitos del hogar",
    title: "¿Qué nivel de limpieza profunda esperas en casa?",
    description:
      "Piensa en baños, cocina, suelo y zonas comunes.",
    options: [
      "Muy relajado",
      "Limpieza básica semanal",
      "Limpieza frecuente y organizada",
      "Nivel de limpieza muy alto",
    ],
  },
  {
    key: "dishes",
    category: "🏠 Hábitos del hogar",
    title: "¿Cómo gestionas los platos en el fregadero?",
    description:
      "Una de las pequeñas cosas que más conflictos puede provocar.",
    options: [
      "Los lavo justo después de usarlos",
      "Los limpio durante el mismo día",
      "Pueden quedarse hasta el día siguiente",
      "No me importa que se acumulen",
    ],
  },
  {
    key: "common_objects",
    category: "🏠 Hábitos del hogar",
    title: "¿Qué opinas de dejar objetos personales en zonas comunes?",
    description:
      "Por ejemplo, ropa, mochilas, cargadores o material de estudio.",
    options: [
      "Prefiero las zonas comunes despejadas",
      "Acepto algunos objetos personales",
      "Me da bastante igual",
      "Me gusta que la casa se sienta vivida",
    ],
  },
  {
    key: "noise",
    category: "🎵 Ambiente",
    title: "¿Qué ambiente ideal buscas en casa?",
    description:
      "Desde un hogar muy tranquilo hasta uno con bastante vida social.",
    options: [
      "Muy tranquilo y silencioso",
      "Tranquilo, con algunos momentos sociales",
      "Social y con bastante actividad",
      "Muy animado y abierto",
    ],
  },
  {
    key: "visits",
    category: "🎵 Ambiente",
    title: "¿Cómo llevas las visitas inesperadas?",
    description:
      "Personas que vienen a casa sin haber avisado previamente.",
    options: [
      "Siempre deberían avisar",
      "Prefiero que avisen con tiempo",
      "No me importa alguna visita espontánea",
      "Me encantan las visitas espontáneas",
    ],
  },
  {
    key: "sleepovers",
    category: "🎵 Ambiente",
    title: "¿Qué opinas de que parejas o amistades se queden a dormir?",
    description:
      "Cada persona tiene límites distintos respecto a las pernoctaciones.",
    options: [
      "Solo en ocasiones especiales",
      "Está bien si se avisa antes",
      "No me importa mientras sea razonable",
      "No tengo ningún problema",
    ],
  },
  {
    key: "wake_up",
    category: "🌅 Rutina",
    title: "¿A qué hora sueles levantarte?",
    description:
      "Tu horario habitual nos ayuda a buscar personas con ritmos compatibles.",
    options: [
      "Antes de las 7:00",
      "Entre las 7:00 y las 9:00",
      "Entre las 9:00 y las 11:00",
      "Después de las 11:00",
    ],
  },
  {
    key: "night_noise",
    category: "🌅 Rutina",
    title: "¿Cómo llevas el ruido después de las 22:00?",
    description:
      "Música, conversaciones, televisión o movimiento dentro de casa.",
    options: [
      "Necesito silencio",
      "Acepto un poco de ruido",
      "Me adapto bastante bien",
      "Normalmente no me afecta",
    ],
  },
  {
    key: "smoking",
    category: "🌅 Estilo de vida",
    title: "¿Cuál es tu postura respecto al tabaco?",
    description:
      "Esta preferencia puede ser muy importante para la convivencia.",
    options: [
      "No quiero convivir con fumadores",
      "Está bien si se fuma únicamente fuera",
      "Me da igual",
      "Yo fumo",
    ],
  },
  {
    key: "alcohol",
    category: "🌅 Estilo de vida",
    title: "¿Qué opinas del consumo de alcohol en casa?",
    description:
      "Buscamos conocer el ambiente en el que te sentirías cómodo.",
    options: [
      "Prefiero evitarlo",
      "Solo ocasionalmente",
      "Me da igual",
      "Forma parte de mi vida social",
    ],
  },
  {
    key: "pets",
    category: "🐶 Mascotas",
    title: "¿Qué opinas de vivir con mascotas?",
    description:
      "Puedes indicar también si actualmente tienes una.",
    options: [
      "Prefiero vivir sin mascotas",
      "Depende del animal",
      "Me encantan las mascotas",
      "Tengo mascota",
    ],
  },
  {
    key: "bills",
    category: "💰 Organización",
    title: "¿Cómo prefieres gestionar las facturas?",
    description:
      "Luz, agua, internet y otros gastos compartidos.",
    options: [
      "Dividir todos los gastos exactamente",
      "Una persona paga y después se compensa",
      "Crear un fondo común",
      "Me adapto al sistema del piso",
    ],
  },
  {
    key: "food",
    category: "💰 Organización",
    title: "¿Cómo prefieres organizar la comida?",
    description:
      "Cada hogar puede tener una forma diferente de gestionar la compra.",
    options: [
      "Cada persona compra su comida",
      "Compartir solo productos básicos",
      "Hacer algunas compras juntos",
      "Compartir la mayoría de la comida",
    ],
  },
  {
    key: "communication",
    category: "🧠 Convivencia",
    title: "¿Cómo prefieres comunicar los problemas?",
    description:
      "No existe una respuesta correcta, buscamos conocer tu estilo.",
    options: [
      "Hablarlo en el momento",
      "Esperar a estar tranquilos",
      "Hablarlo en una reunión de convivencia",
      "Prefiero escribirlo por mensaje",
    ],
  },
  {
    key: "conflicts",
    category: "🧠 Convivencia",
    title: "¿Cómo sueles resolver los conflictos?",
    description:
      "Piensa en cómo reaccionas cuando aparece una diferencia importante.",
    options: [
      "Hablando directamente",
      "Buscando un acuerdo intermedio",
      "Necesito tiempo antes de hablar",
      "Intento evitar las discusiones",
    ],
  },
  {
    key: "rules",
    category: "🧠 Convivencia",
    title: "¿Qué importancia tienen para ti las reglas de convivencia?",
    description:
      "Por ejemplo, turnos de limpieza, horarios o uso de zonas comunes.",
    options: [
      "Deben estar muy claras y cumplirse",
      "Son importantes, pero pueden adaptarse",
      "Solo necesitamos algunas reglas básicas",
      "Prefiero una convivencia espontánea",
    ],
  },
  {
    key: "culture",
    category: "🌍 Personalidad",
    title: "¿Cómo te relacionas con otras culturas y costumbres?",
    description:
      "CoFlow quiere crear comunidades diversas y respetuosas.",
    options: [
      "Me encanta conocer culturas diferentes",
      "Soy bastante abierto",
      "Depende de las costumbres",
      "Prefiero convivir con personas parecidas a mí",
    ],
  },
  {
    key: "space",
    category: "🌍 Personalidad",
    title: "¿Cuánto espacio personal necesitas?",
    description:
      "Algunas personas hacen mucha vida en común y otras necesitan desconectar.",
    options: [
      "Necesito mucho tiempo a solas",
      "Necesito bastante espacio personal",
      "Busco un equilibrio",
      "Me encanta hacer vida en común",
    ],
  },
  {
    key: "lifestyle",
    category: "🌍 Convivencia ideal",
    title: "¿Qué tipo de convivencia estás buscando?",
    description:
      "Esta respuesta nos ayudará a entender qué esperas de tu próximo hogar.",
    options: [
      "Compartir gastos y mantener independencia",
      "Tener una relación cordial",
      "Hacer algunos planes juntos",
      "Crear una amistad y una comunidad",
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";
  const { user, loading: authLoading, refresh } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [completed, setCompleted] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [rentalBudget, setRentalBudget] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const TOTAL_STEPS = questions.length + 1;
  const isPhotoStep = step === questions.length;
  const question = isPhotoStep ? null : questions[step];
  const currentAnswer = question ? answers[question.key] : undefined;
  const hasAvatar = Boolean(avatarFile || user?.avatar_url);

  const progress = useMemo(() => {
    return ((step + 1) / TOTAL_STEPS) * 100;
  }, [step, TOTAL_STEPS]);

  const answeredQuestions = Object.keys(answers).length;

  // La foto es opcional: solo las respuestas del cuestionario son
  // obligatorias para completar el perfil.
  const isComplete = useMemo(() => {
    return questions.every((item) => Boolean(answers[item.key]));
  }, [answers]);

  const avatarPreviewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile]
  );

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  function handleAvatarSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      setAvatarError("Solo se aceptan imágenes en formato JPEG, PNG o WebP.");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setAvatarError("La foto debe pesar menos de 5MB.");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

    setAvatarError("");
    setAvatarFile(file);
  }

  useEffect(() => {
    if (authLoading) return;

    if (user?.onboarding_completed && !isEditing) {
      router.replace("/comunidades");
      return;
    }

    let active = true;

    async function loadInitialAnswers() {
      try {
        const profile = await getMyOnboarding();

        if (!active) return;

        setAnswers({
          cleanliness: profile.cleanliness,
          dishes: profile.dishes,
          common_objects: profile.common_objects,
          noise: profile.noise,
          visits: profile.visits,
          sleepovers: profile.sleepovers,
          wake_up: profile.wake_up,
          night_noise: profile.night_noise,
          smoking: profile.smoking,
          alcohol: profile.alcohol,
          pets: profile.pets,
          bills: profile.bills,
          food: profile.food,
          communication: profile.communication,
          conflicts: profile.conflicts,
          rules: profile.rules,
          culture: profile.culture,
          space: profile.space,
          lifestyle: profile.lifestyle,
        });
      } catch {
        if (!active) return;

        const savedAnswers = localStorage.getItem(DRAFT_KEY);

        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers) as DraftAnswers);
          } catch {
            localStorage.removeItem(DRAFT_KEY);
          }
        }
      } finally {
        if (active) setInitializing(false);
      }
    }

    loadInitialAnswers();

    return () => {
      active = false;
    };
  }, [authLoading, user, isEditing, router]);

  useEffect(() => {
    if (initializing) return;

    localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
  }, [answers, initializing]);

  useEffect(() => {
    function syncRentalBudget() {
      if (user?.rental_budget !== undefined && user?.rental_budget !== null) {
        setRentalBudget(String(user.rental_budget));
      }
    }

    syncRentalBudget();
  }, [user]);

  function selectOption(option: string) {
    if (!question) return;

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [question.key]: option,
    }));
  }

  function nextQuestion() {
    if (isPhotoStep) {
      // La foto es opcional — el botón siempre avanza, con o sin foto
      // elegida.
      setCompleted(true);
      return;
    }

    if (!currentAnswer) return;

    setDirection("forward");
    setStep((currentStep) => currentStep + 1);
  }

  function previousQuestion() {
    if (step === 0) return;

    setDirection("back");
    setStep((currentStep) => currentStep - 1);
  }

  function reviewAnswers() {
    setCompleted(false);
    setStep(0);
  }

  async function handleFinish() {
    if (submitting) return;

    if (!isComplete) {
      setSubmitError(
        "Por favor responde todas las preguntas y añade una foto de perfil antes de continuar."
      );
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    try {
      await saveOnboarding(answers as OnboardingAnswers);

      if (user) {
        const trimmedBudget = rentalBudget.trim();

        await updateProfile({
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          rental_budget: trimmedBudget ? Number(trimmedBudget) : null,
          is_looking_for_roommates: user.is_looking_for_roommates,
        });
      }

      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }

      localStorage.removeItem(DRAFT_KEY);
      await refresh();

      router.push("/comunidades");
    } catch {
      setSubmitError("No pudimos guardar tus respuestas. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  if (initializing) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
      </main>
    );
  }

  if (completed) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface-muted px-6 py-12">

        <section className="relative w-full max-w-2xl animate-[fadeIn_500ms_ease-out] rounded-18 border border-primary/30 bg-surface p-8 text-center shadow-soft md:p-14">
          <div className="mx-auto flex h-24 w-24 items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl text-white shadow-soft">
              ✓
            </div>
          </div>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-primary">
            Perfil completado
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-dark md:text-6xl">
            Tu comunidad ideal está más cerca.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-secondary md:text-lg">
            Hemos guardado tus preferencias de convivencia. CoFlow podrá
            utilizarlas para buscar personas compatibles contigo.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-18 bg-surface-muted p-5">
              <p className="text-3xl font-bold text-brand-dark">
                {answeredQuestions}
              </p>
              <p className="mt-1 text-sm text-muted">
                Respuestas
              </p>
            </div>

            <div className="rounded-18 bg-surface-muted p-5">
              <p className="text-3xl font-bold text-brand-dark">
                100%
              </p>
              <p className="mt-1 text-sm text-muted">
                Perfil completado
              </p>
            </div>

            <div className="rounded-18 bg-surface-muted p-5">
              <p className="text-3xl font-bold text-brand-dark">
                19
              </p>
              <p className="mt-1 text-sm text-muted">
                Factores analizados
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-18 border border-border bg-surface-muted p-5 text-left">
            <label
              htmlFor="onboarding-rental-budget"
              className="block text-sm font-bold text-brand-dark"
            >
              Presupuesto mensual aproximado para alquiler
            </label>

            <p className="mt-1 text-xs leading-5 text-muted">
              Indica aproximadamente cuánto pagarías como máximo cada mes
              por tu parte del alquiler. No representa tus ingresos. Es
              opcional.
            </p>

            <div className="relative mt-3">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-muted">
                €
              </span>

              <input
                id="onboarding-rental-budget"
                type="number"
                inputMode="numeric"
                min={0}
                max={20000}
                value={rentalBudget}
                onChange={(event) => setRentalBudget(event.target.value)}
                placeholder="Ej. 550"
                disabled={submitting}
                className="h-12 w-full rounded-14 border border-border bg-surface pl-9 pr-4 text-base text-brand-dark outline-none transition focus:border-primary disabled:opacity-60"
              />
            </div>
          </div>

          {submitError && (
            <p className="mt-6 rounded-14 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="mt-10 w-full rounded-18 bg-primary px-8 py-4 text-base font-bold text-white shadow-button transition duration-200 hover:-translate-y-1 hover:bg-primary-hover hover:shadow-soft active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? "Guardando..." : "Descubrir mi dashboard"}
          </button>

          <button
            type="button"
            onClick={reviewAnswers}
            disabled={submitting}
            className="mt-4 text-sm font-semibold text-muted transition hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Revisar mis respuestas
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-surface-muted">
      <div className="fixed left-0 top-0 z-50 h-2 w-full bg-border">
        <div
          className="h-full rounded-r-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>


      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-3"
        >
          <div className="relative h-8 w-10">
            <span className="absolute left-0 top-1 h-7 w-7 rounded-full bg-primary" />
            <span className="absolute right-0 top-1 h-7 w-7 rounded-full border-2 border-surface-muted bg-mint-200" />
          </div>

          <span className="text-xl font-bold text-brand-dark">
            CoFlow
          </span>
        </button>

        <div className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted shadow-soft">
          {step + 1} de {TOTAL_STEPS}
        </div>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100vh-104px)] max-w-3xl items-center px-6 pb-16 md:px-10">
        <div
          key={step}
          className={`w-full ${
            direction === "forward"
              ? "animate-[slideFromRight_400ms_ease-out]"
              : "animate-[slideFromLeft_400ms_ease-out]"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            {isPhotoStep ? "📸 Tu perfil" : question?.category}
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-brand-dark md:text-6xl">
            {isPhotoStep ? "Añade una foto de perfil" : question?.title}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-secondary md:text-lg">
            {isPhotoStep
              ? "Es opcional, pero marca la diferencia: los perfiles con foto generan más confianza y reciben más solicitudes de conexión."
              : question?.description}
          </p>

          {isPhotoStep ? (
            <div className="mt-10">
              <ul className="mb-6 grid gap-2.5 sm:grid-cols-3">
                {[
                  "Genera más confianza al conectar",
                  "Recibe más solicitudes",
                  "Tu perfil se ve más completo",
                ].map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-2 rounded-14 bg-mint-50 px-3.5 py-2.5 text-sm font-semibold text-primary-dark"
                  >
                    <CheckIcon />
                    {benefit}
                  </li>
                ))}
              </ul>

              <input
                ref={avatarInputRef}
                type="file"
                accept={AVATAR_ACCEPTED_TYPES.join(",")}
                onChange={(event) =>
                  handleAvatarSelected(event.target.files)
                }
                className="hidden"
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="group flex w-full flex-col items-center gap-4 rounded-18 border-2 border-dashed border-border bg-surface p-10 text-center transition duration-200 hover:border-primary/40 hover:bg-mint-50"
              >
                {avatarPreviewUrl || user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreviewUrl ?? user?.avatar_url ?? ""}
                    alt="Vista previa de tu foto de perfil"
                    className="h-32 w-32 rounded-full border-4 border-surface object-cover shadow-soft"
                  />
                ) : (
                  <span className="flex h-32 w-32 items-center justify-center text-primary-dark">
                    <CameraIcon />
                  </span>
                )}

                <span className="font-bold text-brand-dark">
                  {hasAvatar ? "Cambiar foto" : "Subir foto"}
                </span>

                <span className="text-sm text-muted">
                  JPEG, PNG o WebP · máx. 5MB
                </span>
              </button>

              {avatarError && (
                <p className="mt-4 rounded-14 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {avatarError}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-10 grid gap-4">
              {question?.options.map((option, index) => {
                const selected = currentAnswer === option;

                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => selectOption(option)}
                    className={`group flex w-full items-center justify-between rounded-18 border p-5 text-left transition duration-200 md:p-6 ${
                      selected
                        ? "scale-[1.01] border-primary bg-mint-50 shadow-soft"
                        : "border-border bg-surface shadow-soft hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-14 text-sm font-bold transition ${
                          selected
                            ? "bg-primary text-white"
                            : "bg-surface-soft text-muted group-hover:bg-mint-100 group-hover:text-primary-dark"
                        }`}
                      >
                        {index + 1}
                      </span>

                      <span
                        className={`text-base font-semibold md:text-lg ${
                          selected
                            ? "text-brand-dark"
                            : "text-secondary"
                        }`}
                      >
                        {option}
                      </span>
                    </div>

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        selected
                          ? "border-primary bg-primary text-sm text-white"
                          : "border-border text-transparent group-hover:border-primary/30"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {submitError && (
            <p className="mt-6 rounded-14 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={previousQuestion}
              disabled={step === 0}
              className="rounded-18 border border-border bg-surface px-6 py-4 font-semibold text-brand-dark shadow-soft transition hover:-translate-y-0.5 hover:border-border hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
            >
              ← Atrás
            </button>

            <button
              type="button"
              onClick={nextQuestion}
              disabled={isPhotoStep ? false : !currentAnswer}
              className="rounded-18 bg-primary px-7 py-4 font-bold text-white shadow-button transition hover:-translate-y-1 hover:bg-primary-hover hover:shadow-soft active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {isPhotoStep
                ? hasAvatar
                  ? "Completar perfil"
                  : "Continuar sin foto"
                : "Continuar →"}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            {isPhotoStep && !hasAvatar
              ? "Podrás añadir tu foto más tarde desde tu perfil."
              : "Tus respuestas se guardan automáticamente."}
          </p>
        </div>
      </section>

      <style jsx global>{`
        @keyframes slideFromRight {
          from {
            opacity: 0;
            transform: translateX(28px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideFromLeft {
          from {
            opacity: 0;
            transform: translateX(-28px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-10 w-10"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
