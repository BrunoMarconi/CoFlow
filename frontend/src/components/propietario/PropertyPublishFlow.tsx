"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import AddressAutocomplete, {
  type ResolvedAddress,
} from "@/components/propietario/AddressAutocomplete";
import {
  createProperty,
  getPropertyAmenities,
  markPropertyReady,
  uploadPropertyImages,
} from "@/services/properties";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { Amenity, PropertyCreate, PropertyType } from "@/types/property";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type SpaceType = "entire-home" | "private-room" | "shared-room";
type HomeChoice = "APARTMENT" | "HOUSE" | "STUDIO" | "PENTHOUSE" | "DUPLEX" | "CHALET";

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

const STEP_COUNT = 10;
const MAX_PHOTOS = 15;
const MIN_PHOTOS_TO_PUBLISH = 5;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const HOME_CHOICES: {
  id: HomeChoice;
  label: string;
  propertyType: PropertyType;
  icon: "building" | "house" | "studio" | "penthouse" | "duplex" | "chalet";
}[] = [
  { id: "APARTMENT", label: "Piso", propertyType: "APARTMENT", icon: "building" },
  { id: "HOUSE", label: "Casa", propertyType: "HOUSE", icon: "house" },
  { id: "STUDIO", label: "Estudio", propertyType: "STUDIO", icon: "studio" },
  { id: "PENTHOUSE", label: "ÃƒÂtico", propertyType: "APARTMENT", icon: "penthouse" },
  { id: "DUPLEX", label: "DÃƒÂºplex", propertyType: "HOUSE", icon: "duplex" },
  { id: "CHALET", label: "Chalet", propertyType: "HOUSE", icon: "chalet" },
];

const SPACE_CHOICES: {
  id: SpaceType;
  title: string;
  description: string;
  icon: "home" | "bed" | "bunk";
}[] = [
  {
    id: "entire-home",
    title: "Vivienda completa",
    description: "Ideal si alquilas el piso entero.",
    icon: "home",
  },
  {
    id: "private-room",
    title: "HabitaciÃƒÂ³n privada",
    description: "La opciÃƒÂ³n mÃƒÂ¡s comÃƒÂºn para compartir piso.",
    icon: "bed",
  },
  {
    id: "shared-room",
    title: "HabitaciÃƒÂ³n compartida",
    description: "Para habitaciones con mÃƒÂ¡s de una persona.",
    icon: "bunk",
  },
];

const VIBE_TAGS = [
  "Tranquilo",
  "Luminoso",
  "CÃƒÂ©ntrico",
  "Estudiantes",
  "Con terraza",
  "Ordenado",
];

