"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import ViewportPortal from "@/components/ui/ViewportPortal";
import {
  Archive,
  ArrowUpDown,
  Bath,
  BedDouble,
  Building2,
  Camera,
  Car,
  Check,
  ChevronLeft,
  CircleHelp,
  CookingPot,
  CreditCard,
  Home,
  ImagePlus,
  KeyRound,
  LoaderCircle,
  Minus,
  Monitor,
  Plus,
  Search,
  ShieldCheck,
  Snowflake,
  SunMedium,
  Users,
  WalletCards,
  WashingMachine,
  Wifi,
  X,
} from "lucide-react";
import AddressAutocomplete, {
  type ResolvedAddress,
} from "./AddressAutocomplete";
import PropertyLocationMap from "./PropertyLocationMap";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { confirmPaymentMethod, createSetupIntent, getPaymentMethodStatus } from "@/services/billing";
import {
  createProperty,
  getPropertyAmenities,
  markPropertyReady,
  subscribeProperty,
  uploadPropertyImages,
} from "@/services/properties";
import type { Amenity, PropertyCreate, PropertyType } from "@/types/property";

// Suscripción de 23,99€/mes por piso, 30 días de prueba gratis desde
// que se publica (ver backend PROPERTY_SUBSCRIPTION_TRIAL_DAYS). Se usa
// solo para el mensaje informativo de esta pantalla — la fecha real la
// fija Stripe en el momento de crear la suscripción.
const TRIAL_DAYS = 30;
const SUBSCRIPTION_PRICE_LABEL = "23,99 €/mes";

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
  | "conditions"
  | "payment";

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type PriceField = "rent" | "deposit" | "minimumStay";

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
  "payment",
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
  { value: "duplex", propertyType: "OTHER", label: "Dúplex", icon: <ArrowUpDown /> },
  { value: "chalet", propertyType: "HOUSE", label: "Chalet", icon: <SunMedium /> },
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
  "Familiar",
  "Estudiantes",
  "Profesionales",
  "Sociable",
  "Independiente",
  "Con terraza",
  "Ordenado",
  "Acogedor",
  "Pet friendly",
];

