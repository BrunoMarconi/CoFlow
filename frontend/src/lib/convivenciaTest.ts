/* Las tres preguntas del test de convivencia de la landing de Erasmus.
 *
 * Dos de ellas apuntan a campos reales del perfil de compatibilidad
 * (ver backend/app/database/models/compatibility_profile.py):
 *   ambiente -> lifestyle
 *   horario  -> wake_up
 * La tercera (zona) no es un campo de convivencia sino una preferencia
 * de busqueda, y por eso se guarda aparte.
 *
 * El test NO escribe nada en la base de datos: todas las columnas de
 * CompatibilityProfile son NOT NULL, asi que un perfil de tres respuestas
 * no es un registro valido. Las respuestas viven en localStorage y sirven
 * para prellenar el onboarding cuando la persona se registre. */

export type ConvivenciaQuestionId = "ambiente" | "horario" | "zona";

export type ConvivenciaOption = {
  value: string;
  /** Texto del boton. */
  label: string;
  /** Como se lee dentro de la tarjeta de perfil, que habla en primera persona. */
  cardLabel: string;
};

export type ConvivenciaQuestion = {
  id: ConvivenciaQuestionId;
  /** Enunciado completo, el que oye un lector de pantalla. */
  legend: string;
  /** Etiqueta corta, la que se ve sobre los botones y en la tarjeta. */
  shortLabel: string;
  /** Campo del perfil que rellenara esta respuesta, o null si no mapea. */
  profileField: "lifestyle" | "wake_up" | null;
  options: ConvivenciaOption[];
};

export const CONVIVENCIA_QUESTIONS: ConvivenciaQuestion[] = [
  {
    id: "ambiente",
    legend: "¿Casa tranquila o ambiente social?",
    shortLabel: "Ambiente",
    profileField: "lifestyle",
    options: [
      { value: "tranquilo", label: "Tranquila", cardLabel: "Casa tranquila" },
      { value: "social", label: "Social", cardLabel: "Ambiente social" },
    ],
  },
  {
    id: "horario",
    legend: "¿Madrugas o eres más nocturno?",
    shortLabel: "Horario",
    profileField: "wake_up",
    options: [
      { value: "madrugador", label: "Madrugo", cardLabel: "Madrugo" },
      { value: "nocturno", label: "Nocturno", cardLabel: "Más de noche" },
    ],
  },
  {
    id: "zona",
    legend: "¿Centro, Teatinos o sin preferencia?",
    shortLabel: "Zona",
    profileField: null,
    options: [
      { value: "centro", label: "Centro", cardLabel: "Centro" },
      { value: "teatinos", label: "Teatinos", cardLabel: "Teatinos" },
      { value: "indiferente", label: "Sin preferencia", cardLabel: "Cualquier zona" },
    ],
  },
];

export type ConvivenciaAnswers = Partial<Record<ConvivenciaQuestionId, string>>;

const KEY = "coflow:convivencia-draft";

/* Mismo patron que cookieNotice: todo envuelto en try/catch porque en
 * ventana privada o con el almacenamiento bloqueado el acceso lanza, y la
 * seccion tiene que seguir funcionando sin persistencia. */

export function readConvivenciaDraft(): ConvivenciaAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as ConvivenciaAnswers | null;
    if (!raw || typeof raw !== "object") return {};
    // Nos quedamos solo con respuestas que sigan existiendo entre las
    // opciones actuales, por si el test cambia despues de que alguien
    // dejara un borrador guardado.
    const clean: ConvivenciaAnswers = {};
    for (const question of CONVIVENCIA_QUESTIONS) {
      const value = raw[question.id];
      if (value && question.options.some((option) => option.value === value)) {
        clean[question.id] = value;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveConvivenciaDraft(answers: ConvivenciaAnswers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    /* Sin persistencia el test sigue siendo usable en esta visita. */
  }
}

export function isConvivenciaComplete(answers: ConvivenciaAnswers): boolean {
  return CONVIVENCIA_QUESTIONS.every((question) => Boolean(answers[question.id]));
}

export function findConvivenciaOption(
  question: ConvivenciaQuestion,
  answers: ConvivenciaAnswers,
): ConvivenciaOption | null {
  const value = answers[question.id];
  return question.options.find((option) => option.value === value) ?? null;
}
