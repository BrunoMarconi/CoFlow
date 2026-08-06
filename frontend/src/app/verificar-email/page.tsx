"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import { verifyEmail } from "@/services/auth";

type Status = "verifying" | "verified" | "expired" | "invalid" | "used" | "error";

const STATUS_MESSAGES: Record<Exclude<Status, "verifying" | "verified">, string> = {
  expired: "Este enlace de verificación ha caducado.",
  invalid: "Este enlace de verificación no es válido.",
  used: "Este enlace de verificación ya se usó.",
  error: "No se pudo verificar tu correo. Inténtalo de nuevo.",
};

function mapErrorCode(code: string | undefined): Status {
  if (code === "TOKEN_EXPIRED") return "expired";
  if (code === "TOKEN_ALREADY_USED") return "used";
  if (code === "INVALID_TOKEN") return "invalid";
  return "error";
}

export default function VerificarEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ranRef = useRef(false);

  const [status, setStatus] = useState<Status>("verifying");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const token = searchParams.get("token");
    router.replace("/verificar-email");

    Promise.resolve()
      .then(() => {
        if (!token) {
          setStatus("invalid");
          return null;
        }
        return verifyEmail(token);
      })
      .then((result) => {
        if (result !== null) setStatus("verified");
      })
      .catch((error) => {
        if (axios.isAxiosError(error)) {
          const code = error.response?.data?.detail?.code;
          setStatus(mapErrorCode(code));
          return;
        }
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4 py-10">
      <div className="w-full max-w-md rounded-18 border border-border bg-surface p-8 text-center shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          CoFlow
        </p>

        {status === "verifying" && (
          <>
            <div className="mt-6 flex justify-center">
              <Spinner />
            </div>
            <p className="mt-4 text-sm text-muted">Verificando tu correo…</p>
          </>
        )}

        {status === "verified" && (
          <>
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              Correo verificado
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Ya puedes usar todas las funciones de CoFlow.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-18 bg-brand px-6 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-brand-dark"
            >
              Ir a iniciar sesión
            </Link>
          </>
        )}

        {(status === "expired" ||
          status === "invalid" ||
          status === "used" ||
          status === "error") && (
          <>
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              No pudimos verificar tu correo
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              {STATUS_MESSAGES[status]}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-18 bg-brand px-6 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-brand-dark"
            >
              Ir a iniciar sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