const AMENITIES: Array<{ label: string; icon: ReactNode }> = [
  { label: "Wifi", icon: <Wifi /> },
  { label: "Escritorio", icon: <Monitor /> },
  { label: "Lavadora", icon: <WashingMachine /> },
  { label: "Aire acondicionado", icon: <Snowflake /> },
  { label: "Terraza", icon: <SunMedium /> },
  { label: "Ascensor", icon: <ArrowUpDown /> },
  { label: "Parking", icon: <Car /> },
  { label: "Armario", icon: <Archive /> },
  { label: "Cocina equipada", icon: <CookingPot /> },
  { label: "Baño privado", icon: <Bath /> },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function PropertyPublishFlow() {
  return <PropertyPublishFlowInner />;
}

function PropertyPublishFlowInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const { activateOwnerMode } = useOwnerMode();
  const paymentRef = useRef<PaymentScreenHandle>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(
    null
  );
  const [screen, setScreen] = useState<Screen>("welcome");
  const [direction, setDirection] = useState(1);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [priceSheet, setPriceSheet] = useState<PriceField | null>(null);
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
    getPaymentMethodStatus()
      .then(setHasPaymentMethod)
      .catch(() => setHasPaymentMethod(false));
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
    return () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }, []);

  function goTo(next: Screen) {
    setDirection(SCREENS.indexOf(next) >= SCREENS.indexOf(screen) ? 1 : -1);
    setError("");
    setScreen(next);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  function goBack() {
    const index = SCREENS.indexOf(screen);
    if (index <= 0) return router.push("/perfil");
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
    if (!rent || !deposit || Number(minimumStayMonths) < 1) {
      setError("Completa el precio, la fianza y la estancia mínima.");
      return;
    }

    setPublishing(true);
    setError("");
    const propertyType = PROPERTY_TYPES.find((choice) => choice.value === propertyKind)?.propertyType ?? "APARTMENT";
    const selectedCatalogAmenities = selectedAmenities
      .map((label) => amenities.find((item) => item.label.toLocaleLowerCase("es").includes(label.toLocaleLowerCase("es").split(" ")[0])))
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
      furnished: selectedAmenities.some((label) => label.toLocaleLowerCase("es").includes("amuebl")),
      total_monthly_rent: Number(rent),
      deposit: Number(deposit),
      utilities_included: utilitiesIncluded,
      available_from: today(),
      minimum_stay_months: Number(minimumStayMonths),
      additional_requirements: `${availableRooms} habitaciones disponibles · ${vibes.join(", ")} · ${listingType}`,
      amenity_ids: selectedCatalogAmenities.map((item) => item.id),
    };

    try {
      if (!hasPaymentMethod) {
        let paymentMethodId: string;
        try {
          paymentMethodId = await paymentRef.current!.confirmCard();
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "No hemos podido guardar la tarjeta. Revísala e inténtalo de nuevo.");
          setPublishing(false);
          return;
        }

        await confirmPaymentMethod(paymentMethodId);
        setHasPaymentMethod(true);
      }

      const property = await createProperty(payload);
      await uploadPropertyImages(property.id, photos.map((photo) => photo.file));
      await markPropertyReady(property.id);
      await subscribeProperty(property.id);
      await queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      activateOwnerMode();
      router.push("/propietarios/pisos");
    } catch {
      setError("No hemos podido publicar el piso. Revisa los datos e inténtalo de nuevo.");
      setPublishing(false);
    }
  }

  const progress = SCREENS.indexOf(screen) + 1;

  return (
    <div className="min-h-dvh bg-white text-[#191919]">
      <FlowHeader onBack={goBack} onClose={() => router.push("/perfil")} first={screen === "welcome"} />
      <main className="mx-auto w-full max-w-4xl px-5 pb-32 sm:px-8 lg:px-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={screen}
            custom={direction}
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : direction * 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: prefersReducedMotion ? 0 : direction * -12 }}
            transition={{ duration: prefersReducedMotion ? 0.08 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen === "welcome" ? <WelcomeScreen /> : null}
            {screen === "address" ? <AddressScreen address={addressLine} onOpen={() => setAddressSheetOpen(true)} /> : null}
            {screen === "map" ? <MapScreen address={addressLine} latitude={latitude} longitude={longitude} onCoordinatesChange={({ latitude: lat, longitude: lon }) => { setLatitude(lat); setLongitude(lon); }} onAddressResolved={resolveAddress} /> : null}
            {screen === "space-intro" ? <SpaceIntroduction /> : null}
            {screen === "property-type" ? <ChoiceGrid title="¿Qué tipo de vivienda es?" choices={PROPERTY_TYPES} selected={propertyKind} onSelect={setPropertyKind} /> : null}
            {screen === "listing-type" ? <ChoiceList title="¿Qué vas a publicar?" choices={LISTING_TYPES} selected={listingType} onSelect={(value) => setListingType(value as typeof listingType)} /> : null}
            {screen === "basics" ? <BasicsScreen bedrooms={bedrooms} bathrooms={bathrooms} maxTenants={maxTenants} availableRooms={availableRooms} onBedrooms={setBedrooms} onBathrooms={setBathrooms} onMaxTenants={setMaxTenants} onAvailableRooms={setAvailableRooms} /> : null}
            {screen === "amenities" ? <AmenitiesScreen selected={selectedAmenities} onToggle={(label) => setSelectedAmenities((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label])} /> : null}
            {screen === "photos" ? <PhotosScreen photos={photos} error={photoError} onAdd={addPhotos} onRemove={removePhoto} /> : null}
            {screen === "title" ? <TextScreen title="Ponle un título" value={title} onChange={setTitle} placeholder="Habitación luminosa en piso compartido" maxLength={150} /> : null}
            {screen === "vibe" ? <VibeScreen selected={vibes} onToggle={(vibe) => setVibes((current) => current.includes(vibe) ? current.filter((item) => item !== vibe) : [...current, vibe])} /> : null}
            {screen === "description" ? <TextScreen title="Cuéntales cómo es tu vivienda" value={description} onChange={setDescription} placeholder="Describe el espacio, la zona y el ambiente que quieres crear…" multiline maxLength={2000} /> : null}
            {screen === "conditions" ? <ConditionsScreen rent={rent} deposit={deposit} utilitiesIncluded={utilitiesIncluded} minimumStayMonths={minimumStayMonths} onOpen={setPriceSheet} onUtilities={setUtilitiesIncluded} /> : null}
            {screen === "payment" ? <PaymentScreen ref={paymentRef} hasPaymentMethod={hasPaymentMethod} /> : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <FlowFooter screen={screen} progress={progress} publishing={publishing} hasPaymentMethod={hasPaymentMethod} error={error} onBack={goBack} onNext={() => { const validation = validate(nextScreen(screen)); if (validation) setError(validation); }} onPublish={publish} />
      <AddressSheet open={addressSheetOpen} inputRef={addressInputRef} value={addressLine} onChange={setAddressLine} onClose={() => setAddressSheetOpen(false)} onResolved={(address) => { resolveAddress(address); setAddressSheetOpen(false); goTo("map"); }} />
      <PriceSheet field={priceSheet} rent={rent} deposit={deposit} minimumStay={minimumStayMonths} onRent={setRent} onDeposit={setDeposit} onMinimumStay={setMinimumStayMonths} onClose={() => setPriceSheet(null)} />
    </div>
  );
}

