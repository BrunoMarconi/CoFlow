"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import CommunityApplicationAction from "./CommunityApplicationAction";
import CommunityCover from "@/components/ui/CommunityCover";
import PhotoDetailShell from "@/components/ui/PhotoDetailShell";
import UserAvatar from "@/components/ui/UserAvatar";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import { detailTransitionName } from "@/lib/detailTransitions";
import { cn } from "@/lib/utils";
import type { Community } from "@/types/community";

type CommunityHeaderProps = {
  community: Community;
  isOwner: boolean;
  joining: boolean;
  joinError: string;
  joinSuccess: boolean;
  onJoin: () => void;
};

export default function CommunityHeader({
  community,
  isOwner,
  joining,
  joinError,
  joinSuccess,
  onJoin,
}: CommunityHeaderProps) {
  const location = [community.neighborhood, community.city]
    .filter(Boolean)
    .join(", ");
  const availablePlaces = Math.max(
    community.max_members - community.member_count,
    0
  );
  const highlights = getHighlights(community);

  return (
    <div className="space-y-5 sm:space-y-7">
      <PhotoDetailShell
        transitionName={detailTransitionName("community", community.id)}
        media={
          <CommunityCover
            name={community.name}
            coverColor={community.cover_color}
            coverImageUrl={community.cover_image_url}
            members={community.members.slice(0, 4).map((member) => ({
              id: member.user_id,
              firstName: member.user.first_name,
              lastName: member.user.last_name,
              imageUrl: member.user.avatar_url,
            }))}
            memberCount={community.member_count}
            isOwn={isOwner}
            className="h-full"
          />
        }
        actions={
          <>
            <Link href="/comunidades" transitionTypes={["nav-back"]} aria-label="Volver a comunidades" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#191919] shadow-[0_3px_14px_rgba(0,0,0,0.14)] backdrop-blur"><BackIcon /></Link>
            {isOwner ? <Link href={`/comunidades/${community.id}/editar`} transitionTypes={["nav-forward"]} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_3px_14px_rgba(0,0,0,0.18)] transition hover:bg-primary-hover">Editar</Link> : <span />}
          </>
        }
      >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-primary-dark"><span className={cn("h-2 w-2 rounded-full", community.is_active ? "bg-primary" : "bg-muted")} />{community.is_active ? "Comunidad activa" : "Comunidad inactiva"}</span>
          </div>
          <h1 className="font-rounded text-3xl font-semibold tracking-[-0.035em] text-brand-dark sm:text-4xl">
            {community.name}
          </h1>

          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-secondary sm:text-base sm:leading-7">
            {community.description}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Fact icon={<PeopleIcon />} value={`${community.member_count}/${community.max_members}`} label="Miembros" />
            <Fact
              icon={<BudgetIcon />}
              value={
                community.monthly_rent !== null
                  ? `${community.monthly_rent.toLocaleString("es-ES")} €`
                  : "A convenir"
              }
              label="Por persona"
            />
            <Fact icon={<LocationIcon />} value={community.city} label="Ubicación" />
            <Fact icon={<HomeIcon />} value={getProfileTypeLabel(community.profile_type)} label="Tipo" />
          </div>
      </PhotoDetailShell>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] xl:items-start"
      >
        <div className="space-y-5">
          <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-7">
            <h2 className="text-xl font-extrabold text-brand-dark">Sobre nosotros</h2>
            {community.profile_description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-secondary">
                {community.profile_description}
              </p>
            )}
            <ul className="mt-5 space-y-3">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3 text-sm leading-6 text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary">
                    <CheckIcon />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-brand-dark">
                  Miembros ({community.member_count})
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  Personas que forman esta comunidad.
                </p>
              </div>
              {community.members.length > 0 && (
                <Link href={`/personas/${community.members[0].user_id}`} className="text-sm font-bold text-primary-dark hover:underline">
                  Ver perfiles
                </Link>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {community.members.slice(0, 6).map((member) => (
                <Link
                  key={member.id}
                  href={`/personas/${member.user_id}`}
                  className="group flex w-[4.5rem] flex-col items-center gap-2 text-center"
                >
                  <UserAvatar
                    firstName={member.user.first_name}
                    lastName={member.user.last_name}
                    userId={member.user_id}
                    imageUrl={member.user.avatar_url}
                    size="lg"
                    className={cn(
                      "border-2 border-white shadow-soft transition group-hover:ring-2 group-hover:ring-primary/40",
                      member.role === "OWNER" && "ring-2 ring-primary ring-offset-2 ring-offset-surface"
                    )}
                  />
                  <span className="w-full truncate text-xs font-bold text-foreground">
                    {member.user.first_name}
                  </span>
                </Link>
              ))}
              {community.member_count > 6 && (
                <span className="flex h-16 w-16 items-center justify-center self-start rounded-full border border-dashed border-primary/40 text-sm font-bold text-primary-dark">
                  +{community.member_count - 6}
                </span>
              )}
            </div>
          </section>
        </div>

        <aside className="rounded-24 border border-primary/25 bg-surface p-5 shadow-soft sm:p-7 xl:sticky xl:top-24">
          <span className="flex h-12 w-12 items-center justify-center text-primary">
            <JoinIcon />
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-brand-dark">
            {community.is_member
              ? "Ya formas parte"
              : isOwner
                ? "Esta es tu comunidad"
                : availablePlaces > 0
                  ? "¿Te interesa unirte?"
                  : "Comunidad completa"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            {community.is_member
              ? "Entra al chat y mantente al día de todo lo que ocurre en la comunidad."
              : isOwner
                ? "Gestiona sus miembros, solicitudes e información desde tu espacio privado."
                : availablePlaces > 0
                  ? "Envía una solicitud para que los miembros puedan conocerte y valorar vuestro encaje."
                  : "Ahora mismo no quedan plazas disponibles, pero puedes guardar esta comunidad para revisarla más adelante."}
          </p>

          <div className="mt-5">
            <MembershipAction
              community={community}
              isOwner={isOwner}
              joining={joining}
              onJoin={onJoin}
            />
          </div>

          {location && (
            <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-secondary">
              <LocationIcon />
              {location}
            </p>
          )}

          {joinError && (
            <p role="alert" className="mt-4 rounded-14 border border-red-100 px-3 py-2 text-sm font-semibold text-red-700">
              {joinError}
            </p>
          )}
          {joinSuccess && (
            <p role="status" className="mt-4 rounded-14 border border-primary/30 px-3 py-2 text-sm font-semibold text-primary-dark">
              Te has unido correctamente a la comunidad.
            </p>
          )}
        </aside>
      </motion.div>
    </div>
  );
}

function MembershipAction({
  community,
  isOwner,
  joining,
  onJoin,
}: {
  community: Community;
  isOwner: boolean;
  joining: boolean;
  onJoin: () => void;
}) {
  if (community.is_member) {
    return (
      <Link
        href="/mensajes/comunidad"
        className="flex h-13 w-full items-center justify-center gap-2 rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button transition hover:bg-primary-hover"
      >
        <MessageIcon />
        Ir al chat de comunidad
      </Link>
    );
  }

  if (isOwner) {
    return (
      <Link
        href={`/comunidades/${community.id}/editar`}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button transition hover:bg-primary-hover"
      >
        <EditIcon />
        Gestionar comunidad
      </Link>
    );
  }

  if (community.is_full || community.open_spots <= 0) {
    return (
      <button type="button" disabled className="flex h-13 w-full cursor-not-allowed items-center justify-center rounded-14 bg-surface-soft px-5 text-sm font-bold text-muted">
        Sin plazas disponibles
      </button>
    );
  }

  if (community.join_type === "OPEN") {
    return (
      <button
        type="button"
        onClick={onJoin}
        disabled={joining}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <JoinIcon />
        {joining ? "Uniéndote..." : "Unirme a la comunidad"}
      </button>
    );
  }

  return <CommunityApplicationAction community={community} actionLabel="Solicitar unirme" />;
}

function Fact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-14 border border-border px-3 py-3 text-center">
      <span className="mx-auto flex h-6 w-6 items-center justify-center text-primary">{icon}</span>
      <p className="mt-1 truncate text-sm font-extrabold text-brand-dark">{value}</p>
      <p className="mt-0.5 truncate text-[11px] font-semibold text-secondary">{label}</p>
    </div>
  );
}

