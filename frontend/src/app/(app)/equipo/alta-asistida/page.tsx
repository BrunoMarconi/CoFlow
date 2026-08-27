"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { createAssistedListing, markAssistedListingReady, uploadAssistedListingImages, type AssistedListingResult } from "@/services/assistedListings";

export default function AssistedListingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AssistedListingResult | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState("");

  if (loading) return <main className="mx-auto max-w-4xl p-6">Comprobando acceso…</main>;
  if (!user) { router.replace("/login"); return null; }
  if (user.role !== "ADMIN") return <main className="mx-auto max-w-4xl p-6"><h1 className="text-2xl font-bold">Acceso restringido</h1><p className="mt-2 text-muted">Esta herramienta es solo para el equipo de CoFlow.</p></main>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setResult(null);
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const numberOrNull = (name: string) => { const raw = text(name); return raw === "" ? null : Number(raw); };
    try {
      const created = await createAssistedListing({
        owner: { first_name: text("first_name") || null, last_name: text("last_name") || null, email: text("email") || null, phone: text("phone") || null },
        property: {
          title: text("title") || null, description: text("description") || null, property_type: text("property_type"),
          address_line: text("address_line") || null, city: "Málaga", province: "Málaga", postal_code: text("postal_code") || null, neighborhood: text("neighborhood") || null,
          bedrooms: numberOrNull("bedrooms"), bathrooms: numberOrNull("bathrooms"), max_tenants: numberOrNull("max_tenants"),
          has_elevator: form.get("has_elevator") === "on", furnished: form.get("furnished") === "on",
          total_monthly_rent: numberOrNull("rent"), deposit: numberOrNull("deposit"), utilities_included: form.get("utilities_included") === "on",
          available_from: text("available_from") || null, amenity_ids: [],
        },
        owner_consent: form.get("owner_consent") === "on",
      });
      setResult(created);
      setPhotos([]);
      setPublished(false);
      setPublishError("");
      event.currentTarget.reset();
    } catch (reason: unknown) {
      const detail = (reason as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "No se pudo guardar el alta. Revisa los datos.");
    } finally { setSaving(false); }
  }

  function onPhotosSelected(event: ChangeEvent<HTMLInputElement>) {
    setPhotos(Array.from(event.target.files ?? []));
  }

  async function publish() {
    if (!result) return;
    setPublishing(true); setPublishError("");
    try {
      if (photos.length > 0) await uploadAssistedListingImages(result.property_id, photos);
      await markAssistedListingReady(result.property_id);
      setPublished(true);
    } catch (reason: unknown) {
      const detail = (reason as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const missing = detail && typeof detail === "object" && "missing_fields" in (detail as Record<string, unknown>)
        ? (detail as { missing_fields?: string[] }).missing_fields
        : undefined;
      setPublishError(missing?.length ? `Faltan datos: ${missing.join(", ")}` : "No se pudo publicar el piso.");
    } finally { setPublishing(false); }
  }

  return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Herramienta del equipo</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Alta asistida durante una llamada</h1>
    <p className="mt-3 max-w-2xl leading-7 text-muted">Completa lo esencial con el consentimiento verbal del propietario durante la llamada. Sube las fotos y publica el piso tú mismo, sin que el propietario tenga que hacer nada más.</p>

    {result ? <section className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5" aria-live="polite">
      <h2 className="font-bold text-green-900">Borrador creado</h2>
      <p className="mt-1 text-sm text-green-800">Propietario: {result.owner_email}. Añade fotos y publica cuando esté listo.</p>

      {published ? <p className="mt-4 font-bold text-green-900">Piso publicado ✓</p> : <div className="mt-4 space-y-3">
        <label className="block text-sm font-semibold">Fotos<input type="file" accept="image/*" multiple onChange={onPhotosSelected} className="mt-2 block w-full text-sm" /></label>
        {photos.length > 0 ? <p className="text-xs text-green-800">{photos.length} foto(s) seleccionada(s)</p> : null}
        {publishError ? <p role="alert" className="text-sm font-semibold text-red-700">{publishError}</p> : null}
        <button type="button" disabled={publishing} onClick={publish} className="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white disabled:opacity-50">{publishing ? "Publicando…" : "Publicar piso"}</button>
      </div>}
    </section> : null}

    <form onSubmit={submit} className="mt-8 space-y-8">
      <FormSection title="1. Propietario"><div className="grid gap-5 sm:grid-cols-2"><Input name="first_name" label="Nombre" /><Input name="last_name" label="Apellidos" /><Input name="email" type="email" label="Correo" /><Input name="phone" type="tel" label="Teléfono" /></div></FormSection>
      <FormSection title="2. Vivienda"><div className="space-y-5"><Input name="title" label="Título del anuncio" placeholder="Habitación luminosa en Teatinos" /><Textarea name="description" label="Descripción" /><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Tipo<select name="property_type" className="mt-2 h-11.5 w-full rounded-14 border border-border bg-white px-4"><option value="SHARED_APARTMENT">Habitación / piso compartido</option><option value="APARTMENT">Piso completo</option><option value="STUDIO">Estudio</option><option value="HOUSE">Casa</option></select></label><Input name="neighborhood" label="Barrio o zona" /><Input name="address_line" label="Dirección" /><Input name="postal_code" label="Código postal" /></div></div></FormSection>
      <FormSection title="3. Precio y capacidad"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Input name="rent" type="number" min={0} label="Alquiler mensual (€)" /><Input name="deposit" type="number" min={0} label="Fianza (€)" /><Input name="available_from" type="date" label="Disponible desde" /><Input name="bedrooms" type="number" min={0} defaultValue={1} label="Habitaciones" /><Input name="bathrooms" type="number" min={1} defaultValue={1} label="Baños" /><Input name="max_tenants" type="number" min={1} defaultValue={1} label="Máximo de inquilinos" /></div><div className="mt-5 flex flex-wrap gap-5"><Check name="furnished" label="Amueblado" /><Check name="has_elevator" label="Tiene ascensor" /><Check name="utilities_included" label="Gastos incluidos" /></div></FormSection>
      <label className="flex items-start gap-3 rounded-2xl border border-line p-5 text-sm leading-6"><input name="owner_consent" type="checkbox" required className="mt-1 h-5 w-5 accent-[var(--brand)]" /><span><strong>El propietario ha dado su consentimiento verbal durante la llamada.</strong><br /><span className="text-muted">Le he explicado que voy a publicar su piso en CoFlow con estos datos. Si alquilamos la habitación, le llamaremos directamente.</span></span></label>
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
      <button disabled={saving} className="min-h-14 w-full rounded-xl bg-brand px-6 font-bold text-white disabled:opacity-50">{saving ? "Creando borrador…" : "Crear borrador"}</button>
    </form>
  </main>;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[1.5rem] border border-line bg-white p-5 sm:p-7"><h2 className="mb-5 text-lg font-bold">{title}</h2>{children}</section>; }
function Check({ name, label }: { name: string; label: string }) { return <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input name={name} type="checkbox" className="h-5 w-5 accent-[var(--brand)]" />{label}</label>; }