function nextScreen(screen: Screen): Screen {
  const index = SCREENS.indexOf(screen);
  return SCREENS[Math.min(SCREENS.length - 1, index + 1)];
}

function FlowHeader({ onBack, onClose, first }: { onBack: () => void; onClose: () => void; first: boolean }) {
  return (
    <header className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-5 sm:h-22 sm:px-8 lg:px-10">
      <button type="button" onClick={first ? onClose : onBack} aria-label={first ? "Cerrar" : "Atrás"} className="flex h-11 w-11 items-center justify-center rounded-full text-[#191919] transition hover:bg-[#f5f5f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
        {first ? <X className="h-7 w-7" /> : <ChevronLeft className="h-7 w-7" />}
      </button>
      <a href="/propietarios/ayuda" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#dddddd] bg-white px-4 text-sm font-bold text-[#191919] shadow-[0_5px_18px_rgba(0,0,0,0.08)] sm:px-5 sm:text-base">
        <CircleHelp className="h-5 w-5" /> ¿Tienes alguna duda?
      </a>
    </header>
  );
}

function WelcomeScreen() {
  return (
    <section className="flex h-[calc(100dvh-12.5rem)] min-h-0 flex-col justify-center overflow-hidden">
      <div className="relative h-[clamp(250px,45dvh,470px)] w-full overflow-hidden rounded-[1.75rem] bg-[#f7f5f2]">
        <Image src="/images/owner-publish-welcome-2026.png" alt="Casa mediterránea luminosa con jardín" fill priority sizes="(min-width: 768px) 780px, 94vw" className="object-cover" />
      </div>
      <h1 className="mt-7 text-[clamp(2.05rem,7vw,4rem)] font-semibold leading-[1.03] tracking-[-0.055em] text-[#191919]">Publica tu vivienda en CoFlow</h1>
    </section>
  );
}

function AddressScreen({ address, onOpen }: { address: string; onOpen: () => void }) {
  return (
    <section className="mx-auto flex h-[calc(100dvh-12.5rem)] max-w-2xl flex-col justify-center">
      <h1 className="text-[clamp(2.25rem,8vw,4rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[#191919]">¿Dónde está tu vivienda?</h1>
      <button type="button" onClick={onOpen} className="mt-9 flex h-16 w-full items-center gap-4 rounded-full border border-[#c9c9c9] bg-white px-6 text-left text-lg font-medium text-[#191919] shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition hover:border-black focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black">
        <Search className="h-6 w-6 text-[#555]" />
        <span className={address ? "truncate" : "text-[#717171]"}>{address || "¿Dónde está tu vivienda?"}</span>
      </button>
    </section>
  );
}

