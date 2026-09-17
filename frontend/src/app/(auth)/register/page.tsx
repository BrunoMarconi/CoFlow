"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Users2 } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { register } from "@/services/auth";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { setPostVerificationOwnerIntent } from "@/lib/postVerificationIntent";
import s from "@/components/auth/Auth.module.css";

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

  // El formulario va en dos pasos: identidad primero (email y
  // contraseña) y datos personales después. Cada paso es su propio
  // <form>, así la validación nativa del navegador valida solo los
  // campos visibles en vez de bloquear el envío por campos ocultos.
  const [step, setStep] = useState<1 | 2>(1);
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

  function goToDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStep(2);
  }

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
      // El 409 es por el email, que se pidió en el paso 1: se vuelve
      // allí para que el usuario pueda corregirlo sin buscarlo.
      if (status === 409) setStep(1);
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

  const isOwner = role === "OWNER";

  return (
    <AuthSplit
      kicker={isOwner ? "Para propietarios" : "Tu cuenta CoFlow"}
      headline={isOwner ? "Tu vivienda merece una buena convivencia." : "Tu próxima casa empieza por tu gente."}
      text={
        isOwner
          ? "Publica gratis y conoce el presupuesto y las preferencias de cada persona antes de responder."
          : "Cuenta cómo te gusta convivir y conoce a personas con las que la convivencia pueda funcionar."
      }
      points={
        isOwner
          ? ["Publicar es gratis y sin permanencia", "Solicitudes con contexto real", "Tú decides a quién respondes"]
          : ["Perfiles con email verificado", "Personas y comunidades en Málaga", "Tú decides qué se ve de tu perfil"]
      }
    >
      <div className={s.steps}>
        <span>Paso {step} de 2</span>
        <span className={s.dots} aria-hidden="true">
          <i className={`${s.dot} ${s.dotOn}`} />
          <i className={`${s.dot} ${step === 2 ? s.dotOn : ""}`} />
        </span>
      </div>

      <h1 className={s.title}>{step === 1 ? (isOwner ? "Publica gratis en Málaga" : "Crea tu cuenta") : "Cuéntanos quién eres"}</h1>
      <p className={s.subtitle}>
        {step === 1
          ? isOwner
            ? "Sin tarjeta, sin permanencia y con control total sobre tu anuncio."
            : "Encuentra compañero de piso y únete a su comunidad."
          : "Solo nos falta esto para crear tu cuenta."}
      </p>

      {step === 1 ? (
        <>
          <div className={s.roleGroup} role="group" aria-label="Tipo de cuenta">
            <button type="button" onClick={() => setRole("USER")} aria-pressed={!isOwner} className={`${s.roleButton} ${!isOwner ? s.roleButtonOn : ""}`}>
              <Users2 /> Busco piso
            </button>
            <button type="button" onClick={() => setRole("OWNER")} aria-pressed={isOwner} className={`${s.roleButton} ${isOwner ? s.roleButtonOn : ""}`}>
              <Building2 /> Soy propietario/a
            </button>
          </div>

          <form onSubmit={goToDetails} className={s.form}>
            <label className={s.field}>
              <span className={s.fieldLabel}>Email</span>
              <input className={s.input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" autoComplete="email" required />
            </label>

            <div className={s.field}>
              <label htmlFor="register-password" className={s.fieldLabel}>Contraseña</label>
              <input
                id="register-password"
                className={`${s.input} ${s.inputWithButton}`}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                aria-describedby="register-password-help"
                minLength={8}
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className={s.reveal}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <p id="register-password-help" className={s.formNote}>Usa al menos 8 caracteres. Podrás completar tu perfil de convivencia después.</p>

            {error && <p role="alert" className={s.error}>{error}</p>}

            <div className={s.actions}>
              <button type="submit" className={s.submit}>Continuar <ArrowRight /></button>
            </div>
          </form>
        </>
      ) : (
        <form onSubmit={submit} className={s.form}>
          <div className={s.row}>
            <label className={s.field}>
              <span className={s.fieldLabel}>Nombre</span>
              <input className={s.input} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Apellidos</span>
              <input className={s.input} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
            </label>
          </div>

          <label className={s.field}>
            <span className={s.fieldLabel}>Fecha de nacimiento</span>
            <input className={s.input} type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} required />
          </label>

          <div className={s.checks}>
            <label className={s.check}>
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required />
              <span>
                Acepto los <Link href="/legal/terminos" target="_blank">Términos y Condiciones</Link> y la <Link href="/legal/privacidad" target="_blank">Política de Privacidad</Link>.
              </span>
            </label>
            <label className={s.check}>
              <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />
              <span>Recibir novedades de CoFlow (opcional).</span>
            </label>
          </div>

          {error && <p role="alert" className={s.error}>{error}</p>}

          <div className={s.actions}>
            <button type="submit" disabled={loading} className={s.submit}>
              {loading ? "Creando cuenta..." : isOwner ? "Crear cuenta y publicar" : "Crear cuenta"}
              {!loading && <ArrowRight />}
            </button>
            <button type="button" onClick={() => { setError(""); setStep(1); }} className={s.back}>
              <ArrowLeft /> Volver
            </button>
          </div>
        </form>
      )}

      <p className={s.foot}>
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </AuthSplit>
  );
}