function getHighlights(community: Community) {
  const preferences = community.preferences;
  const highlights = [
    preferences?.atmosphere
      ? `Ambiente ${preferences.atmosphere.toLowerCase()} y respetuoso.`
      : "Buscamos un ambiente respetuoso y acogedor.",
    preferences?.cleanliness
      ? `Cuidamos la convivencia: ${preferences.cleanliness.toLowerCase()}.`
      : "Valoramos la limpieza y el orden en casa.",
    preferences?.visits
      ? `Sobre las visitas: ${preferences.visits.toLowerCase()}.`
      : "Hablamos las cosas con claridad y respeto.",
    "Buscamos buena convivencia y comunicación.",
  ];

  return [...new Set(highlights)];
}

function BaseIcon({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>;
}

function CheckIcon() { return <BaseIcon className="h-3.5 w-3.5"><path d="m6 12 4 4 8-9" /></BaseIcon>; }
function PeopleIcon() { return <BaseIcon><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 7a3 3 0 0 1 0 6M22 21a5 5 0 0 0-5-5" /></BaseIcon>; }
function BudgetIcon() { return <BaseIcon><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.5-.7-1.5-1.2-3-1.2-2 0-3 1-3 2.3 0 3.4 6 1.4 6 4.7 0 1.4-1.2 2.4-3.2 2.4-1.5 0-2.7-.5-3.5-1.5M12 5.5v13" /></BaseIcon>; }
function LocationIcon() { return <BaseIcon><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></BaseIcon>; }
function HomeIcon() { return <BaseIcon><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /></BaseIcon>; }
function JoinIcon() { return <BaseIcon className="h-7 w-7"><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" /></BaseIcon>; }
function MessageIcon() { return <BaseIcon><path d="M21 15a2 2 0 0 1-2 2H8l-5 3V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" /></BaseIcon>; }
function EditIcon() { return <BaseIcon><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></BaseIcon>; }
function BackIcon() { return <BaseIcon className="h-6 w-6"><path d="M19 12H5M11 18l-6-6 6-6" /></BaseIcon>; }
