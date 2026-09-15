"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  Euro,
  House,
  Layers,
  LoaderCircle,
  MessageCircle,
  Plus,
  Save,
  Sofa,
  Sparkles,
  UsersRound,
  WandSparkles,
  X,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";
import type { ResolvedAddress } from "@/components/propietario/AddressAutocomplete";
import OwnerPicker, { type OwnerConflict } from "./OwnerPicker";
import ListingPreview from "./ListingPreview";
import { ChoiceCard, FieldGroup, NumberStepper, QuickChip, StepHeader, ToggleChip, TriStateRow } from "./WizardControls";
import { createAssistedListing } from "@/services/assistedListings";
import {
  deleteTeamPropertyImage,
  getTeamOwner,
  getTeamProperty,
  markTeamPropertyReady,
  reorderTeamPropertyImages,
  setTeamPropertyCover,
  updateTeamProperty,
  uploadTeamPropertyImages,
} from "@/services/team";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import {
  EMPTY_DRAFT,
  EMPTY_NEW_OWNER,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_OPTIONS,
  TEAM_STATUS_LABELS,
  WIZARD_STEPS,
  buildDescription,
  clearStoredWizard,
  cleanNewOwner,
  draftFromProperty,
  getReadiness,
  isPristine,
  readStoredWizard,
  suggestTitle,
  toPayload,
  todayISO,
  validateOwner,
  whatsappHref,
  writeStoredWizard,
  type ListingDraft,
  type OwnerMode,
  type WizardStep,
  isInMalagaProvince,
} from "@/lib/teamListing";
import { cn } from "@/lib/utils";
import type { Amenity, PropertyType } from "@/types/property";
import type { AssistedListingResult, NewOwnerInput, TeamOwner, TeamPropertyDetail } from "@/types/team";

const AddressAutocomplete = dynamic(() => import("@/components/propietario/AddressAutocomplete"));
const PropertyLocationMap = dynamic(() => import("@/components/propietario/PropertyLocationMap"), { ssr: false });
const PropertyImageUploader = dynamic(() => import("@/components/propietario/PropertyImageUploader"));

const TYPE_ICONS: Record<PropertyType, ReactNode> = {
  APARTMENT: <Building2 />,
  SHARED_APARTMENT: <UsersRound />,
  STUDIO: <Sofa />,
  HOUSE: <House />,
  OTHER: <Layers />,
};

const STEP_REQUIREMENTS: Record<Exclude<WizardStep, "cliente">, string[]> = {
  ubicacion: ["address", "postal"],
  vivienda: ["type"],
  precio: ["rent", "deposit", "available"],
  anuncio: ["title", "description"],
  fotos: ["photos"],
};

function readOwnerConflict(error: unknown): OwnerConflict | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;
  const detail = error.response.data?.detail;
  if (detail && typeof detail === "object" && detail.code === "OWNER_EXISTS") {
    return { ownerProfileId: detail.owner_profile_id, displayName: detail.display_name };
  }
  return null;
}

function readMissingFields(error: unknown): string[] | null {
  if (!axios.isAxiosError(error)) return null;
  const detail = error.response?.data?.detail;
  return detail && typeof detail === "object" && Array.isArray(detail.missing_fields) ? detail.missing_fields : null;
}

function firstPendingStep(property: TeamPropertyDetail): WizardStep {
  const pending = getReadiness(draftFromProperty(property), property.images.length).find((item) => !item.done);
  return pending?.step ?? "fotos";
}

