"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { login } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[login]", ...args);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { refresh, refreshCommunity } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({
        email,
        password,
      });
      devLog("login response recibida", { emailVerified: data.is_email_verified });

      setToken(data.access_token);
      devLog("token guardado");

      const currentUser = await refresh();
      devLog("user actualizado", {
        gotUser: Boolean(currentUser),
        onboardingCompleted: currentUser?.onboarding_completed ?? null,
      });

      if (currentUser?.onboarding_completed) {
        await refreshCommunity();
      }

      const destination = currentUser?.onboarding_completed
        ? "/comunidades"
        : "/onboarding";
      devLog("ruta de destino", destination);

      router.replace(destination);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;

      if (status === 401) {
        setError("El correo o la contraseña no son correctos.");
      } else if (status !== undefined) {
        // Error real del servidor (5xx) o de validación (4xx distinto de
        // 401): no es un problema de credenciales, así que no lo
        // mostramos como tal — induciría a error a quien esté seguro de
        // su contraseña.
        setError(
          "Estamos teniendo problemas técnicos para iniciar sesión. Inténtalo de nuevo en unos minutos."
        );
      } else {
        setError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-surface-muted px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <Card className="w-full max-w-md p-8 md:p-10">
          <Link
            href="/"
            className="mb-10 flex items-center justify-center gap-3"
          >
            <div className="flex">
              <div className="h-5 w-5 rounded-full bg-primary" />
              <div className="-ml-2 h-5 w-5 rounded-full border-2 border-white bg-mint-200" />
            </div>

            <span className="text-2xl font-bold text-brand-dark">
              CoFlow
            </span>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-brand-dark">
              Bienvenido de nuevo
            </h1>

            <p className="mt-3 text-secondary">
              Inicia sesión para continuar buscando tu próxima comunidad.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-dark">
                Correo electrónico
              </label>

              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-dark">
                Contraseña
              </label>

              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            {error && (
              <p className="rounded-14 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-secondary">
            ¿Todavía no tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:text-primary-dark"
            >
              Crear cuenta
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}