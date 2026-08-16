"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Cake, Eye, EyeOff, LockKeyhole, Mail, UserRound, Users2, Building2 } from "lucide-react";
import AuthBrand from "@/components/auth/AuthBrand";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { register } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { setPostVerificationOwnerIntent } from "@/lib/postVerificationIntent";
import { cn } from "@/lib/utils";

type Role = "USER" | "OWNER";

export default function RegisterPage() {
  const router = useRouter();
  const { applyAuthenticatedUser } = useAuth();
  const [role, setRole] = useState<Role>("USER");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("role") === "owner") {
      setRole("OWNER");
    }
  }, []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!termsAccepted) {
      setError("Debes aceptar los Términos y Condiciones para crear una cuenta.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role,
        birth_date: birthDate,
        terms_accepted: termsAccepted,
        marketing_consent: marketingConsent,
      });
      setToken(data.access_token);
      applyAuthenticatedUser(data.user);
      if (role === "OWNER") setPostVerificationOwnerIntent();
      router.push("/verificacion-pendiente");
    } catch (reason) {
      const response = (reason as { response?: { status?: number; data?: { detail?: unknown } } })?.response;
      const status = response?.status;
      const detail = response?.data?.detail;
      const firstDetailMessage = Array.isArray(detail) ? detail[0]?.msg : undefined;
      setError(
        status === 409
          ? "Ese correo ya tiene una cuenta. Inicia sesión o utiliza otro."
          : status === 422 && typeof firstDetailMessage === "string"
            ? firstDetailMessage.replace(/^Value error,\s*/, "")
            : "No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-5 py-[calc(var(--safe-top)+1.25rem)] sm:px-8">
      <div className="w-full max-w-md">
        <AuthBrand />

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-brand-dark">Crea tu cuenta</h1>
          <p className="mt-2 text-sm leading-6 text-secondary">Encuentra compañero de piso y únete a su comunidad.</p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-2 rounded-14 border border-border bg-surface-soft p-1">
          <RoleButton active={role === "USER"} onClick={() => setRole("USER")} icon={<Users2 className="h-4 w-4" />} label="Busco piso o compañeros" />
          <RoleButton active={role === "OWNER"} onClick={() => setRole("OWNER")} icon={<Building2 className="h-4 w-4" />} label="Soy propietario/a" />
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input aria-label="Nombre" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nombre" leftElement={<UserRound className="h-5 w-5" />} autoComplete="given-name" required />
            <Input aria-label="Apellidos" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Apellidos" leftElement={<UserRound className="h-5 w-5" />} autoComplete="family-name" required />
          </div>
          <Input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" leftElement={<Mail className="h-5 w-5" />} autoComplete="email" required />
          <Input aria-label="Fecha de nacimiento" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} leftElement={<Cake className="h-5 w-5" />} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} required />
          <div className="relative">
            <Input aria-label="Contraseña" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" leftElement={<LockKeyhole className="h-5 w-5" />} autoComplete="new-password" minLength={8} required className="pr-12" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-0 flex h-11.5 w-10 items-center justify-center text-muted">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            <p className="mt-2 text-xs leading-5 text-muted">Mínimo 8 caracteres.</p>
          </div>

          {role === "OWNER" && (
            <p className="rounded-14 bg-primary/5 px-4 py-3 text-xs leading-5 text-secondary">
              Como propietario/a accedes directamente a tu panel para publicar viviendas, sin el test de convivencia. Podrás activarlo más adelante si también quieres buscar compañero de piso.
            </p>
          )}

          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                required
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm leading-6 text-secondary">
                He leído y acepto los{" "}
                <Link href="/legal/terminos" target="_blank" className="font-bold text-primary-dark underline underline-offset-4">
                  Términos y Condiciones
                </Link>{" "}
                de CoFlow.
              </span>
            </label>
            <p className="text-xs leading-5 text-muted">
              Al crear tu cuenta, tus datos serán tratados de acuerdo con nuestra{" "}
              <Link href="/legal/privacidad" target="_blank" className="font-semibold text-primary-dark underline underline-offset-4">
                Política de Privacidad
              </Link>
              .
            </p>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm leading-6 text-secondary">Quiero recibir novedades y comunicaciones de CoFlow.</span>
            </label>
          </div>

          {error && <p role="alert" className="rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2">
            {loading ? "Creando cuenta..." : "Continuar"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </form>

        <p className="mt-6 border-t border-border pt-5 text-center text-sm text-secondary">
          ¿Ya tienes cuenta? <Link href="/login" className="font-bold text-primary-dark underline underline-offset-4">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}

function RoleButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-10 px-2 text-center text-xs font-bold transition",
        active ? "bg-primary text-white shadow-button" : "text-secondary hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
