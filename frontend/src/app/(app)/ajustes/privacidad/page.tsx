"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import Switch from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toast";

type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

const visibilityLabels: Record<Visibility, string> = {
  PUBLIC: "Público",
  FRIENDS: "Solo amigos",
  PRIVATE: "Privado",
};

export default function PrivacyPage() {
  const [publicProfile, setPublicProfile] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [contactRequests, setContactRequests] = useState(true);
  const [anonymousData, setAnonymousData] = useState(true);
  const [locationVisibility, setLocationVisibility] = useState<Visibility>("FRIENDS");
  const [desiredCityVisibility, setDesiredCityVisibility] = useState<Visibility>("PUBLIC");
  const [occupationVisibility, setOccupationVisibility] = useState<Visibility>("FRIENDS");
  const [bioVisibility, setBioVisibility] = useState<Visibility>("FRIENDS");
  const [messagesVisibility, setMessagesVisibility] = useState<Visibility>("FRIENDS");

  return (
    <div className="mx-auto w-full max-w-4xl pb-6 sm:pb-10">
      <header className="mb-5 sm:mb-6">
        <div className="flex items-center gap-3 md:block">
          <Link
            href="/perfil"
            aria-label="Volver al perfil"
            className="flex h-10 w-10 shrink-0 items-center justify-start text-brand-dark transition hover:text-primary md:hidden"
          >
            <ArrowLeftIcon />
          </Link>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-foreground sm:text-3xl">
            Privacidad
          </h1>
        </div>
        <p className="mt-1 text-sm leading-6 text-secondary sm:mt-2 sm:text-base">
          Controla quién puede ver tu información y cómo se usa en CoFlow.
        </p>
      </header>

      <div className="space-y-4">
        <SettingsSection
          icon={<EyeIcon />}
          title="Visibilidad del perfil"
          description="Elige qué partes de tu perfil son visibles para otros usuarios."
        >
          <SettingRow
            icon={<UserIcon />}
            title="Perfil público"
            description="Permite que otros usuarios te encuentren y vean tu perfil básico."
            control={
              <Switch
                checked={publicProfile}
                onChange={() => setPublicProfile((value) => !value)}
                label="Mostrar perfil público"
              />
            }
          />
          <SettingRow
            icon={<LocationIcon />}
            title="Ubicación actual"
            description="Muestra la ciudad donde estás actualmente en tu perfil."
            control={<VisibilitySelect value={locationVisibility} onChange={setLocationVisibility} label="Visibilidad de la ubicación actual" />}
          />
          <SettingRow
            icon={<TargetIcon />}
            title="Ciudad donde quieres vivir"
            description="Muestra la ciudad donde buscas compartir piso."
            control={<VisibilitySelect value={desiredCityVisibility} onChange={setDesiredCityVisibility} label="Visibilidad de la ciudad deseada" />}
          />
          <SettingRow
            icon={<CalendarIcon />}
            title="Edad"
            description="Muestra tu edad, nunca tu fecha de nacimiento."
            control={
              <Switch
                checked={showAge}
                onChange={() => setShowAge((value) => !value)}
                label="Mostrar edad"
              />
            }
          />
          <SettingRow
            icon={<WorkIcon />}
            title="Ocupación"
            description="Muestra tu ocupación o estudios en tu perfil."
            control={<VisibilitySelect value={occupationVisibility} onChange={setOccupationVisibility} label="Visibilidad de la ocupación" />}
          />
          <SettingRow
            icon={<MessageIcon />}
            title="Bio y datos personales"
            description="Muestra tu bio y otra información personal."
            control={<VisibilitySelect value={bioVisibility} onChange={setBioVisibility} label="Visibilidad de la bio" />}
          />
        </SettingsSection>

        <SettingsSection
          icon={<MailIcon />}
          title="Mensajes y contacto"
          description="Configura quién puede contactarte."
        >
          <SettingRow
            title="Quién puede enviarte mensajes"
            description="Elige quién puede enviarte mensajes en CoFlow."
            control={<VisibilitySelect value={messagesVisibility} onChange={setMessagesVisibility} label="Quién puede enviar mensajes" />}
          />
          <SettingRow
            title="Solicitudes de contacto"
            description="Recibe notificaciones cuando alguien quiera contactarte."
            control={
              <Switch
                checked={contactRequests}
                onChange={() => setContactRequests((value) => !value)}
                label="Recibir solicitudes de contacto"
              />
            }
          />
        </SettingsSection>

        <SettingsSection
          icon={<LockIcon />}
          title="Información y uso de datos"
          description="Gestiona cómo usamos tu información."
        >
          <SettingRow
            title="Uso de datos para mejorar CoFlow"
            description="Nos ayudas a mejorar la plataforma con datos anonimizados."
            control={
              <Switch
                checked={anonymousData}
                onChange={() => setAnonymousData((value) => !value)}
                label="Permitir el uso de datos anonimizados"
              />
            }
          />
          <ActionRow title="Cookies y tecnologías similares" description="Gestiona el uso de cookies en tu navegador." />
        </SettingsSection>

        <SettingsSection icon={<MoreIcon />} title="Otras opciones">
          <ActionRow href="/ajustes/privacidad/bloqueados" title="Bloqueados" description="Gestiona los usuarios que has bloqueado." />
          <ActionRow title="Cuentas silenciadas" description="Gestiona las cuentas que has silenciado." />
        </SettingsSection>

        <aside className="flex items-start gap-4 rounded-18 border border-border bg-surface p-4 shadow-soft sm:items-center sm:p-5">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center text-primary sm:mt-0">
            <ShieldIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">Tu privacidad es importante</p>
            <p className="mt-1 text-xs leading-5 text-secondary sm:text-sm">
              En CoFlow protegemos tu información y nunca la compartimos con terceros sin tu consentimiento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.show("La página informativa de privacidad estará disponible próximamente")}
            className="hidden shrink-0 items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-dark sm:flex"
          >
            Saber más <ChevronIcon />
          </button>
        </aside>
      </div>
    </div>
  );
}

