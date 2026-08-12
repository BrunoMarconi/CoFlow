"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useUserConnection } from "@/hooks/useUserConnection";
import Spinner from "@/components/ui/Spinner";
import UserAvatar from "@/components/ui/UserAvatar";
import type { PublicUserPreferences, UserPublicProfile } from "@/types/userPublic";

const HIGHLIGHTED_PREFERENCES: Array<{
  key: keyof PublicUserPreferences;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: "lifestyle", label: "Convivencia", icon: <LeafIcon /> },
  { key: "cleanliness", label: "Limpieza", icon: <SparkleIcon /> },
  { key: "smoking", label: "Tabaco", icon: <SmokeIcon /> },
  { key: "visits", label: "Visitas", icon: <DoorIcon /> },
  { key: "wake_up", label: "Rutina", icon: <ClockIcon /> },
  { key: "pets", label: "Mascotas", icon: <PetIcon /> },
];

export default function PersonaPublicaPage() {
  const params = useParams<{ id: string }>();
  const { profile, loading, notFound } = usePublicProfile(params.id);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-extrabold text-foreground">Perfil no encontrado</h1>
        <p className="mt-3 text-sm leading-6 text-secondary">Puede que el enlace no sea correcto o que el perfil ya no esté disponible.</p>
        <Link href="/usuarios" className="mt-6 flex h-11 items-center rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button">Volver a personas</Link>
      </div>
    );
  }

  return <PublicProfile profile={profile} />;
}