function MapScreen(props: Parameters<typeof PropertyLocationMap>[0]) {
  return (
    <section className="mx-auto flex h-[calc(100dvh-12.5rem)] max-w-3xl flex-col justify-center overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-[clamp(2rem,7vw,3.65rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[#191919]">¿El marcador está en el lugar correcto?</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#717171] sm:text-lg">La dirección exacta nunca se mostrará públicamente.</p>
      </div>
      <div className="mt-5 min-h-0 flex-1"><PropertyLocationMap key={`${props.latitude}-${props.longitude}`} {...props} /></div>
    </section>
  );
}

function SpaceIntroduction() {
  return (
    <section className="flex h-[calc(100dvh-12.5rem)] min-h-0 flex-col justify-center overflow-hidden">
      <div className="relative h-[clamp(250px,45dvh,470px)] w-full overflow-hidden rounded-[1.75rem] bg-[#f5f2ee]">
        <Image src="/images/owner-space-modular-2026.png" alt="Interior modular de una vivienda formándose" fill priority sizes="(min-width: 768px) 780px, 94vw" className="object-cover" />
      </div>
      <p className="mt-6 text-sm font-semibold text-[#717171]">Paso 1</p>
      <h1 className="mt-1 text-[clamp(2.25rem,8vw,4rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[#191919]">Describe tu espacio</h1>
    </section>
  );
}

function ScreenTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-[clamp(2rem,7vw,3.65rem)] font-semibold leading-[1.03] tracking-[-0.05em] text-[#191919]">{children}</h1>;
}

