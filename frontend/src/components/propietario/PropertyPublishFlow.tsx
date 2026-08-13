"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  Building2,
  Camera,
  Check,
  ChevronLeft,
  CircleHelp,
  Home,
  ImagePlus,
  KeyRound,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import AddressAutocomplete, {
  type ResolvedAddress,
} from "./AddressAutocomplete";
import PropertyLocationMap from "./PropertyLocationMap";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import {
  createProperty,
  getPropertyAmenities,
  markPropertyReady,
  uploadPropertyImages,
} from "@/services/properties";
import type { Amenity, PropertyCreate, PropertyType } from "@/types/property";

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 10;

type Screen =
  | "welcome"
  | "address"
  | "map"
  | "space-intro"
  | "property-type"
  | "listing-type"
  | "basics"
  | "amenities"
  | "photos"
  | "title"
  | "vibe"
  | "description"
  | "conditions";

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

const SCREENS: Screen[] = [
  "welcome",
  "address",
  "map",
  "space-intro",
  "property-type",
  "listing-type",
  "basics",
  "amenities",
  "photos",
  "title",
  "vibe",
  "description",
  "conditions",
];

const PROPERTY_TYPES: Array<{
  value: string;
  propertyType: PropertyType;
  label: string;
  icon: ReactNode;
}> = [
  { value: "apartment", propertyType: "APARTMENT", label: "Piso", icon: <Building2 /> },
  { value: "house", propertyType: "HOUSE", label: "Casa", icon: <Home /> },
  { value: "studio", propertyType: "STUDIO", label: "Estudio", icon: <BedDouble /> },
  { value: "penthouse", propertyType: "SHARED_APARTMENT", label: "Ático", icon: <KeyRound /> },
  { value: "duplex", propertyType: "OTHER", label: "Dúplex", icon: <Building2 /> },
  { value: "chalet", propertyType: "HOUSE", label: "Chalet", icon: <Home /> },
];

const LISTING_TYPES = [
  { value: "whole", label: "Vivienda completa", icon: <Home /> },
  { value: "private", label: "Habitación privada", icon: <BedDouble /> },
  { value: "shared", label: "Habitación compartida", icon: <Users /> },
] as const;

const VIBES = [
  "Tranquilo",
  "Luminoso",
  "Céntrico",
  "Estudiantes",
  "Con terraza",
  "Ordenado",
];

const AMENITY_LABELS = [
  "Wifi",
  "Escritorio",
  "Lavadora",
  "Aire acondicionado",
  "Terraza",
  "Ascensor",
  "Parking",
  "Armario",
  "Cocina equipada",
  "Baño privado",
];

const today = () => new Date().toISOString().slice(0, 10);

