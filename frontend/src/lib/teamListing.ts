import type { Amenity, PropertyStatus, PropertyType } from "@/types/property";
import type {
  NewOwnerInput,
  OwnerType,
  TeamOwner,
  TeamPropertyDetail,
  TeamPropertyUpdate,
} from "@/types/team";

/* Lógica compartida del alta asistida y del panel del equipo: el
 * borrador del formulario, su conversión al contrato de la API y la
 * lista de "lo que falta para publicar", que replica a propósito
 * PropertyService._missing_ready_fields del backend para que el equipo
 * lo vea ANTES de pulsar publicar, no como un error después. */

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Piso",
  SHARED_APARTMENT: "Piso compartido",
  STUDIO: "Estudio",
  HOUSE: "Casa",
  OTHER: "Otro",
};

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; hint: string }[] = [
  { value: "APARTMENT", hint: "Vivienda completa" },
  { value: "SHARED_APARTMENT", hint: "Se alquila por habitaciones" },
  { value: "STUDIO", hint: "Un único espacio" },
  { value: "HOUSE", hint: "Chalet, adosado…" },
  { value: "OTHER", hint: "Loft, dúplex…" },
];

export const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  AGENCY: "Inmobiliaria",
  INDIVIDUAL: "Particular",
  COMPANY: "Empresa",
};

export const TEAM_STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Borrador",
  READY: "Publicada",
  PAUSED: "Pausada",
  PUBLISHED: "Visible",
  RENTED: "Alquilada",
  ARCHIVED: "Archivada",
};

export const EDITABLE_STATUSES: PropertyStatus[] = ["DRAFT", "READY", "PAUSED"];

export type WizardStep =
  | "cliente"
  | "ubicacion"
  | "vivienda"
  | "precio"
  | "anuncio"
  | "fotos";

export const WIZARD_STEPS: { id: WizardStep; label: string }[] = [
  { id: "cliente", label: "Cliente" },
  { id: "ubicacion", label: "Ubicación" },
  { id: "vivienda", label: "Vivienda" },
  { id: "precio", label: "Precio" },
  { id: "anuncio", label: "Anuncio" },
  { id: "fotos", label: "Fotos" },
];

export type TriState = boolean | null;
export type OwnerMode = "existing" | "new";

export interface ListingDraft {
  propertyType: PropertyType | null;
  addressLine: string;
  postalCode: string;
  neighborhood: string;
  city: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
  floor: string;
  surfaceM2: string;
  bedrooms: number;
  bathrooms: number;
  maxTenants: number;
  hasElevator: boolean;
  furnished: boolean;
  amenityIds: number[];
  rent: string;
  deposit: string;
  utilitiesIncluded: boolean;
  availableFrom: string;
  minimumStay: string;
  petsAllowed: TriState;
  smokingAllowed: TriState;
  couplesAllowed: TriState;
  studentsAllowed: TriState;
  registrationAllowed: TriState;
  title: string;
  description: string;
}

export const EMPTY_DRAFT: ListingDraft = {
  propertyType: null,
  addressLine: "",
  postalCode: "",
  neighborhood: "",
  city: "Málaga",
  province: "Málaga",
  latitude: null,
  longitude: null,
  floor: "",
  surfaceM2: "",
  bedrooms: 1,
  bathrooms: 1,
  maxTenants: 1,
  hasElevator: false,
  furnished: false,
  amenityIds: [],
  rent: "",
  deposit: "",
  utilitiesIncluded: false,
  availableFrom: "",
  minimumStay: "",
  petsAllowed: null,
  smokingAllowed: null,
  couplesAllowed: null,
  studentsAllowed: null,
  registrationAllowed: null,
  title: "",
  description: "",
};

/* Misma regla que el backend (assisted_listings.py): el alta asistida
   admite toda la provincia de Málaga, no solo la capital. Manda el código
   postal (los de la provincia empiezan por 29); si no hay, el nombre de
   provincia; sin ninguno no se bloquea, porque la dirección puede
   completarse después. */
export function isInMalagaProvince(draft: Pick<ListingDraft, "province" | "postalCode">): boolean {
  const postal = draft.postalCode.trim();
  if (postal) return postal.startsWith("29");
  const province = draft.province.trim().toLowerCase();
  if (province) return province === "málaga" || province === "malaga";
  return true;
}

export const EMPTY_NEW_OWNER: NewOwnerInput = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  owner_type: "AGENCY",
  company_name: "",
};

