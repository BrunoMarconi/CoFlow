"use client";

import { useState } from "react";
import Image from "next/image";
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

  async function handleCopyInvitation() {
    const url = await ensureInvitationUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      setInvitationError(
        "No pudimos copiar el enlace. Prueba con Compartir enlace."
      );
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

  const visibleError = validationError || serverError;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {step === 1 ? (
        <header className="mx-auto max-w-2xl">
          <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Volver"
              className="flex h-11 w-11 items-center justify-start text-brand-dark transition hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
            >
              <ArrowLeftIcon />
            </button>

            <p className="text-center text-lg font-semibold text-brand-dark">
              1 de 4
            </p>
          </div>

          <div className="ml-[4.25rem] mr-[4.25rem] h-1 overflow-hidden rounded-full bg-border sm:ml-[5.25rem] sm:mr-[5.25rem]">
            <div className="h-full w-1/4 rounded-full bg-primary" />
          </div>

          <div className="mt-7 flex h-14 w-14 items-center justify-center text-primary sm:mt-12 sm:h-16 sm:w-16">
            <CommunityPeopleIcon />
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-brand-dark sm:mt-5 sm:text-5xl">
            Crear comunidad
          </h1>

          <p className="mt-3 max-w-lg text-base leading-7 text-secondary sm:mt-4 sm:text-xl sm:leading-8">
            Empieza creando el espacio que compartiréis juntos.
          </p>

          <div className="relative mx-auto mt-1 aspect-[16/7] w-full max-w-xl sm:mt-5 sm:aspect-[16/8]">
            <Image
              src="/images/create-community-living-room.webp"
              alt="Un salón acogedor con sofá verde, plantas y una mesa compartida"
              fill
              priority
              sizes="(max-width: 640px) 100vw, 576px"
              className="object-contain"
            />
          </div>
        </header>
      ) : step === 2 ? (
        <header className="mx-auto max-w-2xl">
          <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setValidationError("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
              aria-label="Volver al paso anterior"
              className="flex h-11 w-11 items-center justify-start text-brand-dark transition hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
          >
            <ArrowLeftIcon />
          </button>

            <p className="text-center text-lg font-semibold text-brand-dark">
              2 de 4
            </p>
          </div>

          <div className="mx-auto mt-1 grid max-w-md grid-cols-4 gap-3">
            <span className="h-1 rounded-full bg-primary" />
            <span className="h-1 rounded-full bg-primary" />
            <span className="h-1 rounded-full bg-border" />
            <span className="h-1 rounded-full bg-border" />
          </div>

          <h1 className="mt-8 text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-brand-dark sm:mt-12 sm:text-5xl">
            ¿Cómo queréis convivir?
          </h1>

          <p className="mt-3 max-w-xl text-base leading-7 text-secondary sm:mt-4 sm:text-xl sm:leading-8">
            Contadnos lo esencial para encontrar personas que encajen con
            vuestra comunidad.
          </p>
        </header>
      ) : step === 3 ? (
        <header className="mx-auto max-w-2xl">
          <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
            <span aria-hidden="true" />
            <p className="text-center text-lg font-semibold text-brand-dark">
              3 de 4
            </p>
          </div>

          <div className="mx-auto mt-1 grid max-w-md grid-cols-4 gap-3">
            <span className="h-1 rounded-full bg-primary" />
            <span className="h-1 rounded-full bg-primary" />
            <span className="h-1 rounded-full bg-primary" />
            <span className="h-1 rounded-full bg-border" />
          </div>

          <div className="mt-8 flex h-14 w-14 items-center justify-center text-primary sm:mt-12 sm:h-16 sm:w-16">
            <AddPeopleIcon />
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-brand-dark sm:mt-5 sm:text-5xl">
            Añade a tu gente
          </h1>

          <p className="mt-3 max-w-xl text-base leading-7 text-secondary sm:mt-4 sm:text-xl sm:leading-8">
            Podéis crear la comunidad en solitario y añadir personas cuando
            queráis.
          </p>
        </header>
      ) : (
        <header className="mx-auto max-w-2xl">
          <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
          <button
            type="button"
            onClick={() => setStep(3)}
              aria-label="Volver al paso anterior"
              className="flex h-11 w-11 items-center justify-start text-brand-dark transition hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
          >
            <ArrowLeftIcon />
          </button>

            <p className="text-center text-lg font-semibold text-brand-dark">
              4 de 4
            </p>
          </div>

          <div className="mx-auto mt-1 grid max-w-md grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} className="h-1 rounded-full bg-primary" />
            ))}
          </div>
        </header>
      )}

      <div
        className={cn(
          step === 1 && "mx-auto mt-2 max-w-2xl",
          step === 2 && "mx-auto mt-7 max-w-2xl sm:mt-10",
          step === 3 && "mx-auto mt-7 max-w-2xl sm:mt-10",
          step === 4 && "mx-auto mt-7 max-w-2xl sm:mt-10"
        )}
      >
        {step === 1 && (
          <section>
            <div className="space-y-5">
              <div className="rounded-24 border border-border/70 bg-surface p-4 shadow-[0_12px_35px_rgba(26,55,43,0.08)] sm:p-7">
                <Input
                  label="¿Cómo se llamará vuestra comunidad?"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Casa Málaga"
                  minLength={NAME_MIN_LENGTH}
                  maxLength={120}
                  required
                  className="h-14 rounded-18 px-4 text-base sm:h-16 sm:px-5 sm:text-xl"
                />
              </div>

              <div className="rounded-24 border border-border/70 bg-surface p-4 shadow-[0_12px_35px_rgba(26,55,43,0.08)] sm:p-7">
                <Input
                  label="¿Dónde buscáis?"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Málaga"
                  maxLength={100}
                  autoComplete="address-level2"
                  required
                  leftElement={<LocationPinIcon />}
                  className="h-14 rounded-18 pl-12 pr-4 text-base sm:h-16 sm:pl-13 sm:pr-5 sm:text-xl"
                />
              </div>
            </div>

            {visibleError && <ErrorBanner message={visibleError} />}

            <button
              type="button"
              onClick={handleContinueStep1}
              className="relative mt-6 flex h-14 w-full items-center justify-center rounded-24 bg-primary px-14 text-base font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 sm:mt-7 sm:h-16 sm:px-16 sm:text-lg"
            >
              Continuar
              <span className="absolute right-6">
                <ArrowRightIcon />
              </span>
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-8 sm:space-y-10">
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
                Tu correo todavía no está verificado. Tendrás que
                confirmarlo antes de poder crear la comunidad —{" "}
                <a href="/verificacion-pendiente" className="underline">
                  ver cómo verificarlo
                </a>
                .
              </div>
            )}

            <div>
              <WizardSectionTitle
                title="Presupuesto mensual por persona"
                hint="La cantidad que puede pagar cada persona al mes."
              />

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[400, 500, 600, 800, 1000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setMonthlyRent(String(amount))}
                    aria-pressed={monthlyRent === String(amount)}
                    className={cn(
                      "min-h-14 rounded-18 border px-3 text-sm font-semibold transition-colors sm:min-h-16 sm:text-base",
                      monthlyRent === String(amount)
                        ? "border-primary bg-mint-50 text-primary-dark"
                        : "border-border bg-surface text-foreground hover:border-primary/40"
                    )}
                  >
                    {amount.toLocaleString("es-ES")} €
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <Input
                  label="Otra cantidad"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={monthlyRent}
                  onChange={(event) => setMonthlyRent(event.target.value)}
                  placeholder="Ej. 650 €"
                  required
                  className="h-14 rounded-18 px-5 text-base"
                />
              </div>
            </div>

            <div>
              <WizardSectionTitle
                title="¿Cuántas personas queréis ser?"
                hint="Es el tamaño final de la comunidad, contando contigo."
              />

              <div className="mt-4 grid grid-cols-5 gap-3">
                {MEMBER_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setMaxMembers(size)}
                    aria-pressed={maxMembers === size}
                    className={cn(
                      "flex h-14 items-center justify-center rounded-18 border text-base font-bold transition-colors",
                      maxMembers === size
                        ? "border-primary bg-mint-50 text-primary-dark"
                        : "border-border bg-surface text-foreground hover:border-primary/40"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <WizardSectionTitle
                title="Fecha aproximada de entrada"
                hint="Es opcional y podréis cambiarla más adelante."
              />

              <div className="relative mt-4 rounded-18 border border-border bg-surface p-4 pl-16">
                <span className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-primary">
                  <CalendarIcon />
                </span>
                <label
                  htmlFor="move-in-date"
                  className="block text-sm font-bold text-brand-dark"
                >
                  ¿Cuándo queréis entrar?
                </label>
                <input
                  id="move-in-date"
                  type="date"
                  value={moveInDate}
                  onChange={(event) => setMoveInDate(event.target.value)}
                  className="mt-1 w-full bg-transparent text-sm text-secondary outline-none"
                />
                {moveInDate && (
                  <button
                    type="button"
                    onClick={() => setMoveInDate("")}
                    className="mt-2 text-sm font-bold text-primary hover:text-primary-hover sm:absolute sm:right-5 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2"
                  >
                    Más tarde
                  </button>
                )}
              </div>
            </div>

            <div>
              <WizardSectionTitle
                title="¿Qué tipo de comunidad sois?"
                hint="Ayuda a explicar quiénes formáis principalmente el grupo."
              />
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfileType(option.value)}
                    className={cn(
                      "mt-3 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors duration-150",
                      profileType === option.value
                        ? "border-primary/30 bg-mint-100 text-primary-dark"
                        : "border-border bg-surface text-secondary hover:border-primary/30"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <WizardSectionTitle
                title="Estilo de convivencia"
                hint="Seleccionad una respuesta en cada aspecto de la convivencia."
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {preferenceQuestions.map((question) => (
                  <div
                    key={question.key}
                    className="rounded-18 border border-border bg-surface p-4"
                  >
                    <p className="text-sm font-bold text-brand-dark">
                      {question.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted">
                      {question.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                              "rounded-full border px-3 py-2 text-xs font-semibold transition-colors duration-150",
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
            </div>

            <div>
              <WizardSectionTitle
                title="Sobre vuestra comunidad"
                hint="Esta descripción es obligatoria para que otras personas sepan quiénes sois."
              />
              <div className="mt-4 rounded-18 border border-border bg-surface p-4">
                <Textarea
                  label="Cuéntanos un poco sobre vuestra comunidad"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Somos una comunidad tranquila de estudiantes y trabajadores..."
                  minLength={DESCRIPTION_MIN_LENGTH}
                  required
                  rows={4}
                  className="rounded-14 border-0 bg-surface-soft"
                />
              </div>
            </div>

            <div>
              <WizardSectionTitle
                title="¿Algo importante para vosotros?"
                hint="Es opcional: podéis dejarlo para más adelante."
              />
              <div className="mt-4 rounded-18 border border-border bg-surface p-4">
                <Textarea
                  value={profileDescription}
                  onChange={(event) =>
                    setProfileDescription(event.target.value)
                  }
                  placeholder="Ej.: no fumadores, respeto por los horarios..."
                  maxLength={500}
                  rows={2}
                  className="min-h-20 rounded-14 border-0 bg-surface-soft text-sm"
                />
                {profileDescription && (
                  <button
                    type="button"
                    onClick={() => setProfileDescription("")}
                    className="mt-3 text-sm font-bold text-primary hover:text-primary-hover"
                  >
                    Más tarde
                  </button>
                )}
              </div>
            </div>

            {visibleError && <ErrorBanner message={visibleError} />}

            <button
              type="button"
              onClick={handleCreateCommunity}
              disabled={submitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-24 bg-primary px-6 text-base font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:text-lg"
            >
              {submitting ? (
                <>
                  <LoadingIcon />
                  Creando comunidad...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRightIcon />
                </>
              )}
            </button>

            <p className="-mt-5 text-center text-sm font-semibold text-primary">
              Guardaremos esto para mejorar vuestras coincidencias
            </p>
          </section>
        )}

        {step === 3 && community && user && (
          <section>
            <div className="rounded-24 border border-border bg-surface p-4 shadow-[0_12px_35px_rgba(26,55,43,0.08)] sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <UserAvatar
                    firstName={user.first_name}
                    lastName={user.last_name}
                    userId={user.id}
                    imageUrl={user.avatar_url}
                    size="lg"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-brand-dark">
                      {user.first_name} {user.last_name}
                    </p>
                    <span className="mt-1 inline-flex rounded-full border border-primary/20 bg-surface px-2.5 py-1 text-xs font-bold text-primary-dark shadow-soft">
                      Creador
                    </span>
                  </div>
                </div>

                <span className="shrink-0 text-sm font-semibold text-secondary">
                  1 de {community.max_members}
                </span>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-soft">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${100 / community.max_members}%` }}
                />
              </div>

              <p className="mt-3 text-sm leading-6 text-muted">
                Quedan {Math.max(community.max_members - 1, 0)} plazas. Las
                invitaciones estarán pendientes hasta que cada persona las
                acepte.
              </p>
            </div>

            <div className="mt-8">
              <WizardSectionTitle
                title="Invita con un enlace"
                hint="El enlace permite solicitar unirse, pero no añade a nadie automáticamente."
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleShareInvitation}
                  disabled={invitationLoading}
                  className="flex h-14 items-center justify-center gap-3 rounded-18 bg-primary px-4 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:px-5 sm:text-base"
                >
                  <ShareIcon />
                  {invitationLoading
                    ? "Generando enlace..."
                    : "Compartir enlace"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyInvitation}
                  disabled={invitationLoading}
                  className="flex h-14 items-center justify-center gap-3 rounded-18 border border-border bg-surface px-4 text-sm font-bold text-brand-dark transition hover:border-primary/40 hover:bg-mint-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:px-5 sm:text-base"
                >
                  <CopyIcon />
                  Copiar enlace
                </button>
              </div>

              {invitationToken && (
                <div className="mt-4 flex items-center gap-2 rounded-14 border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary-dark shadow-soft">
                  <CheckCircleIcon className="h-5 w-5" />
                  Enlace de invitación listo
                </div>
              )}
            </div>

            {invitationError && <ErrorBanner message={invitationError} />}

            <div className="mt-8 space-y-2 sm:mt-10 sm:space-y-3">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-24 bg-primary px-6 text-base font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover sm:h-16 sm:text-lg"
              >
                Continuar
                <ArrowRightIcon />
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="h-12 w-full text-sm font-bold text-primary transition hover:text-primary-hover"
              >
                Más tarde
              </button>
            </div>
          </section>
        )}

        {step === 4 && community && (
          <section className="space-y-7">
            <div className="relative text-center">
              <div className="pointer-events-none absolute left-1/2 top-1 h-24 w-56 -translate-x-1/2" aria-hidden="true">
                {[12, 28, 44, 62, 78, 90].map((left, index) => (
                  <span
                    key={left}
                    className={cn(
                      "absolute h-2 w-2 rotate-45 rounded-sm bg-mint-200",
                      index % 2 === 0 ? "top-5" : "top-14"
                    )}
                    style={{ left: `${left}%` }}
                  />
                ))}
              </div>

              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-button">
                <CheckCircleIcon className="h-10 w-10" />
              </div>

              <h1 className="mt-5 text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-brand-dark sm:mt-7 sm:text-5xl">
                ¡Tu comunidad está lista!
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-secondary sm:mt-4 sm:text-lg sm:leading-8">
                Ya podéis empezar a encontrar personas que encajen con
                vuestra forma de convivir.
              </p>
            </div>

            <div className="overflow-hidden rounded-24 border border-border bg-surface shadow-[0_12px_35px_rgba(26,55,43,0.08)]">
              <div className="relative h-32 overflow-hidden bg-mint-50 sm:h-40">
                <Image
                  src="/images/create-community-living-room.webp"
                  alt="Ilustración de un espacio de convivencia compartido"
                  fill
                  sizes="(max-width: 640px) 100vw, 672px"
                  className="object-cover"
                />
              </div>

              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-18 bg-primary text-white ring-4 ring-white">
                    <CommunityHomeIcon />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-bold text-brand-dark">
                      {community.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-secondary">
                      <LocationPinIcon />
                      {community.city}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-bold text-foreground">
                    Miembros ({community.member_count}/{community.max_members})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-sm font-bold text-primary hover:text-primary-hover"
                  >
                    Invitar más
                  </button>
                </div>

                <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
                  {user && (
                    <div className="w-24 shrink-0 rounded-18 border border-border p-3 text-center">
                      <span className="inline-flex rounded-full border border-primary/20 bg-surface px-2 py-0.5 text-[10px] font-bold text-primary-dark shadow-soft">
                        Creador
                      </span>
                      <div className="mx-auto mt-2 w-fit">
                        <UserAvatar
                          firstName={user.first_name}
                          lastName={user.last_name}
                          userId={user.id}
                          imageUrl={user.avatar_url}
                          size="lg"
                        />
                      </div>
                      <p className="mt-2 truncate text-xs font-bold text-brand-dark">
                        {user.first_name}
                      </p>
                    </div>
                  )}

                  {Array.from({
                    length: Math.max(
                      community.max_members - community.member_count,
                      0
                    ),
                  }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-24 shrink-0 text-center text-xs font-semibold text-muted"
                    >
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-secondary/40 text-3xl font-light text-primary">
                        +
                      </span>
                      <span className="mt-2 block">Añadir miembro</span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-primary-dark shadow-soft">
                    {community.member_count} confirmados
                  </span>
                  <span className="rounded-full bg-surface-soft px-3 py-1.5 text-secondary">
                    0 invitaciones pendientes
                  </span>
                  <span className="rounded-full bg-surface-soft px-3 py-1.5 text-secondary">
                    {Math.max(
                      community.max_members - community.member_count,
                      0
                    )}{" "}
                    plazas disponibles
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="text-base font-bold text-foreground">
                  Resumen de preferencias
                </h3>

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

                {community.profile_description && (
                  <div className="mt-3 rounded-14 bg-surface-soft p-4">
                    <p className="text-xs font-semibold text-muted">
                      Importante para vosotros
                    </p>
                    <p className="mt-1 text-sm leading-6 text-brand-dark">
                      {community.profile_description}
                    </p>
                  </div>
                )}

                {invitationToken && (
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-surface px-3 py-1.5 text-xs font-bold text-primary-dark shadow-soft">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Enlace para invitar disponible
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-18 border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm font-bold text-primary-dark">
                Próximo paso
              </p>
              <p className="mt-1 text-sm leading-6 text-secondary">
                Te mostraremos personas y comunidades compatibles. No
                mostraremos pisos que todavía no existen en CoFlow.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleEnterCommunity}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-24 bg-primary px-6 text-base font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover sm:h-16 sm:text-lg"
              >
                Entrar en mi comunidad
                <ArrowRightIcon />
              </button>

              <button
                type="button"
                onClick={handleGoHome}
                className="block h-12 w-full text-center text-sm font-bold text-primary transition hover:text-primary-hover"
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-14 bg-surface-muted p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-primary-dark">
        {value}
      </p>
    </div>
  );
}

function WizardSectionTitle({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <span
        title={hint}
        aria-label={hint}
        className="flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border border-muted text-xs font-bold text-muted"
      >
        i
      </span>
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

function CommunityPeopleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="3" />
      <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19" />
      <path d="M15.5 4.6a3 3 0 0 1 0 5.8" />
      <path d="M17 13a4.5 4.5 0 0 1 3.5 4.4V19" />
    </svg>
  );
}

function AddPeopleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 19v-1.5A4.5 4.5 0 0 1 7 13h2a4.5 4.5 0 0 1 4.5 4.5V19" />
      <path d="M18 8v6M15 11h6" />
    </svg>
  );
}

function CommunityHomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden="true"
    >
      <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z" />
      <path d="M8.5 13.2c0-1.1.9-2 2-2 .7 0 1.2.3 1.5.8.3-.5.8-.8 1.5-.8 1.1 0 2 .9 2 2 0 2-3.5 4.1-3.5 4.1s-3.5-2.1-3.5-4.1Z" />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-primary"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
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