export default function PropertyPublishFlow() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef<PendingPhoto[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const [homeChoice, setHomeChoice] = useState<HomeChoice>("APARTMENT");
  const [spaceType, setSpaceType] = useState<SpaceType>("private-room");
  const [surfaceM2, setSurfaceM2] = useState(" ".trim());
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxTenants, setMaxTenants] = useState(1);
  const [availableRooms, setAvailableRooms] = useState(1);
  const [availableFrom, setAvailableFrom] = useState("");
  const [hasElevator, setHasElevator] = useState(false);
  const [furnished, setFurnished] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalMonthlyRent, setTotalMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [minimumStayMonths, setMinimumStayMonths] = useState("6");

  useEffect(() => {
    let active = true;

    getPropertyAmenities()
      .then((items) => {
        if (active) setAmenities(items);
      })
      .catch(() => {
        // Las comodidades siguen siendo opcionales si el catÃƒÂ¡logo no carga.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    pendingPhotosRef.current = pendingPhotos;
  }, [pendingPhotos]);

  useEffect(() => {
    return () => {
      pendingPhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!addressSheetOpen) return;

    const focusTimer = window.setTimeout(() => addressInputRef.current?.focus(), 220);
    return () => window.clearTimeout(focusTimer);
  }, [addressSheetOpen]);

  const selectedHome = useMemo(
    () => HOME_CHOICES.find((choice) => choice.id === homeChoice) ?? HOME_CHOICES[0],
    [homeChoice]
  );

  const approximateLocation = [neighborhood, city].filter(Boolean).join(", ") || "Tu zona";

  function resolveAddress(resolved: ResolvedAddress) {
    setAddressLine(resolved.addressLine);
    setCity(resolved.city);
    setProvince(resolved.province);
    setPostalCode(resolved.postalCode);
    setNeighborhood(resolved.neighborhood ?? "");
    setLatitude(resolved.latitude);
    setLongitude(resolved.longitude);
  }

  function moveTo(nextStep: WizardStep) {
    setValidationError("");
    setPhotoError("");
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    setStep(nextStep);
  }

  function previousStep() {
    if (step === 1 || step === 2) {
      setStarted(false);
      return;
    }

    moveTo((step - 1) as WizardStep);
  }

  function validateCurrentStep(): string | null {
    if (step === 2) {
      if (!addressLine.trim()) return "Busca o escribe la direcciÃƒÂ³n de la vivienda.";
      if (!city.trim() || !province.trim() || !postalCode.trim()) {
        return "Completa ciudad, provincia y cÃƒÂ³digo postal para continuar.";
      }
    }

    if (step === 3 && !locationConfirmed) {
      return "Confirma la zona aproximada de tu vivienda.";
    }

    if (step === 6) {
      if (bedrooms < 0 || bathrooms < 1 || maxTenants < 1) {
        return "Revisa habitaciones, baÃƒÂ±os y plazas totales.";
      }
      if (availableRooms < 0 || availableRooms > Math.max(bedrooms, 1)) {
        return "Las habitaciones disponibles no pueden superar las habitaciones totales.";
      }
      if (!availableFrom) return "Indica cuÃƒÂ¡ndo estarÃƒÂ¡ disponible la vivienda.";
    }

    if (step === 8 && pendingPhotos.length < MIN_PHOTOS_TO_PUBLISH) {
      return `AÃƒÂ±ade al menos ${MIN_PHOTOS_TO_PUBLISH} fotos para publicar.`;
    }

    if (step === 9) {
      if (title.trim().length < 5) return "El tÃƒÂ­tulo debe tener al menos 5 caracteres.";
      if (description.trim().length < 30) {
        return "CuÃƒÂ©ntanos un poco mÃƒÂ¡s: la descripciÃƒÂ³n necesita al menos 30 caracteres.";
      }
    }

    if (step === 10) {
      if (!totalMonthlyRent || Number(totalMonthlyRent) < 0) {
        return "Indica el precio mensual de la vivienda.";
      }
      if (!deposit || Number(deposit) < 0) return "Indica la fianza.";
      if (!availableFrom) return "Indica la fecha de entrada disponible.";
      if (!minimumStayMonths || Number(minimumStayMonths) < 1) {
        return "Indica una estancia mÃƒÂ­nima de al menos un mes.";
      }
    }

    return null;
  }

  function handleNext() {
    const error = validateCurrentStep();
    if (error) {
      setValidationError(error);
      return;
    }

    moveTo((step + 1) as WizardStep);
  }

  function toggleAmenity(id: number) {
    setSelectedAmenities((current) =>
      current.includes(id)
        ? current.filter((currentId) => currentId !== id)
        : [...current, id]
    );
  }

  function toggleVibe(vibe: string) {
    setSelectedVibes((current) =>
      current.includes(vibe)
        ? current.filter((currentVibe) => currentVibe !== vibe)
        : [...current, vibe]
    );
  }

  function handlePhotoSelection(files: FileList | null) {
    if (!files) return;

    const fileList = Array.from(files);
    const invalidFile = fileList.find((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type));

    if (invalidFile) {
      setPhotoError("Puedes subir fotografÃƒÂ­as JPEG, PNG o WebP.");
      return;
    }

    if (pendingPhotos.length + fileList.length > MAX_PHOTOS) {
      setPhotoError(`Puedes incluir hasta ${MAX_PHOTOS} fotos en un anuncio.`);
      return;
    }

    const newPhotos = fileList.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingPhotos((current) => [...current, ...newPhotos]);
    setPhotoError("");
  }

  function removePhoto(id: string) {
    setPendingPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  }

  function buildPayload(): PropertyCreate {
    return {
      title: title.trim(),
      description: description.trim(),
      property_type: selectedHome.propertyType,
      address_line: addressLine.trim(),
      city: city.trim(),
      province: province.trim(),
      postal_code: postalCode.trim(),
      neighborhood: neighborhood.trim() || null,
      latitude,
      longitude,
      surface_m2: surfaceM2 ? Number(surfaceM2) : null,
      bedrooms,
      bathrooms,
      floor: null,
      has_elevator: hasElevator,
      furnished,
      max_tenants: maxTenants,
      total_monthly_rent: Number(totalMonthlyRent),
      deposit: Number(deposit),
      utilities_included: utilitiesIncluded,
      available_from: availableFrom,
      minimum_stay_months: Number(minimumStayMonths),
      pets_allowed: null,
      smoking_allowed: null,
      couples_allowed: null,
      students_allowed: null,
      registration_allowed: null,
      additional_requirements: [
        `Espacio publicado: ${SPACE_CHOICES.find((choice) => choice.id === spaceType)?.title ?? "Vivienda"}.`,
        `Habitaciones disponibles: ${availableRooms}.`,
        selectedVibes.length ? `Ambiente: ${selectedVibes.join(", ")}.` : null,
      ]
        .filter(Boolean)
        .join(" "),
      amenity_ids: selectedAmenities,
    };
  }

  async function handlePublish() {
    const error = validateCurrentStep();
    if (error) {
      setValidationError(error);
      return;
    }

    setPublishing(true);
    setValidationError("");

    try {
      const property = await createProperty(buildPayload());
      await uploadPropertyImages(
        property.id,
        pendingPhotos.map((photo) => photo.file)
      );
      await markPropertyReady(property.id);
      router.push(`/propietarios/pisos/${property.id}`);
    } catch (error) {
      setValidationError(
        getCommunityErrorMessage(
          error,
          "No pudimos publicar el anuncio. Tus datos siguen en esta pantalla para que puedas intentarlo de nuevo."
        )
      );
    } finally {
      setPublishing(false);
    }
  }

  if (!started) {
    return (
      <PublishIntroduction
        onClose={() => router.push("/propietarios")}
        onStart={() => {
          setStep(2);
          setStarted(true);
        }}
      />
    );
  }

  const titleByStep: Record<WizardStep, string> = {
    1: "Publica tu vivienda en CoFlow",
    2: "Ã‚Â¿DÃƒÂ³nde estÃƒÂ¡ tu vivienda?",
    3: "Confirma la ubicaciÃƒÂ³n",
    4: "Ã‚Â¿QuÃƒÂ© tipo de vivienda es?",
    5: "Ã‚Â¿QuÃƒÂ© vas a publicar?",
    6: "AÃƒÂ±ade la informaciÃƒÂ³n bÃƒÂ¡sica",
    7: "Ã‚Â¿QuÃƒÂ© ofrece tu vivienda?",
    8: "AÃƒÂ±ade fotos de tu vivienda",
    9: "Ponle un tÃƒÂ­tulo y cuÃƒÂ©ntalo",
    10: "Precio y condiciones",
  };

  const subtitleByStep: Record<WizardStep, string> = {
    1: "Te guiaremos paso a paso para crear un anuncio que conecte con las personas adecuadas.",
    2: "La ubicaciÃƒÂ³n nos ayuda a mostrar tu vivienda a las personas adecuadas en tu zona.",
    3: "La direcciÃƒÂ³n exacta nunca se mostrarÃƒÂ¡ pÃƒÂºblicamente. Solo usamos esta informaciÃƒÂ³n para posicionar tu anuncio.",
    4: "Selecciona la opciÃƒÂ³n que mejor describa tu vivienda para mostrarla a las personas adecuadas.",
    5: "Selecciona el tipo de espacio que quieres publicar para encontrar la convivencia que buscas.",
    6: "CuÃƒÂ©ntanos los datos clave de tu vivienda para que sea mÃƒÂ¡s fÃƒÂ¡cil encontrar a las personas adecuadas.",
    7: "Selecciona los servicios y comodidades disponibles para destacar lo mejor de tu espacio.",
    8: "Las primeras fotos deberÃƒÂ­an mostrar la habitaciÃƒÂ³n y las zonas comunes.",
    9: "Un buen tÃƒÂ­tulo y una descripciÃƒÂ³n clara atraen a las personas adecuadas para tu piso.",
    10: "Revisa los detalles econÃƒÂ³micos y las condiciones de tu anuncio antes de publicarlo.",
  };

  return (
    <div className="relative min-h-dvh bg-[#fdfcfb] text-brand-dark">
      <div className="mx-auto w-full max-w-5xl px-5 pb-38 pt-6 sm:px-8 sm:pb-32 sm:pt-8 lg:max-w-6xl lg:px-12">
        <FlowTopBar
          onBack={previousStep}
          onClose={() => router.push("/propietarios")}
          onHelp={() => setHelpOpen(true)}
          isFirstStep={step === 1}
          hideHelp={step === 2}
        />

        <AnimatePresence>
          {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
        </AnimatePresence>

        <motion.main
          key={step}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
          transition={{ duration: prefersReducedMotion ? 0.08 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={`mx-auto w-full max-w-3xl ${step === 2 ? "mt-20 lg:mt-28" : "mt-11 lg:mt-14"}`}
        >
          {step !== 2 && (
            <>
              <span className="inline-flex rounded-full border border-primary/10 bg-surface px-3 py-1.5 text-sm font-bold text-primary-dark shadow-soft">
                Paso {step}
              </span>
              <h1 className="mt-5 max-w-3xl font-rounded text-[2.5rem] font-bold leading-[0.98] tracking-[-0.055em] text-brand-dark sm:text-6xl lg:text-7xl">
                {titleByStep[step]}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary sm:text-xl sm:leading-9">
                {subtitleByStep[step]}
              </p>
            </>
          )}

          <div className={step === 2 ? "" : "mt-9 sm:mt-12"}>
            {step === 2 && (
              <StepAddress
                addressLine={addressLine}
                onAddressChange={setAddressLine}
                onOpen={() => setAddressSheetOpen(true)}
              />
            )}
            {step === 3 && (
              <StepMap
                address={addressLine}
                location={approximateLocation}
                confirmed={locationConfirmed}
                onConfirm={() => setLocationConfirmed((current) => !current)}
              />
            )}
            {step === 4 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
                {HOME_CHOICES.map((choice) => (
                  <SelectableHomeCard
                    key={choice.id}
                    choice={choice}
                    selected={homeChoice === choice.id}
                    onSelect={() => setHomeChoice(choice.id)}
                  />
                ))}
              </div>
            )}
            {step === 5 && (
              <div className="space-y-4">
                {SPACE_CHOICES.map((choice) => (
                  <SelectableSpaceCard
                    key={choice.id}
                    choice={choice}
                    selected={spaceType === choice.id}
                    onSelect={() => setSpaceType(choice.id)}
                  />
                ))}
              </div>
            )}
            {step === 6 && (
              <StepBasics
                surfaceM2={surfaceM2}
                bedrooms={bedrooms}
                bathrooms={bathrooms}
                maxTenants={maxTenants}
                availableRooms={availableRooms}
                availableFrom={availableFrom}
                onSurfaceChange={setSurfaceM2}
                onBedroomsChange={(value) => {
                  setBedrooms(value);
                  setAvailableRooms((current) => Math.min(current, Math.max(value, 1)));
                }}
                onBathroomsChange={setBathrooms}
                onMaxTenantsChange={setMaxTenants}
                onAvailableRoomsChange={setAvailableRooms}
                onAvailableFromChange={setAvailableFrom}
              />
            )}
            {step === 7 && (
              <StepAmenities
                amenities={amenities}
                selectedAmenities={selectedAmenities}
                hasElevator={hasElevator}
                furnished={furnished}
                onToggleAmenity={toggleAmenity}
                onToggleElevator={() => setHasElevator((current) => !current)}
                onToggleFurnished={() => setFurnished((current) => !current)}
              />
            )}
            {step === 8 && (
              <StepPhotos
                photos={pendingPhotos}
                error={photoError}
                onSelect={handlePhotoSelection}
                onRemove={removePhoto}
              />
            )}
            {step === 9 && (
              <StepStory
                title={title}
                description={description}
                selectedVibes={selectedVibes}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onToggleVibe={toggleVibe}
              />
            )}
            {step === 10 && (
              <StepConditions
                rent={totalMonthlyRent}
                deposit={deposit}
                utilitiesIncluded={utilitiesIncluded}
                availableFrom={availableFrom}
                minimumStayMonths={minimumStayMonths}
                photoCount={pendingPhotos.length}
                locationReady={locationConfirmed}
                onRentChange={setTotalMonthlyRent}
                onDepositChange={setDeposit}
                onUtilitiesChange={setUtilitiesIncluded}
                onAvailableFromChange={setAvailableFrom}
                onMinimumStayChange={setMinimumStayMonths}
              />
            )}
          </div>
        </motion.main>
      </div>

      {validationError && (
        <div className="fixed inset-x-5 bottom-26 z-40 mx-auto max-w-xl rounded-18 border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-[0_14px_34px_rgba(92,37,31,0.12)] sm:bottom-27">
          {validationError}
        </div>
      )}

      {step !== 2 && (
        <FlowActions
          step={step}
          publishing={publishing}
          onBack={previousStep}
          onNext={handleNext}
          onPublish={handlePublish}
        />
      )}

      <AnimatePresence>
        {addressSheetOpen && (
          <AddressBottomSheet
            value={addressLine}
            inputRef={addressInputRef}
            onChange={setAddressLine}
            onResolved={(resolved) => {
              resolveAddress(resolved);
              setAddressSheetOpen(false);
              moveTo(3);
            }}
            onClose={() => setAddressSheetOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PublishIntroduction({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: () => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="relative min-h-dvh bg-[#fdfcfb] px-5 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
          <HelpButton onClick={() => setHelpOpen((current) => !current)} />
        </div>

        <AnimatePresence>
          {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-12 aspect-[1.34] max-w-2xl"
        >
          <Image
            src="/images/owner-publish-home-realistic.png"
            alt="Vivienda compartida ilustrada"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-contain"
          />
        </motion.div>

        <div className="mx-auto mt-9 max-w-2xl sm:mt-12">
          <h1 className="font-rounded text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-brand-dark sm:text-6xl">
            Publica tu vivienda en CoFlow
          </h1>

          <button
            type="button"
            onClick={onStart}
            className="mt-10 flex h-15 w-full items-center justify-center rounded-full bg-brand px-6 text-lg font-bold text-white shadow-[0_14px_30px_rgba(16,72,45,0.2)] transition hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
          >
            Seguir
          </button>
          <button
            type="button"
            onClick={onClose}
            className="hidden mx-auto mt-5 block text-base font-semibold text-primary-dark underline underline-offset-4"
          >
            AtrÃƒÂ¡s
          </button>
        </div>
      </div>
    </div>
  );
}

function FlowTopBar({
  onBack,
  onClose,
  onHelp,
  isFirstStep,
  hideHelp = false,
}: {
  onBack: () => void;
  onClose: () => void;
  onHelp: () => void;
  isFirstStep: boolean;
  hideHelp?: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={isFirstStep ? onClose : onBack}
        className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={isFirstStep ? "Cerrar publicaciÃƒÂ³n" : "Volver al paso anterior"}
      >
        {isFirstStep ? <CloseIcon /> : <ArrowLeftIcon />}
      </button>
      {!hideHelp && (
      <button
        type="button"
        onClick={onHelp}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-bold text-primary-dark shadow-soft transition hover:border-primary/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <QuestionIcon />
        <span>Ã‚Â¿Necesitas ayuda?</span>
      </button>
      )}
    </header>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-bold text-primary-dark shadow-soft transition hover:border-primary/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <QuestionIcon />
      <span>Ã‚Â¿Necesitas ayuda?</span>
    </button>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className="absolute right-5 top-20 z-50 w-[min(22rem,calc(100%-2.5rem))] rounded-24 border border-border bg-surface p-5 shadow-[0_18px_46px_rgba(26,55,43,0.16)] sm:right-8"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-brand-dark">Estamos contigo</p>
          <p className="mt-1 text-sm leading-6 text-secondary">
            Puedes cerrar el proceso y volver mÃƒÂ¡s tarde. Tus fotos no se guardan hasta publicar.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar ayuda" className="text-muted hover:text-foreground">
          <CloseIcon />
        </button>
      </div>
    </motion.div>
  );
}

function StepAddress({
  addressLine,
  onOpen,
}: {
  addressLine: string;
  onAddressChange: (value: string) => void;
  onOpen: () => void;
}) {
  return (
    <div>
      <h1 className="font-rounded text-[2.55rem] font-bold leading-[1.02] tracking-[-0.055em] text-brand-dark sm:text-6xl">
        Ã‚Â¿DÃƒÂ³nde estÃƒÂ¡ tu vivienda?
      </h1>
      <button
        type="button"
        onClick={onOpen}
        className="mt-8 flex h-16 w-full items-center gap-3 rounded-full border border-border bg-surface px-5 text-left shadow-[0_10px_25px_rgba(26,55,43,0.07)] transition hover:border-primary/35 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary sm:h-17"
      >
        <SearchFieldIcon />
        <span className={`min-w-0 flex-1 truncate text-[1.05rem] font-medium sm:text-lg ${addressLine ? "text-brand-dark" : "text-secondary/70"}`}>
          {addressLine || "Ã‚Â¿DÃƒÂ³nde estÃƒÂ¡ tu vivienda?"}
        </span>
      </button>
      <p className="mt-5 text-sm leading-6 text-secondary">
        La direcciÃƒÂ³n exacta nunca se mostrarÃƒÂ¡ pÃƒÂºblicamente.
      </p>
    </div>
  );
}

function AddressBottomSheet({
  value,
  inputRef,
  onChange,
  onResolved,
  onClose,
}: {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onResolved: (address: ResolvedAddress) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end bg-brand-dark/20 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <motion.section
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="flex h-[85dvh] w-full flex-col rounded-t-[2rem] bg-[#fdfcfb] px-5 pb-[calc(1.5rem+var(--safe-bottom))] pt-4 shadow-[0_-18px_55px_rgba(26,55,43,0.16)] sm:mx-auto sm:max-w-3xl sm:rounded-t-[2.4rem] sm:px-8"
        role="dialog"
        aria-modal="true"
        aria-label="Indica tu direcciÃƒÂ³n"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-11 rounded-full bg-border" />
        <div className="mt-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-[-0.03em] text-brand-dark sm:text-2xl">Indica tu direcciÃƒÂ³n</h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition hover:bg-surface-soft" aria-label="Cerrar">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-7 min-h-0 flex-1">
          <AddressAutocomplete
            value={value}
            onChange={onChange}
            onResolved={onResolved}
            inputRef={inputRef}
            variant="sheet"
          />
        </div>
      </motion.section>
    </motion.div>
  );
}

function SearchFieldIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6 shrink-0 text-secondary" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
}

function StepMap({
  address,
  location,
  confirmed,
  onConfirm,
}: {
  address: string;
  location: string;
  confirmed: boolean;
  onConfirm: () => void;
}) {
  return (
    <div>
      <div className="relative min-h-[25rem] overflow-hidden rounded-[1.8rem] border border-border bg-[#edf1eb] shadow-[0_12px_34px_rgba(26,55,43,0.08)] sm:min-h-[31rem]">
        <div className="absolute inset-0 opacity-90 [background-image:linear-gradient(32deg,transparent_0_46%,rgba(255,255,255,.9)_47%_52%,transparent_53%),linear-gradient(-38deg,transparent_0_48%,rgba(255,255,255,.82)_49%_54%,transparent_55%),linear-gradient(90deg,transparent_0_48%,rgba(255,255,255,.7)_49%_54%,transparent_55%)] [background-size:110px_95px,140px_110px,160px_135px]" />
        <div className="absolute -bottom-14 -left-10 h-70 w-70 rounded-full border border-primary/10 bg-mint-50/75" />
        <div className="absolute right-6 top-6 max-w-[calc(100%-3rem)] rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary-dark shadow-soft">
          <span className="mr-2 inline-block align-middle text-primary"><LocationIcon /></span>
          {address || "Tu direcciÃƒÂ³n"}
        </div>
        <p className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-[0.16em] text-primary/65">
          {location}
        </p>
        <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/15 bg-mint-50/75">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-[0_12px_24px_rgba(16,72,45,0.25)]">
            <FlowIcon name="home" className="h-8 w-8" />
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        className={`mt-5 flex w-full items-center justify-between rounded-18 border px-5 py-4 text-left transition ${
          confirmed ? "border-primary/30 bg-surface shadow-soft" : "border-border bg-surface hover:border-primary/25"
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="text-primary"><LockIcon /></span>
          <span className="text-sm font-semibold text-primary-dark">Mostraremos solo la zona aproximada.</span>
        </span>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${confirmed ? "border-primary bg-primary text-white" : "border-border text-transparent"}`}>
          <CheckIcon className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}

function SelectableHomeCard({
  choice,
  selected,
  onSelect,
}: {
  choice: (typeof HOME_CHOICES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex min-h-43 flex-col items-center justify-center rounded-[1.45rem] border p-4 text-center shadow-soft transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary sm:min-h-51 ${
        selected ? "border-primary bg-[#fbfdf9]" : "border-border bg-surface hover:border-primary/25"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
          <CheckIcon className="h-4 w-4" />
        </span>
      )}
      <span className="text-primary"><HomeTypeIcon type={choice.icon} /></span>
      <span className="mt-4 text-lg font-bold text-primary-dark">{choice.label}</span>
    </button>
  );
}

function SelectableSpaceCard({
  choice,
  selected,
  onSelect,
}: {
  choice: (typeof SPACE_CHOICES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex w-full items-center gap-5 rounded-[1.6rem] border p-5 text-left shadow-soft transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary sm:p-6 ${
        selected ? "border-primary bg-[#fbfdf9]" : "border-border bg-surface hover:border-primary/25"
      }`}
    >
      <span className="flex h-17 w-17 shrink-0 items-center justify-center rounded-18 border border-primary/12 text-primary sm:h-20 sm:w-20">
        <FlowIcon name={choice.icon} className="h-10 w-10" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-bold text-primary-dark sm:text-2xl">{choice.title}</span>
        <span className="mt-1 block text-base leading-6 text-secondary sm:text-lg">{choice.description}</span>
      </span>
      {selected ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white"><CheckIcon className="h-5 w-5" /></span>
      ) : (
        <ChevronIcon className="h-7 w-7 shrink-0 text-primary" />
      )}
    </button>
  );
}

function StepBasics({
  surfaceM2,
  bedrooms,
  bathrooms,
  maxTenants,
  availableRooms,
  availableFrom,
  onSurfaceChange,
  onBedroomsChange,
  onBathroomsChange,
  onMaxTenantsChange,
  onAvailableRoomsChange,
  onAvailableFromChange,
}: {
  surfaceM2: string;
  bedrooms: number;
  bathrooms: number;
  maxTenants: number;
  availableRooms: number;
  availableFrom: string;
  onSurfaceChange: (value: string) => void;
  onBedroomsChange: (value: number) => void;
  onBathroomsChange: (value: number) => void;
  onMaxTenantsChange: (value: number) => void;
  onAvailableRoomsChange: (value: number) => void;
  onAvailableFromChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <CounterCard icon="bed" label="Habitaciones" value={bedrooms} minimum={0} onChange={onBedroomsChange} />
      <CounterCard icon="bath" label="BaÃƒÂ±os" value={bathrooms} minimum={1} onChange={onBathroomsChange} />
      <CounterCard icon="users" label="Plazas totales" value={maxTenants} minimum={1} onChange={onMaxTenantsChange} />
      <CounterCard icon="person" label="Habitaciones disponibles" value={availableRooms} minimum={0} maximum={Math.max(bedrooms, 1)} onChange={onAvailableRoomsChange} />
      <div className="rounded-[1.45rem] border border-border bg-surface p-5 shadow-soft sm:p-6">
        <Input
          label="Disponible desde"
          type="date"
          value={availableFrom}
          onChange={(event) => onAvailableFromChange(event.target.value)}
          required
        />
      </div>
      <div className="rounded-[1.45rem] border border-border bg-surface p-5 shadow-soft sm:p-6">
        <Input
          label="Superficie (mÃ‚Â²)"
          helperText="Opcional"
          type="number"
          min={1}
          inputMode="numeric"
          value={surfaceM2}
          onChange={(event) => onSurfaceChange(event.target.value)}
        />
      </div>
    </div>
  );
}

function CounterCard({
  icon,
  label,
  value,
  minimum,
  maximum = 20,
  onChange,
}: {
  icon: "bed" | "bath" | "users" | "person";
  label: string;
  value: number;
  minimum: number;
  maximum?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex min-h-22 items-center gap-4 rounded-[1.45rem] border border-border bg-surface px-5 py-4 shadow-soft sm:px-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-14 border border-primary/12 text-primary"><FlowIcon name={icon} className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1 text-lg font-semibold text-primary-dark">{label}</span>
      <div className="flex items-center gap-3">
        <CounterButton label={`Reducir ${label}`} disabled={value <= minimum} onClick={() => onChange(value - 1)}>Ã¢Ë†â€™</CounterButton>
        <span className="w-7 text-center text-xl font-bold text-brand-dark">{value}</span>
        <CounterButton label={`Aumentar ${label}`} disabled={value >= maximum} onClick={() => onChange(value + 1)}>+</CounterButton>
      </div>
    </div>
  );
}

function CounterButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-14 border border-primary/15 text-2xl font-medium text-primary transition hover:border-primary/40 hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-35">
      {children}
    </button>
  );
}

function StepAmenities({
  amenities,
  selectedAmenities,
  hasElevator,
  furnished,
  onToggleAmenity,
  onToggleElevator,
  onToggleFurnished,
}: {
  amenities: Amenity[];
  selectedAmenities: number[];
  hasElevator: boolean;
  furnished: boolean;
  onToggleAmenity: (id: number) => void;
  onToggleElevator: () => void;
  onToggleFurnished: () => void;
}) {
  const shownAmenities = amenities.slice(0, 10);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AmenityCard label="Ascensor" icon="elevator" selected={hasElevator} onClick={onToggleElevator} />
      <AmenityCard label="Amueblado" icon="chair" selected={furnished} onClick={onToggleFurnished} />
      {shownAmenities.map((amenity) => (
        <AmenityCard
          key={amenity.id}
          label={amenity.label}
          icon={amenityIconFor(amenity.label)}
          selected={selectedAmenities.includes(amenity.id)}
          onClick={() => onToggleAmenity(amenity.id)}
        />
      ))}
      {shownAmenities.length === 0 && (
        <p className="col-span-full rounded-18 border border-border bg-surface p-5 text-sm text-secondary shadow-soft">
          Puedes continuar: aÃƒÂ±adiremos mÃƒÂ¡s comodidades en cuanto el catÃƒÂ¡logo estÃƒÂ© disponible.
        </p>
      )}
    </div>
  );
}

function AmenityCard({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: FlowIconName;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-29 items-center gap-4 rounded-[1.45rem] border p-4 text-left shadow-soft transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary sm:min-h-33 sm:p-5 ${
        selected ? "border-primary/30 bg-[#fbfdf9]" : "border-border bg-surface hover:border-primary/25"
      }`}
    >
      <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-primary/10 text-primary">
        <FlowIcon name={icon} className="h-7 w-7" />
      </span>
      <span className="flex-1 text-lg font-semibold text-primary-dark">{label}</span>
      <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-border text-transparent"}`}>
        <CheckIcon className="h-4 w-4" />
      </span>
    </button>
  );
}

function StepPhotos({
  photos,
  error,
  onSelect,
  onRemove,
}: {
  photos: PendingPhoto[];
  error: string;
  onSelect: (files: FileList | null) => void;
  onRemove: (id: string) => void;
}) {
  const fileInputId = "property-publish-photos";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <label htmlFor={fileInputId} className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-primary/25 bg-surface p-4 text-center transition hover:border-primary/50 hover:bg-[#fbfdf9]">
          <span className="flex h-15 w-15 items-center justify-center rounded-full border border-primary/15 text-primary"><PlusIcon className="h-8 w-8" /></span>
          <span className="mt-3 text-base font-semibold text-primary-dark">Subir fotos</span>
          <input id={fileInputId} className="sr-only" type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} multiple onChange={(event) => onSelect(event.target.files)} />
        </label>
        {photos.map((photo, index) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-soft">
            {/* Las previsualizaciones viven solo en memoria hasta que se publique el anuncio. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.previewUrl} alt={`Foto ${index + 1} de la vivienda`} className="h-full w-full object-cover" />
            {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-primary-dark shadow-soft">Portada</span>}
            <button type="button" onClick={() => onRemove(photo.id)} aria-label={`Eliminar foto ${index + 1}`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-soft opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><CloseIcon className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-18 border border-primary/10 bg-surface px-4 py-3 text-sm text-secondary shadow-soft">
        <InfoIcon className="h-5 w-5 shrink-0 text-primary" />
        <span>MÃƒÂ­nimo {MIN_PHOTOS_TO_PUBLISH} fotos para publicar Ã‚Â· {photos.length}/{MAX_PHOTOS}</span>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function StepStory({
  title,
  description,
  selectedVibes,
  onTitleChange,
  onDescriptionChange,
  onToggleVibe,
}: {
  title: string;
  description: string;
  selectedVibes: string[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onToggleVibe: (value: string) => void;
}) {
  return (
    <div className="space-y-8">
      <Input
        label="TÃƒÂ­tulo de tu anuncio"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        helperText={`${title.length}/150 caracteres`}
        placeholder="Ej. HabitaciÃƒÂ³n luminosa en piso compartido"
        maxLength={150}
        required
        className="h-15 rounded-18 text-lg sm:text-xl"
      />
      <div>
        <p className="text-lg font-bold text-primary-dark">Ã‚Â¿CÃƒÂ³mo describirÃƒÂ­as el ambiente?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {VIBE_TAGS.map((tag) => {
            const selected = selectedVibes.includes(tag);
            return (
              <button key={tag} type="button" onClick={() => onToggleVibe(tag)} className={`inline-flex h-12 items-center gap-2 rounded-full border px-4 text-base font-semibold transition ${selected ? "border-primary/30 bg-[#fbfdf9] text-primary-dark" : "border-border bg-surface text-foreground hover:border-primary/25"}`}>
                {tag}
                {selected && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"><CheckIcon className="h-3.5 w-3.5" /></span>}
              </button>
            );
          })}
        </div>
      </div>
      <Textarea
        label="CuÃƒÂ©ntales mÃƒÂ¡s sobre tu piso"
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        helperText={description.trim().length >= 30 ? `${description.trim().length} caracteres` : `${description.trim().length}/30 caracteres mÃƒÂ­nimo`}
        placeholder="Describe el espacio, la zona y el ambiente que quieres crearÃ¢â‚¬Â¦"
        rows={7}
        required
        className="rounded-18 text-base leading-7"
      />
    </div>
  );
}

function StepConditions({
  rent,
  deposit,
  utilitiesIncluded,
  availableFrom,
  minimumStayMonths,
  photoCount,
  locationReady,
  onRentChange,
  onDepositChange,
  onUtilitiesChange,
  onAvailableFromChange,
  onMinimumStayChange,
}: {
  rent: string;
  deposit: string;
  utilitiesIncluded: boolean;
  availableFrom: string;
  minimumStayMonths: string;
  photoCount: number;
  locationReady: boolean;
  onRentChange: (value: string) => void;
  onDepositChange: (value: string) => void;
  onUtilitiesChange: (value: boolean) => void;
  onAvailableFromChange: (value: string) => void;
  onMinimumStayChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ConditionInput label="Precio al mes" icon="tag" value={rent} onChange={onRentChange} suffix="Ã¢â€šÂ¬" />
        <ConditionInput label="Fianza" icon="shield" value={deposit} onChange={onDepositChange} suffix="Ã¢â€šÂ¬" />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-[1.45rem] border border-border bg-surface px-5 py-5 shadow-soft sm:px-6">
        <span className="flex items-center gap-3 text-lg font-semibold text-primary-dark"><span className="flex h-12 w-12 items-center justify-center rounded-14 border border-primary/12 text-primary"><FlowIcon name="wallet" className="h-6 w-6" /></span>Gastos incluidos</span>
        <button type="button" role="switch" aria-checked={utilitiesIncluded} onClick={() => onUtilitiesChange(!utilitiesIncluded)} className={`relative h-8 w-14 rounded-full transition ${utilitiesIncluded ? "bg-primary" : "bg-border"}`}>
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${utilitiesIncluded ? "left-7" : "left-1"}`} />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.45rem] border border-border bg-surface p-5 shadow-soft sm:p-6">
          <Input label="Entrada disponible" type="date" value={availableFrom} onChange={(event) => onAvailableFromChange(event.target.value)} required />
        </div>
        <ConditionInput label="Estancia mÃƒÂ­nima" icon="hourglass" value={minimumStayMonths} onChange={onMinimumStayChange} suffix="meses" />
      </div>
      <div className="rounded-[1.6rem] border border-primary/15 bg-[#fbfdf9] p-5 shadow-soft sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary"><CheckIcon className="h-8 w-8" /></span>
          <div>
            <p className="text-xl font-bold text-primary-dark">Todo listo para publicar</p>
            <ul className="mt-4 space-y-2 text-base text-secondary">
              <ReadyLine ready={locationReady} label="DirecciÃƒÂ³n confirmada" />
              <ReadyLine ready={photoCount >= MIN_PHOTOS_TO_PUBLISH} label={`${photoCount} fotos aÃƒÂ±adidas`} />
              <ReadyLine ready={Boolean(rent && deposit && availableFrom && minimumStayMonths)} label="Precio y condiciones completados" />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConditionInput({
  label,
  icon,
  value,
  suffix,
  onChange,
}: {
  label: string;
  icon: FlowIconName;
  value: string;
  suffix: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.45rem] border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="mb-3 flex items-center gap-3 text-primary"><span className="flex h-10 w-10 items-center justify-center rounded-12 border border-primary/12"><FlowIcon name={icon} className="h-5 w-5" /></span><span className="text-base font-semibold text-primary-dark">{label}</span></div>
      <div className="flex items-center gap-2">
        <input type="number" inputMode="numeric" min={0} value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-brand-dark outline-none placeholder:text-muted" placeholder="0" />
        <span className="text-base font-semibold text-secondary">{suffix}</span>
      </div>
    </div>
  );
}

function ReadyLine({ ready, label }: { ready: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${ready ? "border-primary bg-primary text-white" : "border-border text-transparent"}`}><CheckIcon className="h-3 w-3" /></span>{label}</li>
  );
}

function FlowActions({
  step,
  publishing,
  onBack,
  onNext,
  onPublish,
}: {
  step: WizardStep;
  publishing: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[#fdfcfb]/95 px-5 pb-[calc(1rem+var(--safe-bottom))] pt-4 backdrop-blur-xl sm:px-8 sm:pb-5">
      <div className="mx-auto w-full max-w-3xl">
        <ProgressSegments step={step} />
        <div className="mt-4 grid grid-cols-[minmax(0,.8fr)_minmax(0,1.25fr)] gap-3 sm:gap-5">
          <button type="button" onClick={onBack} disabled={publishing} className="h-14 rounded-full border border-primary bg-surface px-5 text-base font-bold text-primary-dark transition hover:bg-surface-soft disabled:opacity-50 sm:h-15 sm:text-lg">
            AtrÃƒÂ¡s
          </button>
          {step < STEP_COUNT ? (
            <button type="button" onClick={onNext} disabled={publishing} className="h-14 rounded-full bg-brand px-5 text-base font-bold text-white shadow-[0_12px_26px_rgba(16,72,45,0.2)] transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60 sm:h-15 sm:text-lg">
              Siguiente
            </button>
          ) : (
            <button type="button" onClick={onPublish} disabled={publishing} className="h-14 rounded-full bg-brand px-5 text-base font-bold text-white shadow-[0_12px_26px_rgba(16,72,45,0.2)] transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60 sm:h-15 sm:text-lg">
              {publishing ? "PublicandoÃ¢â‚¬Â¦" : "Publicar anuncio"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressSegments({ step }: { step: WizardStep }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Paso ${step} de ${STEP_COUNT}`}>
      {Array.from({ length: STEP_COUNT }, (_, index) => (
        <span key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${index < step ? "bg-primary" : "bg-border"}`} />
      ))}
    </div>
  );
}

type FlowIconName =
  | "home" | "camera" | "tag" | "bed" | "bunk" | "building" | "house" | "studio" | "penthouse" | "duplex" | "chalet" | "bath" | "users" | "person" | "elevator" | "chair" | "wifi" | "washer" | "air" | "terrace" | "kitchen" | "wardrobe" | "parking" | "wallet" | "hourglass" | "shield";

function amenityIconFor(label: string): FlowIconName {
  const normalized = label.toLocaleLowerCase("es");
  if (normalized.includes("wifi") || normalized.includes("internet")) return "wifi";
  if (normalized.includes("lavadora")) return "washer";
  if (normalized.includes("aire")) return "air";
  if (normalized.includes("terraza") || normalized.includes("balcÃƒÂ³n")) return "terrace";
  if (normalized.includes("cocina")) return "kitchen";
  if (normalized.includes("armario")) return "wardrobe";
  if (normalized.includes("parking") || normalized.includes("garaje")) return "parking";
  return "home";
}

function FlowIcon({ name, className }: { name: FlowIconName; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className, "aria-hidden": true };
  const paths: Record<FlowIconName, ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /><path d="M9 21v-6h6v6" /></>,
    camera: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="m8 7 1.5-3h5L16 7" /><circle cx="12" cy="13.5" r="3.5" /></>,
    tag: <><path d="M20 13 13 20 4 11V4h7Z" /><circle cx="8.5" cy="8.5" r="1" /></>,
    bed: <><path d="M3 19V9" /><path d="M21 19v-6" /><path d="M3 14h18" /><path d="M5 14v-4h6a3 3 0 0 1 3 3v1" /><path d="M3 19h18" /></>,
    bunk: <><path d="M4 3v18" /><path d="M20 3v18" /><path d="M4 8h16" /><path d="M4 16h16" /><path d="M7 6h4" /><path d="M7 14h4" /></>,
    building: <><path d="M4 21V4h12v17" /><path d="M16 9h4v12" /><path d="M8 8h1M12 8h1M8 12h1M12 12h1M8 16h1M12 16h1" /></>,
    house: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /><path d="M9 21v-6h6v6" /></>,
    studio: <><path d="M4 20V5h16v15" /><path d="M7 20v-6h10v6" /><path d="M8 9h8" /><path d="M10 5V2m4 3V2" /></>,
    penthouse: <><path d="m3 12 9-9 9 9" /><path d="M5 11v10h14V11" /><path d="M8 21v-5h8v5" /><path d="M14 3v4h4" /></>,
    duplex: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M4 12h16" /><path d="M8 8h2M14 8h2M8 16h2M14 16h2" /><path d="M12 21v-4" /></>,
    chalet: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9" /><path d="M8 21v-6h8v6" /><path d="M18 5v4" /></>,
    bath: <><path d="M4 13a8 8 0 0 0 16 0Z" /><path d="M6 13V8a3 3 0 0 1 6 0v1" /><path d="M18 13v5" /><path d="M7 21v-2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M17 11a3 3 0 0 0 0-6" /><path d="M21 20a5 5 0 0 0-3-4.6" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    elevator: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="m9 8 3-3 3 3M15 16l-3 3-3-3" /><path d="M12 5v14" /></>,
    chair: <><path d="M5 12V6h10v6" /><path d="M5 12h13" /><path d="M6 12v7m10-7v7" /><path d="M18 12V8" /></>,
    wifi: <><path d="M3 9a14 14 0 0 1 18 0" /><path d="M6 12a9 9 0 0 1 12 0" /><path d="M9 15a4 4 0 0 1 6 0" /><circle cx="12" cy="18" r="1" /></>,
    washer: <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="14" r="4" /><path d="M7 7h.01M10 7h4" /></>,
    air: <><rect x="3" y="6" width="18" height="8" rx="2" /><path d="M7 18c1 1 2 1 3 0s2-1 3 0 2 1 3 0" /><path d="M9 14v2m6-2v2" /></>,
    terrace: <><path d="M3 12h18" /><path d="M5 12v8m14-8v8" /><path d="M8 20v-5m8 5v-5" /><path d="M12 12V4" /><path d="M7 7a7 7 0 0 1 10 0" /></>,
    kitchen: <><path d="M4 4v16h16V4" /><path d="M4 12h16" /><path d="M8 4v8m8-8v8" /><path d="M7 16h3m4 0h3" /></>,
    wardrobe: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M12 3v18" /><path d="M9 12h.01M15 12h.01" /></>,
    parking: <><path d="M5 20V5h9a5 5 0 0 1 0 10H8" /><path d="M8 8h6" /><path d="M8 20v-5" /></>,
    wallet: <><path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4Z" /><path d="M4 7V5a2 2 0 0 1 2-2h11" /><path d="M16 13h2" /></>,
    hourglass: <><path d="M6 3h12M6 21h12" /><path d="M7 3c0 6 10 6 10 12" /><path d="M17 3c0 6-10 6-10 12" /></>,
    shield: <path d="M12 3 5 6v5c0 5 3.4 8.6 7 10 3.6-1.4 7-5 7-10V6Z" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function HomeTypeIcon({ type }: { type: (typeof HOME_CHOICES)[number]["icon"] }) {
  return <FlowIcon name={type} className="h-16 w-16 sm:h-20 sm:w-20" />;
}

function CloseIcon({ className = "h-7 w-7" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg>;
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true"><path d="m19 12H5m6-6-6 6 6 6" /></svg>;
}

function ChevronIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="m5 12 4.3 4.3L19 7" /></svg>;
}

function QuestionIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 3.5M12 17h.01" /></svg>;
}

function InfoIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

function LocationIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="inline h-5 w-5" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

function PlusIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
