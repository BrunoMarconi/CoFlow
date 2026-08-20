"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import AuthBrand from "@/components/auth/AuthBrand";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { login } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { applyAuthenticatedUser, refreshCommunity, refreshOwnerProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ email, password });
      setToken(data.access_token);
      applyAuthenticatedUser(data.user);
      const currentUser = data.user;

      if (currentUser?.role === "OWNER") {
        const ownerProfile = await refreshOwnerProfile();
        router.replace(ownerProfile ? "/propietarios/pisos" : "/propietarios/perfil");
        return;
      }

      // No se espera: el destino ya se decide con currentUser, y la
      // comunidad puede seguir cargando en segundo plano una vez
      // dentro — esperarla aquí solo añadía otro round-trip antes de
      // poder navegar.
      if (currentUser?.onboarding_completed) void refreshCommunity();
      router.replace(currentUser?.onboarding_completed ? "/comunidades" : "/onboarding");
    } catch (reason) {
      const status = (reason as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? "El correo o la contraseña no son correctos." : status ? "No pudimos iniciar sesión ahora mismo. Inténtalo de nuevo." : "No pudimos conectar con el servidor. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-5 py-[calc(var(--safe-top)+1.25rem)] sm:px-8">
      <div className="w-full max-w-md">
        <AuthBrand />

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-brand-dark">Inicia sesión</h1>
          <p className="mt-2 text-sm text-secondary">Vuelve a tu comunidad CoFlow.</p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" leftElement={<Mail className="h-5 w-5" />} autoComplete="email" required />

          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-foreground">Contraseña</label>
            <div className="relative">
              <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" leftElement={<LockKeyhole className="h-5 w-5" />} autoComplete="current-password" required className="pr-12" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-0 flex h-11.5 w-10 items-center justify-center text-muted">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

          <div className="text-right">
            <Link href="/ayuda" className="text-sm font-bold text-primary-dark">¿Necesitas ayuda para entrar?</Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-7 border-t border-border pt-6 text-center text-sm text-secondary">
          ¿No tienes cuenta? <Link href="/register" className="font-bold text-primary-dark underline underline-offset-4">Regístrate</Link>
        </p>
      </div>
    </main>
  );
}
