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

      setToken(data.access_token);
      const currentUser = await refresh();

      if (currentUser?.onboarding_completed) {
        await refreshCommunity();
      }

      router.push(currentUser?.onboarding_completed ? "/comunidades" : "/onboarding");
    } catch {
      setError("El correo o la contraseña no son correctos.");
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
              Bienvenido de nuevo
            </h1>

            <p className="mt-3 text-gray-600">
              Inicia sesión para continuar buscando tu próxima comunidad.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
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
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            ¿Todavía no tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-semibold text-green-600 hover:text-green-700"
            >
              Crear cuenta
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}