function SettingsSection({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
      <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-primary">{icon}</span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-extrabold text-foreground sm:text-lg">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-5 text-secondary sm:text-sm">{description}</p>}
        </div>
      </div>
      <div className="divide-y divide-border border-t border-border">{children}</div>
    </section>
  );
}

function SettingRow({ icon, title, description, control }: { icon?: ReactNode; title: string; description: string; control: ReactNode }) {
  return (
    <div className="flex min-h-18 items-center gap-3 px-4 py-3.5 sm:px-5">
      {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center text-primary">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-secondary sm:text-sm">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function ActionRow({ title, description, href }: { title: string; description: string; href?: string }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-secondary sm:text-sm">{description}</p>
      </div>
      <span className="shrink-0 text-muted"><ChevronIcon /></span>
    </>
  );
  const className = "flex min-h-18 w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-soft sm:px-5";
  if (href) return <Link href={href} className={className}>{content}</Link>;
  return <button type="button" onClick={() => toast.show(`${title} estará disponible próximamente`)} className={className}>{content}</button>;
}

function VisibilitySelect({ value, onChange, label }: { value: Visibility; onChange: (value: Visibility) => void; label: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Visibility)}
        className="h-10 w-30 appearance-none rounded-12 border border-border bg-surface pl-3 pr-9 text-xs font-semibold text-foreground shadow-soft outline-none transition hover:border-secondary/40 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-36 sm:text-sm"
      >
        {Object.entries(visibilityLabels).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted"><ChevronDownIcon /></span>
    </label>
  );
}

function BaseIcon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>;
}

function ArrowLeftIcon() { return <BaseIcon className="h-6 w-6"><path d="m15 18-6-6 6-6" /></BaseIcon>; }
function ChevronIcon() { return <BaseIcon className="h-4 w-4"><path d="m9 6 6 6-6 6" /></BaseIcon>; }
function ChevronDownIcon() { return <BaseIcon className="h-4 w-4"><path d="m7 10 5 5 5-5" /></BaseIcon>; }
function EyeIcon() { return <BaseIcon><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></BaseIcon>; }
function UserIcon() { return <BaseIcon><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></BaseIcon>; }
function LocationIcon() { return <BaseIcon><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></BaseIcon>; }
function TargetIcon() { return <BaseIcon><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></BaseIcon>; }
function CalendarIcon() { return <BaseIcon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></BaseIcon>; }
function WorkIcon() { return <BaseIcon><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h3M8 11h3M8 15h3M15 7v10" /></BaseIcon>; }
function MessageIcon() { return <BaseIcon><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></BaseIcon>; }
function MailIcon() { return <BaseIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></BaseIcon>; }
function LockIcon() { return <BaseIcon><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></BaseIcon>; }
function MoreIcon() { return <BaseIcon><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></BaseIcon>; }
function ShieldIcon() { return <BaseIcon className="h-6 w-6"><path d="M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></BaseIcon>; }
