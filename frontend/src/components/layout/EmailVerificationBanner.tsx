"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { resendVerification } from "@/services/auth";

const COOLDOWN_SECONDS = 60;

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  if (!user || user.is_email_verified) return null;
  if (pathname === "/verificacion-pendiente") return null;

  async function handleResend() {
    if (sending || cooldown > 0) return;

    setSending(true);
    try {
      await resendVerification(user!.email);
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      // Silencioso: el usuario puede reintentar cuando termine la cuenta atrás.
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm sm:flex-row sm:items-center">
      <p className="font-semibold text-amber-800">
        Confirma tu correo para utilizar todas las funciones de CoFlow.
      </p>

      <button
        type="button"
        onClick={handleResend}
        disabled={sending || cooldown > 0}
        className="shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cooldown > 0
          ? `Reenviar (${cooldown}s)`
          : sending
            ? "Enviando…"
            : sent
              ? "Reenviado"
              : "Reenviar"}
      </button>
    </div>
  );
}