export default function PropertyPublishFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const { activateOwnerMode } = useOwnerMode();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [direction, setDirection] = useState(1);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(36.7213);
  const [longitude, setLongitude] = useState(-4.4214);
  const [propertyKind, setPropertyKind] = useState("apartment");
  const [listingType, setListingType] = useState<(typeof LISTING_TYPES)[number]["value"]>("private");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxTenants, setMaxTenants] = useState(4);
  const [availableRooms, setAvailableRooms] = useState(1);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const photosRef = useRef<PendingPhoto[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [title, setTitle] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [minimumStayMonths, setMinimumStayMonths] = useState("6");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    getPropertyAmenities().then(setAmenities).catch(() => setAmenities([]));
  }, []);

  useEffect(() => {
    if (!addressSheetOpen) return;
    const timeout = window.setTimeout(() => addressInputRef.current?.focus(), 220);
    return () => window.clearTimeout(timeout);
  }, [addressSheetOpen]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () =>
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }, []);

  function goTo(next: Screen) {
    setDirection(SCREENS.indexOf(next) >= SCREENS.indexOf(screen) ? 1 : -1);
    setError("");
    setScreen(next);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  function goBack() {
    const index = SCREENS.indexOf(screen);
    if (index <= 0) {
      router.push("/perfil");
      return;
    }
    goTo(SCREENS[index - 1]);
  }

  function resolveAddress(address: ResolvedAddress) {
    setAddressLine(address.addressLine);
    setCity(address.city);
    setProvince(address.province);
    setPostalCode(address.postalCode);
    setNeighborhood(address.neighborhood);
    setLatitude(address.latitude);
    setLongitude(address.longitude);
  }

  function addPhotos(files: FileList | null) {
    setPhotoError("");
    if (!files) return;
    const valid = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const room = MAX_PHOTOS - photos.length;
    if (valid.length > room) setPhotoError(`Puedes añadir hasta ${MAX_PHOTOS} fotos.`);
    setPhotos((current) => [
      ...current,
      ...valid.slice(0, room).map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  }

  function validate(next: Screen) {
    if (screen === "address" && !addressLine) return "Selecciona una dirección para continuar.";
    if (screen === "photos" && photos.length < MIN_PHOTOS) return `Añade al menos ${MIN_PHOTOS} fotos.`;
    if (screen === "title" && title.trim().length < 5) return "El título necesita al menos 5 caracteres.";
    if (screen === "vibe" && vibes.length === 0) return "Selecciona al menos una opción.";
    if (screen === "description" && description.trim().length < 30) return "La descripción necesita al menos 30 caracteres.";
    if (screen === "conditions" && (!rent || !deposit || Number(minimumStayMonths) < 1)) return "Completa el precio, la fianza y la estancia mínima.";
    goTo(next);
    return "";
  }

  async function publish() {
    const validation =
      !rent || !deposit || Number(minimumStayMonths) < 1
        ? "Completa el precio, la fianza y la estancia mínima."
        : "";
    if (validation) {
      setError(validation);
      return;
    }
    setPublishing(true);
    setError("");

    const propertyType =
      PROPERTY_TYPES.find((choice) => choice.value === propertyKind)?.propertyType ??
      "APARTMENT";
    const selectedCatalogAmenities = selectedAmenities
      .map((label) =>
        amenities.find((item) =>
          item.label
            .toLocaleLowerCase("es")
            .includes(label.toLocaleLowerCase("es").split(" ")[0])
        )
      )
      .filter((item): item is Amenity => Boolean(item));

    const payload: PropertyCreate = {
      title: title.trim(),
      description: description.trim(),
      property_type: propertyType,
      address_line: addressLine,
      city,
      province,
      postal_code: postalCode || "00000",
      neighborhood,
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      max_tenants: maxTenants,
      has_elevator: selectedAmenities.includes("Ascensor"),
      furnished: selectedAmenities.some((label) =>
        label.toLocaleLowerCase("es").includes("amuebl")
      ),
      total_monthly_rent: Number(rent),
      deposit: Number(deposit),
      utilities_included: utilitiesIncluded,
      available_from: today(),
      minimum_stay_months: Number(minimumStayMonths),
      additional_requirements: `${availableRooms} habitaciones disponibles · ${vibes.join(", ")} · ${listingType}`,
      amenity_ids: selectedCatalogAmenities.map((item) => item.id),
    };

    try {
      const property = await createProperty(payload);
      await uploadPropertyImages(property.id, photos.map((photo) => photo.file));
      await markPropertyReady(property.id);
      await queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      activateOwnerMode();
      router.push("/propietarios/pisos");
    } catch {
      setError("No hemos podido publicar el piso. Revisa los datos e inténtalo de nuevo.");
      setPublishing(false);
    }
  }

  const blockStep = screen === "space-intro" || ["property-type", "listing-type", "basics", "amenities", "photos"].includes(screen) ? 1 : screen === "title" || screen === "vibe" || screen === "description" ? 2 : screen === "conditions" ? 3 : null;

  return (
    <div className="min-h-dvh bg-[#fdfcfb] text-foreground">
      <FlowHeader onBack={goBack} onClose={() => router.push("/perfil")} first={screen === "welcome"} />
      <main className="mx-auto w-full max-w-4xl px-5 pb-36 sm:px-8 lg:px-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={screen}
            custom={direction}
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : direction * 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: prefersReducedMotion ? 0 : direction * -12 }}
            transition={{ duration: prefersReducedMotion ? 0.08 : 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen === "welcome" ? <WelcomeScreen /> : null}
            {screen === "address" ? <AddressScreen address={addressLine} onOpen={() => setAddressSheetOpen(true)} /> : null}
            {screen === "map" ? <MapScreen address={addressLine} latitude={latitude} longitude={longitude} onCoordinatesChange={({ latitude: lat, longitude: lon }) => { setLatitude(lat); setLongitude(lon); }} onAddressResolved={resolveAddress} /> : null}
            {screen === "space-intro" ? <SpaceIntroduction /> : null}
            {screen === "property-type" ? <ChoiceGrid title="¿Qué tipo de vivienda es?" choices={PROPERTY_TYPES} selected={propertyKind} onSelect={setPropertyKind} /> : null}
            {screen === "listing-type" ? <ChoiceList title="¿Qué vas a publicar?" choices={LISTING_TYPES} selected={listingType} onSelect={(value) => setListingType(value as typeof listingType)} /> : null}
            {screen === "basics" ? <BasicsScreen bedrooms={bedrooms} bathrooms={bathrooms} maxTenants={maxTenants} availableRooms={availableRooms} onBedrooms={setBedrooms} onBathrooms={setBathrooms} onMaxTenants={setMaxTenants} onAvailableRooms={setAvailableRooms} /> : null}
            {screen === "amenities" ? <AmenitiesScreen catalog={amenities} selected={selectedAmenities} onToggle={(id) => setSelectedAmenities((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} /> : null}
            {screen === "photos" ? <PhotosScreen photos={photos} error={photoError} onAdd={addPhotos} onRemove={removePhoto} /> : null}
            {screen === "title" ? <TextScreen title="Ponle un título" value={title} onChange={setTitle} placeholder="Habitación luminosa en piso compartido" maxLength={150} /> : null}
            {screen === "vibe" ? <VibeScreen selected={vibes} onToggle={(vibe) => setVibes((current) => current.includes(vibe) ? current.filter((item) => item !== vibe) : [...current, vibe])} /> : null}
            {screen === "description" ? <TextScreen title="Cuéntales cómo es tu vivienda" value={description} onChange={setDescription} placeholder="Describe el espacio, la zona y el ambiente que quieres crear…" multiline maxLength={2000} /> : null}
            {screen === "conditions" ? <ConditionsScreen rent={rent} deposit={deposit} utilitiesIncluded={utilitiesIncluded} minimumStayMonths={minimumStayMonths} onRent={setRent} onDeposit={setDeposit} onUtilities={setUtilitiesIncluded} onMinimumStay={setMinimumStayMonths} /> : null}
          </motion.div>
        </AnimatePresence>
        {error ? <p role="alert" className="mt-5 text-center text-sm font-semibold text-red-600">{error}</p> : null}
      </main>

      <FlowFooter screen={screen} blockStep={blockStep} publishing={publishing} onBack={goBack} onNext={() => {
        const next = nextScreen(screen);
        const validation = validate(next);
        if (validation) setError(validation);
      }} onPublish={publish} />

      <AddressSheet open={addressSheetOpen} inputRef={addressInputRef} value={addressLine} onChange={setAddressLine} onClose={() => setAddressSheetOpen(false)} onResolved={(address) => { resolveAddress(address); setAddressSheetOpen(false); goTo("map"); }} />
    </div>
  );
}

function nextScreen(screen: Screen): Screen {
  const index = SCREENS.indexOf(screen);
  return SCREENS[Math.min(SCREENS.length - 1, index + 1)];
}

function FlowHeader({ onBack, onClose, first }: { onBack: () => void; onClose: () => void; first: boolean }) {
  return (
    <header className="mx-auto flex h-24 w-full max-w-5xl items-center justify-between px-5 sm:px-8 lg:px-10">
      <button type="button" onClick={first ? onClose : onBack} aria-label={first ? "Cerrar" : "Atrás"} className="flex h-11 w-11 items-center justify-center rounded-full text-brand-dark transition hover:bg-surface-soft">
        {first ? <X className="h-7 w-7" /> : <ChevronLeft className="h-7 w-7" />}
      </button>
      <a href="/propietarios/ayuda" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-bold text-brand-dark shadow-soft sm:px-5 sm:text-base">
        <CircleHelp className="h-5 w-5" /> ¿Tienes alguna duda?
      </a>
    </header>
  );
}

function WelcomeScreen() {
  return (
    <section className="flex min-h-[calc(100dvh-13rem)] flex-col items-center justify-center text-center">
      <div className="relative aspect-[4/3] w-full max-w-2xl">
        <Image src="/images/owner-publish-home-realistic.png" alt="Salón luminoso de una vivienda compartida" fill priority sizes="(min-width: 768px) 640px, 92vw" className="object-contain" />
      </div>
      <h1 className="mt-6 font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">Publica tu vivienda en CoFlow</h1>
    </section>
  );
}

function AddressScreen({ address, onOpen }: { address: string; onOpen: () => void }) {
  return (
    <section className="mx-auto max-w-2xl pt-[12vh] sm:pt-24">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">¿Dónde está tu vivienda?</h1>
      <button type="button" onClick={onOpen} className="mt-10 flex h-17 w-full items-center gap-4 rounded-full border border-border bg-surface px-6 text-left text-lg font-medium text-brand-dark shadow-[0_12px_30px_rgba(26,55,43,0.08)] transition hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary">
        <Search className="h-6 w-6 text-secondary" />
        <span className={address ? "truncate" : "text-secondary/70"}>{address || "¿Dónde está tu vivienda?"}</span>
      </button>
    </section>
  );
}

function MapScreen(props: Parameters<typeof PropertyLocationMap>[0]) {
  return (
    <section className="mx-auto max-w-3xl pt-4 sm:pt-8">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">¿El marcador está en el lugar correcto?</h1>
      <p className="mt-4 max-w-2xl text-lg leading-7 text-secondary sm:text-xl">Solo mostraremos la zona aproximada. La dirección exacta seguirá siendo privada.</p>
      <div className="mt-8"><PropertyLocationMap {...props} /></div>
    </section>
  );
}

function SpaceIntroduction() {
  return (
    <section className="flex min-h-[calc(100dvh-14rem)] flex-col justify-center">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-2xl sm:aspect-[5/4]">
        <Image src="/images/owner-space-intro.png" alt="Distribución completa de una vivienda" fill priority sizes="(min-width: 768px) 680px, 92vw" className="object-contain" />
      </div>
      <p className="mt-3 text-base font-bold text-brand-dark">Paso 1</p>
      <h1 className="mt-2 font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">Describe tu espacio</h1>
    </section>
  );
}

function ChoiceGrid({ title, choices, selected, onSelect }: { title: string; choices: Array<{ value: string; label: string; icon: ReactNode }>; selected: string; onSelect: (value: string) => void }) {
  return (
    <section className="pt-8 sm:pt-12">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">{title}</h1>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
        {choices.map((choice, index) => (
          <button key={`${choice.value}-${index}`} type="button" onClick={() => onSelect(choice.value)} className={`flex aspect-[1.08] flex-col items-center justify-center gap-4 rounded-24 border bg-surface p-5 text-xl font-semibold text-brand-dark shadow-soft transition hover:-translate-y-1 ${selected === choice.value ? "border-primary ring-1 ring-primary" : "border-border"}`}>
            <span className="[&>svg]:h-14 [&>svg]:w-14 [&>svg]:stroke-[1.5]">{choice.icon}</span>{choice.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function ChoiceList({ title, choices, selected, onSelect }: { title: string; choices: ReadonlyArray<{ value: string; label: string; icon: ReactNode }>; selected: string; onSelect: (value: string) => void }) {
  return (
    <section className="mx-auto max-w-3xl pt-8 sm:pt-12">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">{title}</h1>
      <div className="mt-10 space-y-4">
        {choices.map((choice) => (
          <button key={choice.value} type="button" onClick={() => onSelect(choice.value)} className={`flex min-h-28 w-full items-center gap-5 rounded-24 border bg-surface p-5 text-left shadow-soft transition sm:p-7 ${selected === choice.value ? "border-primary ring-1 ring-primary" : "border-border"}`}>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-18 border border-primary/10 text-primary [&>svg]:h-9 [&>svg]:w-9 [&>svg]:stroke-[1.6]">{choice.icon}</span>
            <span className="flex-1 text-xl font-bold text-brand-dark sm:text-2xl">{choice.label}</span>
            {selected === choice.value ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"><Check className="h-5 w-5" /></span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function BasicsScreen({ bedrooms, bathrooms, maxTenants, availableRooms, onBedrooms, onBathrooms, onMaxTenants, onAvailableRooms }: { bedrooms: number; bathrooms: number; maxTenants: number; availableRooms: number; onBedrooms: (value: number) => void; onBathrooms: (value: number) => void; onMaxTenants: (value: number) => void; onAvailableRooms: (value: number) => void }) {
  return (
    <section className="mx-auto max-w-3xl pt-8 sm:pt-12">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">Información básica</h1>
      <div className="mt-10 space-y-4">
        <Counter label="Habitaciones" icon={<BedDouble />} value={bedrooms} onChange={onBedrooms} />
        <Counter label="Baños" icon={<Bath />} value={bathrooms} onChange={onBathrooms} minimum={1} />
        <Counter label="Plazas totales" icon={<Users />} value={maxTenants} onChange={onMaxTenants} minimum={1} />
        <Counter label="Habitaciones disponibles" icon={<KeyRound />} value={availableRooms} onChange={onAvailableRooms} minimum={1} maximum={bedrooms} />
      </div>
    </section>
  );
}

function Counter({ label, icon, value, onChange, minimum = 0, maximum = 20 }: { label: string; icon: ReactNode; value: number; onChange: (value: number) => void; minimum?: number; maximum?: number }) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-24 border border-border bg-surface p-5 shadow-soft sm:px-7">
      <span className="flex h-13 w-13 items-center justify-center rounded-16 border border-primary/10 text-primary [&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      <span className="min-w-0 flex-1 text-lg font-bold text-brand-dark sm:text-xl">{label}</span>
      <button type="button" aria-label={`Restar ${label}`} disabled={value <= minimum} onClick={() => onChange(value - 1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-brand-dark disabled:opacity-30"><Minus className="h-5 w-5" /></button>
      <span className="w-7 text-center text-xl font-bold text-brand-dark">{value}</span>
      <button type="button" aria-label={`Sumar ${label}`} disabled={value >= maximum} onClick={() => onChange(value + 1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-brand-dark disabled:opacity-30"><Plus className="h-5 w-5" /></button>
    </div>
  );
}

function AmenitiesScreen({ catalog: _catalog, selected, onToggle }: { catalog: Amenity[]; selected: string[]; onToggle: (label: string) => void }) {
  return (
    <section className="pt-8 sm:pt-12">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">¿Qué ofrece tu vivienda?</h1>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {AMENITY_LABELS.map((label) => {
          const active = selected.includes(label);
          return <button key={label} type="button" onClick={() => onToggle(label)} className={`relative flex min-h-28 items-center gap-3 rounded-24 border bg-surface p-4 text-left shadow-soft transition ${active ? "border-primary ring-1 ring-primary" : "border-border"}`}><Sparkles className="h-7 w-7 shrink-0 text-primary" /><span className="text-base font-semibold text-brand-dark">{label}</span>{active ? <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"><Check className="h-4 w-4" /></span> : null}</button>;
        })}
      </div>
    </section>
  );
}

function PhotosScreen({ photos, error, onAdd, onRemove }: { photos: PendingPhoto[]; error: string; onAdd: (files: FileList | null) => void; onRemove: (id: string) => void }) {
  return (
    <section className="pt-8 sm:pt-12">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">Añade fotos de tu vivienda</h1>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-24 border-2 border-dashed border-primary/25 bg-surface shadow-soft transition hover:border-primary/50"><span className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/15 text-primary"><ImagePlus className="h-7 w-7" /></span><span className="mt-3 font-bold text-brand-dark">Subir fotos</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => onAdd(event.target.files)} /></label>
        {photos.map((photo, index) => <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-24 border border-border shadow-soft">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.previewUrl} alt={`Foto ${index + 1} de la vivienda`} className="h-full w-full object-cover" />{index === 0 ? <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-dark shadow-soft">Portada</span> : null}<button type="button" aria-label={`Eliminar foto ${index + 1}`} onClick={() => onRemove(photo.id)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-brand-dark shadow-soft"><X className="h-5 w-5" /></button></div>)}
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-18 border border-border bg-surface px-4 py-3 text-sm text-secondary shadow-soft"><Camera className="h-5 w-5 text-primary" />Mínimo {MIN_PHOTOS} fotos · {photos.length}/{MAX_PHOTOS}</div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
    </section>
  );
}

function TextScreen({ title, value, onChange, placeholder, multiline = false, maxLength }: { title: string; value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean; maxLength: number }) {
  return (
    <section className="mx-auto max-w-2xl pt-[10vh] sm:pt-20">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">{title}</h1>
      <div className="mt-10 rounded-24 border border-border bg-surface p-5 shadow-[0_12px_32px_rgba(26,55,43,0.08)] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/8 sm:p-6">
        {multiline ? <textarea autoFocus rows={8} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} className="w-full resize-none bg-transparent text-lg leading-8 text-brand-dark outline-none placeholder:text-secondary/55" /> : <input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} className="h-12 w-full bg-transparent text-xl font-semibold text-brand-dark outline-none placeholder:text-secondary/55" />}
        <p className="mt-3 text-right text-xs font-semibold text-secondary">{value.length}/{maxLength}</p>
      </div>
    </section>
  );
}

function VibeScreen({ selected, onToggle }: { selected: string[]; onToggle: (value: string) => void }) {
  return (
    <section className="mx-auto max-w-2xl pt-[10vh] sm:pt-20">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">¿Cómo describirías el ambiente?</h1>
      <div className="mt-10 flex flex-wrap gap-3">{VIBES.map((vibe) => { const active = selected.includes(vibe); return <button key={vibe} type="button" onClick={() => onToggle(vibe)} className={`inline-flex h-14 items-center gap-2 rounded-full border bg-surface px-5 text-base font-semibold shadow-soft transition ${active ? "border-primary text-brand-dark ring-1 ring-primary" : "border-border text-secondary"}`}>{vibe}{active ? <Check className="h-5 w-5 text-primary" /> : null}</button>; })}</div>
    </section>
  );
}

function ConditionsScreen({ rent, deposit, utilitiesIncluded, minimumStayMonths, onRent, onDeposit, onUtilities, onMinimumStay }: { rent: string; deposit: string; utilitiesIncluded: boolean; minimumStayMonths: string; onRent: (value: string) => void; onDeposit: (value: string) => void; onUtilities: (value: boolean) => void; onMinimumStay: (value: string) => void }) {
  return (
    <section className="mx-auto max-w-3xl pt-8 sm:pt-12">
      <h1 className="font-rounded text-4xl font-bold tracking-[-0.045em] text-brand-dark sm:text-6xl">Precio y condiciones</h1>
      <div className="mt-10 space-y-4">
        <PriceInput label="Precio al mes" icon={<WalletCards />} value={rent} onChange={onRent} suffix="€" />
        <PriceInput label="Fianza" icon={<ShieldCheck />} value={deposit} onChange={onDeposit} suffix="€" />
        <div className="flex min-h-24 items-center gap-4 rounded-24 border border-border bg-surface p-5 shadow-soft sm:px-7"><span className="flex h-13 w-13 items-center justify-center rounded-16 border border-primary/10 text-primary"><WalletCards className="h-7 w-7" /></span><span className="flex-1 text-lg font-bold text-brand-dark">Gastos incluidos</span><button type="button" role="switch" aria-checked={utilitiesIncluded} onClick={() => onUtilities(!utilitiesIncluded)} className={`relative h-8 w-14 rounded-full transition ${utilitiesIncluded ? "bg-primary" : "bg-border"}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${utilitiesIncluded ? "left-7" : "left-1"}`} /></button></div>
        <PriceInput label="Estancia mínima" icon={<KeyRound />} value={minimumStayMonths} onChange={onMinimumStay} suffix="meses" />
      </div>
    </section>
  );
}

function PriceInput({ label, icon, value, onChange, suffix }: { label: string; icon: ReactNode; value: string; onChange: (value: string) => void; suffix: string }) {
  return <label className="flex min-h-24 items-center gap-4 rounded-24 border border-border bg-surface p-5 shadow-soft transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/8 sm:px-7"><span className="flex h-13 w-13 items-center justify-center rounded-16 border border-primary/10 text-primary [&>svg]:h-7 [&>svg]:w-7">{icon}</span><span className="flex-1 text-lg font-bold text-brand-dark">{label}</span><input type="number" inputMode="numeric" min="0" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" className="w-20 bg-transparent text-right text-xl font-bold text-brand-dark outline-none placeholder:text-secondary/45" /><span className="font-semibold text-secondary">{suffix}</span></label>;
}

function FlowFooter({ screen, blockStep, publishing, onBack, onNext, onPublish }: { screen: Screen; blockStep: number | null; publishing: boolean; onBack: () => void; onNext: () => void; onPublish: () => void }) {
  if (screen === "address") return null;
  const final = screen === "conditions";
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[#fdfcfb]/94 px-5 pb-[calc(1rem+var(--safe-bottom))] pt-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto max-w-4xl">
        {blockStep ? <div className="mb-4 grid grid-cols-3 gap-2" aria-label={`Bloque ${blockStep} de 3`}>{[1, 2, 3].map((item) => <span key={item} className={`h-1.5 rounded-full ${item <= blockStep ? "bg-primary" : "bg-border"}`} />)}</div> : null}
        <div className={`grid gap-3 ${screen === "welcome" ? "grid-cols-1" : "grid-cols-[.72fr_1.28fr]"}`}>
          {screen !== "welcome" ? <button type="button" onClick={onBack} disabled={publishing} className="h-14 rounded-full border border-primary bg-surface px-5 text-base font-bold text-brand-dark disabled:opacity-50">Atrás</button> : null}
          <button type="button" onClick={final ? onPublish : onNext} disabled={publishing} className="flex h-14 items-center justify-center rounded-full bg-brand px-5 text-base font-bold text-white shadow-[0_12px_28px_rgba(16,72,45,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60">{publishing ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Publicando…</> : final ? "Publicar anuncio" : screen === "welcome" ? "Empezar" : "Siguiente"}</button>
        </div>
      </div>
    </footer>
  );
}

function AddressSheet({ open, value, onChange, onResolved, onClose, inputRef }: { open: boolean; value: string; onChange: (value: string) => void; onResolved: (address: ResolvedAddress) => void; onClose: () => void; inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    <AnimatePresence>{open ? <motion.div className="fixed inset-0 z-70 bg-brand-dark/25 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.section role="dialog" aria-modal="true" aria-label="Indica tu dirección" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 flex h-[85dvh] flex-col rounded-t-[2rem] bg-[#fdfcfb] px-5 pb-[calc(1rem+var(--safe-bottom))] pt-5 shadow-[0_-20px_60px_rgba(15,50,33,0.16)] sm:left-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:px-7"><div className="mb-7 flex items-center justify-between"><h2 className="text-xl font-bold text-brand-dark sm:text-2xl">Indica tu dirección</h2><button type="button" onClick={onClose} aria-label="Cerrar búsqueda" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-soft"><X className="h-6 w-6" /></button></div><AddressAutocomplete value={value} onChange={onChange} onResolved={onResolved} inputRef={inputRef} variant="sheet" /></motion.section></motion.div> : null}</AnimatePresence>
  );
}
