"use client";

import { FormEvent, useMemo, useState } from "react";

import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { COMMUNITY_PROFILE_TYPE_OPTIONS } from "@/lib/communityProfileType";
import { COMMUNITY_COVER_COLOR_MAP } from "@/components/ui/CommunityCover";
import type {
  CommunityCoverColor,
  CommunityCreate,
  CommunityJoinType,
  CommunityPreferencesCreate,
  CommunityProfileType,
  CommunityUrgency,
} from "@/types/community";

const NAME_MIN_LENGTH = 3;
const DESCRIPTION_MIN_LENGTH = 20;
const MIN_MEMBERS = 2;
const MAX_MEMBERS = 12;
const PROFILE_DESCRIPTION_MAX_LENGTH = 500;

const COVER_COLOR_OPTIONS: {
  value: CommunityCoverColor;
  label: string;
}[] = [
  { value: "sage", label: "Verde salvia" },
  { value: "cream", label: "Crema" },
  { value: "stone", label: "Gris piedra" },
  { value: "sand", label: "Arena" },
  { value: "smoke", label: "Azul humo" },
  { value: "forest", label: "Verde oscuro" },
];

export type PreferenceKey = keyof CommunityPreferencesCreate;

export type PreferenceQuestion = {
  key: PreferenceKey;
  title: string;
  description: string;
  options: string[];
};

export type CommunityFormValues = CommunityCreate;

type CommunityFormProps = {
  mode: "create" | "edit";
  initialValues?: CommunityFormValues;
  submitting?: boolean;
  serverError?: string;
  onSubmit: (values: CommunityFormValues) => Promise<void>;
  onCancel?: () => void;
};

export const preferenceQuestions: PreferenceQuestion[] = [
  {
    key: "cleanliness",
    title: "¿Qué nivel de limpieza esperáis?",
    description:
      "Define cómo queréis mantener la cocina, baños y zonas comunes.",
    options: [
      "Limpieza relajada",
      "Limpieza básica semanal",
      "Limpieza frecuente y organizada",
      "Nivel de limpieza muy alto",
    ],
  },
  {
    key: "atmosphere",
    title: "¿Qué ambiente queréis en casa?",
    description:
      "Desde una convivencia independiente hasta una comunidad muy social.",
    options: [
      "Muy tranquilo y silencioso",
      "Tranquilo, con algunos momentos sociales",
      "Social y con bastante actividad",
      "Muy animado y abierto",
    ],
  },
  {
    key: "visits",
    title: "¿Cómo gestionáis las visitas?",
    description:
      "Amistades o familiares que vienen a las zonas comunes.",
    options: [
      "Siempre deben avisar con tiempo",
      "Preferimos que se avise antes",
      "Aceptamos visitas espontáneas ocasionales",
      "No tenemos problema con las visitas",
    ],
  },
  {
    key: "sleepovers",
    title: "¿Pueden quedarse terceros a dormir?",
    description:
      "Parejas, amistades o familiares de los miembros.",
    options: [
      "Solo en ocasiones especiales",
      "Permitido con previo aviso",
      "Permitido mientras sea razonable",
      "No tenemos restricciones",
    ],
  },
  {
    key: "smoking",
    title: "¿Cuál es vuestra postura sobre el tabaco?",
    description:
      "Esta condición debería quedar clara antes de aceptar nuevos miembros.",
    options: [
      "No aceptamos fumadores",
      "Solo se puede fumar fuera de casa",
      "Nos da igual mientras no moleste",
      "Se permite fumar dentro",
    ],
  },
  {
    key: "pets",
    title: "¿Aceptáis mascotas?",
    description:
      "Indica si la comunidad acepta animales o ya convive con alguno.",
    options: [
      "No aceptamos mascotas",
      "Depende del animal",
      "Aceptamos mascotas",
      "Ya vivimos con mascotas",
    ],
  },
  {
    key: "rules",
    title: "¿Cómo queréis gestionar las reglas?",
    description:
      "Turnos de limpieza, horarios, gastos y uso de zonas comunes.",
    options: [
      "Normas claras y estrictas",
      "Normas claras pero flexibles",
      "Solo algunas reglas básicas",
      "Preferimos una convivencia espontánea",
    ],
  },
  {
    key: "lifestyle",
    title: "¿Qué tipo de convivencia buscáis?",
    description:
      "Define qué relación esperáis tener entre las personas de la casa.",
    options: [
      "Compartir gastos y mantener independencia",
      "Tener una relación cordial",
      "Hacer algunos planes juntos",
      "Crear amistad y comunidad",
    ],
  },
];

