"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bath,
  BedDouble,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImagePlus,
  MapPin,
  Tag,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import AddressAutocomplete, { type ResolvedAddress } from "./AddressAutocomplete";
import { deletePropertyImage, getPropertyAmenities, setPropertyImageCover, updateProperty, uploadPropertyImages } from "@/services/properties";
import type { Amenity, Property, PropertyUpdate } from "@/types/property";

type EditStep = "photos" | "title" | "location" | "price" | "bedrooms" | "bathrooms" | "tenants" | "description" | "amenities";
const EDIT_STEPS: EditStep[] = ["photos", "title", "location", "price", "bedrooms", "bathrooms", "tenants", "description", "amenities"];

export default function PropertyEditPanel({ initialProperty }: { initialProperty: Property }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStep = searchParams.get("step");
  const step = EDIT_STEPS.includes(requestedStep as EditStep) ? requestedStep as EditStep : null;
  const [property, setProperty] = useState(initialProperty);
  const [amenityOptions, setAmenityOptions] = useState<Amenity[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const basePath = `/propietarios/pisos/${property.id}/editar`;

  useEffect(() => { getPropertyAmenities().then(setAmenityOptions).catch(() => setAmenityOptions([])); }, []);

  function closeStep() { setError(""); router.replace(basePath, { scroll: false }); }

  async function save(payload: PropertyUpdate) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      setProperty(await updateProperty(property.id, payload));
      router.replace(basePath, { scroll: false });
    } catch {
      setError("No hemos podido guardar el cambio. Revisa el dato e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    try { setProperty(await uploadPropertyImages(property.id, Array.from(files))); }
    catch { setError("No hemos podido añadir las fotos."); }
  }

  async function removePhoto(imageId: number) {
    try { setProperty(await deletePropertyImage(property.id, imageId)); }
    catch { setError("No hemos podido eliminar la foto."); }
  }

  async function makeCover(imageId: number) {
    try { setProperty(await setPropertyImageCover(property.id, imageId)); }
    catch { setError("No hemos podido cambiar la portada."); }
  }

  if (step) {
    return <EditStepScreen step={step} property={property} amenities={amenityOptions} saving={saving} error={error} onBack={closeStep} onSave={save} onAddPhotos={addPhotos} onRemovePhoto={removePhoto} onMakeCover={makeCover} />;
  }

  const cover = property.images.find((image) => image.is_cover) ?? property.images[0];
  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <header className="flex items-center gap-4">
        <Link href={`/propietarios/pisos/${property.id}`} transitionTypes={["nav-back"]} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd] bg-white"><ChevronLeft className="h-6 w-6" /></Link>
        <div><p className="text-xs font-medium text-[#717171]">{property.title}</p><h1 className="mt-0.5 text-3xl font-semibold tracking-[-0.04em] text-[#191919] sm:text-4xl">¿Qué quieres editar?</h1></div>
      </header>

      {cover ? <div className="relative mt-7 aspect-[16/7] overflow-hidden rounded-[1.5rem]"><Image src={cover.image_url} alt="" fill unoptimized sizes="768px" className="object-cover" /></div> : null}

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dddddd] bg-white">
        <EditRow href={`${basePath}?step=photos`} icon={<ImagePlus />} label="Fotos" value={`${property.images.length} ${property.images.length === 1 ? "foto" : "fotos"}`} />
        <EditRow href={`${basePath}?step=title`} icon={<FileText />} label="Título del anuncio" value={property.title} />
        <EditRow href={`${basePath}?step=location`} icon={<MapPin />} label="Ubicación" value={[property.address_line, property.city].filter(Boolean).join(", ")} />
        <EditRow href={`${basePath}?step=price`} icon={<WalletCards />} label="Precio al mes" value={property.total_monthly_rent === null ? "Sin definir" : `${property.total_monthly_rent.toLocaleString("es-ES")} €`} />
        <EditRow href={`${basePath}?step=bedrooms`} icon={<BedDouble />} label="Habitaciones" value={String(property.bedrooms)} />
        <EditRow href={`${basePath}?step=bathrooms`} icon={<Bath />} label="Baños" value={String(property.bathrooms)} />
        <EditRow href={`${basePath}?step=tenants`} icon={<Users />} label="Plazas" value={String(property.max_tenants)} />
        <EditRow href={`${basePath}?step=description`} icon={<FileText />} label="Descripción" value={property.description} />
        <EditRow href={`${basePath}?step=amenities`} icon={<Tag />} label="Comodidades" value={property.amenities.map((item) => item.label).join(", ") || "Sin indicar"} last />
      </div>
    </div>
  );
}

