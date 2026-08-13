"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bath, BedDouble, Camera, ChevronLeft, FileText, ImagePlus, MapPin, Save, Trash2, Users, WalletCards } from "lucide-react";
import { deletePropertyImage, setPropertyImageCover, updateProperty, uploadPropertyImages } from "@/services/properties";
import type { Property } from "@/types/property";

export default function PropertyEditPanel({ initialProperty }: { initialProperty: Property }) {
  const router = useRouter();
  const [property, setProperty] = useState(initialProperty);
  const [title, setTitle] = useState(property.title);
  const [description, setDescription] = useState(property.description);
  const [rent, setRent] = useState(property.total_monthly_rent === null ? "" : String(property.total_monthly_rent));
  const [bedrooms, setBedrooms] = useState(String(property.bedrooms));
  const [bathrooms, setBathrooms] = useState(String(property.bathrooms));
  const [maxTenants, setMaxTenants] = useState(String(property.max_tenants));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateProperty(property.id, {
        title: title.trim(),
        description: description.trim(),
        total_monthly_rent: rent ? Number(rent) : null,
        bedrooms: Math.max(1, Number(bedrooms)),
        bathrooms: Math.max(1, Number(bathrooms)),
        max_tenants: Math.max(1, Number(maxTenants)),
      });
      setProperty(updated);
      router.push(`/propietarios/pisos/${property.id}`);
    } catch {
      setError("No hemos podido guardar los cambios. Revisa los datos e inténtalo de nuevo.");
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

  const sortedImages = [...property.images].sort((a, b) => a.position - b.position);

  return (
    <div className="mx-auto w-full max-w-5xl pb-28">
      <header className="flex items-center gap-3"><Link href={`/propietarios/pisos/${property.id}`} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd] bg-white"><ChevronLeft className="h-6 w-6" /></Link><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#717171]">{property.status === "READY" ? "Activo" : property.status}</p><h1 className="mt-1 text-4xl font-semibold tracking-[-0.045em] text-[#191919]">Editar piso</h1></div></header>

      <section className="mt-7">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {sortedImages.slice(0, 4).map((image, index) => <div key={image.id} className={`group relative overflow-hidden rounded-[1.25rem] bg-[#f3f3f3] ${index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}><Image src={image.image_url} alt="" fill unoptimized sizes="(min-width: 640px) 30vw, 50vw" className="object-cover" />{image.is_cover ? <span className="absolute left-2 top-2 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold text-white">Portada</span> : <button type="button" onClick={() => makeCover(image.id)} className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold opacity-0 shadow transition group-hover:opacity-100">Hacer portada</button>}<button type="button" onClick={() => removePhoto(image.id)} aria-label="Eliminar foto" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow"><Trash2 className="h-4 w-4" /></button></div>)}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-[#bdbdbd] bg-white"><ImagePlus className="h-6 w-6" /><span className="text-xs font-semibold">Añadir</span><input type="file" multiple accept="image/*" className="sr-only" onChange={(event) => addPhotos(event.target.files)} /></label>
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-[#bdbdbd] bg-white sm:hidden"><Camera className="h-6 w-6" /><span className="text-xs font-semibold">Cámara</span><input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => addPhotos(event.target.files)} /></label>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <EditField icon={<FileText />} label="Título del anuncio"><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} className="w-full bg-transparent text-base font-semibold outline-none" /></EditField>
        <div className="flex items-center gap-4 rounded-[1.25rem] border border-[#dddddd] bg-white p-5 shadow-[0_5px_16px_rgba(0,0,0,0.045)]"><MapPin className="h-5 w-5 shrink-0" /><div className="min-w-0"><span className="block text-xs text-[#717171]">Ubicación</span><strong className="block truncate text-base font-semibold">{property.address_line}, {property.city}</strong></div></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><SmallField icon={<WalletCards />} label="Precio" value={rent} onChange={setRent} suffix="€" /><SmallField icon={<BedDouble />} label="Habitaciones" value={bedrooms} onChange={setBedrooms} /><SmallField icon={<Bath />} label="Baños" value={bathrooms} onChange={setBathrooms} /><SmallField icon={<Users />} label="Plazas" value={maxTenants} onChange={setMaxTenants} /></div>
        <EditField icon={<FileText />} label="Descripción"><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} maxLength={2000} className="w-full resize-none bg-transparent text-sm leading-6 outline-none" /></EditField>
        {property.amenities.length ? <div className="rounded-[1.25rem] border border-[#dddddd] bg-white p-5 shadow-[0_5px_16px_rgba(0,0,0,0.045)]"><span className="text-xs text-[#717171]">Comodidades</span><div className="mt-3 flex flex-wrap gap-2">{property.amenities.map((amenity) => <span key={amenity.id} className="rounded-full border border-[#dddddd] px-3 py-1.5 text-xs font-semibold">{amenity.label}</span>)}</div></div> : null}
      </section>

      {error ? <p role="alert" className="mt-4 rounded-[1rem] bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.5rem)] left-5 right-5 z-30 mx-auto flex max-w-2xl gap-2 rounded-full bg-white/95 p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.16)] backdrop-blur md:bottom-6"><Link href={`/propietarios/pisos/${property.id}`} className="flex h-12 flex-1 items-center justify-center rounded-full text-sm font-semibold">Cancelar</Link><button type="button" onClick={save} disabled={saving} className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Guardando…" : "Guardar cambios"}</button></div>
    </div>
  );
}

function EditField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) { return <label className="flex items-start gap-4 rounded-[1.25rem] border border-[#dddddd] bg-white p-5 shadow-[0_5px_16px_rgba(0,0,0,0.045)]"><span className="mt-1 [&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="min-w-0 flex-1"><span className="mb-2 block text-xs text-[#717171]">{label}</span>{children}</span></label>; }
function SmallField({ icon, label, value, onChange, suffix }: { icon: React.ReactNode; label: string; value: string; onChange: (value: string) => void; suffix?: string }) { return <label className="rounded-[1.25rem] border border-[#dddddd] bg-white p-4 shadow-[0_5px_16px_rgba(0,0,0,0.045)]"><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="mt-3 block text-xs text-[#717171]">{label}</span><span className="mt-1 flex items-baseline gap-1"><input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 w-full bg-transparent text-xl font-semibold outline-none" />{suffix ? <span className="text-sm font-semibold">{suffix}</span> : null}</span></label>; }
