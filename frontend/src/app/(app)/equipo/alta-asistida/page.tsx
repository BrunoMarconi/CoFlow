"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { createAssistedListing, type AssistedListingResult } from "@/services/assistedListings";

export default function AssistedListingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AssistedListingResult | null>(null);

  if (loading) return <main className="mx-auto max-w-4xl p-6">Comprobando acceso…</main>;
  if (!user) { router.replace("/login"); return null; }
  if (user.role !== "ADMIN") return <main className="mx-auto max-w-4xl p-6"><h1 className="text-2xl font-bold">Acceso restringido</h1><p className="mt-2 text-muted">Esta herramienta es solo para el equipo de CoFlow.</p></main>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setResult(null);
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const number = (name: string) => Number(text(name));
    try {
      const created = await createAssistedListing({
        owner: { first_name: text("first_name"), last_name: text("last_name"), email: text("email"), phone: text("phone") },
        property: {
          title: text("title"), description: text("description"), property_type: text("property_type"),
          address_line: text("address_line"), city: "Málaga", province: "Málaga", postal_code: text("postal_code"), neighborhood: text("neighborhood") || null,
          bedrooms: number("bedrooms"), bathrooms: number("bathrooms"), max_tenants: number("max_tenants"),
          has_elevator: form.get("has_elevator") === "on", furnished: form.get("furnished") === "on",
          total_monthly_rent: number("rent"), deposit: number("deposit"), utilities_included: form.get("utilities_included") === "on",
          available_from: text("available_from") || null, amenity_ids: [],
        },
        owner_consent: form.get("owner_consent") === "on",
      });
      setResult(created);
      event.currentTarget.reset();
    } catch (reason: unknown) {
      const detail = (reason as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "No se pudo guardar el alta. Revisa los datos.");
    } finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Herramienta del equipo</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Alta asistida durante una llamada</h1>
    <p className="mt-3 max-w-2xl leading-7 text-muted">Completa lo esencial. El anuncio quedará en borrador y el propietario recibirá un enlace para crear su acceso, revisar y publicar.</p>

    {result ? <section className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5" aria-live="polite">
      <h2 className="font-bold text-green-900">Borrador creado y correo enviado</h2>
      <p className="mt-1 text-sm text-green-800">Enviado a {result.owner_email}. También puedes copiar el enlace y mandarlo por WhatsApp.</p>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => navigator.clipboard.writeText(result.claim_url)} className="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white">Copiar enlace</button><a href={result.claim_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-green-300 px-5 text-sm font-bold text-green-900">Abrir revisión</a></div>
    </section> : null}

    <form onSubmit={submit} className="mt-8 space-y-8">
      <FormSection title="1. Propietario"><div className="grid gap-5 sm:grid-cols-2"><Input name="first_name" label="Nombre" required /><Input name="last_name" label="Apellidos" required /><Input name="email" type="email" label="Correo" required /><Input name="phone" type="tel" label="Teléfono" required /></div></FormSection>
      <FormSection title="2. Vivienda"><div className="space-y-5"><Input name="title" label="Título del anuncio" placeholder="Habitación luminosa en Teatinos" minLength={5} required /><Textarea name="description" label="Descripción" minLength={30} required /><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Tipo<select name="property_type" className="mt-2 h-11.5 w-full rounded-14 border border-border bg-white px-4"><option value="SHARED_APARTMENT">Habitación / piso compartido</option><option value="APARTMENT">Piso completo</option><option value="STUDIO">Estudio</option><option value="HOUSE">Casa</option></select></label><Input name="neighborhood" label="Barrio o zona" /><Input name="address_line" label="Dirección" required /><Input name="postal_code" label="Código postal" required /></div></div></FormSection>
      <FormSection title="3. Precio y capacidad"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Input name="rent" type="number" min={0} label="Alquiler mensual (€)" required /><Input name="deposit" type="number" min={0} label="Fianza (€)" required /><Input name="available_from" type="date" label="Disponible desde" required /><Input name="bedrooms" type="number" min={0} defaultValue={1} label="Habitaciones" required /><Input name="bathrooms" type="number" min={1} defaultValue={1} label="Baños" required /><Input name="max_tenants" type="number" min={1} defaultValue={1} label="Máximo de inquilinos" required /></div><div className="mt-5 flex flex-wrap gap-5"><Check name="furnished" label="Amueblado" /><Check name="has_elevator" label="Tiene ascensor" /><Check name="utilities_included" label="Gastos incluidos" /></div></FormSection>
      <label className="flex items-start gap-3 rounded-2xl border border-line p-5 text-sm leading-6"><input name="owner_consent" type="checkbox" required className="mt-1 h-5 w-5 accent-[var(--brand)]" /><span><strong>El propietario autoriza esta alta asistida.</strong><br /><span className="text-muted">Le he explicado que recibirá un borrador, que deberá revisar y que nada se publicará sin su confirmación.</span></span></label>
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
      <button disabled={saving} className="min-h-14 w-full rounded-xl bg-brand px-6 font-bold text-white disabled:opacity-50">{saving ? "Creando borrador…" : "Crear borrador y enviar enlace"}</button>
    </form>
  </main>;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[1.5rem] border border-line bg-white p-5 sm:p-7"><h2 className="mb-5 text-lg font-bold">{title}</h2>{children}</section>; }
function Check({ name, label }: { name: string; label: string }) { return <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input name={name} type="checkbox" className="h-5 w-5 accent-[var(--brand)]" />{label}</label>; }
