"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import { maskEmail } from "@/lib/maskEmail";
import { resendVerification } from "@/services/auth";

const COOLDOWN_SECONDS = 60;

export default function VerificacionPendientePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && (user?.is_email_verified || !user?.email_verification_enabled)) {
      router.replace("/");
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
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
        Confirma tu correo
      </p>

      <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
        Revisa tu bandeja de entrada
      </h1>

      <p className="mt-4 text-sm leading-6 text-muted">
        Te hemos enviado un enlace de verificación a{" "}
        <span className="font-semibold text-foreground">
          {maskEmail(user.email)}
        </span>
        . Ábrelo para activar todas las funciones de tu cuenta.
      </p>

      {message && (
        <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={sending || cooldown > 0}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  );
}