function EditStepScreen({ step, property, amenities, saving, error, onBack, onSave, onAddPhotos, onRemovePhoto, onMakeCover }: { step: EditStep; property: Property; amenities: Amenity[]; saving: boolean; error: string; onBack: () => void; onSave: (payload: PropertyUpdate) => Promise<void>; onAddPhotos: (files: FileList | null) => Promise<void>; onRemovePhoto: (id: number) => Promise<void>; onMakeCover: (id: number) => Promise<void> }) {
  const [value, setValue] = useState(() => initialValue(step, property));
  const [selectedAmenities, setSelectedAmenities] = useState(() => property.amenities.map((item) => item.id));
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedAddress | null>(null);
  const meta = STEP_META[step];

  async function submit() {
    if (step === "title") return onSave({ title: value.trim() });
    if (step === "description") return onSave({ description: value.trim() });
    if (step === "price") return onSave({ total_monthly_rent: value.trim() ? Number(value) : null });
    if (step === "bedrooms") return onSave({ bedrooms: Math.max(1, Number(value)) });
    if (step === "bathrooms") return onSave({ bathrooms: Math.max(1, Number(value)) });
    if (step === "tenants") return onSave({ max_tenants: Math.max(1, Number(value)) });
    if (step === "amenities") return onSave({ amenity_ids: selectedAmenities });
    if (step === "location" && resolvedAddress) return onSave({ address_line: resolvedAddress.addressLine, city: resolvedAddress.city, province: resolvedAddress.province, postal_code: resolvedAddress.postalCode, neighborhood: resolvedAddress.neighborhood, latitude: resolvedAddress.latitude, longitude: resolvedAddress.longitude });
    if (step === "location") return onBack();
    return onBack();
  }

  if (step === "photos") {
    const sortedImages = [...property.images].sort((a, b) => a.position - b.position);
    return <GuidedScreen title="Fotos de tu vivienda" subtitle="Elige la portada y añade imágenes que cuenten bien el espacio." onBack={onBack} onSave={onBack} saving={false} saveLabel="Listo" error={error}><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{sortedImages.map((image) => <div key={image.id} className="group relative aspect-square overflow-hidden rounded-[1.25rem] bg-[#f3f3f3]"><Image src={image.image_url} alt="" fill unoptimized sizes="33vw" className="object-cover" />{image.is_cover ? <span className="absolute left-2 top-2 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold text-white">Portada</span> : <button type="button" onClick={() => onMakeCover(image.id)} className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold shadow">Hacer portada</button>}<button type="button" onClick={() => onRemovePhoto(image.id)} aria-label="Eliminar foto" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow"><Trash2 className="h-4 w-4" /></button></div>)}<label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-[#bdbdbd] bg-white"><ImagePlus className="h-7 w-7" /><span className="text-xs font-semibold">Elegir fotos</span><input type="file" multiple accept="image/*" className="sr-only" onChange={(event) => onAddPhotos(event.target.files)} /></label><label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-[#bdbdbd] bg-white sm:hidden"><Camera className="h-7 w-7" /><span className="text-xs font-semibold">Hacer una foto</span><input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => onAddPhotos(event.target.files)} /></label></div></GuidedScreen>;
  }

  return <GuidedScreen title={meta.title} subtitle={meta.subtitle} onBack={onBack} onSave={submit} saving={saving} error={error}>
    {step === "location" ? <AddressAutocomplete value={value} onChange={setValue} onResolved={(address) => { setResolvedAddress(address); setValue(address.addressLine); }} variant="inline" /> : step === "amenities" ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{amenities.map((amenity) => { const selected = selectedAmenities.includes(amenity.id); return <button key={amenity.id} type="button" onClick={() => setSelectedAmenities((current) => selected ? current.filter((id) => id !== amenity.id) : [...current, amenity.id])} className={`min-h-24 rounded-[1.25rem] border p-4 text-left text-sm font-semibold transition ${selected ? "border-black bg-[#f7f7f7] ring-1 ring-black" : "border-[#dddddd] bg-white"}`}>{amenity.label}</button>; })}</div> : step === "description" ? <div><textarea autoFocus value={value} onChange={(event) => setValue(event.target.value)} maxLength={2000} rows={8} className="w-full resize-none border-0 border-b-2 border-black bg-transparent px-0 py-4 text-xl leading-8 outline-none placeholder:text-[#b0b0b0]" placeholder={meta.placeholder} /><p className="mt-3 text-right text-xs text-[#717171]">{value.length} / 2000</p></div> : <label className="flex items-baseline border-b-2 border-black py-3"><input autoFocus type={meta.numeric ? "number" : "text"} inputMode={meta.numeric ? "numeric" : "text"} min={meta.numeric ? 0 : undefined} maxLength={meta.numeric ? undefined : 150} value={value} onChange={(event) => setValue(event.target.value)} placeholder={meta.placeholder} className={`${meta.numeric ? "text-5xl sm:text-6xl" : "text-2xl sm:text-3xl"} min-w-0 flex-1 bg-transparent font-semibold tracking-[-0.035em] outline-none placeholder:text-[#b0b0b0]`} />{meta.suffix ? <span className="ml-3 text-xl font-semibold text-[#717171]">{meta.suffix}</span> : null}</label>}
  </GuidedScreen>;
}

function GuidedScreen({ title, subtitle, children, onBack, onSave, saving, saveLabel = "Guardar", error }: { title: string; subtitle: string; children: ReactNode; onBack: () => void; onSave: () => void; saving: boolean; saveLabel?: string; error: string }) {
  return <div className="mx-auto flex min-h-[calc(100dvh-var(--mobile-header-height)-var(--mobile-bottom-nav-height)-2rem)] w-full max-w-2xl flex-col pb-24"><header className="flex items-center gap-4"><button type="button" onClick={onBack} aria-label="Volver" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dddddd] bg-white"><ChevronLeft className="h-6 w-6" /></button><span className="text-sm font-medium text-[#717171]">Editar piso</span></header><main className="flex flex-1 flex-col justify-center py-8"><h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#191919] sm:text-5xl">{title}</h1><p className="mt-3 max-w-lg text-base leading-7 text-[#717171]">{subtitle}</p><div className="mt-10">{children}</div>{error ? <p role="alert" className="mt-5 text-sm font-semibold text-red-600">{error}</p> : null}</main><div className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.75rem)] left-6 right-6 z-30 mx-auto max-w-xl sm:bottom-7"><button type="button" onClick={onSave} disabled={saving} className="h-14 w-full rounded-full bg-black px-6 text-base font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] disabled:opacity-50">{saving ? "Guardando…" : saveLabel}</button></div></div>;
}

function EditRow({ href, icon, label, value, last = false }: { href: string; icon: ReactNode; label: string; value: string; last?: boolean }) { return <Link href={href} transitionTypes={["nav-forward"]} scroll={false} className={`flex min-h-20 items-center gap-4 px-5 py-4 transition hover:bg-[#f7f7f7] ${last ? "" : "border-b border-[#e7e7e7]"}`}><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#191919]">{label}</span><span className="mt-1 block truncate text-xs text-[#717171]">{value}</span></span><ChevronRight className="h-5 w-5 text-[#717171]" /></Link>; }

function initialValue(step: EditStep, property: Property) { if (step === "title") return property.title; if (step === "description") return property.description; if (step === "location") return property.address_line; if (step === "price") return property.total_monthly_rent === null ? "" : String(property.total_monthly_rent); if (step === "bedrooms") return String(property.bedrooms); if (step === "bathrooms") return String(property.bathrooms); if (step === "tenants") return String(property.max_tenants); return ""; }

const STEP_META: Record<EditStep, { title: string; subtitle: string; placeholder: string; numeric?: boolean; suffix?: string }> = {
  photos: { title: "Fotos de tu vivienda", subtitle: "Enseña el espacio con claridad.", placeholder: "" },
  title: { title: "¿Cómo se llama tu anuncio?", subtitle: "Un título claro ayuda a entender el piso de un vistazo.", placeholder: "Ej. Piso luminoso en Teatinos" },
  location: { title: "¿Dónde está tu vivienda?", subtitle: "La dirección exacta nunca se mostrará públicamente.", placeholder: "Buscar dirección" },
  price: { title: "¿Cuál es el precio mensual?", subtitle: "Introduce el precio total de la vivienda al mes.", placeholder: "0", numeric: true, suffix: "€" },
  bedrooms: { title: "¿Cuántas habitaciones tiene?", subtitle: "Cuenta todas las habitaciones de la vivienda.", placeholder: "1", numeric: true },
  bathrooms: { title: "¿Cuántos baños tiene?", subtitle: "Incluye baños completos y aseos.", placeholder: "1", numeric: true },
  tenants: { title: "¿Para cuántas personas?", subtitle: "Indica la capacidad máxima de la vivienda.", placeholder: "1", numeric: true },
  description: { title: "Cuéntanos cómo es", subtitle: "Describe el espacio con naturalidad y sin repetir el título.", placeholder: "Háblales del piso, el ambiente y lo que lo hace especial…" },
  amenities: { title: "¿Qué ofrece la vivienda?", subtitle: "Selecciona únicamente las comodidades disponibles.", placeholder: "" },
};
