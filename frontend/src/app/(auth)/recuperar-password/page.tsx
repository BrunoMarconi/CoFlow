"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Mail } from "lucide-react";
import AuthBrand from "@/components/auth/AuthBrand";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { requestPasswordReset } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (reason) {
      const hasResponse = Boolean((reason as { response?: unknown })?.response);
      setError(hasResponse ? "No pudimos enviar el enlace. Inténtalo de nuevo." : "No pudimos conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-5 py-[calc(var(--safe-top)+1.25rem)] sm:px-8">
      <section className="w-full max-w-md">
        <AuthBrand />
        {sent ? (
          <div className="mt-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary-dark"><Check className="h-7 w-7" strokeWidth={2.2} /></div>
            <h1 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-brand-dark">Revisa tu correo</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-secondary">Si existe una cuenta asociada a <span className="font-semibold text-foreground">{email}</span>, recibirás un enlace válido durante 30 minutos.</p>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary-dark"><ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión</Link>
          </div>
        ) : (
          <>
            <div className="mt-8 text-center">
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-brand-dark">Recupera el acceso</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary">Te enviaremos un enlace seguro para crear una contraseña nueva.</p>
            </div>
            <form onSubmit={submit} className="mt-7 space-y-5">
              <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" leftElement={<Mail className="h-5 w-5" />} autoComplete="email" required autoFocus />
              {error && <p role="alert" className="rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Enviando..." : "Enviar enlace seguro"}</Button>
            </form>
            <Link href="/login" className="mt-7 flex items-center justify-center gap-2 text-sm font-bold text-primary-dark"><ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión</Link>
          </>
        )}
      </section>
    </main>
  );
}
