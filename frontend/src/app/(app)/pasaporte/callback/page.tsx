"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import { submitBankConnectionCallback } from "@/services/bankConnections";

type Status = "processing" | "success" | "error";

const TRUELAYER_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Has cancelado la conexión con tu banco.",
  user_cancelled: "Has cancelado la conexión con tu banco.",
};

function extractErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export default function PasaporteCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ranRef = useRef(false);

  const [status, setStatus] = useState<Status>("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");

    router.replace("/pasaporte/callback");

    Promise.resolve()
      .then(() => {
        if (oauthError) {
          setErrorMessage(
            TRUELAYER_ERROR_MESSAGES[oauthError] ??
              oauthErrorDescription ??
              "No se pudo completar la conexión con tu banco."
          );
          setStatus("error");
          return;
        }

        if (!code || !state) {
          setErrorMessage(
            "Falta información para completar la conexión. Vuelve a intentarlo."
          );
          setStatus("error");
          return;
        }

        return submitBankConnectionCallback(code, state).then(() => {
          setStatus("success");
        });
      })
      .catch((error) => {
        setErrorMessage(
          extractErrorMessage(
            error,
            "No se pudo completar la conexión con tu banco."
          )
        );
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      {status === "processing" && (
        <>
          <Spinner />
          <p className="mt-6 text-base font-semibold text-muted">
            Conectando tu banco…
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Conexión completada
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            Banco conectado correctamente
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted">
            Ya tenemos tus datos bancarios listos para el siguiente paso de
            tu Pasaporte de Solvencia.
          </p>

          <Link
            href="/pasaporte"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            Continuar con mi pasaporte
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
            No se pudo conectar
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            Algo salió mal
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted">
            {errorMessage}
          </p>

          <Link
            href="/pasaporte"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            Volver a intentarlo
          </Link>
        </>
      )}
    </div>
  );
}