const emptyPreferences: CommunityPreferencesCreate = {
  cleanliness: "",
  atmosphere: "",
  visits: "",
  sleepovers: "",
  smoking: "",
  pets: "",
  rules: "",
  lifestyle: "",
};

const defaultValues: CommunityFormValues = {
  name: "",
  description: "",
  city: "",
  province: null,
  neighborhood: null,
  max_members: 4,
  preferences: emptyPreferences,
  profile_type: "MIXED",
  profile_description: null,
  join_type: "REQUEST",
  open_spots: 1,
  urgency: "NORMAL",
  monthly_rent: null,
  deposit: null,
  move_in_date: null,
  room_description: null,
  cover_color: "sage",
};

export default function CommunityForm({
  mode,
  initialValues = defaultValues,
  submitting = false,
  serverError = "",
  onSubmit,
  onCancel,
}: CommunityFormProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(
    initialValues.description
  );
  const [city, setCity] = useState(initialValues.city);
  const [province, setProvince] = useState(
    initialValues.province ?? ""
  );
  const [neighborhood, setNeighborhood] = useState(
    initialValues.neighborhood ?? ""
  );
  const [maxMembers, setMaxMembers] = useState(
    String(initialValues.max_members)
  );

  const [openSpots, setOpenSpots] = useState(
    String(initialValues.open_spots)
  );

  const [urgency, setUrgency] =
    useState<CommunityUrgency>(
      initialValues.urgency ?? "NORMAL"
    );

  const [monthlyRent, setMonthlyRent] = useState(
    initialValues.monthly_rent !== null &&
      initialValues.monthly_rent !== undefined
      ? String(initialValues.monthly_rent)
      : ""
  );

  const [deposit, setDeposit] = useState(
    initialValues.deposit !== null &&
      initialValues.deposit !== undefined
      ? String(initialValues.deposit)
      : ""
  );

  const [moveInDate, setMoveInDate] = useState(
    initialValues.move_in_date ?? ""
  );

  const [roomDescription, setRoomDescription] =
    useState(initialValues.room_description ?? "");

  const [joinType, setJoinType] =
    useState<CommunityJoinType>(
      initialValues.join_type ?? "REQUEST"
    );

  const [profileType, setProfileType] =
    useState<CommunityProfileType>(
      initialValues.profile_type ?? "MIXED"
    );

  const [profileDescription, setProfileDescription] = useState(
    initialValues.profile_description ?? ""
  );

  const [coverColor, setCoverColor] = useState<CommunityCoverColor>(
    initialValues.cover_color ?? "sage"
  );

  const [preferences, setPreferences] =
    useState<CommunityPreferencesCreate>({
      ...emptyPreferences,
      ...initialValues.preferences,
    });

  const [validationError, setValidationError] = useState("");

  const answeredPreferences = useMemo(
    () =>
      Object.values(preferences).filter(
        (value) => value.trim().length > 0
      ).length,
    [preferences]
  );

  const progress = step === 1 ? 50 : 100;

  const title =
    mode === "create"
      ? step === 1
        ? "Crea tu comunidad"
        : "¿Cómo queréis convivir?"
      : step === 1
        ? "Edita tu comunidad"
        : "Actualiza vuestra convivencia";

  const descriptionText =
    step === 1
      ? mode === "create"
        ? "Añade la información que verán las personas al descubrir vuestra comunidad."
        : "Modifica la información pública de vuestra comunidad."
      : mode === "create"
        ? "Estas preferencias ayudarán a que las personas sepan si podrían encajar con vosotros."
        : "Actualiza las condiciones y el estilo de convivencia que buscáis.";

  function validateBasicInfo(): string | null {
    if (name.trim().length < NAME_MIN_LENGTH) {
      return `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres.`;
    }

    if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
      return `La descripción debe tener al menos ${DESCRIPTION_MIN_LENGTH} caracteres.`;
    }

    if (!city.trim()) {
      return "La ciudad es obligatoria.";
    }

    const parsedMaxMembers = Number(maxMembers);

    if (
      !Number.isInteger(parsedMaxMembers) ||
      parsedMaxMembers < MIN_MEMBERS ||
      parsedMaxMembers > MAX_MEMBERS
    ) {
      return `La capacidad debe estar entre ${MIN_MEMBERS} y ${MAX_MEMBERS} personas.`;
    }

    const parsedOpenSpots = Number(openSpots);

    if (
      !Number.isInteger(parsedOpenSpots) ||
      parsedOpenSpots < 0 ||
      parsedOpenSpots >= parsedMaxMembers
    ) {
      return `Las plazas abiertas deben estar entre 0 y ${
        parsedMaxMembers - 1
      } (uno menos que la capacidad máxima, porque vosotros ya ocupáis una plaza).`;
    }

    if (
      monthlyRent &&
      (!Number.isInteger(Number(monthlyRent)) ||
        Number(monthlyRent) < 0)
    ) {
      return "El alquiler mensual debe ser una cantidad válida.";
    }

    if (
      deposit &&
      (!Number.isInteger(Number(deposit)) ||
        Number(deposit) < 0)
    ) {
      return "La fianza debe ser una cantidad válida.";
    }

    return null;
  }

  function validatePreferences(): string | null {
    const unansweredQuestion = preferenceQuestions.find(
      (question) => !preferences[question.key].trim()
    );

    if (unansweredQuestion) {
      return "Debes responder todas las preferencias de convivencia.";
    }

    return null;
  }

  function continueToPreferences() {
    const error = validateBasicInfo();

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selectPreference(
    key: PreferenceKey,
    value: string
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));

    setValidationError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    const basicError = validateBasicInfo();
    const preferencesError = validatePreferences();

    if (basicError || preferencesError) {
      setValidationError(
        basicError ?? preferencesError ?? ""
      );
      return;
    }

    setValidationError("");

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      city: city.trim(),
      province: province.trim() || null,
      neighborhood: neighborhood.trim() || null,
      max_members: Number(maxMembers),
      preferences,
      profile_type: profileType,
      profile_description: profileDescription.trim() || null,
      join_type: joinType,
      open_spots: Number(openSpots),
      urgency,
      monthly_rent: monthlyRent
        ? Number(monthlyRent)
        : null,
      deposit: deposit ? Number(deposit) : null,
      move_in_date: moveInDate || null,
      room_description:
        roomDescription.trim() || null,
      cover_color: coverColor,
    });
  }

  const visibleError = validationError || serverError;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <button
          type="button"
          onClick={() => {
            if (step === 2) {
              setStep(1);
              setValidationError("");

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });

              return;
            }

            onCancel?.();
          }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-brand-dark"
        >
          <ArrowLeftIcon />

          {step === 2
            ? "Volver a la información"
            : "Volver"}
        </button>

        <div className="mt-7 flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Paso {step} de 2
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              {title}
            </h1>

            <p className="mt-3 max-w-xl text-base leading-7 text-muted">
              {descriptionText}
            </p>
          </div>

          <span className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-primary-dark shadow-soft sm:inline-flex">
            {step === 1
              ? "Información"
              : `${answeredPreferences}/8 respondidas`}
          </span>
        </div>

        <div className="mt-7 h-2 overflow-hidden rounded-full bg-surface-soft">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mt-8">
        {step === 1 ? (
          <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-8">
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Información de la comunidad
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Estos son los datos que verán las personas al descubrir
                  vuestra comunidad.
                </p>

                <div className="mt-5 space-y-6">
                  <Input
                    label="Nombre de la comunidad"
                    helperText="Elige un nombre corto y fácil de reconocer."
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Ej. Casa Teatinos"
                    minLength={NAME_MIN_LENGTH}
                    maxLength={120}
                    required
                  />

                  <Textarea
                    label="Descripción"
                    helperText="Cuenta quiénes sois y qué tipo de persona estáis buscando."
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Somos una comunidad tranquila de estudiantes y trabajadores..."
                    minLength={DESCRIPTION_MIN_LENGTH}
                    required
                    rows={5}
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Ciudad"
                      value={city}
                      onChange={(event) =>
                        setCity(event.target.value)
                      }
                      placeholder="Ej. Málaga"
                      maxLength={100}
                      autoComplete="address-level2"
                      required
                    />

                    <Input
                      label="Provincia"
                      helperText="Opcional"
                      value={province}
                      onChange={(event) =>
                        setProvince(event.target.value)
                      }
                      placeholder="Ej. Málaga"
                      maxLength={100}
                      autoComplete="address-level1"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Barrio o zona"
                      helperText="Opcional"
                      value={neighborhood}
                      onChange={(event) =>
                        setNeighborhood(event.target.value)
                      }
                      placeholder="Ej. Teatinos"
                      maxLength={120}
                    />

                    <Input
                      label="Capacidad máxima"
                      helperText={`Número máximo de personas que pueden formar parte de la comunidad (entre ${MIN_MEMBERS} y ${MAX_MEMBERS}).`}
                      type="number"
                      inputMode="numeric"
                      min={MIN_MEMBERS}
                      max={MAX_MEMBERS}
                      value={maxMembers}
                      onChange={(event) =>
                        setMaxMembers(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Perfil de la comunidad
                </p>

                <p className="mt-2 text-sm font-bold text-brand-dark">
                  ¿Qué perfil describe mejor a vuestra comunidad?
                </p>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Indica quiénes forman principalmente el grupo. Esto ayuda
                  a otras personas a entender quiénes sois, pero no limita
                  automáticamente quién puede solicitar entrar.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfileType(option.value)}
                      className={`rounded-18 border p-4 text-left transition ${
                        profileType === option.value
                          ? "border-primary bg-mint-50 shadow-soft"
                          : "border-border bg-surface hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-brand-dark">
                          {option.label}
                        </p>

                        <SelectionCircle
                          selected={profileType === option.value}
                        />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-5">
                  <Textarea
                    label="Cuéntalo con más detalle"
                    helperText={
                      profileType === "OTHER"
                        ? 'Como habéis elegido "Otro", os recomendamos completar la descripción. Por ejemplo: somos dos estudiantes y una persona que trabaja desde casa.'
                        : "Opcional. Por ejemplo: somos dos estudiantes y una persona que trabaja desde casa."
                    }
                    value={profileDescription}
                    onChange={(event) =>
                      setProfileDescription(event.target.value)
                    }
                    placeholder="Somos dos estudiantes de máster y una persona que trabaja en remoto."
                    maxLength={PROFILE_DESCRIPTION_MAX_LENGTH}
                    rows={3}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Portada de la comunidad
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Elige un color para la portada automática. Por defecto
                  mostrará las fotos de los miembros sobre este fondo. Si más
                  adelante tenéis piso, podréis subir una imagen propia desde
                  la edición de la comunidad.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {COVER_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCoverColor(option.value)}
                      title={option.label}
                      aria-label={option.label}
                      className={`h-11 w-11 shrink-0 rounded-full border-2 transition ${
                        coverColor === option.value
                          ? "border-primary shadow-soft"
                          : "border-white shadow-sm hover:border-primary/30"
                      }`}
                      style={{
                        backgroundColor:
                          COMMUNITY_COVER_COLOR_MAP[option.value].bg,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-18 border border-dashed border-border bg-surface-muted p-5">
                <p className="text-sm font-bold text-brand-dark">
                  Compañeros actuales
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Después de crear la comunidad podrás invitar a las
                  personas que ya viven contigo. Estas invitaciones no
                  representan candidatos nuevos ni reducen las plazas
                  abiertas.
                </p>
              </div>

              <div className="border-t border-border pt-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Personas nuevas que buscáis
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Esto no es lo mismo que el espacio libre en la vivienda:
                  podéis tener sitio para más gente y estar buscando solo a
                  una persona ahora mismo.
                </p>

                <div className="mt-5">
                  <Input
                    label="¿Cuántas personas nuevas queréis encontrar ahora mismo?"
                    helperText={
                      Number(openSpots) === 0
                        ? "Ahora mismo no buscáis a ninguna persona nueva."
                        : "Este número puede ser menor que el espacio total disponible en la vivienda."
                    }
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={Math.max(Number(maxMembers) - 1, 0)}
                    value={openSpots}
                    onChange={(event) =>
                      setOpenSpots(event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="border-t border-border pt-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Condiciones de la plaza
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Esta información solo tiene sentido si estáis buscando
                  incorporar a alguien nuevo.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Alquiler mensual por persona"
                    helperText="Cantidad que pagará cada persona nueva, al mes, en euros. Opcional."
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={monthlyRent}
                    onChange={(event) =>
                      setMonthlyRent(event.target.value)
                    }
                    placeholder="Ej. 450"
                  />

                  <Input
                    label="Fianza"
                    helperText="Cantidad inicial en euros. Opcional."
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={deposit}
                    onChange={(event) =>
                      setDeposit(event.target.value)
                    }
                    placeholder="Ej. 450"
                  />
                </div>

                <div className="mt-5">
                  <Input
                    label="Fecha de entrada"
                    helperText="Opcional"
                    type="date"
                    value={moveInDate}
                    onChange={(event) =>
                      setMoveInDate(event.target.value)
                    }
                  />
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-brand-dark">
                    ¿Con qué urgencia buscáis a alguien?
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <UrgencyOption
                      title="Sin prisa"
                      description="Podéis esperar a encontrar a la persona adecuada."
                      selected={urgency === "NORMAL"}
                      onClick={() => setUrgency("NORMAL")}
                    />

                    <UrgencyOption
                      title="Próximamente"
                      description="Queréis cubrir la plaza durante las próximas semanas."
                      selected={urgency === "SOON"}
                      onClick={() => setUrgency("SOON")}
                    />

                    <UrgencyOption
                      title="Urgente"
                      description="Necesitáis cubrir la plaza cuanto antes."
                      selected={urgency === "URGENT"}
                      onClick={() => setUrgency("URGENT")}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Textarea
                    label="Descripción de la habitación"
                    helperText="Opcional. Explica tamaño, luz, mobiliario o cualquier detalle útil."
                    value={roomDescription}
                    onChange={(event) =>
                      setRoomDescription(event.target.value)
                    }
                    placeholder="Habitación exterior, amueblada, con escritorio y armario..."
                    maxLength={2000}
                    rows={4}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Forma de acceso
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Decide cómo entrarán las personas nuevas cuando ocupen una
                  plaza abierta.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setJoinType("OPEN")}
                    className={`rounded-18 border p-5 text-left transition ${
                      joinType === "OPEN"
                        ? "border-primary bg-mint-50 shadow-soft"
                        : "border-border bg-surface hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-brand-dark">
                          Entrada directa
                        </p>

                        <p className="mt-2 text-sm leading-6 text-muted">
                          Puedes unirte inmediatamente mientras quede
                          alguna plaza abierta.
                        </p>
                      </div>

                      <SelectionCircle selected={joinType === "OPEN"} />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJoinType("REQUEST")}
                    className={`rounded-18 border p-5 text-left transition ${
                      joinType === "REQUEST"
                        ? "border-primary bg-mint-50 shadow-soft"
                        : "border-border bg-surface hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-brand-dark">
                          Acceso mediante solicitud
                        </p>

                        <p className="mt-2 text-sm leading-6 text-muted">
                          Debes enviar una solicitud. Un administrador
                          revisará tu perfil antes de decidir.
                        </p>
                      </div>

                      <SelectionCircle selected={joinType === "REQUEST"} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {visibleError && (
              <ErrorMessage message={visibleError} />
            )}

            <button
              type="button"
              onClick={continueToPreferences}
              className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-18 bg-primary px-6 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover"
            >
              Continuar
              <ArrowRightIcon />
            </button>
          </section>
        ) : (
          <section>
            <div className="space-y-5">
              {preferenceQuestions.map(
                (question, questionIndex) => {
                  const selected =
                    preferences[question.key];

                  return (
                    <article
                      key={question.key}
                      className="rounded-18 border border-border bg-surface p-5 shadow-soft sm:p-7"
                    >
                      <div className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold text-primary-dark">
                          {questionIndex + 1}
                        </span>

                        <div>
                          <h2 className="text-lg font-bold text-brand-dark">
                            {question.title}
                          </h2>

                          <p className="mt-2 text-sm leading-6 text-muted">
                            {question.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {question.options.map((option) => {
                          const active = selected === option;

                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                selectPreference(
                                  question.key,
                                  option
                                )
                              }
                              className={`flex min-h-16 items-center justify-between gap-4 rounded-18 border px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                active
                                  ? "border-primary bg-mint-50 text-brand-dark shadow-soft"
                                  : "border-border bg-surface text-secondary hover:border-primary/30 hover:bg-mint-50/40"
                              }`}
                            >
                              <span>{option}</span>

                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs transition ${
                                  active
                                    ? "border-primary bg-primary text-white"
                                    : "border-border text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            {visibleError && (
              <ErrorMessage message={visibleError} />
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-[auto_1fr]">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setValidationError("");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                disabled={submitting}
                className="h-14 rounded-18 border border-border bg-surface px-6 text-sm font-bold text-brand-dark transition hover:bg-surface-soft disabled:opacity-50"
              >
                Atrás
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-14 items-center justify-center gap-2 rounded-18 bg-primary px-6 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoadingIcon />
                    {mode === "create"
                      ? "Creando comunidad..."
                      : "Guardando cambios..."}
                  </>
                ) : (
                  <>
                    {mode === "create"
                      ? "Crear comunidad"
                      : "Guardar cambios"}

                    <ArrowRightIcon />
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </form>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-3 rounded-18 border border-red-100 bg-red-50 px-4 py-4"
    >
      <span className="mt-0.5 text-red-500">
        <ErrorIcon />
      </span>

      <p className="text-sm font-semibold leading-6 text-red-700">
        {message}
      </p>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SelectionCircle({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs transition ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-border text-transparent"
      }`}
    >
      ✓
    </span>
  );
}

function UrgencyOption({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-18 border p-4 text-left transition ${
        selected
          ? "border-primary bg-mint-50 shadow-soft"
          : "border-border bg-surface hover:border-primary/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-brand-dark">
            {title}
          </p>

          <p className="mt-2 text-xs leading-5 text-muted">
            {description}
          </p>
        </div>

        <SelectionCircle selected={selected} />
      </div>
    </button>
  );
}
