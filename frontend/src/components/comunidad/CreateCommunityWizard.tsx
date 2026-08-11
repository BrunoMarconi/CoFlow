"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createCommunity } from "@/services/communities";
import { createCommunityInvitation } from "@/services/invitations";
import {
  getCommunityErrorMessage,
  isEmailNotVerifiedError,
} from "@/lib/communityErrors";
import { toast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import UserAvatar from "@/components/ui/UserAvatar";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import {
  COMMUNITY_PROFILE_TYPE_OPTIONS,
  getProfileTypeLabel,
} from "@/lib/communityProfileType";
import {
  preferenceQuestions,
  type PreferenceKey,
} from "@/components/comunidad/CommunityForm";
import { cn } from "@/lib/utils";
import type {
  Community,
  CommunityCreate,
  CommunityPreferencesCreate,
  CommunityProfileType,
} from "@/types/community";

const NAME_MIN_LENGTH = 3;
const DESCRIPTION_MIN_LENGTH = 20;
const MEMBER_SIZE_OPTIONS = [2, 3, 4, 5, 6];

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

type WizardStep = 1 | 2 | 3 | 4;

export default function CreateCommunityWizard({
  onCancel,
}: {
  onCancel: () => void;
}) {
  const router = useRouter();
  const { user, refreshCommunity } = useAuth();

  const [step, setStep] = useState<WizardStep>(1);

  // Paso 1
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  // Paso 2
  const [monthlyRent, setMonthlyRent] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [moveInDate, setMoveInDate] = useState("");
  const [profileType, setProfileType] =
    useState<CommunityProfileType>("MIXED");
  const [preferences, setPreferences] =
    useState<CommunityPreferencesCreate>(emptyPreferences);
  const [description, setDescription] = useState("");
  const [profileDescription, setProfileDescription] = useState("");

  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  // Resultado real de la creación — nada de esto se simula.
  const [community, setCommunity] = useState<Community | null>(null);

  // Paso 3: el token se genera una sola vez y se reutiliza.
  const [invitationToken, setInvitationToken] = useState<string | null>(
    null
  );
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState("");

  function validateStep1(): string | null {
    if (name.trim().length < NAME_MIN_LENGTH) {
      return `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres.`;
    }

    if (!city.trim()) {
      return "La ciudad es obligatoria.";
    }

    return null;
  }

  function validateStep2(): string | null {
    const rent = Number(monthlyRent);

    if (!monthlyRent || !Number.isFinite(rent) || rent < 0) {
      return "Indica el presupuesto mensual por persona.";
    }

    if (!MEMBER_SIZE_OPTIONS.includes(maxMembers)) {
      return "Selecciona cuántas personas queréis ser.";
    }

    const unanswered = preferenceQuestions.find(
      (question) => !preferences[question.key].trim()
    );

    if (unanswered) {
      return "Responde todas las preguntas de estilo de convivencia.";
    }

    if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
      return `Cuéntanos un poco más sobre vuestra comunidad (mínimo ${DESCRIPTION_MIN_LENGTH} caracteres).`;
    }

    return null;
  }

  function handleContinueStep1() {
    const error = validateStep1();

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectPreference(key: PreferenceKey, value: string) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setValidationError("");
  }

  async function handleCreateCommunity() {
    if (submitting) return;

    const error = validateStep2();

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    setServerError("");
    setEmailNotVerified(false);
    setSubmitting(true);

    const payload: CommunityCreate = {
      name: name.trim(),
      description: description.trim(),
      city: city.trim(),
      province: null,
      neighborhood: null,
      max_members: maxMembers,
      preferences,
      join_type: "REQUEST",
      // El creador ya ocupa una plaza al añadirse automáticamente como
      // OWNER — el resto de la capacidad queda abierta sin preguntarlo.
      open_spots: Math.max(maxMembers - 1, 0),
      urgency: "NORMAL",
      profile_type: profileType,
      profile_description: profileDescription.trim() || null,
      monthly_rent: Number(monthlyRent),
      deposit: null,
      move_in_date: moveInDate || null,
      room_description: null,
      cover_color: "sage",
    };

    try {
      // Único POST /communities de todo el wizard. A partir de aquí la
      // comunidad ya existe de verdad — el paso 3 depende de ello para
      // poder generar enlaces de invitación reales.
      const created = await createCommunity(payload);

      setCommunity(created);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (isEmailNotVerifiedError(error)) {
        setEmailNotVerified(true);
        setServerError("Confirma tu correo electrónico para poder crear una comunidad.");
      } else {
        setServerError(
          getCommunityErrorMessage(
            error,
            "No pudimos crear la comunidad. Revisa los datos e inténtalo de nuevo."
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function buildInvitationUrl(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/invitaciones/${token}`;
  }

  async function ensureInvitationUrl(): Promise<string | null> {
    if (invitationToken) return buildInvitationUrl(invitationToken);
    if (!community) return null;

    setInvitationLoading(true);
    setInvitationError("");

    try {
      const invitation = await createCommunityInvitation(community.id);
      setInvitationToken(invitation.token);
      return buildInvitationUrl(invitation.token);
    } catch (error) {
      setInvitationError(
        getCommunityErrorMessage(
          error,
          "No pudimos generar el enlace. Inténtalo de nuevo."
        )
      );
      return null;
    } finally {
      setInvitationLoading(false);
    }
  }

  async function handleShareInvitation() {
    const url = await ensureInvitationUrl();
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          url,
          title: `Únete a ${community?.name ?? "mi comunidad"} en CoFlow`,
        });
        return;
      } catch {
        // Cancelado por el usuario — probamos copiar como alternativa.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      // Sin portapapeles disponible: no bloqueamos el flujo.
    }
  }

  async function handleEnterCommunity() {
    if (!community) return;

    // El redirect de /crear/comunidad depende de useAuth().community —
    // por eso no se llama antes: haría saltar al usuario fuera del
    // wizard en cuanto se creara la comunidad, sin ver los pasos 3/4.
    await refreshCommunity();
    router.push(`/comunidades/${community.id}`);
  }

  async function handleGoHome() {
    await refreshCommunity();
    router.push("/comunidades");
  }

  const progress = (step / 4) * 100;

  const titles: Record<WizardStep, { title: string; description: string }> = {
    1: {
      title: "Crear comunidad",
      description: "Empieza creando el espacio que compartiréis juntos.",
    },
    2: {
      title: "¿Cómo queréis vivir?",
      description:
        "Cuéntanos lo esencial para que otras personas entiendan vuestra comunidad.",
    },
    3: {
      title: "Añade a tu gente",
      description: "Puedes empezar solo y añadir a los demás cuando quieras.",
    },
    4: {
      title: "Tu comunidad está lista",
      description:
        "Ya podéis empezar a encontrar personas que encajen con vuestra comunidad.",
    },
  };

  const visibleError = validationError || serverError;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        {step === 1 && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-brand-dark"
          >
            <ArrowLeftIcon />
            Volver
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setValidationError("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-brand-dark"
          >
            <ArrowLeftIcon />
            Volver
          </button>
        )}

        {step === 4 && (
          <button
            type="button"
            onClick={() => setStep(3)}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-brand-dark"
          >
            <ArrowLeftIcon />
            Volver
          </button>
        )}

        <div className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Paso {step} de 4
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
            {titles[step].title}
          </h1>

          <p className="mt-3 max-w-xl text-base leading-7 text-muted">
            {titles[step].description}
          </p>
        </div>

        <div className="mt-7 h-2 overflow-hidden rounded-full bg-surface-soft">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="mt-8">
        {step === 1 && (
          <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-8">
            <div className="space-y-6">
              <Input
                label="Nombre de la comunidad"
                helperText="Elige un nombre corto y fácil de reconocer."
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Casa Teatinos"
                minLength={NAME_MIN_LENGTH}
                maxLength={120}
                required
              />

              <Input
                label="Ciudad donde buscáis"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Ej. Málaga"
                maxLength={100}
                autoComplete="address-level2"
                required
              />
            </div>

            {visibleError && <ErrorBanner message={visibleError} />}

            <button
              type="button"
              onClick={handleContinueStep1}
              className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-18 bg-primary px-6 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover"
            >
              Continuar
              <ArrowRightIcon />
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            {emailNotVerified && (
              <div className="rounded-18 border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold leading-6 text-amber-800">
                Tu correo todavía no está verificado. Confirma tu email
                para poder crear una comunidad —{" "}
                <a href="/verificacion-pendiente" className="underline">
                  ver cómo verificarlo
                </a>
                .
              </div>
            )}

            {user && !user.is_email_verified && !emailNotVerified && (
              <div className="rounded-18 border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold leading-6 text-amber-800">
                Tu correo todavía no está verificado. Podrás intentar
                crear la comunidad, pero necesitarás confirmarlo antes de
                que se guarde —{" "}
                <a href="/verificacion-pendiente" className="underline">
                  ver cómo verificarlo
                </a>
                .
              </div>
            )}

            <FormBlock eyebrow="Lo esencial">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Presupuesto mensual por persona"
                  helperText="Cantidad que pagará cada persona, al mes, en euros."
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={monthlyRent}
                  onChange={(event) => setMonthlyRent(event.target.value)}
                  placeholder="Ej. 450"
                  required
                />

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="move-in-date"
                      className="text-sm font-semibold text-foreground"
                    >
                      Fecha aproximada de entrada
                    </label>

                    {moveInDate && (
                      <button
                        type="button"
                        onClick={() => setMoveInDate("")}
                        className="text-xs font-bold text-primary-dark hover:text-brand-dark"
                      >
                        Más tarde
                      </button>
                    )}
                  </div>

                  <input
                    id="move-in-date"
                    type="date"
                    value={moveInDate}
                    onChange={(event) => setMoveInDate(event.target.value)}
                    className="mt-2 h-11.5 w-full rounded-14 border border-border bg-surface px-4 text-[15px] text-foreground outline-none transition-all duration-180 hover:border-secondary/40 focus:border-primary focus:ring-4 focus:ring-mint-100"
                  />

                  <p className="mt-2 text-sm leading-5 text-muted">
                    Opcional
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-foreground">
                  ¿Cuántas personas queréis ser?
                </p>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {MEMBER_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setMaxMembers(size)}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-14 border text-sm font-bold transition-colors duration-150",
                        maxMembers === size
                          ? "border-primary/30 bg-mint-100 text-primary-dark"
                          : "border-border bg-surface text-secondary hover:border-primary/30"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </FormBlock>

            <FormBlock eyebrow="¿Qué tipo de comunidad sois?">
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfileType(option.value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-150",
                      profileType === option.value
                        ? "border-primary/30 bg-mint-100 text-primary-dark"
                        : "border-border bg-surface text-secondary hover:border-primary/30"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </FormBlock>

            <FormBlock eyebrow="Estilo de convivencia">
              <div className="grid gap-3 sm:grid-cols-2">
                {preferenceQuestions.map((question) => (
                  <div
                    key={question.key}
                    className="rounded-14 border border-border bg-surface p-3.5"
                  >
                    <p className="text-sm font-bold text-brand-dark">
                      {question.title}
                    </p>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {question.options.map((option) => {
                        const active = preferences[question.key] === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              selectPreference(question.key, option)
                            }
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                              active
                                ? "border-primary/30 bg-mint-100 text-primary-dark"
                                : "border-border bg-surface text-secondary hover:border-primary/30"
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </FormBlock>

            <FormBlock eyebrow="Sobre vuestra comunidad">
              <Textarea
                label="Cuéntanos un poco sobre vuestra comunidad"
                helperText="Así otras personas podrán entender mejor cómo sois y qué buscáis."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Somos una comunidad tranquila de estudiantes y trabajadores..."
                minLength={DESCRIPTION_MIN_LENGTH}
                required
                rows={4}
              />

              <div className="mt-4">
                <Textarea
                  label="Algo importante para vosotros"
                  helperText="Opcional."
                  value={profileDescription}
                  onChange={(event) =>
                    setProfileDescription(event.target.value)
                  }
                  placeholder="Ej.: no fumadores, respeto por los horarios..."
                  maxLength={500}
                  rows={2}
                  className="min-h-20 text-sm"
                />
              </div>
            </FormBlock>

            {visibleError && <ErrorBanner message={visibleError} />}

            <button
              type="button"
              onClick={handleCreateCommunity}
              disabled={submitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-18 bg-primary px-6 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoadingIcon />
                  Creando comunidad...
                </>
              ) : (
                <>
                  Crear comunidad
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </section>
        )}

        {step === 3 && community && user && (
          <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-8">
            <div className="flex items-center gap-4">
              <UserAvatar
                firstName={user.first_name}
                lastName={user.last_name}
                userId={user.id}
                imageUrl={user.avatar_url}
                size="lg"
              />

              <div>
                <p className="text-sm font-bold text-brand-dark">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs font-semibold text-muted">Creador</p>
              </div>
            </div>

            <p className="mt-5 text-sm font-semibold text-secondary">
              1 de {community.max_members} miembros
            </p>

            {invitationError && <ErrorBanner message={invitationError} />}

            <button
              type="button"
              onClick={handleShareInvitation}
              disabled={invitationLoading}
              className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-18 bg-primary px-6 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {invitationLoading ? "Generando enlace..." : "Compartir enlace"}
              <ShareIcon />
            </button>

            <div className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr]">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="h-14 rounded-18 border border-border bg-surface px-6 text-sm font-bold text-brand-dark transition hover:bg-surface-soft"
              >
                Más tarde
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex h-14 items-center justify-center gap-2 rounded-18 bg-brand-dark px-6 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-dark"
              >
                Continuar
                <ArrowRightIcon />
              </button>
            </div>
          </section>
        )}

        {step === 4 && community && (
          <section className="space-y-5">
            <div className="rounded-24 border border-border bg-surface p-6 text-center shadow-soft sm:p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                <CheckCircleIcon className="h-8 w-8" />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-brand-dark">
                Tu comunidad está lista
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Ya podéis empezar a encontrar personas que encajen con
                vuestra comunidad.
              </p>
            </div>

            <div className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-6">
              <p className="text-lg font-bold text-brand-dark">
                {community.name}
              </p>
              <p className="text-sm text-secondary">{community.city}</p>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-secondary">
                <span>
                  {community.member_count} de {community.max_members}{" "}
                  miembros
                </span>
                <span>
                  {Math.max(
                    community.max_members - community.member_count,
                    0
                  )}{" "}
                  plazas disponibles
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SummaryStat
                  label="Presupuesto por persona"
                  value={
                    community.monthly_rent !== null
                      ? `${community.monthly_rent.toLocaleString("es-ES")} €/mes`
                      : "Sin definir"
                  }
                />

                <SummaryStat
                  label="Tamaño de la comunidad"
                  value={`${community.max_members} personas`}
                />

                {community.move_in_date && (
                  <SummaryStat
                    label="Fecha de entrada"
                    value={formatMoveInDate(community.move_in_date)}
                  />
                )}

                <SummaryStat
                  label="Estilo de convivencia"
                  value={community.preferences?.atmosphere ?? "—"}
                />

                <SummaryStat
                  label="Tipo de comunidad"
                  value={getProfileTypeLabel(community.profile_type)}
                />
              </div>

              {invitationToken && (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1.5 text-xs font-bold text-primary-dark">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Enlace de invitación creado
                </span>
              )}
            </div>

            <div className="space-y-3">
              <PrimaryButton
                onClick={handleEnterCommunity}
                className="h-14 w-full"
              >
                Entrar en mi comunidad
              </PrimaryButton>

              <SecondaryButton
                onClick={handleShareInvitation}
                disabled={invitationLoading}
                className="h-14 w-full"
              >
                {invitationLoading
                  ? "Generando enlace..."
                  : "Compartir invitación"}
              </SecondaryButton>

              <button
                type="button"
                onClick={handleGoHome}
                className="block w-full text-center text-sm font-bold text-muted transition hover:text-brand-dark"
              >
                Ir al inicio
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function FormBlock({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
        {eyebrow}
      </p>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-14 bg-surface-muted p-3">
      <p className="text-[11px] font-semibold text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-brand-dark">
        {value}
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
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

function formatMoveInDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);
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

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 3v13" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
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
