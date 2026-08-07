"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { login, register } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { POST_VERIFICATION_INTENT_KEY } from "@/lib/postVerificationIntent";

type Intent = "seeker" | "owner";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [intent, setIntent] = useState<Intent>("seeker");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;

      setError(
        status === 409
          ? "Ese correo ya tiene una cuenta creada. Inicia sesión con tu contraseña o usa otro correo."
          : "No pudimos crear tu cuenta. Intenta de nuevo."
      );
      setLoading(false);
      return;
    }

    try {
      const data = await login({ email, password });

      setToken(data.access_token);
      await refresh();

      if (intent === "owner") {
        window.localStorage.setItem(POST_VERIFICATION_INTENT_KEY, "owner");
      }

      router.push("/verificacion-pendiente");
    } catch {
      // La cuenta SÍ se creó (el registro no lanzó error); solo falló
      // el inicio de sesión automático justo después. No mostramos
      // "no pudimos crear tu cuenta" — sería falso y confunde.
      setError(
        "Tu cuenta se creó correctamente, pero no pudimos iniciar sesión automáticamente. Ve a \"Iniciar sesión\" e inténtalo con tu contraseña."
      );
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
              Crea tu cuenta
            </h1>

            <p className="mt-3 text-secondary">
              Empieza a encontrar tu próxima comunidad hoy mismo.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-dark">
                ¿Qué te trae a CoFlow?
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIntent("seeker")}
                  aria-pressed={intent === "seeker"}
                  className={`rounded-14 border-2 px-4 py-3 text-left text-sm font-semibold transition-colors duration-180 ${
                    intent === "seeker"
                      ? "border-primary bg-mint-50 text-primary-dark"
                      : "border-border bg-surface text-secondary hover:border-primary/40"
                  }`}
                >
                  Busco piso o compañeros
                </button>

                <button
                  type="button"
                  onClick={() => setIntent("owner")}
                  aria-pressed={intent === "owner"}
                  className={`rounded-14 border-2 px-4 py-3 text-left text-sm font-semibold transition-colors duration-180 ${
                    intent === "owner"
                      ? "border-primary bg-mint-50 text-primary-dark"
                      : "border-border bg-surface text-secondary hover:border-primary/40"
                  }`}
                >
                  Quiero publicar mi piso
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-dark">
                  Nombre
                </label>

                <Input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Bruno"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-dark">
                  Apellido
                </label>

                <Input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Marconi"
                  required
                />
              </div>
            </div>

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
                minLength={8}
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
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-secondary">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-dark"
            >
              Iniciar sesión
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
