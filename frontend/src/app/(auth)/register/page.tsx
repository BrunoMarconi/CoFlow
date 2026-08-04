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

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();

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

      const data = await login({ email, password });

      setToken(data.access_token);
      await refresh();

      router.push("/verificacion-pendiente");
    } catch {
      setError("No pudimos crear tu cuenta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#F8FAFC] px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <Card className="w-full max-w-md p-8 md:p-10">
          <Link
            href="/"
            className="mb-10 flex items-center justify-center gap-3"
          >
            <div className="flex">
              <div className="h-5 w-5 rounded-full bg-green-500" />
              <div className="-ml-2 h-5 w-5 rounded-full border-2 border-white bg-green-300" />
            </div>

            <span className="text-2xl font-bold text-[#163B2E]">
              CoFlow
            </span>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#163B2E]">
              Crea tu cuenta
            </h1>

            <p className="mt-3 text-gray-600">
              Empieza a encontrar tu próxima comunidad hoy mismo.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#163B2E]">
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
                <label className="mb-2 block text-sm font-semibold text-[#163B2E]">
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
              <label className="mb-2 block text-sm font-semibold text-[#163B2E]">
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
              <label className="mb-2 block text-sm font-semibold text-[#163B2E]">
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
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
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

          <p className="mt-8 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-green-600 hover:text-green-700"
            >
              Iniciar sesión
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
