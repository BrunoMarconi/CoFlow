"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bath,
  BedDouble,
  Camera,
  Check,
  CheckCircle2,
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
  const [saved, setSaved] = useState(false);
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
      setSaved(true);
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
  const completion = getEditCompleteness(property);
  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-6 pb-12 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-5xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="flex items-start gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-brand-dark shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><ChevronLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Editor de vivienda</p><h1 className="mt-1 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">Mejora tu anuncio</h1><p className="mt-2 truncate text-sm text-secondary">{property.title}</p></div>
        {saved && <span role="status" className="hidden min-h-10 items-center gap-2 rounded-full bg-mint-50 px-3 text-xs font-bold text-primary-dark sm:flex"><CheckCircle2 className="h-4 w-4" />Guardado</span>}
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_17rem]">
        <div className="relative aspect-[16/8] overflow-hidden rounded-[26px] bg-surface shadow-soft sm:aspect-[16/7]">{cover ? <Image src={cover.image_url} alt="" fill unoptimized sizes="(min-width: 1024px) 680px, 100vw" className="object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-secondary"><ImagePlus className="h-7 w-7 text-primary" /><span className="text-sm font-bold">Añade una portada</span></div>}<Link href={`${basePath}?step=photos`} scroll={false} className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/95 px-4 text-xs font-bold text-brand-dark shadow-soft backdrop-blur"><Camera className="h-4 w-4" />Gestionar fotos</Link></div>
        <div className="rounded-[26px] bg-brand-dark p-5 text-white shadow-[0_16px_40px_rgba(20,55,41,.14)]"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Preparación</p><div className="mt-3 flex items-end justify-between"><strong className="font-rounded text-4xl font-semibold">{completion}%</strong><CheckCircle2 className="mb-1 h-5 w-5 text-white/65" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white" style={{ width: `${completion}%` }} /></div><p className="mt-4 text-xs leading-5 text-white/60">{completion === 100 ? "La información esencial está completa." : "Completa los apartados pendientes antes de publicar."}</p></div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[26px] bg-surface p-2 shadow-soft sm:p-3">
        <EditRow href={`${basePath}?step=title`} icon={<FileText />} label="Título del anuncio" value={property.title} />
        <EditRow href={`${basePath}?step=location`} icon={<MapPin />} label="Ubicación" value={[property.address_line, property.city].filter(Boolean).join(", ")} />
        <EditRow href={`${basePath}?step=price`} icon={<WalletCards />} label="Precio al mes" value={property.total_monthly_rent === null ? "Sin definir" : `${property.total_monthly_rent.toLocaleString("es-ES")} €`} />
        <EditRow href={`${basePath}?step=bedrooms`} icon={<BedDouble />} label="Habitaciones" value={String(property.bedrooms)} />
        <EditRow href={`${basePath}?step=bathrooms`} icon={<Bath />} label="Baños" value={String(property.bathrooms)} />
        <EditRow href={`${basePath}?step=tenants`} icon={<Users />} label="Plazas" value={String(property.max_tenants)} />
        <EditRow href={`${basePath}?step=description`} icon={<FileText />} label="Descripción" value={property.description} />
        <EditRow href={`${basePath}?step=amenities`} icon={<Tag />} label="Comodidades" value={property.amenities.map((item) => item.label).join(", ") || "Sin indicar"} />
      </section>

      <div className="mt-4 flex items-start gap-3 rounded-[22px] bg-mint-50 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft"><Check className="h-4 w-4" /></span><div><p className="text-sm font-bold text-brand-dark">Los cambios se guardan por apartado</p><p className="mt-1 text-xs leading-5 text-secondary">Puedes salir al terminar cada edición sin perder el resto del anuncio.</p></div></div>
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
    return <GuidedScreen title="Fotos de tu vivienda" subtitle="Elige la portada y añade imágenes que cuenten bien el espacio." onBack={onBack} onSave={onBack} saving={false} saveLabel="Listo" error={error}><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{sortedImages.map((image) => <div key={image.id} className="group relative aspect-square overflow-hidden rounded-[20px] bg-surface-soft"><Image src={image.image_url} alt="" fill unoptimized sizes="33vw" className="object-cover" />{image.is_cover ? <span className="absolute left-2 top-2 rounded-full bg-brand-dark px-2.5 py-1 text-[10px] font-bold text-white">Portada</span> : <button type="button" onClick={() => onMakeCover(image.id)} className="absolute left-2 top-2 min-h-9 rounded-full bg-white/95 px-3 text-[10px] font-bold text-brand-dark shadow-soft">Hacer portada</button>}<button type="button" onClick={() => onRemovePhoto(image.id)} aria-label="Eliminar foto" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-soft"><Trash2 className="h-4 w-4" /></button></div>)}<label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-primary/35 bg-mint-50 text-primary-dark"><ImagePlus className="h-7 w-7" /><span className="text-xs font-bold">Elegir fotos</span><input type="file" multiple accept="image/*" className="sr-only" onChange={(event) => onAddPhotos(event.target.files)} /></label><label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-primary/35 bg-mint-50 text-primary-dark sm:hidden"><Camera className="h-7 w-7" /><span className="text-xs font-bold">Hacer una foto</span><input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => onAddPhotos(event.target.files)} /></label></div></GuidedScreen>;
  }

  return <GuidedScreen title={meta.title} subtitle={meta.subtitle} onBack={onBack} onSave={submit} saving={saving} error={error}>
    {step === "location" ? <AddressAutocomplete value={value} onChange={setValue} onResolved={(address) => { setResolvedAddress(address); setValue(address.addressLine); }} variant="inline" /> : step === "amenities" ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{amenities.map((amenity) => { const selected = selectedAmenities.includes(amenity.id); return <button key={amenity.id} type="button" aria-pressed={selected} onClick={() => setSelectedAmenities((current) => selected ? current.filter((id) => id !== amenity.id) : [...current, amenity.id])} className={`min-h-20 rounded-[18px] border p-4 text-left text-sm font-bold transition ${selected ? "border-primary/30 bg-mint-50 text-primary-dark ring-2 ring-primary/10" : "border-border bg-surface text-brand-dark hover:bg-surface-soft"}`}>{amenity.label}{selected && <Check className="mt-3 h-4 w-4 text-primary" />}</button>; })}</div> : step === "description" ? <div><label htmlFor="property-description" className="sr-only">Descripción</label><textarea id="property-description" autoFocus value={value} onChange={(event) => setValue(event.target.value)} maxLength={2000} rows={7} className="w-full resize-none rounded-[18px] border border-border bg-surface-soft p-4 text-base leading-7 text-brand-dark outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder={meta.placeholder} /><p className="mt-3 text-right text-xs font-semibold text-secondary">{value.length} / 2000</p></div> : <label className="flex items-baseline rounded-[18px] border border-border bg-surface-soft px-5 py-4 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"><span className="sr-only">{meta.title}</span><input autoFocus type={meta.numeric ? "number" : "text"} inputMode={meta.numeric ? "numeric" : "text"} min={meta.numeric ? 0 : undefined} maxLength={meta.numeric ? undefined : 150} value={value} onChange={(event) => setValue(event.target.value)} placeholder={meta.placeholder} className={`${meta.numeric ? "text-4xl sm:text-5xl" : "text-xl sm:text-2xl"} min-w-0 flex-1 bg-transparent font-rounded font-semibold tracking-[-0.035em] text-brand-dark outline-none placeholder:text-muted`} />{meta.suffix ? <span className="ml-3 text-xl font-semibold text-secondary">{meta.suffix}</span> : null}</label>}
  </GuidedScreen>;
}

function GuidedScreen({ title, subtitle, children, onBack, onSave, saving, saveLabel = "Guardar", error }: { title: string; subtitle: string; children: ReactNode; onBack: () => void; onSave: () => void; saving: boolean; saveLabel?: string; error: string }) {
  return <div className="-mx-6 -mt-4 min-h-[calc(100dvh-var(--mobile-header-height))] bg-surface-soft px-5 pb-28 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-3xl sm:rounded-[32px] sm:px-8"><header className="flex items-center gap-4"><button type="button" onClick={onBack} aria-label="Volver" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-brand-dark shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><ChevronLeft className="h-5 w-5" /></button><span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Editar vivienda</span></header><main className="flex min-h-[calc(100dvh-15rem)] flex-col justify-center py-8"><section className="rounded-[28px] bg-surface p-5 shadow-soft sm:p-8"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Información del anuncio</p><h1 className="mt-2 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">{title}</h1><p className="mt-3 max-w-lg text-sm leading-6 text-secondary sm:text-base">{subtitle}</p><div className="mt-8">{children}</div>{error ? <p role="alert" className="mt-5 text-sm font-semibold text-red-600">{error}</p> : null}</section></main><div className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.75rem)] left-5 right-5 z-30 mx-auto max-w-xl sm:bottom-7"><button type="button" onClick={onSave} disabled={saving} className="flex h-14 w-full items-center justify-center gap-2 rounded-16 bg-brand-dark px-6 text-base font-bold text-white shadow-button disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Guardando…" : saveLabel}{!saving && <ChevronRight className="h-5 w-5" />}</button></div></div>;
}

function EditRow({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value: string }) { return <Link href={href} transitionTypes={["nav-forward"]} scroll={false} className="flex min-h-20 items-center gap-3 rounded-[18px] px-3 py-3 transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-primary [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-brand-dark">{label}</span><span className="mt-0.5 block truncate text-xs text-secondary sm:text-sm">{value}</span></span><ChevronRight className="h-4 w-4 text-muted" /></Link>; }

function initialValue(step: EditStep, property: Property) { if (step === "title") return property.title; if (step === "description") return property.description; if (step === "location") return property.address_line; if (step === "price") return property.total_monthly_rent === null ? "" : String(property.total_monthly_rent); if (step === "bedrooms") return String(property.bedrooms); if (step === "bathrooms") return String(property.bathrooms); if (step === "tenants") return String(property.max_tenants); return ""; }

function getEditCompleteness(property: Property) {
  const checks = [
    property.images.length > 0,
    property.title.trim().length >= 8,
    Boolean(property.address_line && property.city),
    property.total_monthly_rent !== null,
    property.description.trim().length >= 80,
    property.amenities.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

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
