"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import AuthArtwork from "@/components/auth/AuthArtwork";
import AuthBrand from "@/components/auth/AuthBrand";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { login, register } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter(); const { refresh } = useAuth();
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try { await register({ first_name: firstName, last_name: lastName, email, password }); const data = await login({ email, password }); setToken(data.access_token); await refresh(); router.push("/verificacion-pendiente"); }
    catch (reason) { const status = (reason as { response?: { status?: number } })?.response?.status; setError(status === 409 ? "Ese correo ya tiene una cuenta. Inicia sesión o utiliza otro." : "No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo."); }
    finally { setLoading(false); }
  }
  return <main className="min-h-dvh bg-surface px-5 py-[calc(var(--safe-top)+1.25rem)] sm:px-8 sm:py-8"><div className="mx-auto w-full max-w-6xl"><AuthBrand /><div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
    <section><h1 className="text-3xl font-bold leading-tight tracking-[-0.03em] text-brand-dark sm:text-5xl">Tu próximo hogar empieza aquí</h1><p className="mt-3 text-base leading-7 text-secondary">Vive en comunidad, comparte más que un espacio.</p><div className="mt-5 lg:h-[calc(100%-8rem)]"><AuthArtwork variant="register" /></div></section>
    <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-8"><h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">Crea tu cuenta</h2><RegistrationSteps /><form onSubmit={submit} className="mt-7 space-y-4">
      <div className="grid grid-cols-2 gap-3"><Input aria-label="Nombre" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nombre" leftElement={<UserRound className="h-5 w-5" />} autoComplete="given-name" required /><Input aria-label="Apellidos" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Apellidos" leftElement={<UserRound className="h-5 w-5" />} autoComplete="family-name" required /></div>
      <Input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" leftElement={<Mail className="h-5 w-5" />} autoComplete="email" required />
      <div className="relative"><Input aria-label="Contraseña" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" leftElement={<LockKeyhole className="h-5 w-5" />} autoComplete="new-password" minLength={8} required className="pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-0 flex h-11.5 w-10 items-center justify-center text-muted">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button><p className="mt-2 text-xs leading-5 text-muted">Mínimo 8 caracteres.</p></div>
      {error && <p role="alert" className="rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}<Button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2">{loading ? "Creando cuenta..." : "Continuar"}<ArrowRight className="h-5 w-5" /></Button>
    </form><p className="mt-6 border-t border-border pt-5 text-center text-sm text-secondary">¿Ya tienes cuenta? <Link href="/login" className="font-bold text-primary-dark underline underline-offset-4">Inicia sesión</Link></p></section>
  </div></div></main>;
}

function RegistrationSteps() { return <ol className="mt-6 grid grid-cols-3 text-center text-xs font-semibold text-muted"><li className="text-primary-dark"><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">1</span><span className="mt-2 block">Datos básicos</span></li><li><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface">2</span><span className="mt-2 block">Sobre ti</span></li><li><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface">3</span><span className="mt-2 block">Listo</span></li></ol>; }
