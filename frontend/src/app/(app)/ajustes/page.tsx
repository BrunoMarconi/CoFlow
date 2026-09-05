"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Home, KeyRound, LockKeyhole, LoaderCircle, LogOut, MonitorSmartphone, ShieldCheck, Smartphone, UserRound, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { clearToken } from "@/lib/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SecondaryButton from "@/components/ui/SecondaryButton";
import BottomSheet from "@/components/ui/BottomSheet";
import { changePassword, closeAuthSession, closeOtherAuthSessions, deleteAccount, getAuthSessions } from "@/services/auth";
import type { AuthSession } from "@/types/auth";

export default function AjustesPage() {
  const { user, logout } = useAuth();
  const { isOwnerMode } = useOwnerMode();

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] space-y-4 px-6 py-6 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-5xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="px-1 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">{isOwnerMode ? "Espacio de propietario" : "Tu espacio"}</p>
        <h1 className="mt-0.5 font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
          {isOwnerMode ? "Ajustes de propietario" : "Ajustes"}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">{isOwnerMode ? "Gestiona la identidad, seguridad y operativa de tu actividad en CoFlow." : "Gestiona tu cuenta, privacidad y preferencias."}</p>
      </header>

      {user && (
        <section className="relative overflow-hidden rounded-[26px] bg-brand-dark p-5 text-white shadow-[0_16px_40px_rgba(20,55,41,.16)] sm:p-6">
          <span className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-white/[0.04]" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">{[user.first_name, user.last_name].filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="font-rounded text-xl font-semibold tracking-[-0.02em]">{user.first_name} {user.last_name}</p>
              <p className="mt-0.5 truncate text-sm text-white/60">{user.email}</p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 sm:flex"><CheckCircle2 className="h-3.5 w-3.5" /> {isOwnerMode ? "Modo propietario" : "Sesión activa"}</span>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <SettingsGroup title={isOwnerMode ? "Actividad de propietario" : "Cuenta y preferencias"}>
            {isOwnerMode ? (
              <>
                <SettingsLink href="/propietarios/perfil" icon={<UserRound />} title="Perfil profesional" subtitle="Identidad, contacto y datos fiscales" />
                <SettingsLink href="/propietarios/pisos" icon={<Home />} title="Cartera de viviendas" subtitle="Anuncios, estados y disponibilidad" />
              </>
            ) : (
              <>
                <SettingsLink href="/perfil/editar" icon={<UserRound />} title="Información personal" subtitle="Nombre, biografía y datos de contacto" />
                <SettingsLink href="/perfil/preferencias" icon={<Home />} title="Preferencias de vivienda" subtitle="Presupuesto, hábitos y convivencia ideal" />
              </>
            )}
            {user && <SettingsLink href={user.is_email_verified ? (isOwnerMode ? "/propietarios/perfil" : "/perfil#confianza") : "/verificacion-pendiente"} icon={<ShieldCheck />} title="Verificación y confianza" subtitle={user.is_email_verified ? "Correo confirmado · revisar señales" : "Confirma tu dirección de correo"} />}
            <SettingsLink href="/ajustes/notificaciones" icon={<Bell />} title="Notificaciones" subtitle="Categorías, correo y horario silencioso" />
            <SettingsLink href="/ajustes/privacidad" icon={<LockKeyhole />} title="Privacidad" subtitle="Visibilidad del perfil y personas bloqueadas" />
          </SettingsGroup>

          <SettingsGroup title="Soporte">
            <SettingsLink href={isOwnerMode ? "/propietarios/ayuda" : "/ayuda"} icon={<CircleHelp />} title={isOwnerMode ? "Ayuda para propietarios" : "Centro de ayuda"} subtitle={isOwnerMode ? "Publicación, gestión y funcionamiento" : "Preguntas frecuentes y contacto"} />
          </SettingsGroup>
        </div>

        <div className="space-y-4">
          <SecuritySessionsSection />
          <PasswordSection />
          {isOwnerMode && <FreeServiceCard />}
          <DangerSection onLogout={logout} />
        </div>
      </div>
    </div>
  );
}

function SecuritySessionsSection() {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setSessions(await getAuthSessions());
    } catch {
      setError("No pudimos cargar tus sesiones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getAuthSessions()
      .then((items) => { if (active) setSessions(items); })
      .catch(() => { if (active) setError("No pudimos cargar tus sesiones."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function closeOne(id: string) {
    setWorkingId(id);
    setError("");
    try {
      await closeAuthSession(id);
      setSessions((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("No pudimos cerrar esa sesión.");
    } finally {
      setWorkingId(null);
    }
  }

  async function closeOthers() {
    setWorkingId("others");
    setError("");
    try {
      await closeOtherAuthSessions();
      setSessions((current) => current.filter((item) => item.is_current));
    } catch {
      setError("No pudimos cerrar las demás sesiones.");
    } finally {
      setWorkingId(null);
    }
  }

  const otherCount = sessions.filter((item) => !item.is_current).length;
  return (
    <SectionCard title="Sesiones y dispositivos">
      <p className="text-sm leading-6 text-secondary">Revisa dónde está abierta tu cuenta y cierra cualquier acceso que no reconozcas.</p>
      {loading ? (
        <div className="mt-4 space-y-2" aria-label="Cargando sesiones" aria-busy="true">{[0, 1].map((item) => <div key={item} className="h-16 animate-pulse rounded-16 bg-surface-soft" />)}</div>
      ) : error && sessions.length === 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-16 bg-surface-soft p-4"><p role="alert" className="text-sm font-semibold text-secondary">{error}</p><button type="button" onClick={() => void load()} className="min-h-11 rounded-full px-3 text-xs font-bold text-primary-dark">Reintentar</button></div>
      ) : (
        <div className="mt-4 space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center gap-3 rounded-16 bg-surface-soft p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft">{session.device_label === "iPhone" || session.device_label === "Android" ? <Smartphone className="h-5 w-5" /> : <MonitorSmartphone className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-foreground">{session.device_label}</p>{session.is_current && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary-dark">Este dispositivo</span>}</div><p className="mt-0.5 text-xs text-muted">{session.browser_label} · {formatSessionActivity(session.last_active_at)}</p></div>
              {!session.is_current && <button type="button" disabled={workingId === session.id} onClick={() => void closeOne(session.id)} className="min-h-11 shrink-0 rounded-full px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">{workingId === session.id ? "Cerrando…" : "Cerrar"}</button>}
            </div>
          ))}
        </div>
      )}
      {error && sessions.length > 0 && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      {otherCount > 0 && <SecondaryButton onClick={() => void closeOthers()} disabled={workingId !== null} className="mt-4 w-full">{workingId === "others" ? "Cerrando sesiones…" : `Cerrar las demás sesiones (${otherCount})`}</SecondaryButton>}
    </SectionCard>
  );
}

function formatSessionActivity(value: string) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 2) return "activa ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  if (minutes < 1_440) return `hace ${Math.floor(minutes / 60)} h`;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-black/[0.06] bg-[#fbfcfa] p-5 shadow-[0_10px_30px_rgba(20,42,32,.04)] sm:p-6">
      <h2 className="font-rounded text-xl font-semibold tracking-[-0.02em] text-brand-dark">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">{title}</h2>
      <div className="divide-y divide-border/70 overflow-hidden rounded-[24px] bg-surface shadow-sm">
        {children}
      </div>
    </section>
  );
}

function SettingsLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-18 items-center gap-3 px-4 py-3 transition-colors duration-180 hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-12 bg-mint-50 text-primary [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-secondary">{subtitle}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}

function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (reason) {
      const status = (reason as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? "La contraseña actual no es correcta." : "No pudimos actualizar tu contraseña. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#fbfcfa] shadow-[0_10px_30px_rgba(20,42,32,.04)]">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-20 w-full items-center gap-3 p-4 text-left transition hover:bg-[#f5f7f4] sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-mint-50 text-primary"><KeyRound className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-brand-dark">Contraseña</span><span className="mt-0.5 block text-xs leading-5 text-secondary">Actualiza tu clave de acceso de forma segura</span></span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <form onSubmit={submit} className="space-y-4 border-t border-black/[0.06] p-5">
        <Input
          label="Contraseña actual"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          leftElement={<KeyRound className="h-5 w-5" />}
          autoComplete="current-password"
          required
        />
        <Input
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          leftElement={<KeyRound className="h-5 w-5" />}
          autoComplete="new-password"
          minLength={8}
          helperText="Mínimo 8 caracteres."
          required
        />
        <Input
          label="Confirma la nueva contraseña"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          leftElement={<KeyRound className="h-5 w-5" />}
          autoComplete="new-password"
          minLength={8}
          required
        />

        {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
        {success && <p className="text-sm font-semibold text-primary-dark">{success}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Actualizar contraseña"}
        </Button>
      </form>}
    </section>
  );
}

function FreeServiceCard() {
  return (
    <SectionCard title="CoFlow es gratuito">
      <div className="flex items-start gap-3 rounded-18 bg-mint-50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-brand-dark">Publica y gestiona sin coste</p>
          <p className="mt-1 text-sm leading-6 text-secondary">No necesitas tarjeta, no existen cuotas y no se activa ninguna renovación automática.</p>
        </div>
      </div>
    </SectionCard>
  );
}

function DangerSection({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setError("");
    setDeleting(true);
    try {
      await deleteAccount(password);
      clearToken();
      router.replace("/");
    } catch (reason) {
      const response = (reason as { response?: { status?: number; data?: { detail?: unknown } } })?.response;
      const detail = response?.data?.detail;
      setError(
        response?.status === 401
          ? "La contraseña no es correcta."
          : typeof detail === "string"
            ? detail
            : "No hemos podido eliminar tu cuenta. Inténtalo de nuevo."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="rounded-[24px] border border-black/[0.06] bg-[#fbfcfa] p-4 shadow-[0_10px_30px_rgba(20,42,32,.04)] sm:p-5">
        <h2 className="font-rounded text-xl font-semibold tracking-[-0.02em] text-brand-dark">Sesión y cuenta</h2>

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex min-h-13 w-full items-center gap-3 rounded-14 px-3 text-left text-sm font-bold text-foreground transition-colors duration-180 hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <LogOut className="h-4.5 w-4.5 text-muted" /> Cerrar sesión
        </button>

        <div className="border-t border-border/70">
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex min-h-13 w-full items-center gap-3 rounded-14 px-3 text-left text-sm font-bold text-red-600 transition-colors duration-180 hover:bg-red-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <TriangleAlert className="h-4.5 w-4.5" /> Eliminar cuenta
          </button>
        </div>
      </section>

      {showDelete && (
        <BottomSheet
          onClose={() => !deleting && setShowDelete(false)}
          ariaLabel="Eliminar cuenta"
          className="sm:max-w-sm"
          closeOnOutsideClick={!deleting}
        >
          <div className="p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-brand-dark">Eliminar cuenta</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Esta acción no se puede deshacer. Se borrarán tu perfil, tus comunidades, mensajes y pisos publicados. Confirma con tu contraseña.
            </p>

            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              className="mt-4"
              required
            />

            {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{error}</p>}

            <div className="mt-6 flex gap-3">
              <SecondaryButton onClick={() => setShowDelete(false)} disabled={deleting} className="flex-1">
                Cancelar
              </SecondaryButton>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || !password}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-14 bg-red-600 px-5 text-sm font-bold text-white shadow-button transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
