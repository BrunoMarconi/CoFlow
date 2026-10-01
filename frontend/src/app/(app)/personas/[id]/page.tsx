"use client";

import { useState, ViewTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useUserConnection } from "@/hooks/useUserConnection";
import Spinner from "@/components/ui/Spinner";
import PhotoGallery from "@/components/ui/PhotoGallery";
import UserAvatar from "@/components/ui/UserAvatar";
import UserSafetyActions from "@/components/usuario/UserSafetyActions";
import ConvivenciaComparison from "@/components/usuario/ConvivenciaComparison";
import CompatibilityExplanation from "@/components/usuario/CompatibilityExplanation";
import { getMyCompatibilityScore } from "@/services/users";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
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
  const { user } = useAuth();
  const [safetyOpen, setSafetyOpen] = useState(false);
  const { data: myCompatibility } = useQuery({
    queryKey: ["compatibility-score", "me"],
    queryFn: getMyCompatibilityScore,
    enabled: Boolean(user?.onboarding_completed) && Boolean(profile.compatibility),
    staleTime: 60_000,
  });
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
  const heroImages = gallery.length > 0
    ? gallery.map((photo, index) => ({ id: photo.id, src: photo.image_url, alt: `${fullName}, foto ${index + 1}` }))
    : coverPhoto
      ? [{ id: "avatar", src: coverPhoto, alt: fullName }]
      : [];
  const location = profile.community?.city ?? "Ubicación no indicada";
  const budget = profile.rental_budget !== null
    ? `Hasta ${profile.rental_budget.toLocaleString("es-ES")} €/mes`
    : "Presupuesto no indicado";
  // La pista solo tiene sentido si hay dos presupuestos que comparar.
  const budgetHint = budgetComparison(profile.rental_budget, user?.rental_budget ?? null);
  // Busca gente pero todavía no tiene grupo: es el estado accionable.
  const isSeekingCommunity = profile.is_looking_for_roommates && !profile.community;
  const preferenceChips = profile.preferences
    ? HIGHLIGHTED_PREFERENCES.map((item) => ({ ...item, value: profile.preferences![item.key] }))
        .filter((item) => Boolean(item.value))
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl pb-[calc(6rem+var(--safe-bottom))] sm:pb-8">
      <div className="relative -mx-6 sm:mx-0">
        <ViewTransition name={detailTransitionName("person", profile.id)} share="coflow-detail-morph">
          <section className="relative h-[27rem] overflow-hidden bg-[#dfe6df] sm:h-[31rem] sm:rounded-[2rem] lg:h-[34rem]" aria-labelledby="profile-name">
            <PhotoGallery
              images={heroImages}
              priority
              empty={
                <div className="flex h-full items-center justify-center bg-[#dfe7e1]">
                  <UserAvatar firstName={profile.first_name} lastName={profile.last_name} userId={profile.id} size="xl" className="h-28 w-28 shadow-raised sm:h-36 sm:w-36" />
                </div>
              }
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#10291f]/95 via-[#10291f]/24 to-black/5" aria-hidden="true" />

            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-5 sm:px-7 sm:pt-7">
              <Link href="/usuarios" transitionTypes={["nav-back"]} aria-label="Volver a personas" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-strong shadow-raised backdrop-blur-md transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><ArrowLeftIcon /></Link>
              <div className="flex items-center gap-2">
                {/* En móvil, guardar vive aquí: la barra inferior queda
                    solo para la acción principal. En escritorio sigue
                    estando junto a "Conectar". */}
                <button
                  type="button"
                  onClick={toggleSave}
                  disabled={savingToggle}
                  aria-pressed={saved}
                  aria-label={saved ? "Quitar de guardados" : "Guardar perfil"}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-strong shadow-raised backdrop-blur-md transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60 sm:hidden"
                >
                  <HeartIcon filled={saved} className={cn("h-5 w-5", saved && "text-red-500")} />
                </button>
                <button type="button" onClick={() => setSafetyOpen(true)} aria-label="Más opciones" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-strong shadow-raised backdrop-blur-md transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><MoreIcon /></button>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-20 text-white sm:px-9 sm:pb-24 lg:px-11">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                  {isSeekingCommunity && <span className="h-2 w-2 rounded-full bg-[#8dd3ad]" aria-hidden="true" />}
                  {isSeekingCommunity
                    ? "Buscando comunidad"
                    : profile.is_looking_for_roommates
                      ? "Busca compañero de piso"
                      : "No busca compañero actualmente"}
                </span>
                {profile.is_online && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-[#8dd3ad]" aria-hidden="true" />
                    En línea
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-start gap-2.5">
                <h1 id="profile-name" className="max-w-4xl text-4xl font-semibold leading-[.96] tracking-[-0.05em] drop-shadow-sm sm:text-5xl lg:text-6xl">
                  {fullName || "Persona de CoFlow"}
                </h1>
                {profile.is_verified && <VerifiedIcon inverse />}
              </div>
              <p className="mt-3 text-sm font-medium text-white/80 sm:text-base">
                {[profile.age !== null ? `${profile.age} años` : null, location].filter(Boolean).join(" · ")}
              </p>
            </div>
          </section>
        </ViewTransition>

        <div className="relative z-30 mx-4 -mt-14 sm:mx-8 sm:-mt-16 lg:mx-11">
          {profile.match_score !== null && profile.match_breakdown ? (
            <CompatibilityExplanation
              score={profile.match_score}
              breakdown={profile.match_breakdown}
              firstName={profile.first_name}
              theirs={profile.compatibility?.categories}
              mine={myCompatibility?.categories}
              // Con la conexión aceptada la idea de conversación deja de
              // ser un consejo y pasa a ser un enlace al chat.
              conversationHref={connectionStatus === "ACCEPTED" && connectionId !== null ? `/mensajes/${connectionId}` : null}
              actions={
                <div className="hidden min-w-[20rem] grid-cols-[.85fr_1.15fr] gap-2 sm:grid">
                  <SaveButton saved={saved} saving={savingToggle} onToggle={toggleSave} inverse />
                  <PrimaryConnectionAction profile={profile} status={connectionStatus} connectionId={connectionId} connecting={connecting} onConnect={connect} inverse />
                </div>
              }
            />
          ) : (
            <section className="grid gap-5 rounded-[1.75rem] bg-brand-dark p-5 text-white shadow-modal sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-7">
              <div>
                <p className="text-xs font-semibold text-white/70">Compatibilidad contigo</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em]">Conocerse empieza por una conversación</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">La comparación aparecerá cuando ambos perfiles tengan completo su test de convivencia.</p>
              </div>
              <div className="hidden min-w-[20rem] grid-cols-[.85fr_1.15fr] gap-2 sm:grid">
                <SaveButton saved={saved} saving={savingToggle} onToggle={toggleSave} inverse />
                <PrimaryConnectionAction profile={profile} status={connectionStatus} connectionId={connectionId} connecting={connecting} onConnect={connect} inverse />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Una sola rejilla, sin <main> propio: AppShell ya aporta el suyo.
          El orden del DOM es el de móvil (bio, datos, hábitos,
          comparación, intereses); en lg el aside se coloca a mano en la
          columna derecha y el resto se autocoloca en la izquierda. */}
      <div className="mt-12 grid items-start gap-10 sm:mt-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        {profile.bio && (
          <section className="relative max-w-3xl pl-6 lg:col-start-1 sm:pl-8">
            <span className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary" aria-hidden="true" />
            <p className="text-xs font-semibold text-primary">Sobre {profile.first_name || "esta persona"}</p>
            <p className="mt-3 text-lg font-medium leading-8 tracking-[-0.018em] text-brand-dark sm:text-xl sm:leading-9">“{profile.bio}”</p>
          </section>
        )}

        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:row-span-4">
          <section aria-labelledby="practical-title">
            <p className="text-xs font-semibold text-primary">En resumen</p>
            <h2 id="practical-title" className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-brand-dark">Datos prácticos</h2>

            <dl className="mt-4 grid grid-cols-2 gap-3">
              <PracticalCard icon={<WorkIcon />} label="Ocupación" value={profile.occupation ?? "No indicada"} />
              <PracticalCard icon={<MoneyIcon />} label="Presupuesto" value={budget} hint={budgetHint} />
              <PracticalCard
                icon={<StatusIcon />}
                label="Disponibilidad"
                value={profile.is_looking_for_roommates ? "Busca piso ahora" : "No busca ahora"}
              />
              <PracticalCard icon={<PetIcon />} label="Mascotas" value={profile.preferences?.pets ?? "No indicado"} />
            </dl>

            {/* Sin comunidad no se pinta nada: una tarjeta que solo dice
                "no tiene" ocupa sitio sin aportar. */}
            {profile.community && (
              <Link
                href={`/comunidades/${profile.community.id}`}
                className="mt-3 flex min-h-11 items-center gap-3 rounded-[1.25rem] bg-[#eef3ef] p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-soft"><PeopleIcon /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-foreground">Pertenece a {profile.community.name}</span><span className="mt-0.5 block text-xs text-secondary">{profile.community.city}</span></span>
                <ChevronIcon />
              </Link>
            )}
          </section>
        </aside>

        {preferenceChips.length > 0 && (
          <section className="relative overflow-hidden rounded-[2rem] bg-[#e8f0eb] p-6 lg:col-start-1 sm:p-8">
            <span className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full border-[34px] border-white/35" aria-hidden="true" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold text-primary">Convivencia cotidiana</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-brand-dark">Así le gusta compartir casa</h2>
              <p className="mt-2 text-sm leading-6 text-secondary">Hábitos y preferencias que ayudan a imaginar el día a día juntos.</p>
            </div>
            <div className="relative mt-5 flex flex-wrap gap-2.5">
              {preferenceChips.map((item) => (
                <span key={item.key} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-brand-mid shadow-soft backdrop-blur-sm">
                  {item.icon}
                  {item.value}
                </span>
              ))}
            </div>
          </section>
        )}

        {profile.compatibility && profile.compatibility.categories.length > 0 && (
          <ConvivenciaComparison
            categories={profile.compatibility.categories}
            mine={myCompatibility?.categories}
            breakdown={profile.match_breakdown?.categories}
            firstName={profile.first_name}
            className="lg:col-start-1"
          />
        )}

        {profile.interests.length > 0 && (
          <section className="lg:col-start-1">
            <p className="text-xs font-semibold text-primary">Fuera de casa</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-brand-dark">Gustos e intereses</h2>
            <div className="mt-4 flex flex-wrap gap-x-2 gap-y-2.5">
              {profile.interests.map((interest) => <span key={interest} className="rounded-full border border-primary/15 bg-surface px-3.5 py-2 text-xs font-semibold text-[#31453a] shadow-soft">{interest}</span>)}
            </div>
          </section>
        )}
      </div>

      {connectionError && <p className="mt-4 text-center text-sm font-semibold text-red-600">{connectionError}</p>}

      {/* En esta ruta BottomNavigation se oculta (ver hidesBottomNavigation),
          así que esta barra es la única fija abajo y puede quedarse pegada
          al borde respetando el safe area. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-[#f7f8f6]/95 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur-xl sm:hidden">
        <PrimaryConnectionAction
          profile={profile}
          status={connectionStatus}
          connectionId={connectionId}
          connecting={connecting}
          onConnect={connect}
          className="h-14 w-full"
        />
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

function PrimaryConnectionAction({ profile, status, connectionId, connecting, onConnect, inverse = false, className }: { profile: UserPublicProfile; status: UserPublicProfile["connection_status"]; connectionId: number | null; connecting: boolean; onConnect: () => void; inverse?: boolean; className?: string }) {
  // cn (tailwind-merge) resuelve los conflictos, así que la barra móvil
  // puede pedir h-14 y gana sobre el h-12 de base.
  const base = cn(
    inverse
      ? "flex h-12 items-center justify-center gap-2 rounded-14 bg-white px-3 text-sm font-bold text-brand-dark shadow-raised transition hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      : "flex h-12 items-center justify-center gap-2 rounded-14 bg-primary px-3 text-sm font-bold text-white shadow-button transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    className
  );
  if (status === "ACCEPTED" && connectionId !== null) return <Link href={`/mensajes/${connectionId}`} className={base}><MessageIcon />Enviar mensaje</Link>;
  if (status === "PENDING_RECEIVED") return <Link href="/conexiones?tab=recibidas" className={base}>Responder solicitud</Link>;
  if (status === "PENDING_SENT") return <span className={cn("flex h-12 items-center justify-center rounded-14 border text-sm font-bold", inverse ? "border-white/20 bg-white/10 text-white/70" : "border-border bg-surface text-secondary shadow-soft", className)}>Solicitud enviada</span>;
  return <button type="button" onClick={onConnect} disabled={connecting || !profile.is_looking_for_roommates} className={cn(base, "disabled:cursor-not-allowed disabled:opacity-45")}><ConnectIcon />{connecting ? "Enviando..." : "Conectar"}</button>;
}

/** Sitúa su presupuesto respecto al tuyo. Null si falta alguno de los dos. */
function budgetComparison(theirs: number | null, mine: number | null): string | null {
  if (theirs === null || mine === null || mine <= 0) return null;

  // Entre el 80% y el 125% del tuyo compiten por los mismos pisos, así
  // que llamarlo "parecido" es honesto. La banda es asimétrica a
  // propósito: 0.8 y 1.25 son el mismo salto, uno en cada dirección.
  const ratio = theirs / mine;
  if (ratio >= 0.8 && ratio <= 1.25) return "Parecido al tuyo";
  return ratio < 0.8 ? "Por debajo del tuyo" : "Por encima del tuyo";
}

function SaveButton({ saved, saving, onToggle, inverse = false }: { saved: boolean; saving: boolean; onToggle: () => void; inverse?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={saving}
      aria-pressed={saved}
      className={`flex h-12 items-center justify-center gap-2 rounded-14 border px-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60 ${inverse ? "border-white/20 bg-white/10 text-white hover:bg-white/15 focus-visible:outline-white" : "border-primary bg-surface text-primary-dark shadow-soft hover:bg-[#edf3ef] focus-visible:outline-primary"}`}
    >
      <HeartIcon filled={saved} />
      {saved ? "Guardado" : "Guardar"}
    </button>
  );
}

function PracticalCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string | null }) {
  return (
    <div className="rounded-[1.25rem] border border-black/[0.05] bg-surface-raised p-4 shadow-soft">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf3ef] text-brand-mid">{icon}</span>
      {/* Sin MAYÚSCULAS: son cuatro datos, no cuatro secciones. */}
      <dt className="mt-3 text-xs text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold leading-5 text-brand-dark">{value}</dd>
      {hint && <p className="mt-1 text-2xs font-semibold text-primary">{hint}</p>}
    </div>
  );
}

function BaseIcon({ children, className = "h-4 w-4" }: { children: React.ReactNode; className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>; }
function ArrowLeftIcon() { return <BaseIcon className="h-6 w-6"><path d="M19 12H5M11 18l-6-6 6-6" /></BaseIcon>; }
function MoreIcon() { return <BaseIcon className="h-6 w-6"><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></BaseIcon>; }
function VerifiedIcon({ inverse = false }: { inverse?: boolean }) { return <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${inverse ? "bg-white text-brand-dark shadow-soft" : "bg-primary text-white"}`} role="img" aria-label="Correo confirmado"><BaseIcon><path d="m6 12 4 4 8-9" /></BaseIcon></span>; }
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
function HeartIcon({ filled, className = "h-4 w-4" }: { filled: boolean; className?: string }) { return <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" /></svg>; }
function MessageIcon() { return <BaseIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></BaseIcon>; }
function ConnectIcon() { return <BaseIcon><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M18 8v6M15 11h6" /></BaseIcon>; }