export function draftFromProperty(property: TeamPropertyDetail): ListingDraft {
  const optional = (value: number | null) => (value === null ? "" : String(value));

  return {
    propertyType: property.property_type,
    addressLine: property.address_line,
    postalCode: property.postal_code,
    neighborhood: property.neighborhood ?? "",
    city: property.city || "Málaga",
    province: property.province || "Málaga",
    latitude: property.latitude,
    longitude: property.longitude,
    floor: property.floor ?? "",
    surfaceM2: optional(property.surface_m2),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxTenants: property.max_tenants,
    hasElevator: property.has_elevator,
    furnished: property.furnished,
    amenityIds: property.amenities.map((amenity) => amenity.id),
    rent: optional(property.total_monthly_rent),
    deposit: optional(property.deposit),
    utilitiesIncluded: property.utilities_included,
    availableFrom: property.available_from?.slice(0, 10) ?? "",
    minimumStay: optional(property.minimum_stay_months),
    petsAllowed: property.pets_allowed,
    smokingAllowed: property.smoking_allowed,
    couplesAllowed: property.couples_allowed,
    studentsAllowed: property.students_allowed,
    registrationAllowed: property.registration_allowed,
    title: property.title,
    description: property.description,
  };
}

function toWholeNumber(value: string): number | null {
  const trimmed = value.trim().replace(/\./g, "").replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
}

export function toPayload(draft: ListingDraft): TeamPropertyUpdate {
  const surface = toWholeNumber(draft.surfaceM2);
  const minimumStay = toWholeNumber(draft.minimumStay);

  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    property_type: draft.propertyType ?? undefined,
    address_line: draft.addressLine.trim(),
    city: draft.city.trim() || "Málaga",
    province: draft.province.trim() || "Málaga",
    postal_code: draft.postalCode.trim(),
    neighborhood: draft.neighborhood.trim() || null,
    latitude: draft.latitude,
    longitude: draft.longitude,
    surface_m2: surface && surface > 0 ? surface : null,
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    floor: draft.floor.trim() || null,
    has_elevator: draft.hasElevator,
    furnished: draft.furnished,
    max_tenants: draft.maxTenants,
    total_monthly_rent: toWholeNumber(draft.rent),
    deposit: toWholeNumber(draft.deposit),
    utilities_included: draft.utilitiesIncluded,
    available_from: draft.availableFrom || null,
    minimum_stay_months: minimumStay && minimumStay > 0 ? minimumStay : null,
    pets_allowed: draft.petsAllowed,
    smoking_allowed: draft.smokingAllowed,
    couples_allowed: draft.couplesAllowed,
    students_allowed: draft.studentsAllowed,
    registration_allowed: draft.registrationAllowed,
    amenity_ids: draft.amenityIds,
  };
}

export interface ReadinessItem {
  key: string;
  label: string;
  step: WizardStep;
  done: boolean;
}

export function getReadiness(draft: ListingDraft, imageCount: number): ReadinessItem[] {
  return [
    { key: "address", label: "Dirección", step: "ubicacion", done: draft.addressLine.trim().length > 0 },
    { key: "postal", label: "Código postal", step: "ubicacion", done: draft.postalCode.trim().length > 0 },
    { key: "type", label: "Tipo de vivienda", step: "vivienda", done: draft.propertyType !== null },
    { key: "rent", label: "Alquiler mensual", step: "precio", done: toWholeNumber(draft.rent) !== null },
    { key: "deposit", label: "Fianza", step: "precio", done: toWholeNumber(draft.deposit) !== null },
    { key: "available", label: "Fecha de disponibilidad", step: "precio", done: draft.availableFrom !== "" },
    { key: "title", label: "Título", step: "anuncio", done: draft.title.trim().length > 0 },
    { key: "description", label: "Descripción (30+ caracteres)", step: "anuncio", done: draft.description.trim().length >= 30 },
    { key: "photos", label: "Al menos una foto", step: "fotos", done: imageCount > 0 },
  ];
}

export function validateOwner({
  mode,
  selectedOwner,
  newOwner,
  consent,
}: {
  mode: OwnerMode;
  selectedOwner: TeamOwner | null;
  newOwner: NewOwnerInput;
  consent: boolean;
}): string | null {
  if (mode === "existing") {
    if (!selectedOwner) return "Elige el cliente al que pertenece la vivienda.";
  } else {
    const email = (newOwner.email ?? "").trim();
    if (newOwner.owner_type !== "INDIVIDUAL" && !(newOwner.company_name ?? "").trim()) {
      return newOwner.owner_type === "AGENCY"
        ? "Indica el nombre de la inmobiliaria."
        : "Indica el nombre de la empresa.";
    }
    if (
      newOwner.owner_type === "INDIVIDUAL" &&
      !(newOwner.first_name ?? "").trim() &&
      !email &&
      !(newOwner.phone ?? "").trim()
    ) {
      return "Añade al menos el nombre o un contacto del propietario.";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Revisa el email del cliente.";
    }
  }

  if (!consent) return "Confirma que el cliente ha autorizado publicar la vivienda.";
  return null;
}

