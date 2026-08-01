"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getMyOnboarding, saveOnboarding } from "@/services/onboarding";
import { updateProfile } from "@/services/users";
import type { OnboardingAnswers } from "@/types/onboarding";

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

  const question = questions[step];
  const currentAnswer = answers[question.key];

  const progress = useMemo(() => {
    return ((step + 1) / questions.length) * 100;
  }, [step]);

  const answeredQuestions = Object.keys(answers).length;

  const isComplete = useMemo(() => {
    return questions.every((item) => Boolean(answers[item.key]));
  }, [answers]);

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
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [question.key]: option,
    }));
  }

  function nextQuestion() {
    if (!currentAnswer) return;

    if (step === questions.length - 1) {
      setCompleted(true);
      return;
    }

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
      setSubmitError("Por favor responde todas las preguntas antes de continuar.");
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
      <main className="flex min-h-dvh items-center justify-center bg-[#F8FAFC]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-500" />
      </main>
    );
  }

  if (completed) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#F8FAFC] px-6 py-12">
        <div className="absolute left-[-100px] top-[-100px] h-80 w-80 rounded-full bg-green-200/40 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-100px] h-96 w-96 rounded-full bg-green-300/30 blur-3xl" />

        <section className="relative w-full max-w-2xl animate-[fadeIn_500ms_ease-out] rounded-[2rem] border border-green-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(22,59,46,0.12)] md:p-14">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-3xl text-white shadow-lg shadow-green-200">
              ✓
            </div>
          </div>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-green-600">
            Perfil completado
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#163B2E] md:text-6xl">
            Tu comunidad ideal está más cerca.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-gray-600 md:text-lg">
            Hemos guardado tus preferencias de convivencia. CoFlow podrá
            utilizarlas para buscar personas compatibles contigo.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#F8FAFC] p-5">
              <p className="text-3xl font-bold text-[#163B2E]">
                {answeredQuestions}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Respuestas
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8FAFC] p-5">
              <p className="text-3xl font-bold text-[#163B2E]">
                100%
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Perfil completado
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8FAFC] p-5">
              <p className="text-3xl font-bold text-[#163B2E]">
                19
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Factores analizados
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-gray-100 bg-[#F8FAFC] p-5 text-left">
            <label
              htmlFor="onboarding-rental-budget"
              className="block text-sm font-bold text-[#163B2E]"
            >
              Presupuesto mensual aproximado para alquiler
            </label>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Indica aproximadamente cuánto pagarías como máximo cada mes
              por tu parte del alquiler. No representa tus ingresos. Es
              opcional.
            </p>

            <div className="relative mt-3">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-gray-400">
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
                className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-base text-[#163B2E] outline-none transition focus:border-green-400 disabled:opacity-60"
              />
            </div>
          </div>

          {submitError && (
            <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="mt-10 w-full rounded-2xl bg-green-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition duration-200 hover:-translate-y-1 hover:bg-green-600 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? "Guardando..." : "Descubrir mi dashboard"}
          </button>

          <button
            type="button"
            onClick={reviewAnswers}
            disabled={submitting}
            className="mt-4 text-sm font-semibold text-gray-500 transition hover:text-[#163B2E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Revisar mis respuestas
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#F8FAFC]">
      <div className="fixed left-0 top-0 z-50 h-2 w-full bg-gray-200">
        <div
          className="h-full rounded-r-full bg-green-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="absolute left-[-140px] top-20 h-96 w-96 rounded-full bg-green-200/30 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-100px] h-96 w-96 rounded-full bg-green-300/20 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-3"
        >
          <div className="relative h-8 w-10">
            <span className="absolute left-0 top-1 h-7 w-7 rounded-full bg-green-500" />
            <span className="absolute right-0 top-1 h-7 w-7 rounded-full border-2 border-[#F8FAFC] bg-green-300" />
          </div>

          <span className="text-xl font-bold text-[#163B2E]">
            CoFlow
          </span>
        </button>

        <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500 shadow-sm">
          {step + 1} de {questions.length}
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
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-green-600">
            {question.category}
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#163B2E] md:text-6xl">
            {question.title}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
            {question.description}
          </p>

          <div className="mt-10 grid gap-4">
            {question.options.map((option, index) => {
              const selected = currentAnswer === option;

              return (
                <button
                  type="button"
                  key={option}
                  onClick={() => selectOption(option)}
                  className={`group flex w-full items-center justify-between rounded-2xl border p-5 text-left transition duration-200 md:p-6 ${
                    selected
                      ? "scale-[1.01] border-green-500 bg-green-50 shadow-lg shadow-green-100"
                      : "border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                        selected
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-700"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <span
                      className={`text-base font-semibold md:text-lg ${
                        selected
                          ? "text-[#163B2E]"
                          : "text-gray-700"
                      }`}
                    >
                      {option}
                    </span>
                  </div>

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      selected
                        ? "border-green-500 bg-green-500 text-sm text-white"
                        : "border-gray-200 text-transparent group-hover:border-green-300"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>

          {submitError && (
            <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={previousQuestion}
              disabled={step === 0}
              className="rounded-2xl border border-gray-200 bg-white px-6 py-4 font-semibold text-[#163B2E] shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
            >
              ← Atrás
            </button>

            <button
              type="button"
              onClick={nextQuestion}
              disabled={!currentAnswer}
              className="rounded-2xl bg-green-500 px-7 py-4 font-bold text-white shadow-lg shadow-green-200 transition hover:-translate-y-1 hover:bg-green-600 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {step === questions.length - 1
                ? "Completar perfil"
                : "Continuar →"}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Tus respuestas se guardan automáticamente.
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
