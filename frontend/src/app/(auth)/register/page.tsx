"use client";

import { useEffect, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Cake, Eye, EyeOff, LockKeyhole, Mail, UserRound, Users2, Building2 } from "lucide-react";
import AuthBrand from "@/components/auth/AuthBrand";
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
      const timeout = window.setTimeout(() => setRole("OWNER"), 0);
      return () => window.clearTimeout(timeout);
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
    <main className="flex min-h-dvh items-center justify-center overflow-hidden bg-[#f1f0eb] px-5 py-[calc(var(--safe-top)+1rem)] sm:px-8 sm:py-10">
      <div className="w-full max-w-[480px] sm:border sm:border-black/[0.07] sm:bg-[#fafaf7] sm:px-10 sm:py-9 sm:shadow-[0_28px_80px_rgba(30,39,34,.08)]">
        <AuthBrand />

        <div className="mt-4 text-center sm:mt-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#707871]">Tu cuenta CoFlow</p>
          <h1 className="text-[30px] font-semibold tracking-[-0.05em] text-[#12251c]">
            {role === "OWNER" ? "Publica gratis en Málaga" : "Crea tu cuenta"}
          </h1>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-secondary">
            {role === "OWNER"
              ? "Sin tarjeta, sin permanencia y con control total sobre tu anuncio."
              : "Encuentra compañero de piso y únete a su comunidad."}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 border border-black/[0.08] bg-[#e7e8e2] p-1" role="group" aria-label="Tipo de cuenta">
          <RoleButton active={role === "USER"} onClick={() => setRole("USER")} icon={<Users2 className="h-4 w-4" />} label="Busco piso o compañeros" />
          <RoleButton active={role === "OWNER"} onClick={() => setRole("OWNER")} icon={<Building2 className="h-4 w-4" />} label="Soy propietario/a" />
        </div>

        <form onSubmit={submit} className="mt-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <AppleField label="Nombre" icon={<UserRound />} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
            <AppleField label="Apellidos" icon={<UserRound />} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
          </div>
          <AppleField label="Email" icon={<Mail />} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          <AppleField label="Fecha de nacimiento" icon={<Cake />} type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} required />
          <AppleField label="Contraseña" icon={<LockKeyhole />} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required rightElement={<button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="flex h-11 w-11 items-center justify-center rounded-full text-[#77827c] transition active:bg-black/5">{showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}</button>} />

          <div className="space-y-2.5 border-t border-black/[0.08] px-1 pt-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                required
                className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-border text-primary focus:ring-primary/30"
              />
              <span className="text-[12px] leading-[1.45] text-secondary">
                Acepto los{" "}
                <Link href="/legal/terminos" target="_blank" className="font-bold text-primary-dark underline underline-offset-4">
                  Términos y Condiciones
                </Link>{" "}
                {" "}y la{" "}<Link href="/legal/privacidad" target="_blank" className="font-semibold text-primary-dark underline underline-offset-4">Política de Privacidad</Link>.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-border text-primary focus:ring-primary/30"
              />
              <span className="text-[12px] leading-[1.45] text-secondary">Recibir novedades de CoFlow <span className="text-muted">(opcional)</span>.</span>
            </label>
          </div>

          {error && <p role="alert" className="rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#183c2d] py-3 shadow-none hover:bg-[#102a20]">
            {loading ? "Creando cuenta..." : role === "OWNER" ? "Crear cuenta y publicar" : "Continuar"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </form>

        <p className="mt-3 text-center text-[12px] text-secondary">
          ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-primary-dark underline underline-offset-4">Inicia sesión</Link>
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
        "flex min-h-11 items-center justify-center gap-2 px-2 text-center text-[12px] font-semibold transition",
        active ? "bg-[#183c2d] text-white shadow-none" : "text-[#5e6761] hover:text-[#17251f]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

type AppleFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; icon: ReactNode; rightElement?: ReactNode };

function AppleField({ label, icon, rightElement, className, ...props }: AppleFieldProps) {
  return (
    <label className="group relative block h-[54px] bg-[#fafaf7] ring-1 ring-black/[0.11] transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#183c2d]/45">
      <span className="pointer-events-none absolute left-11 top-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#747b76]">{label}</span>
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#626c65] [&>svg]:h-[16px] [&>svg]:w-[16px]">{icon}</span>
      <input aria-label={label} className={cn("h-full w-full bg-transparent pb-1 pl-11 pr-3 pt-5 text-[16px] text-[#17392c] outline-none", rightElement && "pr-14", className)} {...props} />
      {rightElement ? <span className="absolute inset-y-0 right-1.5 flex items-center">{rightElement}</span> : null}
    </label>
  );
}
