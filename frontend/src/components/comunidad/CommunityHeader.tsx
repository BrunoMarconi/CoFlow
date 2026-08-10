"use client";

import { useState } from "react";
import Link from "next/link";
import CommunityApplicationAction from "./CommunityApplicationAction";
import CommunityCover from "@/components/ui/CommunityCover";
import UserAvatar from "@/components/ui/UserAvatar";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import { cn } from "@/lib/utils";
import type {
  Community,
  CommunityMember,
  CommunityPreferences,
} from "@/types/community";

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
  const [tab, setTab] = useState<"resumen" | "vivienda">("resumen");
  const [showAllMembers, setShowAllMembers] = useState(false);

  const location = [community.neighborhood, community.city]
    .filter(Boolean)
    .join(", ");

  const isLookingForMembers =
    community.open_spots > 0 && !community.is_full;

  const statusLabel = community.is_full
    ? "Comunidad completa"
    : isLookingForMembers
      ? "Buscando miembros"
      : "No busca miembros ahora";

  const sortedMembers = [...community.members].sort((a, b) => {
    if (a.role === "OWNER" && b.role !== "OWNER") return -1;
    if (a.role !== "OWNER" && b.role === "OWNER") return 1;
    return (
      new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
    );
  });

  const visibleMembers = showAllMembers
    ? sortedMembers
    : sortedMembers.slice(0, 4);

  const verifiedCount = community.members.filter(
    (member) => member.user.is_email_verified
  ).length;

  const verifiedPercentage =
    community.members.length > 0
      ? Math.round((verifiedCount / community.members.length) * 100)
      : null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-24 border border-border bg-surface shadow-soft">
        <CommunityCover
          name={community.name}
          coverColor={community.cover_color}
          coverImageUrl={community.cover_image_url}
          members={community.members.slice(0, 4).map((member) => ({
            id: member.id.toString(),
            firstName: member.user.first_name,
            lastName: member.user.last_name,
            imageUrl: member.user.avatar_url,
          }))}
          memberCount={community.member_count}
          isOwn={isOwner}
          className="h-44 sm:h-56"
        />

        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-rounded text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
              {community.name}
            </h1>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-bold text-secondary">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isLookingForMembers ? "bg-primary" : "bg-muted"
                )}
              />
              {statusLabel}
            </span>
          </div>

          <p className="mt-1.5 text-sm font-semibold text-secondary">
            {community.member_count}{" "}
            {community.member_count === 1 ? "miembro" : "miembros"}
            {location ? ` · ${location}` : ""}
          </p>

          <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-secondary">
            {community.description}
          </p>

          {verifiedPercentage !== null && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint-50 px-4 py-2 text-xs font-bold text-primary-dark">
              <ShieldIcon />
              {verifiedPercentage}% de perfiles verificados
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {community.is_member ? (
              <Link
                href="/mensajes/comunidad"
                className="flex h-14 items-center justify-center gap-2 rounded-18 bg-brand px-5 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark"
              >
                <MessageIcon />
                Chat de comunidad
              </Link>
            ) : community.is_full ? (
              <button
                type="button"
                disabled
                className="flex h-14 cursor-not-allowed items-center justify-center gap-2 rounded-18 bg-primary px-5 text-sm font-bold text-white opacity-55"
              >
                <UsersIcon />
                Capacidad máxima alcanzada
              </button>
            ) : community.open_spots <= 0 ? (
              <button
                type="button"
                disabled
                className="flex h-14 cursor-not-allowed items-center justify-center gap-2 rounded-18 bg-surface-soft px-5 text-sm font-bold text-muted"
              >
                <UsersIcon />
                No buscan nuevos miembros ahora
              </button>
            ) : community.join_type === "OPEN" ? (
              <button
                type="button"
                onClick={onJoin}
                disabled={joining}
                className="flex h-14 items-center justify-center gap-2 rounded-18 bg-primary px-5 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {joining ? (
                  <>
                    <LoadingIcon />
                    Uniéndote...
                  </>
                ) : (
                  <>
                    <UsersIcon />
                    Unirme directamente
                  </>
                )}
              </button>
            ) : (
              <CommunityApplicationAction community={community} />
            )}

            {isOwner ? (
              <Link
                href={`/comunidades/${community.id}/editar`}
                className="flex h-14 items-center justify-center gap-2 rounded-18 border border-border bg-surface px-5 text-sm font-bold text-brand-dark transition hover:border-primary/30 hover:bg-mint-50/40"
              >
                <EditIcon />
                Editar comunidad
              </Link>
            ) : (
              <Link
                href={`/personas/${community.owner_id}`}
                className="flex h-14 items-center justify-center gap-2 rounded-18 border border-border bg-surface px-5 text-sm font-bold text-brand-dark transition hover:border-primary/30 hover:bg-mint-50/40"
              >
                <ProfileIcon />
                Ver perfil del administrador
              </Link>
            )}
          </div>

          {joinError && (
            <div
              role="alert"
              className="mt-4 rounded-18 border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700"
            >
              {joinError}
            </div>
          )}

          {joinSuccess && (
            <div
              role="alert"
              className="mt-4 rounded-18 border border-primary/30 bg-mint-50 px-4 py-3 text-center text-sm font-semibold text-primary-dark"
            >
              Te has unido correctamente a esta comunidad.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-brand-dark">Miembros</h2>

          {sortedMembers.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllMembers((current) => !current)}
              className="shrink-0 text-xs font-bold text-primary-dark hover:underline"
            >
              {showAllMembers ? "Ver menos" : "Ver todos"}
            </button>
          )}
        </div>

        {sortedMembers.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Todavía no hay miembros registrados.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-4">
            {visibleMembers.map((member) => (
              <MemberChip key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-24 border border-border bg-surface shadow-soft">
        <div className="flex border-b border-border">
          <TabButton active={tab === "resumen"} onClick={() => setTab("resumen")}>
            Resumen
          </TabButton>
          <TabButton
            active={tab === "vivienda"}
            onClick={() => setTab("vivienda")}
          >
            Vivienda ideal
          </TabButton>
        </div>

        <div className="p-5 sm:p-7">
          {tab === "resumen" ? (
            <ResumenTab community={community} />
          ) : (
            <ViviendaTab community={community} />
          )}
        </div>
      </section>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 border-b-2 px-4 py-4 text-sm font-bold transition",
        active
          ? "border-primary text-primary-dark"
          : "border-transparent text-muted hover:text-brand-dark"
      )}
    >
      {children}
    </button>
  );
}

