"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { login } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import s from "@/components/auth/Auth.module.css";

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
    <AuthSplit
      kicker="Bienvenido de vuelta"
      headline="Tu gente sigue donde la dejaste."
      text="Entra para seguir hablando con tu comunidad y retomar la búsqueda donde la dejaste."
      points={["Tus conversaciones y comunidades", "Las personas que guardaste", "Tus preferencias de convivencia"]}
      foot="Disponible en Málaga"
    >
      <h1 className={s.title}>Inicia sesión</h1>
      <p className={s.subtitle}>Vuelve a tu comunidad CoFlow.</p>

      <form onSubmit={submit} className={s.form}>
        <label className={s.field}>
          <span className={s.fieldLabel}>Email</span>
          <input
            className={s.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            required
          />
        </label>

        <div className={s.field}>
          <div className={s.labelRow}>
            <label htmlFor="login-password" className={s.fieldLabel}>Contraseña</label>
            <Link href="/recuperar-password" className={s.inlineLink}>¿La has olvidado?</Link>
          </div>
          <input
            id="login-password"
            className={`${s.input} ${s.inputWithButton}`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className={s.reveal}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>

        {error && <p role="alert" className={s.error}>{error}</p>}

        <div className={s.actions}>
          <button type="submit" disabled={loading} className={s.submit}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            {!loading && <ArrowRight />}
          </button>
        </div>
      </form>

      <p className={s.foot}>
        ¿No tienes cuenta? <Link href="/register">Regístrate</Link>
      </p>
    </AuthSplit>
  );
}
