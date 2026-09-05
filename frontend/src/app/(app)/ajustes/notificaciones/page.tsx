"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Check, Clock3, Mail, MessageCircle, Users } from "lucide-react";
import Switch from "@/components/ui/Switch";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import { getNotificationPreferences, updateNotificationPreferences } from "@/services/notifications";
import type { NotificationPreferences } from "@/types/notification";

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const initialLoad = useRef(true);

  useEffect(() => {
    let active = true;
    getNotificationPreferences().then((data) => { if (active) setPreferences(data); }).catch(() => { if (active) setError("No pudimos cargar tus preferencias."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!preferences || initialLoad.current) { initialLoad.current = false; return; }
    const timer = window.setTimeout(() => {
      updateNotificationPreferences(preferences).then(() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); }).catch(() => setError("No pudimos guardar los cambios."));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [preferences]);

  function toggle(key: keyof NotificationPreferences) {
    setError("");
    setPreferences((current) => current ? { ...current, [key]: !current[key] } : current);
  }

  if (error && !preferences) return <ErrorState title="No se pudieron cargar las preferencias" description={error} onRetry={() => window.location.reload()} />;
  if (!preferences) return <PageSkeleton variant="profile" />;

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <header className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Link href="/ajustes" aria-label="Volver a ajustes" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-soft"><ArrowLeft className="h-5 w-5" /></Link><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Preferencias</p><h1 className="font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark">Notificaciones</h1></div></div><span role="status" aria-live="polite" className={`flex items-center gap-1.5 text-xs font-bold text-primary-dark transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}><Check className="h-4 w-4" /> Guardado</span></header>

      <section className="mt-6 overflow-hidden rounded-[24px] bg-surface shadow-soft"><PreferenceRow icon={<Bell />} title="Notificaciones en CoFlow" description="Avisos dentro de la aplicación." checked={preferences.in_app_enabled} onChange={() => toggle("in_app_enabled")} /><PreferenceRow icon={<Mail />} title="Correo electrónico" description="Recibe novedades aunque no estés dentro." checked={preferences.email_enabled} onChange={() => toggle("email_enabled")} /></section>

      <SectionTitle>Categorías</SectionTitle>
      <section className="overflow-hidden rounded-[24px] bg-surface shadow-soft"><PreferenceRow icon={<MessageCircle />} title="Mensajes" description="Nuevos mensajes privados." checked={preferences.messages} disabled={!preferences.in_app_enabled} onChange={() => toggle("messages")} /><PreferenceRow icon={<Users />} title="Conexiones" description="Solicitudes y conexiones aceptadas." checked={preferences.connections} disabled={!preferences.in_app_enabled} onChange={() => toggle("connections")} /><PreferenceRow icon={<Users />} title="Comunidades" description="Cambios de miembros y administración." checked={preferences.communities} disabled={!preferences.in_app_enabled} onChange={() => toggle("communities")} /><PreferenceRow icon={<Mail />} title="Solicitudes e invitaciones" description="Respuestas y nuevas invitaciones." checked={preferences.applications} disabled={!preferences.in_app_enabled} onChange={() => toggle("applications")} /></section>

      <SectionTitle>Correo y descanso</SectionTitle>
      <section className="rounded-[24px] bg-surface p-5 shadow-soft"><label className="text-sm font-bold text-brand-dark" htmlFor="email-frequency">Frecuencia del correo</label><select id="email-frequency" disabled={!preferences.email_enabled} value={preferences.email_frequency} onChange={(event) => setPreferences({ ...preferences, email_frequency: event.target.value as NotificationPreferences["email_frequency"] })} className="mt-3 h-12 w-full rounded-14 border border-border bg-surface px-4 text-sm font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50"><option value="immediate">Al momento</option><option value="daily">Resumen diario</option><option value="never">Nunca</option></select><div className="mt-5 border-t border-border pt-5"><PreferenceRow plain icon={<Clock3 />} title="Horario silencioso" description="Pausa los avisos entre estas horas." checked={preferences.quiet_hours_enabled} onChange={() => toggle("quiet_hours_enabled")} />{preferences.quiet_hours_enabled && <div className="mt-4 grid grid-cols-2 gap-3"><TimeField label="Desde" value={preferences.quiet_hours_start} onChange={(value) => setPreferences({ ...preferences, quiet_hours_start: value })} /><TimeField label="Hasta" value={preferences.quiet_hours_end} onChange={(value) => setPreferences({ ...preferences, quiet_hours_end: value })} /></div>}</div><p className="mt-5 rounded-14 bg-mint-50 p-3 text-xs leading-5 text-primary-dark">Los avisos críticos de seguridad, como cambios de contraseña, permanecen activos.</p>{error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}</section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) { return <h2 className="mb-2 mt-6 px-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">{children}</h2>; }
function PreferenceRow({ icon, title, description, checked, onChange, disabled = false, plain = false }: { icon: React.ReactNode; title: string; description: string; checked: boolean; onChange: () => void; disabled?: boolean; plain?: boolean }) { return <div className={`flex min-h-20 items-center gap-3 ${plain ? "" : "border-b border-border/70 px-4 py-3 last:border-0"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-12 bg-mint-50 text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-foreground">{title}</p><p className="mt-0.5 text-xs leading-5 text-secondary">{description}</p></div><Switch checked={checked} onChange={onChange} disabled={disabled} label={title} /></div>; }
function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-bold text-secondary">{label}<input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-14 border border-border bg-surface px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>; }