function MemberChip({ member }: { member: CommunityMember }) {
  const fullName = [member.user.first_name, member.user.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={`/personas/${member.user_id}`}
      className="flex w-20 shrink-0 flex-col items-center gap-2 text-center transition hover:opacity-80"
    >
      <UserAvatar
        firstName={member.user.first_name}
        lastName={member.user.last_name}
        userId={member.user_id}
        imageUrl={member.user.avatar_url}
        size="lg"
        className={cn(
          member.role === "OWNER" &&
            "ring-2 ring-primary ring-offset-2 ring-offset-surface"
        )}
      />

      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-brand-dark">
          {fullName || "Miembro"}
          {member.user.age !== null ? `, ${member.user.age}` : ""}
        </p>

        <p
          className={cn(
            "text-[11px] font-semibold",
            member.role === "OWNER" ? "text-primary-dark" : "text-muted"
          )}
        >
          {member.role === "OWNER" ? "Crea comunidad" : "Miembro"}
        </p>
      </div>
    </Link>
  );
}

function ResumenTab({ community }: { community: Community }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Quiénes forman la comunidad
        </p>

        <p className="mt-2 text-base font-bold text-brand-dark">
          {getProfileTypeLabel(community.profile_type)}
        </p>

        {community.profile_description && (
          <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-7 text-secondary">
            {community.profile_description}
          </p>
        )}
      </div>

      <CommunityPreferencesBlock preferences={community.preferences} />
    </div>
  );
}

