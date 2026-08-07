"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import PropertyImageUploader from "./PropertyImageUploader";
import AddressAutocomplete, {
  type ResolvedAddress,
} from "./AddressAutocomplete";
import {
  createProperty,
  deletePropertyImage,
  getPropertyAmenities,
  markPropertyReady,
  reorderPropertyImages,
  setPropertyImageCover,
  updateProperty,
  uploadPropertyImages,
} from "@/services/properties";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type {
  Amenity,
  Property,
  PropertyCreate,
  PropertyType,
} from "@/types/property";

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "APARTMENT", label: "Piso" },
  { value: "HOUSE", label: "Casa" },
  { value: "STUDIO", label: "Estudio" },
  { value: "SHARED_APARTMENT", label: "Piso preparado para compartir" },
  { value: "OTHER", label: "Otro" },
];

const STEP_TITLES = [
  "Información básica",
  "Características",
  "Condiciones económicas",
  "Condiciones del alquiler",
  "Fotografías y resumen",
];

const STEP_TIPS = [
  "Un título claro y una descripción detallada son lo primero que verán los inquilinos: menciona la zona, la luz, el transporte cercano y qué hace especial a la vivienda.",
  "Estos datos ayudan a los inquilinos a filtrar pisos que encajan con lo que buscan. Cuanto más completo, menos preguntas tendrás que responder luego.",
  "El alquiler y la fianza son opcionales por ahora, pero indícalos si ya los tienes claros: son el primer filtro que usa cualquier inquilino.",
  "\"Sin definir\" significa que ese criterio no aparecerá como filtro, ni a favor ni en contra. Márcalo como Sí o No solo si es una condición firme.",
  "Sube al menos 3-4 fotografías con buena luz: portada del salón, dormitorios y cocina. Podrás añadir más y reordenarlas cuando quieras.",
];

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function PropertyForm({
  initialProperty = null,
}: {
  initialProperty?: Property | null;
}) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [maxStepReached, setMaxStepReached] = useState<1 | 2 | 3 | 4 | 5>(
    initialProperty ? 5 : 1
  );
  const [property, setProperty] = useState<Property | null>(initialProperty);
  const [propertyId, setPropertyId] = useState<number | null>(
    initialProperty?.id ?? null
  );
  const [draftSavedNotice, setDraftSavedNotice] = useState(false);

  const [title, setTitle] = useState(initialProperty?.title ?? "");
  const [description, setDescription] = useState(
    initialProperty?.description ?? ""
  );
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialProperty?.property_type ?? "APARTMENT"
  );
  const [city, setCity] = useState(initialProperty?.city ?? "");
  const [province, setProvince] = useState(initialProperty?.province ?? "");
  const [addressLine, setAddressLine] = useState(
    initialProperty?.address_line ?? ""
  );
  const [neighborhood, setNeighborhood] = useState(
    initialProperty?.neighborhood ?? ""
  );
  const [postalCode, setPostalCode] = useState(
    initialProperty?.postal_code ?? ""
  );
  const [latitude, setLatitude] = useState<number | null>(
    initialProperty?.latitude ?? null
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialProperty?.longitude ?? null
  );

  const [surfaceM2, setSurfaceM2] = useState(
    initialProperty?.surface_m2 !== null &&
      initialProperty?.surface_m2 !== undefined
      ? String(initialProperty.surface_m2)
      : ""
  );
  const [bedrooms, setBedrooms] = useState(
    String(initialProperty?.bedrooms ?? 1)
  );
  const [bathrooms, setBathrooms] = useState(
    String(initialProperty?.bathrooms ?? 1)
  );
  const [floor, setFloor] = useState(initialProperty?.floor ?? "");
  const [hasElevator, setHasElevator] = useState(
    initialProperty?.has_elevator ?? false
  );
  const [furnished, setFurnished] = useState(
    initialProperty?.furnished ?? false
  );
  const [maxTenants, setMaxTenants] = useState(
    String(initialProperty?.max_tenants ?? 1)
  );
  const [amenityIds, setAmenityIds] = useState<number[]>(
    initialProperty?.amenities.map((amenity) => amenity.id) ?? []
  );
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  const [totalMonthlyRent, setTotalMonthlyRent] = useState(
    initialProperty?.total_monthly_rent !== null &&
      initialProperty?.total_monthly_rent !== undefined
      ? String(initialProperty.total_monthly_rent)
      : ""
  );
  const [deposit, setDeposit] = useState(
    initialProperty?.deposit !== null && initialProperty?.deposit !== undefined
      ? String(initialProperty.deposit)
      : ""
  );
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(
    initialProperty?.utilities_included ?? false
  );
  const [availableFrom, setAvailableFrom] = useState(
    toDateInputValue(initialProperty?.available_from ?? null)
  );
  const [minimumStayMonths, setMinimumStayMonths] = useState(
    initialProperty?.minimum_stay_months !== null &&
      initialProperty?.minimum_stay_months !== undefined
      ? String(initialProperty.minimum_stay_months)
      : ""
  );

  const [petsAllowed, setPetsAllowed] = useState<boolean | null>(
    initialProperty?.pets_allowed ?? null
  );
  const [smokingAllowed, setSmokingAllowed] = useState<boolean | null>(
    initialProperty?.smoking_allowed ?? null
  );
  const [couplesAllowed, setCouplesAllowed] = useState<boolean | null>(
    initialProperty?.couples_allowed ?? null
  );
  const [studentsAllowed, setStudentsAllowed] = useState<boolean | null>(
    initialProperty?.students_allowed ?? null
  );
  const [registrationAllowed, setRegistrationAllowed] = useState<
    boolean | null
  >(initialProperty?.registration_allowed ?? null);
  const [additionalRequirements, setAdditionalRequirements] = useState(
    initialProperty?.additional_requirements ?? ""
  );

  const [validationError, setValidationError] = useState("");
  const [saving, setSaving] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [readyError, setReadyError] = useState("");

  useEffect(() => {
    let active = true;

    getPropertyAmenities()
      .then((data) => {
        if (active) setAmenities(data);
      })
      .catch(() => {
        // El catálogo de amenities no es crítico para completar el piso.
      });

    return () => {
      active = false;
    };
  }, []);

  const progress = (step / 5) * 100;

  function handleAddressResolved(resolved: ResolvedAddress) {
    setCity(resolved.city);
    setProvince(resolved.province);
    setPostalCode(resolved.postalCode);
    if (resolved.neighborhood) setNeighborhood(resolved.neighborhood);
    setLatitude(resolved.latitude);
    setLongitude(resolved.longitude);
  }

  function toggleAmenity(id: number) {
    setAmenityIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function validateStep1(): string | null {
    if (title.trim().length < 5 || title.trim().length > 150) {
      return "El título debe tener entre 5 y 150 caracteres.";
    }
    if (description.trim().length < 30) {
      return "La descripción debe tener al menos 30 caracteres.";
    }
    if (!city.trim()) return "La ciudad es obligatoria.";
    if (!province.trim()) return "La provincia es obligatoria.";
    if (!addressLine.trim()) return "La dirección es obligatoria.";
    if (!postalCode.trim()) return "El código postal es obligatorio.";
    return null;
  }

  function validateStep2(): string | null {
    const parsedBedrooms = Number(bedrooms);
    const parsedBathrooms = Number(bathrooms);
    const parsedMaxTenants = Number(maxTenants);

    if (!Number.isInteger(parsedBedrooms) || parsedBedrooms < 0) {
      return "Indica un número de habitaciones válido.";
    }
    if (!Number.isInteger(parsedBathrooms) || parsedBathrooms < 1) {
      return "Indica al menos 1 baño.";
    }
    if (!Number.isInteger(parsedMaxTenants) || parsedMaxTenants < 1) {
      return "Indica un máximo de inquilinos válido.";
    }
    if (surfaceM2 && Number(surfaceM2) <= 0) {
      return "La superficie debe ser mayor que 0.";
    }
    return null;
  }

  function validateStep3(): string | null {
    if (totalMonthlyRent && Number(totalMonthlyRent) < 0) {
      return "El alquiler mensual debe ser una cantidad válida.";
    }
    if (deposit && Number(deposit) < 0) {
      return "La fianza debe ser una cantidad válida.";
    }
    if (minimumStayMonths && Number(minimumStayMonths) < 1) {
      return "La estancia mínima debe ser de al menos 1 mes.";
    }
    return null;
  }

  function buildPayload(): PropertyCreate {
    return {
      title: title.trim(),
      description: description.trim(),
      property_type: propertyType,
      address_line: addressLine.trim(),
      city: city.trim(),
      province: province.trim(),
      postal_code: postalCode.trim(),
      neighborhood: neighborhood.trim() || null,
      latitude,
      longitude,
      surface_m2: surfaceM2 ? Number(surfaceM2) : null,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      floor: floor.trim() || null,
      has_elevator: hasElevator,
      furnished: furnished,
      max_tenants: Number(maxTenants),
      total_monthly_rent: totalMonthlyRent ? Number(totalMonthlyRent) : null,
      deposit: deposit ? Number(deposit) : null,
      utilities_included: utilitiesIncluded,
      available_from: availableFrom || null,
      minimum_stay_months: minimumStayMonths
        ? Number(minimumStayMonths)
        : null,
      pets_allowed: petsAllowed,
      smoking_allowed: smokingAllowed,
      couples_allowed: couplesAllowed,
      students_allowed: studentsAllowed,
      registration_allowed: registrationAllowed,
      additional_requirements: additionalRequirements.trim() || null,
      amenity_ids: amenityIds,
    };
  }

  async function persist(): Promise<Property> {
    const payload = buildPayload();

    const saved = propertyId
      ? await updateProperty(propertyId, payload)
      : await createProperty(payload);

    setProperty(saved);
    setPropertyId(saved.id);

    return saved;
  }

  async function goToStep(next: 1 | 2 | 3 | 4 | 5) {
    setValidationError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(next);
    setMaxStepReached((current) => (next > current ? next : current));
  }

  function handleStepNavigatorClick(target: 1 | 2 | 3 | 4 | 5) {
    if (target > maxStepReached || target === step) return;
    goToStep(target);
  }

  async function handleContinue() {
    if (step === 1) {
      const error = validateStep1();
      if (error) return setValidationError(error);
      return goToStep(2);
    }

    if (step === 2) {
      const error = validateStep2();
      if (error) return setValidationError(error);
      return goToStep(3);
    }

    if (step === 3) {
      const error = validateStep3();
      if (error) return setValidationError(error);
      return goToStep(4);
    }

    if (step === 4) {
      setSaving(true);
      setValidationError("");

      try {
        await persist();
        await goToStep(5);
        setDraftSavedNotice(true);
        window.setTimeout(() => setDraftSavedNotice(false), 4000);
      } catch (error) {
        setValidationError(
          getCommunityErrorMessage(
            error,
            "No pudimos guardar el piso. Inténtalo de nuevo."
          )
        );
      } finally {
        setSaving(false);
      }
    }
  }

  async function handleSaveDraft() {
    if (saving) return;
    setSaving(true);
    setValidationError("");

    try {
      const saved = await persist();
      router.push(`/propietarios/pisos/${saved.id}`);
    } catch (error) {
      setValidationError(
        getCommunityErrorMessage(
          error,
          "No pudimos guardar el borrador. Inténtalo de nuevo."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkReady() {
    if (!propertyId || markingReady) return;

    setMarkingReady(true);
    setReadyError("");
    setMissingFields([]);

    try {
      await persist();
      const updated = await markPropertyReady(propertyId);
      setProperty(updated);
      router.push(`/propietarios/pisos/${propertyId}`);
    } catch (error: unknown) {
      const detail = (
        error as {
          response?: { data?: { detail?: { missing_fields?: string[] } } };
        }
      )?.response?.data?.detail;

      if (detail && Array.isArray(detail.missing_fields)) {
        setMissingFields(detail.missing_fields);
        setReadyError("El piso todavía no puede marcarse como preparado.");
      } else {
        setReadyError(
          getCommunityErrorMessage(
            error,
            "No pudimos marcar el piso como preparado."
          )
        );
      }
    } finally {
      setMarkingReady(false);
    }
  }

  async function handleUploadImages(
    files: File[],
    onProgress?: (percent: number) => void
  ) {
    if (!propertyId) return;
    const updated = await uploadPropertyImages(propertyId, files, onProgress);
    setProperty(updated);
  }

  async function handleDeleteImage(imageId: number) {
    if (!propertyId) return;
    const updated = await deletePropertyImage(propertyId, imageId);
    setProperty(updated);
  }

  async function handleSetCover(imageId: number) {
    if (!propertyId) return;
    const updated = await setPropertyImageCover(propertyId, imageId);
    setProperty(updated);
  }

  async function handleReorderImages(imageIds: number[]) {
    if (!propertyId) return;
    const updated = await reorderPropertyImages(propertyId, imageIds);
    setProperty(updated);
  }

  const imageCount = property?.images.length ?? 0;

  const summaryItems = useMemo(
    () => [
      { label: "Título", value: title },
      {
        label: "Tipo",
        value:
          PROPERTY_TYPE_OPTIONS.find((option) => option.value === propertyType)
            ?.label ?? propertyType,
      },
      { label: "Ubicación", value: `${city}, ${province}` },
      {
        label: "Alquiler mensual",
        value: totalMonthlyRent ? `${totalMonthlyRent} €/mes` : "Sin definir",
      },
      { label: "Fotografías", value: `${imageCount}` },
    ],
    [title, propertyType, city, province, totalMonthlyRent, imageCount]
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          Paso {step} de 5
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {STEP_TITLES[step - 1]}
        </h1>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-soft">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {STEP_TITLES.map((title, index) => {
            const stepNumber = (index + 1) as 1 | 2 | 3 | 4 | 5;
            const reachable = stepNumber <= maxStepReached;
            const current = stepNumber === step;

            return (
              <button
                key={title}
                type="button"
                onClick={() => handleStepNavigatorClick(stepNumber)}
                disabled={!reachable}
                aria-current={current ? "step" : undefined}
                title={title}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-bold transition ${
                  current
                    ? "border-brand bg-brand text-white"
                    : reachable
                      ? "border-line bg-surface text-foreground hover:border-brand/40"
                      : "cursor-not-allowed border-line bg-surface-soft text-muted"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    current
                      ? "bg-white/20"
                      : reachable
                        ? "bg-brand/10 text-brand-dark"
                        : "bg-line text-muted"
                  }`}
                >
                  {stepNumber}
                </span>
                <span className="hidden sm:inline">{title}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-6 flex gap-2.5 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm leading-6 text-primary-dark">
        <InfoIcon />
        <p>{STEP_TIPS[step - 1]}</p>
      </div>

      <div className="mt-8 rounded-[2rem] border border-line bg-surface p-5 shadow-sm sm:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <Input
              label="Título"
              helperText={`${title.trim().length}/150 caracteres (mínimo 5)`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Piso luminoso cerca del centro"
              maxLength={150}
              required
            />

            <Textarea
              label="Descripción"
              helperText={
                description.trim().length >= 30
                  ? `${description.trim().length} caracteres`
                  : `${description.trim().length}/30 caracteres mínimo`
              }
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe la vivienda, la zona y lo que la hace especial..."
              rows={5}
              required
            />

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Tipo de vivienda
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {PROPERTY_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPropertyType(option.value)}
                    className={`rounded-2xl border p-3 text-left text-sm font-bold transition ${
                      propertyType === option.value
                        ? "border-brand bg-brand/10 text-brand-dark"
                        : "border-line bg-surface text-muted hover:border-brand/40"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Ciudad"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
              />
              <Input
                label="Provincia"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                required
              />
            </div>

            <AddressAutocomplete
              value={addressLine}
              onChange={setAddressLine}
              onResolved={handleAddressResolved}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Barrio o zona"
                helperText="Opcional"
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
              />
              <Input
                label="Código postal"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                required
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Superficie (m²)"
                helperText="Opcional"
                type="number"
                inputMode="numeric"
                min={1}
                value={surfaceM2}
                onChange={(event) => setSurfaceM2(event.target.value)}
              />
              <Input
                label="Planta"
                helperText="Opcional"
                value={floor}
                onChange={(event) => setFloor(event.target.value)}
                placeholder="Ej. 3ºB"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Habitaciones"
                type="number"
                inputMode="numeric"
                min={0}
                value={bedrooms}
                onChange={(event) => setBedrooms(event.target.value)}
                required
              />
              <Input
                label="Baños"
                type="number"
                inputMode="numeric"
                min={1}
                value={bathrooms}
                onChange={(event) => setBathrooms(event.target.value)}
                required
              />
            </div>

            <Input
              label="Máximo de inquilinos"
              type="number"
              inputMode="numeric"
              min={1}
              value={maxTenants}
              onChange={(event) => setMaxTenants(event.target.value)}
              required
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleOption
                label="Ascensor"
                checked={hasElevator}
                onChange={setHasElevator}
              />
              <ToggleOption
                label="Amueblado"
                checked={furnished}
                onChange={setFurnished}
              />
            </div>

            {amenities.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Servicios y equipamiento
                </p>

                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => {
                    const active = amenityIds.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-brand bg-brand/10 text-brand-dark"
                            : "border-line bg-surface text-muted hover:border-brand/40"
                        }`}
                      >
                        {amenity.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Alquiler mensual total"
                helperText="En euros"
                type="number"
                inputMode="numeric"
                min={0}
                value={totalMonthlyRent}
                onChange={(event) => setTotalMonthlyRent(event.target.value)}
                placeholder="Ej. 950"
              />
              <Input
                label="Fianza"
                helperText="En euros"
                type="number"
                inputMode="numeric"
                min={0}
                value={deposit}
                onChange={(event) => setDeposit(event.target.value)}
                placeholder="Ej. 950"
              />
            </div>

            <ToggleOption
              label="Gastos incluidos en el alquiler"
              checked={utilitiesIncluded}
              onChange={setUtilitiesIncluded}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Fecha disponible"
                type="date"
                value={availableFrom}
                onChange={(event) => setAvailableFrom(event.target.value)}
              />
              <Input
                label="Estancia mínima (meses)"
                helperText="Opcional"
                type="number"
                inputMode="numeric"
                min={1}
                value={minimumStayMonths}
                onChange={(event) =>
                  setMinimumStayMonths(event.target.value)
                }
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <TriStateOption
              label="¿Se admiten mascotas?"
              value={petsAllowed}
              onChange={setPetsAllowed}
            />
            <TriStateOption
              label="¿Se permite fumar?"
              value={smokingAllowed}
              onChange={setSmokingAllowed}
            />
            <TriStateOption
              label="¿Se admiten parejas?"
              value={couplesAllowed}
              onChange={setCouplesAllowed}
            />
            <TriStateOption
              label="¿Se admiten estudiantes?"
              value={studentsAllowed}
              onChange={setStudentsAllowed}
            />
            <TriStateOption
              label="¿Se permite empadronamiento?"
              value={registrationAllowed}
              onChange={setRegistrationAllowed}
            />

            <Textarea
              label="Requisitos adicionales"
              helperText="Opcional"
              value={additionalRequirements}
              onChange={(event) =>
                setAdditionalRequirements(event.target.value)
              }
              rows={3}
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            {draftSavedNotice && (
              <div className="flex items-center gap-2 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-semibold text-primary-dark">
                <CheckCircleIcon />
                Borrador guardado. Puedes volver más tarde y seguir donde lo
                dejaste.
              </div>
            )}

            {propertyId ? (
              <PropertyImageUploader
                images={property?.images ?? []}
                onUpload={handleUploadImages}
                onDelete={handleDeleteImage}
                onSetCover={handleSetCover}
                onReorder={handleReorderImages}
              />
            ) : (
              <p className="text-sm text-muted">
                Guarda el piso para poder añadir fotografías.
              </p>
            )}

            <div className="rounded-2xl bg-surface-soft p-5">
              <p className="text-sm font-bold text-foreground">Resumen</p>

              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex justify-between gap-3">
                    <dt className="text-muted">{item.label}</dt>
                    <dd className="font-semibold text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              Al marcar el piso como preparado, quedará listo para el
              futuro lanzamiento de viviendas de CoFlow. Todavía no será
              visible públicamente.
            </div>

            {readyError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  {readyError}
                </p>

                {missingFields.length > 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    Completa: {missingFields.join(", ")}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {validationError && (
          <p
            role="alert"
            className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {validationError}
          </p>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-[auto_1fr]">
          {step > 1 && (
            <button
              type="button"
              onClick={() => goToStep((step - 1) as 1 | 2 | 3 | 4 | 5)}
              disabled={saving || markingReady}
              className="h-14 rounded-2xl border border-line bg-surface px-6 text-sm font-bold text-foreground transition hover:bg-surface-soft disabled:opacity-50"
            >
              Atrás
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleContinue}
              disabled={saving}
              className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Continuar"}
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || markingReady}
                className="h-14 flex-1 rounded-2xl border border-line bg-surface px-6 text-sm font-bold text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar borrador"}
              </button>

              <button
                type="button"
                onClick={handleMarkReady}
                disabled={saving || markingReady || !propertyId}
                className="h-14 flex-1 rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markingReady ? "Comprobando..." : "Marcar como preparado"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v4h1" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

function ToggleOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line px-4 text-sm font-semibold text-foreground">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[var(--brand)]"
      />
    </label>
  );
}

function TriStateOption({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  const options: { value: boolean | null; label: string }[] = [
    { value: null, label: "Sin definir" },
    { value: true, label: "Sí" },
    { value: false, label: "No" },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-foreground">{label}</p>

      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`h-9 rounded-xl px-3 text-xs font-bold transition ${
              value === option.value
                ? "bg-brand text-white"
                : "bg-surface-soft text-muted hover:bg-line"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
