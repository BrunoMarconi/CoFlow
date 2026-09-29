"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useUserConnection } from "@/hooks/useUserConnection";
import Spinner from "@/components/ui/Spinner";
import PhotoDetailShell from "@/components/ui/PhotoDetailShell";
import PhotoGallery from "@/components/ui/PhotoGallery";
import UserAvatar from "@/components/ui/UserAvatar";
import OnlineDot from "@/components/ui/OnlineDot";
import UserSafetyActions from "@/components/usuario/UserSafetyActions";
import CompatibilityRadar, { CompatibilityRadarIcon } from "@/components/convivencia/CompatibilityRadar";
import CompatibilityExplanation from "@/components/usuario/CompatibilityExplanation";
import { detailTransitionName } from "@/lib/detailTransitions";
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
  const router = useRouter();
  const [safetyOpen, setSafetyOpen] = useState(false);
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
  const showIdentityAvatar = !coverPhoto || Boolean(profile.avatar_url && profile.avatar_url !== coverPhoto);
  const preferenceChips = profile.preferences
    ? HIGHLIGHTED_PREFERENCES.map((item) => ({ ...item, value: profile.preferences![item.key] }))
        .filter((item) => Boolean(item.value))
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <PhotoDetailShell
        transitionName={detailTransitionName("person", profile.id)}
        mediaClassName="h-[18rem] min-h-0 max-h-none sm:h-[22rem] lg:h-[24rem]"
        contentClassName="sm:mx-6 sm:-mt-10 sm:px-8 sm:pb-8 sm:pt-8 lg:px-10"
        media={<PhotoGallery images={(gallery.length > 0 ? gallery.map((photo, index) => ({ id: photo.id, src: photo.image_url, alt: `${fullName}, foto ${index + 1}` })) : coverPhoto ? [{ id: "avatar", src: coverPhoto, alt: fullName }] : [])} priority empty={<div className="h-full bg-[#f2f2f2]" />} />}
        actions={<><Link href="/usuarios" transitionTypes={["nav-back"]} aria-label="Volver a personas" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-strong shadow-card backdrop-blur"><ArrowLeftIcon /></Link><button type="button" onClick={() => setSafetyOpen(true)} aria-label="Más opciones" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-strong shadow-card backdrop-blur"><MoreIcon /></button></>}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {showIdentityAvatar && (
              <div className="relative shrink-0 rounded-full border-4 border-surface-raised bg-surface shadow-raised">
                <UserAvatar
                  firstName={profile.first_name}
                  lastName={profile.last_name}
                  userId={profile.id}
                  imageUrl={profile.avatar_url}
                  size="xl"
                  className="h-20 w-20 sm:h-24 sm:w-24"
                />
                {profile.is_online && <OnlineDot className="bottom-1 right-1" />}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <h1 className="text-3xl font-semibold leading-none tracking-[-0.045em] text-brand-dark sm:text-4xl">
                  {fullName || "Persona de CoFlow"}
                </h1>
                {profile.is_verified && <VerifiedIcon />}
              </div>
              <p className="mt-2 text-sm text-secondary">
                {[profile.age !== null ? `${profile.age} años` : null, location].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#e8f0eb] px-3 py-1.5 text-xs font-semibold text-brand-mid">
                  {profile.is_looking_for_roommates ? "Busca compañero de piso" : "No busca compañero actualmente"}
                </span>
                {profile.is_online && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-dark">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    En línea
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden w-full max-w-sm grid-cols-[.85fr_1.15fr] gap-2 sm:grid">
            <SaveButton saved={saved} saving={savingToggle} onToggle={toggleSave} />
            <PrimaryConnectionAction profile={profile} status={connectionStatus} connectionId={connectionId} connecting={connecting} onConnect={connect} />
          </div>
        </div>
      </PhotoDetailShell>

      {profile.match_score !== null && profile.match_breakdown && (
        <div className="mt-5">
          <CompatibilityExplanation score={profile.match_score} breakdown={profile.match_breakdown} />
        </div>
      )}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
        <main className="min-w-0 space-y-5">
          {profile.bio && (
            <section className="rounded-card border border-black/[0.07] bg-surface-raised p-5 sm:p-6">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-primary">Sobre {profile.first_name || "esta persona"}</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#58665f]">“{profile.bio}”</p>
            </section>
          )}

          {preferenceChips.length > 0 && (
            <section className="rounded-card border border-black/[0.07] bg-surface-raised p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-brand-dark">Estilo de convivencia</h2>
              <p className="mt-1 text-xs leading-5 text-secondary">Lo que valora en el día a día al compartir casa.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {preferenceChips.map((item) => (
                  <span key={item.key} className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf0ec] px-3 py-2 text-xs font-semibold text-brand-mid">
                    {item.icon}
                    {item.value}
                  </span>
                ))}
              </div>
            </section>
          )}

          {profile.interests.length > 0 && (
            <section className="rounded-card border border-black/[0.07] bg-surface-raised p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-brand-dark">Gustos e intereses</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map((interest) => <span key={interest} className="rounded-full bg-[#edf1ee] px-3 py-2 text-xs font-semibold text-[#31453a]">{interest}</span>)}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-card border border-black/[0.07] bg-surface-raised p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-brand-dark">Datos prácticos</h2>
            <dl className="mt-4 divide-y divide-black/[0.06]">
              <PracticalRow icon={<WorkIcon />} label="Ocupación" value={profile.occupation ?? "No indicada"} />
              <PracticalRow icon={<MoneyIcon />} label="Presupuesto" value={budget} />
              <PracticalRow icon={<StatusIcon />} label="Disponibilidad" value={profile.is_looking_for_roommates ? "Disponible" : "No disponible"} />
              <PracticalRow icon={<PetIcon />} label="Mascotas" value={profile.preferences?.pets ?? "No indicado"} />
            </dl>
          </section>

          <section className="rounded-card border border-black/[0.07] bg-[#f4f7f5] p-5">
            {profile.community ? (
              <Link href={`/comunidades/${profile.community.id}`} className="flex min-h-11 items-center gap-3 rounded-14 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-soft"><PeopleIcon /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-foreground">Pertenece a {profile.community.name}</span><span className="mt-0.5 block text-xs text-secondary">{profile.community.city}</span></span>
                <ChevronIcon />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-soft"><PeopleIcon /></span>
                <span><span className="block text-sm font-extrabold text-foreground">Sin comunidad actualmente</span><span className="mt-1 block text-xs leading-5 text-secondary">Está disponible para encontrar personas afines.</span></span>
              </div>
            )}
          </section>
        </aside>
      </div>

      {profile.compatibility && profile.compatibility.categories.length > 0 && (
        <CompatibilityRadar
          className="mt-5 !max-w-none"
          categories={profile.compatibility.categories}
          icon={<CompatibilityRadarIcon />}
          title={`Cómo convive ${profile.first_name || "esta persona"}`}
          subtitle="Estos valores describen su estilo personal, no la comparación"
        />
      )}

      {connectionError && <p className="mt-4 text-center text-sm font-semibold text-red-600">{connectionError}</p>}

      <div className="sticky bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom))] z-20 -mx-2 mt-7 grid grid-cols-[.8fr_1.2fr] gap-2 border-t border-black/[0.06] bg-[#f7f8f6]/95 p-3 backdrop-blur-xl sm:hidden">
        <SaveButton saved={saved} saving={savingToggle} onToggle={toggleSave} />
        <PrimaryConnectionAction profile={profile} status={connectionStatus} connectionId={connectionId} connecting={connecting} onConnect={connect} />
      </div>

      {connectionStatus === "ACCEPTED" && (
        <button type="button" onClick={removeConnection} disabled={connecting} className="mx-auto mt-4 block text-xs font-semibold text-red-600 disabled:opacity-60">Eliminar conexión</button>
      )}

      <UserSafetyActions
        open={safetyOpen}
        userId={profile.id}
        firstName={profile.first_name || "esta persona"}
        onClose={() => setSafetyOpen(false)}
        onBlocked={() => router.replace("/usuarios")}
      />
    </div>
  );
}

function PrimaryConnectionAction({ profile, status, connectionId, connecting, onConnect }: { profile: UserPublicProfile; status: UserPublicProfile["connection_status"]; connectionId: number | null; connecting: boolean; onConnect: () => void }) {
  const base = "flex h-12 items-center justify-center gap-2 rounded-14 bg-primary px-3 text-sm font-bold text-white shadow-button transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  if (status === "ACCEPTED" && connectionId !== null) return <Link href={`/mensajes/${connectionId}`} className={base}><MessageIcon />Enviar mensaje</Link>;
  if (status === "PENDING_RECEIVED") return <Link href="/conexiones?tab=recibidas" className={base}>Responder solicitud</Link>;
  if (status === "PENDING_SENT") return <span className="flex h-12 items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-secondary shadow-soft">Solicitud enviada</span>;
  return <button type="button" onClick={onConnect} disabled={connecting || !profile.is_looking_for_roommates} className={`${base} disabled:cursor-not-allowed disabled:opacity-45`}><ConnectIcon />{connecting ? "Enviando..." : "Conectar"}</button>;
}

function SaveButton({ saved, saving, onToggle }: { saved: boolean; saving: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={saving}
      aria-pressed={saved}
      className="flex h-12 items-center justify-center gap-2 rounded-14 border border-primary bg-surface px-3 text-sm font-bold text-primary-dark shadow-soft transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
    >
      <HeartIcon filled={saved} />
      {saved ? "Guardado" : "Guardar"}
    </button>
  );
}

function PracticalRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf3ef] text-brand-mid">{icon}</span>
      <div className="min-w-0">
        <dt className="text-2xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold leading-5 text-brand-dark">{value}</dd>
      </div>
    </div>
  );
}

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
function StatusIcon() { return <BaseIcon className="h-5 w-5"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></BaseIcon>; }
function PeopleIcon() { return <BaseIcon className="h-7 w-7"><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 7a3 3 0 0 1 0 6M22 21a5 5 0 0 0-5-5" /></BaseIcon>; }
function ChevronIcon() { return <BaseIcon className="h-4 w-4 text-muted"><path d="m9 6 6 6-6 6" /></BaseIcon>; }
function HeartIcon({ filled }: { filled: boolean }) { return <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" /></svg>; }
function MessageIcon() { return <BaseIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></BaseIcon>; }
function ConnectIcon() { return <BaseIcon><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M18 8v6M15 11h6" /></BaseIcon>; }
