"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Input from "@/components/ui/Input";
import { claimOwnerAccount, getOwnerClaim } from "@/services/assistedListings";

export default function OwnerClaimPage() {
  const { token } = useParams<{ token: string }>();
  const [claim, setClaim] = useState<{ first_name: string; property_title: string; property_city: string } | null>(null);
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { getOwnerClaim(token).then(setClaim).catch(() => setError("Este enlace no existe, ya se utilizó o ha caducado.")); }, [token]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget); try { await claimOwnerAccount(token, { password: String(form.get("password")), birth_date: String(form.get("birth_date")), terms_accepted: form.get("terms") === "on" }); setDone(true); } catch { setError("No hemos podido activar la cuenta. Revisa los datos o solicita un enlace nuevo."); } finally { setSaving(false); } }
  if (done) return <main className="mx-auto max-w-lg px-5 py-20 text-center"><h1 className="text-3xl font-bold">Tu cuenta está lista</h1><p className="mt-3 text-muted">Ya puedes entrar, revisar las fotografías y publicar cuando quieras.</p><Link href="/login" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-brand px-6 font-bold text-white">Entrar en CoFlow</Link></main>;
  return <main className="mx-auto max-w-lg px-5 py-14"><p className="text-xs font-bold uppercase tracking-widest text-brand">Invitación de propietario</p><h1 className="mt-3 text-3xl font-bold">Revisa tu anuncio en CoFlow</h1>{claim ? <p className="mt-3 leading-7 text-muted">Hola {claim.first_name}. Hemos preparado el borrador de <strong>{claim.property_title}</strong> en {claim.property_city}. Crea tu acceso para revisarlo.</p> : null}{error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}{claim ? <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-line p-6"><Input name="birth_date" type="date" label="Fecha de nacimiento" required /><Input name="password" type="password" label="Crea una contraseña" minLength={8} helperText="Mínimo 8 caracteres" required /><label className="flex items-start gap-3 text-sm leading-6"><input name="terms" type="checkbox" required className="mt-1 h-5 w-5 accent-[var(--brand)]" /><span>Acepto los <Link href="/legal/terminos" target="_blank" className="font-bold text-brand underline">Términos</Link> y la <Link href="/legal/privacidad" target="_blank" className="font-bold text-brand underline">Política de privacidad</Link>.</span></label><button disabled={saving} className="min-h-12 w-full rounded-xl bg-brand px-5 font-bold text-white disabled:opacity-50">{saving ? "Activando…" : "Activar y revisar mi anuncio"}</button></form> : null}</main>;
}