export function cleanNewOwner(owner: NewOwnerInput): NewOwnerInput {
  const clean = (value: string | null) => (value ?? "").trim() || null;
  return {
    first_name: clean(owner.first_name),
    last_name: clean(owner.last_name),
    email: clean(owner.email),
    phone: clean(owner.phone),
    owner_type: owner.owner_type,
    company_name: owner.owner_type === "INDIVIDUAL" ? null : clean(owner.company_name),
  };
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const TYPE_NOUNS: Record<PropertyType, { noun: string; feminine: boolean }> = {
  APARTMENT: { noun: "piso", feminine: false },
  SHARED_APARTMENT: { noun: "piso compartido", feminine: false },
  STUDIO: { noun: "estudio", feminine: false },
  HOUSE: { noun: "casa", feminine: true },
  OTHER: { noun: "vivienda", feminine: true },
};

export function suggestTitle(draft: ListingDraft): string {
  const { noun, feminine } = TYPE_NOUNS[draft.propertyType ?? "APARTMENT"];
  const rooms =
    draft.propertyType !== "STUDIO" && draft.bedrooms > 0
      ? ` de ${plural(draft.bedrooms, "habitación", "habitaciones")}`
      : "";
  const furnished = draft.furnished ? (feminine ? " amueblada" : " amueblado") : "";
  const place = draft.neighborhood.trim() || draft.city.trim() || "Málaga";

  return capitalize(`${noun}${rooms}${furnished} en ${place}`).slice(0, 150);
}

export function buildDescription(draft: ListingDraft, amenities: Amenity[]): string {
  const { noun, feminine } = TYPE_NOUNS[draft.propertyType ?? "APARTMENT"];
  const city = draft.city.trim() || "Málaga";
  const neighborhood = draft.neighborhood.trim();
  const place = neighborhood && neighborhood.toLowerCase() !== city.toLowerCase() ? `en ${neighborhood}, ${city}` : `en ${city}`;
  const spaces = [
    draft.propertyType !== "STUDIO" ? plural(draft.bedrooms, "habitación", "habitaciones") : null,
    plural(draft.bathrooms, "baño", "baños"),
    toWholeNumber(draft.surfaceM2) ? `${toWholeNumber(draft.surfaceM2)} m²` : null,
  ].filter((item): item is string => Boolean(item));

  const intro = `${capitalize(noun)}${draft.furnished ? (feminine ? " amueblada" : " amueblado") : ""} ${place} con ${joinList(spaces)}.`;

  const building = [
    draft.floor.trim() ? `planta ${draft.floor.trim()}` : null,
    draft.hasElevator ? "edificio con ascensor" : null,
  ].filter((item): item is string => Boolean(item));

  const equipment = amenities
    .filter((amenity) => draft.amenityIds.includes(amenity.id))
    .map((amenity) => amenity.label.toLowerCase());

  const rent = toWholeNumber(draft.rent);
  const deposit = toWholeNumber(draft.deposit);
  const stay = toWholeNumber(draft.minimumStay);

  const lines = [
    intro,
    building.length ? `${capitalize(joinList(building))}.` : null,
    equipment.length ? `Equipamiento: ${joinList(equipment)}.` : null,
    `Capacidad para ${plural(draft.maxTenants, "persona", "personas")}.`,
    draft.availableFrom
      ? `Disponible ${draft.availableFrom <= todayISO() ? "de inmediato" : `desde el ${formatDate(draft.availableFrom)}`}${stay ? `, con una estancia mínima de ${plural(stay, "mes", "meses")}` : ""}.`
      : null,
    rent !== null
      ? `${formatEuros(rent)} al mes${draft.utilitiesIncluded ? " con gastos incluidos" : ""}${deposit ? ` y fianza de ${formatEuros(deposit)}` : ""}.`
      : null,
  ];

  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatEuros(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("es-ES")} €`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export function formatRelative(value: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  // Mes completo: con "short", agosto sale como "ago" y se lee como el
  // "ago" inglés ("18 ago").
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(new Date(value));
}

export function whatsappHref(phone: string | null, text: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const number = digits.length === 9 ? `34${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/* Borrador local del alta nueva: si se cierra la pestaña o se recarga a
 * mitad de una llamada, no se pierde lo escrito. Desde que existe en el
 * servidor (primer guardado), la fuente de verdad pasa a ser la API. */
const STORAGE_KEY = "coflow.team.assisted-listing.v1";

export interface StoredWizardState {
  draft: ListingDraft;
  ownerMode: OwnerMode;
  selectedOwner: TeamOwner | null;
  newOwner: NewOwnerInput;
  consent: boolean;
}

export function readStoredWizard(): StoredWizardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredWizardState>;
    if (!parsed.draft) return null;
    return {
      draft: { ...EMPTY_DRAFT, ...parsed.draft },
      ownerMode: parsed.ownerMode === "new" ? "new" : "existing",
      selectedOwner: parsed.selectedOwner ?? null,
      newOwner: { ...EMPTY_NEW_OWNER, ...parsed.newOwner },
      consent: Boolean(parsed.consent),
    };
  } catch {
    return null;
  }
}

export function writeStoredWizard(state: StoredWizardState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento (modo privado, cuota): el alta sigue funcionando.
  }
}

export function clearStoredWizard() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Igual que arriba.
  }
}

export function isPristine(draft: ListingDraft, newOwner: NewOwnerInput): boolean {
  return (
    JSON.stringify(draft) === JSON.stringify(EMPTY_DRAFT) &&
    JSON.stringify(newOwner) === JSON.stringify(EMPTY_NEW_OWNER)
  );
}