function ChoiceGrid({ title, choices, selected, onSelect }: { title: string; choices: Array<{ value: string; label: string; icon: ReactNode }>; selected: string; onSelect: (value: string) => void }) {
  return (
    <section className="mx-auto max-w-3xl pt-4 sm:pt-8">
      <ScreenTitle>{title}</ScreenTitle>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {choices.map((choice) => {
          const active = selected === choice.value;
          return <button key={choice.value} type="button" onClick={() => onSelect(choice.value)} className={`relative flex min-h-31 flex-col items-start justify-between rounded-[1.25rem] border bg-white p-4 text-left shadow-[0_5px_16px_rgba(0,0,0,0.055)] transition hover:-translate-y-0.5 ${active ? "border-black ring-1 ring-black" : "border-[#dddddd]"}`}><span className="text-[#222] [&>svg]:h-7 [&>svg]:w-7 [&>svg]:stroke-[1.65]">{choice.icon}</span><span className="text-base font-semibold text-[#191919]">{choice.label}</span>{active ? <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white"><Check className="h-4 w-4" /></span> : null}</button>;
        })}
      </div>
    </section>
  );
}

function ChoiceList({ title, choices, selected, onSelect }: { title: string; choices: ReadonlyArray<{ value: string; label: string; icon: ReactNode }>; selected: string; onSelect: (value: string) => void }) {
  return (
    <section className="mx-auto max-w-2xl pt-4 sm:pt-8">
      <ScreenTitle>{title}</ScreenTitle>
      <div className="mt-7 space-y-3">
        {choices.map((choice) => {
          const active = selected === choice.value;
          return <button key={choice.value} type="button" onClick={() => onSelect(choice.value)} className={`flex min-h-20 w-full items-center gap-4 rounded-[1.25rem] border bg-white px-5 py-4 text-left shadow-[0_5px_16px_rgba(0,0,0,0.055)] transition ${active ? "border-black ring-1 ring-black" : "border-[#dddddd]"}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#222] [&>svg]:h-6 [&>svg]:w-6 [&>svg]:stroke-[1.65]">{choice.icon}</span><span className="flex-1 text-lg font-semibold text-[#191919]">{choice.label}</span>{active ? <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white"><Check className="h-4 w-4" /></span> : null}</button>;
        })}
      </div>
    </section>
  );
}

function BasicsScreen(props: { bedrooms: number; bathrooms: number; maxTenants: number; availableRooms: number; onBedrooms: (value: number) => void; onBathrooms: (value: number) => void; onMaxTenants: (value: number) => void; onAvailableRooms: (value: number) => void }) {
  return (
    <section className="mx-auto max-w-2xl pt-4 sm:pt-8">
      <ScreenTitle>Información básica</ScreenTitle>
      <div className="mt-7 divide-y divide-[#e6e6e6] rounded-[1.5rem] border border-[#dddddd] bg-white px-5 shadow-[0_6px_20px_rgba(0,0,0,0.055)]">
        <Counter label="Habitaciones" value={props.bedrooms} onChange={props.onBedrooms} />
        <Counter label="Baños" value={props.bathrooms} onChange={props.onBathrooms} minimum={1} />
        <Counter label="Plazas totales" value={props.maxTenants} onChange={props.onMaxTenants} minimum={1} />
        <Counter label="Habitaciones disponibles" value={props.availableRooms} onChange={props.onAvailableRooms} minimum={1} maximum={props.bedrooms} />
      </div>
    </section>
  );
}

function Counter({ label, value, onChange, minimum = 0, maximum = 20 }: { label: string; value: number; onChange: (value: number) => void; minimum?: number; maximum?: number }) {
  return <div className="flex min-h-18 items-center gap-3 py-3"><span className="min-w-0 flex-1 text-base font-semibold text-[#191919]">{label}</span><button type="button" aria-label={`Restar ${label}`} disabled={value <= minimum} onClick={() => onChange(value - 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#bdbdbd] text-[#222] disabled:opacity-25"><Minus className="h-4 w-4" /></button><span className="w-7 text-center text-lg font-semibold text-[#191919]">{value}</span><button type="button" aria-label={`Sumar ${label}`} disabled={value >= maximum} onClick={() => onChange(value + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#bdbdbd] text-[#222] disabled:opacity-25"><Plus className="h-4 w-4" /></button></div>;
}

function AmenitiesScreen({ selected, onToggle }: { selected: string[]; onToggle: (label: string) => void }) {
  return (
    <section className="mx-auto max-w-3xl pt-4 sm:pt-8">
      <ScreenTitle>¿Qué ofrece tu vivienda?</ScreenTitle>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {AMENITIES.map(({ label, icon }) => {
          const active = selected.includes(label);
          return <button key={label} type="button" onClick={() => onToggle(label)} className={`relative flex min-h-20 items-center gap-3 rounded-[1.1rem] border bg-white p-4 text-left shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition ${active ? "border-black ring-1 ring-black" : "border-[#dddddd]"}`}><span className="text-[#222] [&>svg]:h-6 [&>svg]:w-6 [&>svg]:stroke-[1.6]">{icon}</span><span className="pr-5 text-sm font-semibold text-[#191919]">{label}</span>{active ? <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white"><Check className="h-3.5 w-3.5" /></span> : null}</button>;
        })}
      </div>
    </section>
  );
}

function PhotosScreen({ photos, error, onAdd, onRemove }: { photos: PendingPhoto[]; error: string; onAdd: (files: FileList | null) => void; onRemove: (id: string) => void }) {
  return (
    <section className="mx-auto max-w-3xl pt-4 sm:pt-8">
      <ScreenTitle>Añade fotos</ScreenTitle>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-[#cfcfcf] bg-white shadow-[0_5px_16px_rgba(0,0,0,0.055)] transition hover:border-black"><ImagePlus className="h-7 w-7" /><span className="text-sm font-semibold">Elegir fotos</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => onAdd(event.target.files)} /></label>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-[#cfcfcf] bg-white shadow-[0_5px_16px_rgba(0,0,0,0.055)] transition hover:border-black"><Camera className="h-7 w-7" /><span className="text-sm font-semibold">Tomar una foto</span><input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => onAdd(event.target.files)} /></label>
      </div>
      {photos.length ? <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{photos.map((photo, index) => <div key={photo.id} className="relative aspect-square overflow-hidden rounded-[1rem] border border-[#dddddd]"><Image src={photo.previewUrl} alt={`Foto ${index + 1} de la vivienda`} fill unoptimized className="object-cover" />{index === 0 ? <span className="absolute bottom-2 left-2 rounded-full bg-black px-2 py-1 text-[10px] font-semibold text-white">Portada</span> : null}<button type="button" aria-label={`Eliminar foto ${index + 1}`} onClick={() => onRemove(photo.id)} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-black shadow"><X className="h-4 w-4" /></button></div>)}</div> : null}
      <p className="mt-4 text-sm text-[#717171]">Mínimo {MIN_PHOTOS} fotos · {photos.length}/{MAX_PHOTOS}</p>
      {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
    </section>
  );
}

function TextScreen({ title, value, onChange, placeholder, multiline = false, maxLength }: { title: string; value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean; maxLength: number }) {
  return (
    <section className="mx-auto flex h-[calc(100dvh-12.5rem)] max-w-2xl flex-col justify-center">
      <ScreenTitle>{title}</ScreenTitle>
      <div className="mt-8 rounded-[1.5rem] border border-[#c9c9c9] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition focus-within:border-black focus-within:ring-1 focus-within:ring-black sm:p-6">
        {multiline ? <textarea autoFocus rows={7} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} className="w-full resize-none bg-transparent text-lg leading-8 text-[#191919] outline-none placeholder:text-[#8c8c8c]" /> : <input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} className="h-12 w-full bg-transparent text-xl font-semibold text-[#191919] outline-none placeholder:text-[#8c8c8c]" />}
        <p className="mt-2 text-right text-xs font-semibold text-[#717171]">{value.length}/{maxLength}</p>
      </div>
    </section>
  );
}

function VibeScreen({ selected, onToggle }: { selected: string[]; onToggle: (value: string) => void }) {
  return (
    <section className="mx-auto max-w-2xl pt-4 sm:pt-8">
      <ScreenTitle>¿Cómo describirías el ambiente?</ScreenTitle>
      <div className="mt-8 flex flex-wrap gap-2.5">{VIBES.map((vibe) => { const active = selected.includes(vibe); return <button key={vibe} type="button" onClick={() => onToggle(vibe)} className={`inline-flex h-12 items-center gap-2 rounded-full border bg-white px-5 text-sm font-semibold shadow-[0_3px_10px_rgba(0,0,0,0.045)] transition ${active ? "border-black bg-black text-white" : "border-[#d5d5d5] text-[#333]"}`}>{vibe}{active ? <Check className="h-4 w-4" /> : null}</button>; })}</div>
    </section>
  );
}

function ConditionsScreen({ rent, deposit, utilitiesIncluded, minimumStayMonths, onOpen, onUtilities }: { rent: string; deposit: string; utilitiesIncluded: boolean; minimumStayMonths: string; onOpen: (field: PriceField) => void; onUtilities: (value: boolean) => void }) {
  return (
    <section className="mx-auto max-w-2xl pt-4 sm:pt-8">
      <ScreenTitle>Precio y condiciones</ScreenTitle>
      <div className="mt-7 divide-y divide-[#e6e6e6] rounded-[1.5rem] border border-[#dddddd] bg-white px-5 shadow-[0_6px_20px_rgba(0,0,0,0.055)]">
        <ConditionRow label="Precio al mes" value={rent ? `${rent} €` : "Añadir"} icon={<WalletCards />} onClick={() => onOpen("rent")} emphasized />
        <ConditionRow label="Fianza" value={deposit ? `${deposit} €` : "Añadir"} icon={<ShieldCheck />} onClick={() => onOpen("deposit")} emphasized />
        <div className="flex min-h-19 items-center gap-3 py-3"><WalletCards className="h-5 w-5" /><span className="flex-1 font-semibold">Gastos incluidos</span><button type="button" role="switch" aria-checked={utilitiesIncluded} onClick={() => onUtilities(!utilitiesIncluded)} className={`relative h-8 w-13 rounded-full transition ${utilitiesIncluded ? "bg-black" : "bg-[#d6d6d6]"}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${utilitiesIncluded ? "left-6" : "left-1"}`} /></button></div>
        <ConditionRow label="Estancia mínima" value={`${minimumStayMonths || "0"} meses`} icon={<KeyRound />} onClick={() => onOpen("minimumStay")} />
      </div>
    </section>
  );
}

export type PaymentScreenHandle = { confirmCard: () => Promise<string> };

const PaymentScreen = forwardRef<PaymentScreenHandle, { hasPaymentMethod: boolean | null }>(
  function PaymentScreen({ hasPaymentMethod }, ref) {
    const trialEndDate = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const trialEndLabel = trialEndDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
      if (hasPaymentMethod === false && !clientSecret) {
        createSetupIntent().then((data) => setClientSecret(data.client_secret));
      }
    }, [hasPaymentMethod, clientSecret]);

    return (
      <section className="mx-auto max-w-2xl pt-4 sm:pt-8">
        <ScreenTitle>Añade tu método de pago</ScreenTitle>
        <p className="mt-3 text-sm leading-6 text-[#717171] sm:text-base">
          Cada piso publicado tiene una cuota de <strong className="text-[#191919]">{SUBSCRIPTION_PRICE_LABEL}</strong>, y se cobra <strong className="text-[#191919]">por separado en cada piso que tengas publicado</strong> — si tienes 2 pisos, son 2 cuotas; si tienes 3, son 3, y así con cada uno. No se te cobrará nada durante los primeros {TRIAL_DAYS} días: el primer cobro de este piso sería el <strong className="text-[#191919]">{trialEndLabel}</strong>, y solo si sigue publicado.
        </p>

        {hasPaymentMethod === null ? (
          <div className="mt-8 flex items-center gap-3 text-[#717171]">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Comprobando tu método de pago…</span>
          </div>
        ) : hasPaymentMethod ? (
          <div className="mt-8 flex items-center gap-4 rounded-[1.5rem] border border-[#dddddd] bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,0.055)]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#222]"><CreditCard className="h-5 w-5" /></span>
            <p className="text-sm font-semibold text-[#191919]">Ya tienes una tarjeta guardada. Se usará también para este piso, como una cuota nueva e independiente de tus otros pisos.</p>
          </div>
        ) : clientSecret ? (
          <div className="mt-8 rounded-[1.5rem] border border-[#c9c9c9] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:p-6">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm ref={ref} />
            </Elements>
          </div>
        ) : (
          <div className="mt-8 flex items-center gap-3 text-[#717171]">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Preparando el formulario de pago…</span>
          </div>
        )}
      </section>
    );
  }
);

const PaymentForm = forwardRef<PaymentScreenHandle>(function PaymentForm(_props, ref) {
  const stripe = useStripe();
  const elements = useElements();

  useImperativeHandle(ref, () => ({
    async confirmCard() {
      if (!stripe || !elements) {
        throw new Error("El formulario de pago todavía no está listo. Espera un momento e inténtalo de nuevo.");
      }

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (error || !setupIntent?.payment_method) {
        throw new Error(error?.message ?? "No hemos podido guardar la tarjeta. Revísala e inténtalo de nuevo.");
      }

      return setupIntent.payment_method as string;
    },
  }));

  return <PaymentElement />;
});

function ConditionRow({ label, value, icon, onClick, emphasized = false }: { label: string; value: string; icon: ReactNode; onClick: () => void; emphasized?: boolean }) {
  return <button type="button" onClick={onClick} className="flex min-h-19 w-full items-center gap-3 py-3 text-left"><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="flex-1 font-semibold">{label}</span><strong className={emphasized ? "text-xl font-bold" : "text-base font-semibold"}>{value}</strong><ChevronLeft className="h-5 w-5 rotate-180 text-[#717171]" /></button>;
}

function FlowFooter({ screen, progress, publishing, hasPaymentMethod, error, onBack, onNext, onPublish }: { screen: Screen; progress: number; publishing: boolean; hasPaymentMethod: boolean | null; error: string; onBack: () => void; onNext: () => void; onPublish: () => void }) {
  const final = screen === "payment";
  const actionDisabled = publishing || (final && hasPaymentMethod === null);
  const actionLabel = publishing
    ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Publicando…</>
    : final
      ? (hasPaymentMethod ? "Publicar anuncio" : "Guardar tarjeta y publicar")
      : screen === "welcome" ? "Empezar" : "Siguiente";

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e5e5] bg-white/96 px-5 pb-[calc(1rem+var(--safe-bottom))] pt-3 backdrop-blur-xl sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-13 gap-1.5" aria-label={`Pantalla ${progress} de ${SCREENS.length}`}>{SCREENS.map((item, index) => <span key={item} className={`h-1 rounded-full ${index < progress ? "bg-black" : "bg-[#dddddd]"}`} />)}</div>
        {error ? <p role="alert" className="mt-2 truncate text-center text-xs font-semibold text-red-600">{error}</p> : null}
        <div className={`mt-3 grid gap-3 ${screen === "welcome" ? "grid-cols-1" : "grid-cols-[.68fr_1.32fr]"}`}>
          {screen !== "welcome" ? <button type="button" onClick={onBack} disabled={publishing} className="h-13 rounded-full px-5 text-base font-semibold text-[#191919] underline underline-offset-4 disabled:opacity-50">Atrás</button> : null}
          <button type="button" onClick={final ? onPublish : onNext} disabled={actionDisabled} className="flex h-13 items-center justify-center rounded-full bg-black px-5 text-base font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition hover:bg-[#282828] disabled:opacity-60">{actionLabel}</button>
        </div>
      </div>
    </footer>
  );
}

function AddressSheet({ open, value, onChange, onResolved, onClose, inputRef }: { open: boolean; value: string; onChange: (value: string) => void; onResolved: (address: ResolvedAddress) => void; onClose: () => void; inputRef: RefObject<HTMLInputElement | null> }) {
  return <ViewportPortal><AnimatePresence>{open ? <motion.div className="fixed inset-0 z-70 bg-black/28 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.section role="dialog" aria-modal="true" aria-label="Indica tu dirección" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 flex h-[85dvh] flex-col rounded-t-[2rem] bg-white px-5 pb-[calc(1rem+var(--safe-bottom))] pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.14)] sm:left-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:px-7"><div className="mb-7 flex items-center justify-between"><h2 className="text-xl font-semibold text-[#191919] sm:text-2xl">Indica tu dirección</h2><button type="button" onClick={onClose} aria-label="Cerrar búsqueda" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]"><X className="h-6 w-6" /></button></div><AddressAutocomplete value={value} onChange={onChange} onResolved={onResolved} inputRef={inputRef} variant="sheet" /></motion.section></motion.div> : null}</AnimatePresence></ViewportPortal>;
}

function PriceSheet({ field, rent, deposit, minimumStay, onRent, onDeposit, onMinimumStay, onClose }: { field: PriceField | null; rent: string; deposit: string; minimumStay: string; onRent: (value: string) => void; onDeposit: (value: string) => void; onMinimumStay: (value: string) => void; onClose: () => void }) {
  if (!field) return null;
  const config = field === "rent" ? { title: "Precio al mes", value: rent, suffix: "€", onChange: onRent } : field === "deposit" ? { title: "Fianza", value: deposit, suffix: "€", onChange: onDeposit } : { title: "Estancia mínima", value: minimumStay, suffix: "meses", onChange: onMinimumStay };
  return <ViewportPortal><AnimatePresence><motion.div className="fixed inset-0 z-80 bg-black/28 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.section role="dialog" aria-modal="true" aria-label={config.title} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 rounded-t-[2rem] bg-white px-6 pb-[calc(1.25rem+var(--safe-bottom))] pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.14)] sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2"><div className="mx-auto h-1.5 w-12 rounded-full bg-[#d7d7d7]" /><div className="mt-6 flex items-center justify-between"><h2 className="text-2xl font-semibold tracking-tight">{config.title}</h2><button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5]"><X className="h-5 w-5" /></button></div><label className="mt-10 flex items-baseline justify-center gap-3 border-b-2 border-black pb-4"><input autoFocus type="number" inputMode="numeric" min="0" value={config.value} onChange={(event) => config.onChange(event.target.value)} placeholder="0" className="w-44 bg-transparent text-center text-6xl font-semibold tracking-[-0.05em] outline-none placeholder:text-[#c5c5c5]" /><span className="text-xl font-semibold text-[#717171]">{config.suffix}</span></label><button type="button" onClick={onClose} className="mt-10 h-14 w-full rounded-full bg-black text-base font-semibold text-white">Guardar</button></motion.section></motion.div></AnimatePresence></ViewportPortal>;
}
