"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import AuthBrand from "@/components/auth/AuthBrand";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { resetPassword } from "@/services/auth";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [token] = useState(() => params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      router.replace("/restablecer-password");
    }
  }, [router, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Usa al menos 8 caracteres.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");
    if (!token) return setError("Este enlace no es válido. Solicita uno nuevo.");
    setLoading(true);
    try {
      await resetPassword({ token, new_password: password });
      setDone(true);
    } catch (reason) {
      const detail = (reason as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail;
      setError(detail?.message ?? "No pudimos restablecer la contraseña. Solicita un enlace nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) return <div className="mt-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary-dark"><Check className="h-7 w-7" /></div><h1 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-brand-dark">Contraseña actualizada</h1><p className="mt-3 text-sm leading-6 text-secondary">Ya puedes entrar con tu nueva contraseña. Las sesiones anteriores se han cerrado.</p><Link href="/login" className="mt-8 inline-flex rounded-14 bg-primary px-7 py-4 font-semibold text-white shadow-button">Iniciar sesión</Link></div>;

  return <><div className="mt-8 text-center"><h1 className="text-3xl font-bold tracking-[-0.035em] text-brand-dark">Nueva contraseña</h1><p className="mt-2 text-sm leading-6 text-secondary">Elige una clave segura que no hayas utilizado antes.</p></div><form onSubmit={submit} className="mt-7 space-y-5"><div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-foreground">Contraseña nueva</label><div className="relative"><Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" leftElement={<LockKeyhole className="h-5 w-5" />} autoComplete="new-password" required className="pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-0 flex h-11.5 w-10 items-center justify-center text-muted">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div><Input label="Repite la contraseña" type={showPassword ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repite la contraseña" leftElement={<LockKeyhole className="h-5 w-5" />} autoComplete="new-password" required />{error && <p role="alert" className="rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}<Button type="submit" disabled={loading} className="w-full">{loading ? "Guardando..." : "Guardar contraseña"}</Button></form><p className="mt-6 text-center text-xs leading-5 text-muted">El enlace solo funciona una vez y caduca por seguridad.</p></>;
}

export default function ResetPasswordPage() {
  return <main className="flex min-h-dvh items-center justify-center bg-surface px-5 py-[calc(var(--safe-top)+1.25rem)] sm:px-8"><section className="w-full max-w-md"><AuthBrand /><Suspense fallback={<p className="mt-8 text-center text-sm text-secondary">Preparando enlace seguro...</p>}><ResetPasswordForm /></Suspense></section></main>;
}
