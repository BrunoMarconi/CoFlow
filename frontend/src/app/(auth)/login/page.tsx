"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import AuthArtwork from "@/components/auth/AuthArtwork";
import AuthBrand from "@/components/auth/AuthBrand";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { login } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter(); const { refresh, refreshCommunity } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try { const data = await login({ email, password }); setToken(data.access_token); const currentUser = await refresh(); if (currentUser?.onboarding_completed) await refreshCommunity(); router.replace(currentUser?.onboarding_completed ? "/comunidades" : "/onboarding"); }
    catch (reason) { const status = (reason as { response?: { status?: number } })?.response?.status; setError(status === 401 ? "El correo o la contraseña no son correctos." : status ? "No pudimos iniciar sesión ahora mismo. Inténtalo de nuevo." : "No pudimos conectar con el servidor. Revisa tu conexión."); }
    finally { setLoading(false); }
  }
  return <main className="min-h-dvh bg-surface px-5 py-[calc(var(--safe-top)+1.25rem)] sm:px-8 sm:py-8"><div className="mx-auto w-full max-w-6xl"><AuthBrand /><div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
    <section><h1 className="text-3xl font-bold leading-tight tracking-[-0.03em] text-brand-dark sm:text-5xl">Encuentra compañeros de piso que encajen contigo</h1><p className="mt-3 max-w-xl text-base leading-7 text-secondary">Vive en comunidad y comparte más que un piso: comparte tu estilo de vida.</p><div className="mt-5 lg:h-[calc(100%-9rem)]"><AuthArtwork variant="login" /></div></section>
    <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-8"><div className="text-center"><h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">Inicia sesión</h2><p className="mt-2 text-sm text-secondary">Vuelve a tu comunidad CoFlow.</p></div>
      <form onSubmit={submit} className="mt-7 space-y-5"><Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" leftElement={<Mail className="h-5 w-5" />} autoComplete="email" required />
        <div><label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-foreground">Contraseña</label><div className="relative"><Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" leftElement={<LockKeyhole className="h-5 w-5" />} autoComplete="current-password" required className="pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-0 flex h-11.5 w-10 items-center justify-center text-muted">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
        {error && <p role="alert" className="rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}<div className="text-right"><Link href="/ayuda" className="text-sm font-bold text-primary-dark">¿Necesitas ayuda para entrar?</Link></div><Button type="submit" disabled={loading} className="w-full">{loading ? "Iniciando sesión..." : "Iniciar sesión"}</Button>
      </form><p className="mt-7 border-t border-border pt-6 text-center text-sm text-secondary">¿No tienes cuenta? <Link href="/register" className="font-bold text-primary-dark underline underline-offset-4">Regístrate</Link></p>
    </section></div><p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-primary" /> Tu privacidad y seguridad son nuestra prioridad.</p></div></main>;
}