function PublicProfile({ profile }: { profile: UserPublicProfile }) {
  const {
    saved,
    savingToggle,
    toggleSave,
    connectionStatus,
    connectionId,
    connecting,
    connectionError,
    connect,
    removeConnection,
  } = useUserConnection(profile);

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const sortedPhotos = [...profile.photos].sort((a, b) => a.position - b.position);
  const coverPhoto = sortedPhotos[0]?.image_url ?? profile.avatar_url;
  const gallery = sortedPhotos.length > 0 ? sortedPhotos : [];
  const location = profile.community?.city ?? "Ubicación no indicada";
  const budget = profile.rental_budget !== null
    ? `Hasta ${profile.rental_budget.toLocaleString("es-ES")} € / mes`
    : "Presupuesto no indicado";
  const preferenceChips = profile.preferences
    ? HIGHLIGHTED_PREFERENCES.map((item) => ({ ...item, value: profile.preferences![item.key] }))
        .filter((item) => Boolean(item.value))
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl pb-5">
      <header className="relative flex h-11 items-center justify-between">
        <Link href="/usuarios" aria-label="Volver a personas" className="flex h-10 w-10 items-center justify-start text-brand-dark"><ArrowLeftIcon /></Link>
        <h1 className="absolute inset-x-12 text-center text-lg font-extrabold text-foreground">Perfil público</h1>
        <button type="button" aria-label="Más opciones" className="flex h-10 w-10 items-center justify-end text-brand-dark"><MoreIcon /></button>
      </header>

      <section className="mt-3 overflow-hidden rounded-24 border border-border bg-surface shadow-soft">
        <div className="relative h-36 bg-surface sm:h-52">
          {coverPhoto ? (
            <Image src={coverPhoto} alt="" fill unoptimized priority sizes="(max-width: 768px) 100vw, 896px" className="object-cover" />
          ) : (
            <div className="h-full border-b border-border bg-surface" />
          )}
        </div>

        <div className="relative px-5 pb-5 pt-14 sm:px-7 sm:pb-7 sm:pt-16">
          <div className="absolute -top-16 left-5 rounded-full border-4 border-white bg-surface shadow-soft sm:-top-20 sm:left-7">
            <UserAvatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              userId={profile.id}
              imageUrl={profile.avatar_url}
              size="xl"
              className="h-32 w-32 sm:h-36 sm:w-36"
            />
            {profile.is_online && <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" aria-label="En línea" />}
          </div>

          <div className="sm:ml-40">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-rounded text-3xl font-semibold text-brand-dark">{fullName || "Persona de CoFlow"}</h2>
              {profile.is_verified && <VerifiedIcon />}
            </div>
            <p className="mt-1 text-sm text-secondary">
              {[profile.age !== null ? `${profile.age} años` : null, location].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-2 text-sm font-bold text-primary-dark">
              {profile.is_looking_for_roommates ? "Buscando compañero de piso" : "No busca compañero actualmente"}
            </p>
          </div>
        </div>
      </section>

      {profile.bio && (
        <section className="mt-4 rounded-18 border border-border bg-surface p-4 shadow-soft">
          <p className="text-sm leading-6 text-secondary">“{profile.bio}”</p>
        </section>
      )}

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <QuickFact icon={<WorkIcon />} label={profile.occupation ?? "Ocupación"} value={profile.occupation ? "Ocupación" : "Sin indicar"} reverse />
        <QuickFact icon={<MoneyIcon />} label="Presupuesto" value={budget} />
        <QuickFact icon={<HomeIcon />} label="Comunidad" value={profile.community?.name ?? "Sin comunidad"} />
        <QuickFact icon={<StatusIcon />} label="Disponibilidad" value={profile.is_looking_for_roommates ? "Disponible" : "No disponible"} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {preferenceChips.length > 0 && (
            <section className="rounded-18 border border-border bg-surface p-4 shadow-soft">
              <h2 className="text-base font-extrabold text-foreground">Estilo de convivencia</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {preferenceChips.map((item) => (
                  <span key={item.key} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-primary-dark shadow-soft">
                    {item.icon}
                    {item.value}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-18 border border-border bg-surface p-4 shadow-soft">
            <h2 className="text-base font-extrabold text-foreground">Información básica</h2>
            <dl className="mt-3 space-y-3">
              <InfoRow label="Edad" value={profile.age !== null ? `${profile.age} años` : "No indicada"} />
              <InfoRow label="Ubicación" value={location} />
              <InfoRow label="Ocupación" value={profile.occupation ?? "No indicada"} />
              <InfoRow label="Presupuesto" value={budget} />
              <InfoRow label="Mascotas" value={profile.preferences?.pets ?? "No indicado"} />
            </dl>
          </section>
        </div>

        <div className="space-y-4">
          {gallery.length > 0 && (
            <section className="rounded-18 border border-border bg-surface p-4 shadow-soft">
              <h2 className="text-base font-extrabold text-foreground">Fotos</h2>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {gallery.slice(0, 6).map((photo, index) => (
                  <div key={photo.id} className={`relative overflow-hidden rounded-14 ${index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                    <Image src={photo.image_url} alt="" fill unoptimized sizes="(max-width: 1024px) 33vw, 240px" className="object-cover" />
                    {index === 5 && gallery.length > 6 && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xl font-extrabold text-white">+{gallery.length - 5}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-18 border border-border bg-surface p-4 shadow-soft">
            {profile.community ? (
              <Link href={`/comunidades/${profile.community.id}`} className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center text-primary"><PeopleIcon /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-foreground">Pertenece a {profile.community.name}</span><span className="mt-0.5 block text-xs text-secondary">{profile.community.city}</span></span>
                <ChevronIcon />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center text-primary"><PeopleIcon /></span>
                <span><span className="block text-sm font-extrabold text-foreground">Actualmente no pertenece a ninguna comunidad</span><span className="mt-1 block text-xs leading-5 text-secondary">Cada persona solo puede pertenecer a una comunidad.</span></span>
              </div>
            )}
          </section>
        </div>
      </div>

      {connectionError && <p className="mt-4 text-center text-sm font-semibold text-red-600">{connectionError}</p>}

      <div className="sticky bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom))] z-20 -mx-2 mt-5 grid grid-cols-2 gap-3 border-t border-border bg-background/95 p-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button type="button" onClick={toggleSave} disabled={savingToggle} className="flex h-12 items-center justify-center gap-2 rounded-14 border border-primary bg-surface px-3 text-sm font-bold text-primary-dark shadow-soft disabled:opacity-60">
          <HeartIcon filled={saved} />
          {saved ? "Guardado" : "Guardar"}
        </button>
        <PrimaryConnectionAction profile={profile} status={connectionStatus} connectionId={connectionId} connecting={connecting} onConnect={connect} />
      </div>

      {connectionStatus === "ACCEPTED" && (
        <button type="button" onClick={removeConnection} disabled={connecting} className="mx-auto mt-4 block text-xs font-semibold text-red-600 disabled:opacity-60">Eliminar conexión</button>
      )}
    </div>
  );
}

function PrimaryConnectionAction({ profile, status, connectionId, connecting, onConnect }: { profile: UserPublicProfile; status: UserPublicProfile["connection_status"]; connectionId: number | null; connecting: boolean; onConnect: () => void }) {
  const base = "flex h-12 items-center justify-center gap-2 rounded-14 bg-primary px-3 text-sm font-bold text-white shadow-button";
  if (status === "ACCEPTED" && connectionId !== null) return <Link href={`/mensajes/${connectionId}`} className={base}><MessageIcon />Enviar mensaje</Link>;
  if (status === "PENDING_RECEIVED") return <Link href="/conexiones" className={base}>Responder solicitud</Link>;
  if (status === "PENDING_SENT") return <span className="flex h-12 items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-secondary shadow-soft">Solicitud enviada</span>;
  return <button type="button" onClick={onConnect} disabled={connecting || !profile.is_looking_for_roommates} className={`${base} disabled:opacity-45`}><ConnectIcon />{connecting ? "Enviando..." : "Conectar"}</button>;
}

function QuickFact({ icon, label, value, reverse = false }: { icon: React.ReactNode; label: string; value: string; reverse?: boolean }) {
  return <div className="flex min-h-24 flex-col items-center justify-center rounded-18 border border-border bg-surface p-3 text-center shadow-soft"><span className="text-primary">{icon}</span><span className="mt-2 line-clamp-1 text-xs font-extrabold text-foreground">{reverse ? value : label}</span><span className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-secondary">{reverse ? label : value}</span></div>;
}

function InfoRow({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[110px_1fr] gap-3 text-xs"><dt className="text-secondary">{label}</dt><dd className="font-semibold text-foreground">{value}</dd></div>; }

type IconProps = { className?: string };
function BaseIcon({ children, className = "h-4 w-4" }: { children: React.ReactNode; className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>; }
function ArrowLeftIcon() { return <BaseIcon className="h-6 w-6"><path d="M19 12H5M11 18l-6-6 6-6" /></BaseIcon>; }
function MoreIcon() { return <BaseIcon className="h-6 w-6"><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></BaseIcon>; }
function VerifiedIcon() { return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white"><BaseIcon><path d="m6 12 4 4 8-9" /></BaseIcon></span>; }
function LeafIcon() { return <BaseIcon><path d="M20 4S8 3 5 12c-2 6 4 8 7 5 4-4 4-8 8-13ZM4 20c4-6 8-8 13-11" /></BaseIcon>; }
function SparkleIcon() { return <BaseIcon><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6Z" /></BaseIcon>; }
function SmokeIcon() { return <BaseIcon><path d="M4 16h13M4 20h13M19 16v4M7 12c0-3 4-2 4-5M12 12c0-3 4-2 4-5" /></BaseIcon>; }
function DoorIcon() { return <BaseIcon><path d="M5 21V4h12v17M17 21h3M13 12h.01" /></BaseIcon>; }
function ClockIcon() { return <BaseIcon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></BaseIcon>; }
function PetIcon() { return <BaseIcon><circle cx="7" cy="8" r="2" /><circle cx="17" cy="8" r="2" /><circle cx="5" cy="13" r="2" /><circle cx="19" cy="13" r="2" /><path d="M9 18c1.5-3 4.5-3 6 0 1 2-1 3-3 3s-4-1-3-3Z" /></BaseIcon>; }
function WorkIcon() { return <BaseIcon className="h-5 w-5"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3" /></BaseIcon>; }
function MoneyIcon() { return <BaseIcon className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M15 8.5a4 4 0 1 0 0 7M7 11h7M7 14h7" /></BaseIcon>; }
function HomeIcon() { return <BaseIcon className="h-5 w-5"><path d="m3 11 9-8 9 8M5 10v11h14V10" /></BaseIcon>; }
function StatusIcon() { return <BaseIcon className="h-5 w-5"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></BaseIcon>; }
function PeopleIcon() { return <BaseIcon className="h-7 w-7"><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 7a3 3 0 0 1 0 6M22 21a5 5 0 0 0-5-5" /></BaseIcon>; }
function ChevronIcon() { return <BaseIcon className="h-4 w-4 text-muted"><path d="m9 6 6 6-6 6" /></BaseIcon>; }
function HeartIcon({ filled }: { filled: boolean }) { return <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" /></svg>; }
function MessageIcon() { return <BaseIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></BaseIcon>; }
function ConnectIcon() { return <BaseIcon><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M18 8v6M15 11h6" /></BaseIcon>; }
