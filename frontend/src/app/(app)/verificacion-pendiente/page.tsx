"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import { maskEmail } from "@/lib/maskEmail";
import { resendVerification } from "@/services/auth";
import { consumePostVerificationOwnerIntent } from "@/lib/postVerificationIntent";

const COOLDOWN_SECONDS = 60;

export default function VerificacionPendientePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && (user?.is_email_verified || !user?.email_verification_enabled)) {
      router.replace(
        consumePostVerificationOwnerIntent() ? "/propietarios/perfil" : "/onboarding"
      );
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  async function handleResend() {
    if (sending || cooldown > 0 || !user) return;

    setSending(true);
    setMessage("");

    try {
      await resendVerification(user.email);
      setMessage("Te hemos enviado un nuevo correo de verificación.");
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      setMessage("No pudimos reenviar el correo. Inténtalo de nuevo en unos minutos.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="w-full rounded-[28px] border border-black/[0.06] bg-[#fbfcfa] p-6 shadow-[0_18px_50px_rgba(20,42,32,.07)] sm:p-9">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e5f1ea] text-primary-dark"><MailIcon /></span>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Confirma tu correo</p>

      <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
        Revisa tu bandeja de entrada
      </h1>

      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted">
        Te hemos enviado un enlace de verificación a{" "}
        <span className="font-semibold text-foreground">
          {maskEmail(user.email)}
        </span>
        . Ábrelo para activar todas las funciones de tu cuenta.
      </p>

      {message && (
        <p className="mt-4 rounded-14 bg-surface-soft px-4 py-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2 text-left"><Step number="1" text="Abre tu correo" /><Step number="2" text="Pulsa el enlace" /><Step number="3" text="Vuelve a CoFlow" /></div>

      <button
        type="button"
        onClick={handleResend}
        disabled={sending || cooldown > 0}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white shadow-[0_8px_20px_rgba(20,55,41,.16)] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cooldown > 0
          ? `Reenviar correo (${cooldown}s)`
          : sending
            ? "Enviando…"
            : "Reenviar correo"}
      </button>

      <div className="mt-5 flex items-center gap-4 text-sm">
        <Link href="/perfil/editar" className="font-semibold text-brand">
          Cambiar correo
        </Link>
        <button
          type="button"
          onClick={logout}
          className="font-semibold text-muted"
        >
          Volver al login
        </button>
      </div>
      <p className="mt-6 border-t border-black/[0.06] pt-4 text-[11px] leading-5 text-muted">Confirmar el correo demuestra que controlas esa dirección. No es una verificación documental de identidad.</p>
      </div>
    </div>
  );
}

function Step({ number, text }: { number: string; text: string }) { return <div className="rounded-[14px] bg-white p-3"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e8eeea] text-[10px] font-bold text-primary-dark">{number}</span><p className="mt-2 text-[10px] font-semibold leading-4 text-secondary">{text}</p></div>; }
function MailIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>; }