function ViviendaTab({ community }: { community: Community }) {
  const isLookingForMembers =
    community.open_spots > 0 && !community.is_full;

  if (!isLookingForMembers) {
    return (
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-18 bg-surface-muted text-primary">
          <UsersIcon />
        </span>

        <div>
          <p className="text-sm font-bold text-brand-dark">
            {community.is_full
              ? "Capacidad máxima alcanzada"
              : "No buscan nuevos miembros ahora"}
          </p>

          <p className="mt-2 text-sm leading-6 text-muted">
            Esta comunidad no tiene condiciones de plaza que mostrar
            ahora mismo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
        {community.open_spots === 1 ? "Plaza abierta" : "Plazas abiertas"}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SpotData
          label="Plazas abiertas"
          value={String(community.open_spots)}
        />

        <SpotData
          label="Presupuesto"
          value={
            community.monthly_rent !== null
              ? `${community.monthly_rent.toLocaleString("es-ES")} €/mes`
              : "Por consultar"
          }
        />

        <SpotData
          label="Fianza"
          value={
            community.deposit !== null
              ? `${community.deposit.toLocaleString("es-ES")} €`
              : "Por consultar"
          }
        />

        <SpotData
          label="Fecha de entrada"
          value={formatMoveInDate(community.move_in_date)}
        />
      </div>

      {community.room_description && (
        <div className="mt-5 rounded-18 bg-surface-muted p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Sobre la habitación
          </p>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-secondary">
            {community.room_description}
          </p>
        </div>
      )}
    </div>
  );
}

function SpotData({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-18 border border-border bg-surface-muted p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-2 text-sm font-bold text-brand-dark">{value}</p>
    </div>
  );
}

function CommunityPreferencesBlock({
  preferences,
}: {
  preferences: CommunityPreferences | null;
}) {
  if (!preferences) {
    return (
      <div className="rounded-18 bg-surface-muted p-6 text-center">
        <p className="text-sm font-bold text-brand-dark">
          Preferencias todavía no configuradas
        </p>

        <p className="mt-2 text-sm leading-6 text-muted">
          El administrador aún no ha indicado cómo quiere organizar la
          convivencia.
        </p>
      </div>
    );
  }

  const items = [
    { key: "atmosphere", label: "Ambiente", value: preferences.atmosphere, icon: <VolumeIcon /> },
    { key: "cleanliness", label: "Limpieza", value: preferences.cleanliness, icon: <SparklesIcon /> },
    { key: "visits", label: "Visitas", value: preferences.visits, icon: <VisitorsIcon /> },
    { key: "pets", label: "Mascotas", value: preferences.pets, icon: <PetIcon /> },
    { key: "sleepovers", label: "Pernoctaciones", value: preferences.sleepovers },
    { key: "smoking", label: "Tabaco", value: preferences.smoking },
    { key: "rules", label: "Reglas de convivencia", value: preferences.rules },
    { key: "lifestyle", label: "Tipo de convivencia", value: preferences.lifestyle },
  ];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
        Cómo es la convivencia
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-2 text-xs font-bold text-primary-dark [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            {item.icon}
            {item.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatMoveInDate(value: string | null) {
  if (!value) return "Fecha flexible";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Por consultar";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M16 4a4 4 0 0 1 0 7" />
      <path d="M18 14a6 6 0 0 1 4 5.7" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function VisitorsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M14 14.5a4.5 4.5 0 0 1 7.5 3.5" />
    </svg>
  );
}

function PetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="2" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="5" cy="13" r="2" />
      <circle cx="19" cy="13" r="2" />
      <path d="M12 12c-3 0-5 2.2-5 4.5S9 20 12 20s5-1.2 5-3.5S15 12 12 12Z" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