export default function AssistedListingWizard({
  amenities,
  initialProperty,
  initialOwner,
}: {
  amenities: Amenity[];
  initialProperty: TeamPropertyDetail | null;
  initialOwner: TeamOwner | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const isEditing = initialProperty !== null;

  const [restored] = useState(() => (isEditing || initialOwner ? null : readStoredWizard()));
  const [showRestored, setShowRestored] = useState(Boolean(restored));
  const [draft, setDraft] = useState<ListingDraft>(() =>
    initialProperty ? draftFromProperty(initialProperty) : restored?.draft ?? EMPTY_DRAFT
  );
  const [ownerMode, setOwnerMode] = useState<OwnerMode>(() => restored?.ownerMode ?? "existing");
  const [selectedOwner, setSelectedOwner] = useState<TeamOwner | null>(
    () => initialProperty?.owner ?? initialOwner ?? restored?.selectedOwner ?? null
  );
  const [newOwner, setNewOwner] = useState<NewOwnerInput>(() => restored?.newOwner ?? EMPTY_NEW_OWNER);
  // Añadir otra vivienda de un cliente ya autorizado no debería obligar
  // a volver al primer paso solo para marcar otra vez la casilla.
  const [consent, setConsent] = useState(() => isEditing || Boolean(initialOwner) || Boolean(restored?.consent));
  const [step, setStep] = useState<WizardStep>(() =>
    initialProperty ? firstPendingStep(initialProperty) : initialOwner ? "ubicacion" : "cliente"
  );

  const [propertyId, setPropertyId] = useState<number | null>(initialProperty?.id ?? null);
  const [property, setProperty] = useState<TeamPropertyDetail | null>(initialProperty);
  const [created, setCreated] = useState<AssistedListingResult | null>(null);
  const [published, setPublished] = useState<TeamPropertyDetail | null>(null);

  const [busy, setBusy] = useState<"idle" | "saving" | "publishing">("idle");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [ownerError, setOwnerError] = useState("");
  const [conflict, setConflict] = useState<OwnerConflict | null>(null);
  const [previousDescription, setPreviousDescription] = useState<string | null>(null);

  const imageCount = property?.images.length ?? 0;
  const readiness = useMemo(() => getReadiness(draft, imageCount), [draft, imageCount]);
  const ownerProblem = propertyId !== null ? null : validateOwner({ mode: ownerMode, selectedOwner, newOwner, consent });
  const isReady = readiness.every((item) => item.done);
  const stepIndex = WIZARD_STEPS.findIndex((item) => item.id === step);
  const ownerName =
    property?.owner.display_name ??
    (ownerMode === "existing"
      ? selectedOwner?.display_name ?? null
      : (newOwner.owner_type !== "INDIVIDUAL" ? newOwner.company_name : newOwner.first_name)?.trim() || null);
  const outsideMalaga = propertyId === null && !isInMalagaProvince(draft);

  // Copia local del alta mientras aún no existe en el servidor.
  useEffect(() => {
    if (propertyId !== null) return;
    if (isPristine(draft, newOwner)) return;
    writeStoredWizard({ draft, ownerMode, selectedOwner, newOwner, consent });
  }, [consent, draft, newOwner, ownerMode, propertyId, selectedOwner]);

  // Con la vivienda ya en el servidor, avisar antes de perder cambios.
  useEffect(() => {
    if (!dirty || propertyId === null || published) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty, propertyId, published]);

  function patch(changes: Partial<ListingDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
    setDirty(true);
    setError("");
  }

  function goTo(next: WizardStep) {
    setStep(next);
    setError("");
    document.getElementById("alta-top")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function stepComplete(id: WizardStep) {
    if (id === "cliente") return ownerProblem === null;
    return readiness.filter((item) => STEP_REQUIREMENTS[id].includes(item.key)).every((item) => item.done);
  }

  function syncCaches(detail: TeamPropertyDetail) {
    queryClient.setQueryData(["team-property", detail.id], detail);
    void queryClient.invalidateQueries({ queryKey: ["team-properties"] });
    void queryClient.invalidateQueries({ queryKey: ["team-owners"] });
  }

  function applyDetail(detail: TeamPropertyDetail) {
    setProperty(detail);
    syncCaches(detail);
  }

  /** Crea el borrador la primera vez y lo actualiza a partir de ahí. */
  async function persist(): Promise<TeamPropertyDetail | null> {
    const payload = toPayload(draft);

    if (propertyId !== null) {
      const updated = await updateTeamProperty(propertyId, payload);
      applyDetail(updated);
      setDirty(false);
      return updated;
    }

    if (ownerProblem) {
      setOwnerError(ownerProblem);
      goTo("cliente");
      return null;
    }

    let result: AssistedListingResult;
    try {
      result = await createAssistedListing(
        ownerMode === "existing" && selectedOwner
          ? { owner_profile_id: selectedOwner.owner_profile_id, property: payload, owner_consent: consent }
          : { owner: cleanNewOwner(newOwner), property: payload, owner_consent: consent }
      );
    } catch (caught) {
      const ownerConflict = readOwnerConflict(caught);
      if (ownerConflict) {
        setConflict(ownerConflict);
        goTo("cliente");
        return null;
      }
      throw caught;
    }

    // A partir de aquí la vivienda existe: aunque falle lo siguiente, un
    // reintento la actualiza en vez de crear un duplicado.
    setPropertyId(result.property_id);
    setCreated(result);
    clearStoredWizard();
    const detail = await getTeamProperty(result.property_id);
    applyDetail(detail);
    setSelectedOwner(detail.owner);
    setDirty(false);
    return detail;
  }

  async function save({ quiet = false }: { quiet?: boolean } = {}) {
    if (busy !== "idle") return false;
    setBusy("saving");
    setError("");
    try {
      const saved = await persist();
      if (!saved) return false;
      if (!quiet) toast.success("Borrador guardado");
      return true;
    } catch (caught) {
      setError(getCommunityErrorMessage(caught, "No hemos podido guardar la vivienda. Inténtalo de nuevo."));
      return false;
    } finally {
      setBusy("idle");
    }
  }

  async function publish() {
    if (busy !== "idle") return;
    setBusy("publishing");
    setError("");
    try {
      const saved = await persist();
      if (!saved) return;
      const ready = saved.status === "READY" ? saved : await markTeamPropertyReady(saved.id);
      applyDetail(ready);
      setPublished(ready);
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    } catch (caught) {
      const missing = readMissingFields(caught);
      setError(
        missing?.length
          ? `Faltan datos para publicar: ${missing.join(", ")}.`
          : getCommunityErrorMessage(caught, "No hemos podido publicar la vivienda.")
      );
    } finally {
      setBusy("idle");
    }
  }

  async function handleNext() {
    const next = WIZARD_STEPS[stepIndex + 1]?.id;
    if (!next) return;
    if (step === "cliente" && ownerProblem) {
      setOwnerError(ownerProblem);
      return;
    }
    // Las fotos se suben directamente a la vivienda, así que al llegar a
    // ese paso el borrador tiene que existir ya en el servidor.
    if (next === "fotos" && !(await save({ quiet: true }))) return;
    goTo(next);
  }

  async function adoptConflictOwner() {
    if (!conflict) return;
    try {
      const owner = await getTeamOwner(conflict.ownerProfileId);
      setSelectedOwner(owner);
      setOwnerMode("existing");
      setConflict(null);
      setOwnerError("");
      toast.success(`La vivienda irá a la cuenta de ${owner.display_name}`);
    } catch (caught) {
      setOwnerError(getCommunityErrorMessage(caught, "No hemos podido cargar ese cliente."));
    }
  }

  function discardRestored() {
    clearStoredWizard();
    setDraft(EMPTY_DRAFT);
    setNewOwner(EMPTY_NEW_OWNER);
    setSelectedOwner(null);
    setOwnerMode("existing");
    setConsent(false);
    setShowRestored(false);
    setStep("cliente");
  }

  function handleAddressResolved(resolved: ResolvedAddress) {
    setDraft((current) => ({
      ...current,
      addressLine: resolved.addressLine || current.addressLine,
      city: resolved.city || current.city,
      province: resolved.province || current.province,
      postalCode: resolved.postalCode || current.postalCode,
      neighborhood: resolved.neighborhood ?? current.neighborhood,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    }));
    setDirty(true);
  }

  function generateDescription() {
    setPreviousDescription(draft.description);
    patch({ description: buildDescription(draft, amenities) });
  }

  async function uploadImages(files: File[], onProgress?: (percent: number) => void) {
    if (propertyId === null) return;
    applyDetail(await uploadTeamPropertyImages(propertyId, files, onProgress));
  }

  if (published) {
    return (
      <PublishedView
        property={published}
        claimUrl={created?.claim_url ?? null}
        onAddAnother={() => router.push(`/equipo/alta-asistida?cliente=${published.owner.owner_profile_id}&nueva=${Date.now()}`)}
      />
    );
  }

  const rentNumber = Number(draft.rent.replace(/\./g, ""));
  const saveStatus =
    busy === "saving"
      ? "Guardando…"
      : propertyId === null
        ? "Sin guardar · copia en este navegador"
        : dirty
          ? "Cambios sin guardar"
          : "Guardado";

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-4 pb-10 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-7xl sm:rounded-sheet sm:p-7 lg:p-8">
      <header id="alta-top" className="flex scroll-mt-28 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="type-overline text-muted">Equipo CoFlow · Alta asistida</p>
          <h1 className="mt-2 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">
            {isEditing ? "Editar vivienda" : "Nueva vivienda"}
          </h1>
          <p className="mt-1 truncate text-sm text-secondary">
            {ownerName ? <>Para <strong className="font-bold text-brand-dark">{ownerName}</strong></> : "Elige primero el cliente"}
            {property ? <> · {TEAM_STATUS_LABELS[property.status]}</> : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/equipo/viviendas"
            className="press-control inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-bold text-brand-dark shadow-soft hover:bg-white"
          >
            <Layers className="h-4 w-4" /> <span className="hidden sm:inline">Todas las viviendas</span>
          </Link>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy !== "idle"}
            className="press-control inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-bold text-brand-dark shadow-soft hover:bg-white disabled:opacity-50"
          >
            {busy === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar borrador
          </button>
        </div>
      </header>

      {showRestored ? (
        <div className="mt-4 flex items-center gap-3 rounded-field bg-surface p-3 pl-4 text-sm shadow-soft">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1 text-secondary">Hemos recuperado el alta que dejaste a medias.</p>
          <button type="button" onClick={discardRestored} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-brand-dark hover:bg-surface-soft">
            Empezar de cero
          </button>
          <button type="button" onClick={() => setShowRestored(false)} aria-label="Cerrar aviso" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-soft">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <nav
        aria-label="Pasos del alta"
        // .scroll-fade-x difumina los 20px de cada borde: el relleno
        // lateral equivalente hace que solo se difumine el hueco vacío.
        className="scroll-fade-x -mx-4 mt-5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden"
      >
        <ol className="flex min-w-max gap-2">
          {WIZARD_STEPS.map((item, index) => {
            const current = item.id === step;
            const complete = stepComplete(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => goTo(item.id)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "press-control flex h-11 items-center gap-2 rounded-full pl-1.5 pr-4 text-sm font-semibold transition-colors",
                    current ? "bg-brand-dark text-white shadow-button" : "bg-surface text-secondary shadow-soft hover:text-brand-dark"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                      current ? "bg-white/15" : complete ? "bg-primary text-white" : "bg-surface-soft text-muted"
                    )}
                  >
                    {complete && !current ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={step}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="rounded-panel bg-surface p-5 shadow-soft sm:p-7"
            >
              {step === "cliente" ? (
                <>
                  <StepHeader
                    title="¿De quién es la vivienda?"
                    description="Si el cliente ya trabaja con CoFlow, como la inmobiliaria, elígelo: la vivienda se añade a su cuenta."
                  />
                  <OwnerPicker
                    mode={ownerMode}
                    onModeChange={(mode) => {
                      setOwnerMode(mode);
                      setOwnerError("");
                    }}
                    selectedOwner={selectedOwner}
                    onSelectOwner={(owner) => {
                      setSelectedOwner(owner);
                      setOwnerError("");
                    }}
                    newOwner={newOwner}
                    onNewOwnerChange={(changes) => {
                      setNewOwner((current) => ({ ...current, ...changes }));
                      setOwnerError("");
                      if ("email" in changes) setConflict(null);
                    }}
                    consent={consent}
                    onConsentChange={(value) => {
                      setConsent(value);
                      setOwnerError("");
                    }}
                    conflict={conflict}
                    onAdoptConflict={() => void adoptConflictOwner()}
                    locked={propertyId !== null}
                    error={ownerError}
                  />
                </>
              ) : null}

              {step === "ubicacion" ? (
                <>
                  <StepHeader
                    title="¿Dónde está?"
                    description="Busca la calle y el número: rellenamos el código postal, el barrio y el punto en el mapa."
                  />
                  <AddressAutocomplete
                    value={draft.addressLine}
                    onChange={(value) => patch({ addressLine: value })}
                    onResolved={handleAddressResolved}
                  />
                  {outsideMalaga ? (
                    <p className="mt-3 flex items-center gap-2 rounded-field bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      <CircleAlert className="h-4 w-4 shrink-0" />
                      Esta dirección no parece estar en la provincia de Málaga{draft.city ? ` (${draft.city})` : ""}. El alta asistida admite toda la provincia: revisa el código postal (empieza por 29).
                    </p>
                  ) : null}
                  {draft.latitude !== null && draft.longitude !== null ? (
                    <div className="mt-4 overflow-hidden rounded-field">
                      <PropertyLocationMap
                        address={draft.addressLine}
                        latitude={draft.latitude}
                        longitude={draft.longitude}
                        onCoordinatesChange={(coordinates) => patch({ latitude: coordinates.latitude, longitude: coordinates.longitude })}
                        onAddressResolved={handleAddressResolved}
                      />
                    </div>
                  ) : null}
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <Input label="Código postal" inputMode="numeric" value={draft.postalCode} onChange={(event) => patch({ postalCode: event.target.value })} placeholder="29001" maxLength={15} />
                    <Input label="Barrio o zona" value={draft.neighborhood} onChange={(event) => patch({ neighborhood: event.target.value })} placeholder="Soho" maxLength={120} />
                    <Input label="Planta y puerta" value={draft.floor} onChange={(event) => patch({ floor: event.target.value })} placeholder="3º B" maxLength={20} />
                  </div>
                </>
              ) : null}

              {step === "vivienda" ? (
                <>
                  <StepHeader title="Cómo es la vivienda" description="Toca en vez de escribir: tipo, espacios y equipamiento." />
                  <div className="space-y-6">
                    <FieldGroup title="Tipo de vivienda">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {PROPERTY_TYPE_OPTIONS.map((option) => (
                          <ChoiceCard
                            key={option.value}
                            label={PROPERTY_TYPE_LABELS[option.value]}
                            hint={option.hint}
                            icon={TYPE_ICONS[option.value]}
                            active={draft.propertyType === option.value}
                            onClick={() => patch({ propertyType: option.value })}
                          />
                        ))}
                      </div>
                    </FieldGroup>

                    <FieldGroup title="Espacios">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <NumberStepper
                          label="Habitaciones"
                          value={draft.bedrooms}
                          min={0}
                          max={20}
                          onChange={(value) => patch({ bedrooms: value, maxTenants: Math.max(draft.maxTenants, value) })}
                        />
                        <NumberStepper label="Baños" value={draft.bathrooms} min={1} max={10} onChange={(value) => patch({ bathrooms: value })} />
                        <NumberStepper label="Plazas" value={draft.maxTenants} min={1} max={20} onChange={(value) => patch({ maxTenants: value })} />
                        <Input
                          aria-label="Superficie en metros cuadrados"
                          inputMode="numeric"
                          value={draft.surfaceM2}
                          onChange={(event) => patch({ surfaceM2: event.target.value.replace(/[^\d]/g, "") })}
                          placeholder="Superficie (m²)"
                          className="h-15 rounded-field"
                        />
                      </div>
                    </FieldGroup>

                    <FieldGroup title="Características">
                      <div className="flex flex-wrap gap-2">
                        <ToggleChip label="Amueblado" icon={<Sofa />} active={draft.furnished} onClick={() => patch({ furnished: !draft.furnished })} />
                        <ToggleChip label="Ascensor" icon={<Plus />} active={draft.hasElevator} onClick={() => patch({ hasElevator: !draft.hasElevator })} />
                      </div>
                    </FieldGroup>

                    {amenities.length > 0 ? (
                      <FieldGroup title="Equipamiento" description={`${draft.amenityIds.length} seleccionados`}>
                        <div className="flex flex-wrap gap-2">
                          {amenities.map((amenity) => {
                            const active = draft.amenityIds.includes(amenity.id);
                            return (
                              <ToggleChip
                                key={amenity.id}
                                label={amenity.label}
                                icon={<Plus />}
                                active={active}
                                onClick={() =>
                                  patch({
                                    amenityIds: active
                                      ? draft.amenityIds.filter((id) => id !== amenity.id)
                                      : [...draft.amenityIds, amenity.id],
                                  })
                                }
                              />
                            );
                          })}
                        </div>
                      </FieldGroup>
                    ) : null}
                  </div>
                </>
              ) : null}

              {step === "precio" ? (
                <>
                  <StepHeader title="Precio y condiciones" description="Lo que primero mira quien busca: cuánto cuesta y desde cuándo está libre." />
                  <div className="space-y-6">
                    <FieldGroup title="Alquiler">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Input
                            label="Alquiler mensual"
                            inputMode="numeric"
                            value={draft.rent}
                            onChange={(event) => patch({ rent: event.target.value.replace(/[^\d]/g, "") })}
                            placeholder="950"
                            leftElement={<Euro className="h-4 w-4" />}
                          />
                          <div className="mt-2">
                            <ToggleChip
                              label="Gastos incluidos"
                              icon={<Plus />}
                              active={draft.utilitiesIncluded}
                              onClick={() => patch({ utilitiesIncluded: !draft.utilitiesIncluded })}
                            />
                          </div>
                        </div>
                        <div>
                          <Input
                            label="Fianza"
                            inputMode="numeric"
                            value={draft.deposit}
                            onChange={(event) => patch({ deposit: event.target.value.replace(/[^\d]/g, "") })}
                            placeholder="950"
                            leftElement={<Euro className="h-4 w-4" />}
                          />
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {[1, 2].map((months) => {
                              const value = Number.isFinite(rentNumber) && draft.rent ? String(rentNumber * months) : "";
                              return (
                                <QuickChip
                                  key={months}
                                  label={months === 1 ? "1 mes" : `${months} meses`}
                                  disabled={!value}
                                  active={Boolean(value) && draft.deposit === value}
                                  onClick={() => patch({ deposit: value })}
                                />
                              );
                            })}
                            <QuickChip label="Sin fianza" active={draft.deposit === "0"} onClick={() => patch({ deposit: "0" })} />
                          </div>
                        </div>
                      </div>
                    </FieldGroup>

                    <FieldGroup title="Disponibilidad">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Input
                            label="Disponible desde"
                            type="date"
                            value={draft.availableFrom}
                            onChange={(event) => patch({ availableFrom: event.target.value })}
                          />
                          <div className="mt-2">
                            <QuickChip label="Inmediata" active={draft.availableFrom === todayISO()} onClick={() => patch({ availableFrom: todayISO() })} />
                          </div>
                        </div>
                        <div>
                          <Input
                            label="Estancia mínima (meses)"
                            inputMode="numeric"
                            value={draft.minimumStay}
                            onChange={(event) => patch({ minimumStay: event.target.value.replace(/[^\d]/g, "") })}
                            placeholder="Sin mínimo"
                          />
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <QuickChip label="Sin mínimo" active={draft.minimumStay === ""} onClick={() => patch({ minimumStay: "" })} />
                            {["6", "12"].map((months) => (
                              <QuickChip key={months} label={`${months} meses`} active={draft.minimumStay === months} onClick={() => patch({ minimumStay: months })} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </FieldGroup>

                    <FieldGroup title="Condiciones" description="Déjalo en «Sin definir» si no es una condición firme.">
                      <div className="divide-y divide-border">
                        <TriStateRow label="Mascotas" value={draft.petsAllowed} onChange={(value) => patch({ petsAllowed: value })} />
                        <TriStateRow label="Parejas" value={draft.couplesAllowed} onChange={(value) => patch({ couplesAllowed: value })} />
                        <TriStateRow label="Estudiantes" value={draft.studentsAllowed} onChange={(value) => patch({ studentsAllowed: value })} />
                        <TriStateRow label="Empadronamiento" value={draft.registrationAllowed} onChange={(value) => patch({ registrationAllowed: value })} />
                        <TriStateRow label="Fumar" value={draft.smokingAllowed} onChange={(value) => patch({ smokingAllowed: value })} />
                      </div>
                    </FieldGroup>
                  </div>
                </>
              ) : null}

              {step === "anuncio" ? (
                <>
                  <StepHeader title="El anuncio" description="Con los datos que ya has metido te proponemos título y descripción. Revísalos y ajusta lo que quieras." />
                  <div className="space-y-6">
                    <FieldGroup
                      title="Título"
                      action={
                        <button
                          type="button"
                          onClick={() => patch({ title: suggestTitle(draft) })}
                          className="press-control inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-soft px-3 text-xs font-bold text-brand-dark hover:bg-black/[0.06]"
                        >
                          <WandSparkles className="h-3.5 w-3.5" /> Sugerir
                        </button>
                      }
                    >
                      <Input
                        value={draft.title}
                        onChange={(event) => patch({ title: event.target.value })}
                        placeholder="Piso de 3 habitaciones en el Soho"
                        maxLength={150}
                        helperText={`${draft.title.trim().length}/150`}
                        aria-label="Título del anuncio"
                      />
                    </FieldGroup>

                    <FieldGroup
                      title="Descripción"
                      action={
                        <div className="flex items-center gap-1.5">
                          {previousDescription !== null ? (
                            <button
                              type="button"
                              onClick={() => {
                                patch({ description: previousDescription });
                                setPreviousDescription(null);
                              }}
                              className="rounded-full px-3 py-2 text-xs font-bold text-secondary hover:text-brand-dark"
                            >
                              Deshacer
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={generateDescription}
                            className="press-control inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-soft px-3 text-xs font-bold text-brand-dark hover:bg-black/[0.06]"
                          >
                            <WandSparkles className="h-3.5 w-3.5" /> Redactar con los datos
                          </button>
                        </div>
                      }
                    >
                      <Textarea
                        value={draft.description}
                        onChange={(event) => {
                          patch({ description: event.target.value });
                          setPreviousDescription(null);
                        }}
                        rows={9}
                        placeholder="Cuenta cómo es la vivienda, la luz, la zona y el transporte cercano…"
                        helperText={
                          draft.description.trim().length >= 30
                            ? `${draft.description.trim().length} caracteres`
                            : `${draft.description.trim().length}/30 caracteres mínimo`
                        }
                        aria-label="Descripción del anuncio"
                        className="min-h-56"
                      />
                    </FieldGroup>
                  </div>
                </>
              ) : null}

              {step === "fotos" ? (
                <>
                  <StepHeader title="Fotos" description="Arrastra varias a la vez. La primera es la portada; puedes cambiarla y reordenarlas." />
                  {propertyId !== null ? (
                    <PropertyImageUploader
                      images={property?.images ?? []}
                      onUpload={uploadImages}
                      onDelete={async (imageId) => applyDetail(await deleteTeamPropertyImage(propertyId, imageId))}
                      onSetCover={async (imageId) => applyDetail(await setTeamPropertyCover(propertyId, imageId))}
                      onReorder={async (imageIds) => applyDetail(await reorderTeamPropertyImages(propertyId, imageIds))}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 rounded-field bg-surface-soft px-6 py-10 text-center">
                      <p className="text-sm text-secondary">Guardamos el borrador para poder subir las fotos.</p>
                      <button
                        type="button"
                        onClick={() => void save({ quiet: true })}
                        disabled={busy !== "idle"}
                        className="press-control inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {busy === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar y subir fotos
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </motion.section>
          </AnimatePresence>

          {error ? (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-field bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          ) : null}

          <div className="sticky bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.75rem)] z-20 mt-4 md:bottom-6">
            <div className="material-chrome flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/90 p-1.5 shadow-overlay backdrop-blur-xl">
              <button
                type="button"
                onClick={() => stepIndex > 0 && goTo(WIZARD_STEPS[stepIndex - 1].id)}
                disabled={stepIndex === 0 || busy !== "idle"}
                aria-label="Paso anterior"
                className="press-control flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-brand-dark disabled:opacity-35 sm:w-auto sm:gap-2 sm:px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden text-sm font-bold sm:inline">Atrás</span>
              </button>
              <div className="min-w-0 flex-1 px-1">
                <p className="truncate text-xs font-bold text-brand-dark">
                  Paso {stepIndex + 1} de {WIZARD_STEPS.length} · {WIZARD_STEPS[stepIndex].label}
                </p>
                <p className="truncate text-2xs text-muted">{saveStatus}</p>
              </div>
              {step !== "fotos" ? (
                <button
                  type="button"
                  onClick={() => void handleNext()}
                  disabled={busy !== "idle"}
                  className="press-control inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button disabled:opacity-50"
                >
                  {busy === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void publish()}
                  disabled={busy !== "idle" || !isReady}
                  className="press-control inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button disabled:opacity-40"
                >
                  {busy === "publishing" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheck className="h-4 w-4" />}
                  {property?.status === "READY" ? "Guardar" : "Publicar"}
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="xl:sticky xl:top-[calc(var(--mobile-header-height)+1.5rem)]">
          <ListingPreview
            draft={draft}
            coverUrl={(property?.images.find((image) => image.is_cover) ?? property?.images[0])?.image_url ?? null}
            imageCount={imageCount}
            ownerName={ownerName}
            statusLabel={property ? TEAM_STATUS_LABELS[property.status] : "Nueva"}
            readiness={readiness}
            onJump={goTo}
            publishLabel={property?.status === "READY" ? "Guardar cambios" : "Publicar vivienda"}
            publishing={busy === "publishing"}
            disabled={busy !== "idle"}
            onPublish={() => void publish()}
          />
        </aside>
      </div>
    </div>
  );
}

function PublishedView({
  property,
  claimUrl,
  onAddAnother,
}: {
  property: TeamPropertyDetail;
  claimUrl: string | null;
  onAddAnother: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const owner = property.owner;
  const greeting = owner.first_name && owner.first_name !== "Propietario" ? owner.first_name : owner.display_name;
  const invitation = claimUrl
    ? `Hola ${greeting}, ya tienes tu vivienda en CoFlow. Activa tu cuenta para verla y gestionarla: ${claimUrl}`
    : "";

  async function copyLink() {
    if (!claimUrl) return;
    try {
      await navigator.clipboard.writeText(claimUrl);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No hemos podido copiar el enlace");
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-10">
      <motion.section
        initial={{ opacity: 0, y: reducedMotion ? 0 : 10, scale: reducedMotion ? 1 : 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="rounded-sheet bg-surface p-6 text-center shadow-card sm:p-10"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-button">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </span>
        <p className="type-overline mt-6 text-muted">Vivienda publicada</p>
        <h1 className="mt-2 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark">{property.title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary">
          Ya está en la cuenta de <strong className="font-bold text-brand-dark">{owner.display_name}</strong>
          {owner.property_count ? `, que tiene ${owner.property_count} ${owner.property_count === 1 ? "vivienda" : "viviendas"} en CoFlow` : ""}.
        </p>

        {claimUrl ? (
          <div className="mt-7 rounded-panel bg-surface-soft p-4 text-left sm:p-5">
            <p className="text-sm font-bold text-brand-dark">Enlace para que active su cuenta</p>
            <p className="mt-1 text-xs leading-5 text-secondary">
              {owner.email ? `Se lo hemos enviado a ${owner.email}. ` : ""}Es personal, de un solo uso y caduca en 7 días.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={claimUrl}
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Enlace de activación"
                className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-xs text-secondary outline-none"
              />
              <button type="button" onClick={() => void copyLink()} className="press-control inline-flex h-11 items-center justify-center gap-2 rounded-full bg-surface px-4 text-sm font-bold text-brand-dark shadow-soft">
                <Copy className="h-4 w-4" /> Copiar
              </button>
              <a
                href={whatsappHref(owner.phone, invitation)}
                target="_blank"
                rel="noreferrer"
                className="press-control inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1f8f4e] px-4 text-sm font-bold text-white"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        ) : null}

        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onAddAnother}
            className="press-control inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button sm:col-span-2"
          >
            <Plus className="h-4 w-4" /> Añadir otra vivienda de {owner.display_name}
          </button>
          <Link href={`/equipo/viviendas/${property.id}`} className="press-control inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface-soft px-5 text-sm font-bold text-brand-dark">
            Ver ficha
          </Link>
          <Link href="/equipo/viviendas" className="press-control inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface-soft px-5 text-sm font-bold text-brand-dark">
            <Layers className="h-4 w-4" /> Todas las viviendas
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
