import type { ReactNode } from "react";
import Link from "next/link";
import CommunityApplicationAction from "./CommunityApplicationAction";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
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
  const location = [
    community.neighborhood,
    community.city,
    community.province,
  ]
    .filter(Boolean)
    .join(", ");

  const initials = community.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const isLookingForMembers =
    community.open_spots > 0 && !community.is_full;

  const urgencyData = getUrgencyData(
    community.urgency
  );

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-24 border border-border bg-surface shadow-soft sm:rounded-24">
        <div className="relative min-h-[13rem] overflow-hidden bg-gradient-to-br from-brand-dark via-[#237154] to-green-400 px-5 py-6 sm:min-h-72 sm:px-10 sm:py-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-green-100/10" />
          <div className="absolute bottom-8 right-16 h-24 w-24 rounded-full bg-white/5 blur-sm" />

          <div className="relative flex h-full flex-col justify-between gap-6 sm:gap-12">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur sm:max-w-[75%] sm:px-4 sm:py-2">
                <LocationIcon />
                <span className="truncate">{location}</span>
              </span>

              <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                {isLookingForMembers && (
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 ${urgencyData.heroClass}`}
                  >
                    {urgencyData.label}
                  </span>
                )}

                <span className="rounded-full border border-white/20 bg-black/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur sm:px-4 sm:py-2">
                  {community.join_type === "OPEN"
                    ? "Entrada directa"
                    : "Acceso mediante solicitud"}
                </span>
              </div>
            </div>

            <div className="flex items-end gap-4 sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-18 border border-white/20 bg-white/15 text-xl font-bold text-white shadow-soft backdrop-blur sm:h-24 sm:w-24 sm:rounded-24 sm:text-3xl">
                {initials || "CF"}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-green-100">
                  Comunidad de CoFlow
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:mt-2 sm:text-5xl">
                  {community.name}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Sobre la comunidad
              </p>

              <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-8 text-secondary">
                {community.description}
              </p>
            </div>

            <aside className="rounded-24 bg-surface-muted p-5">
              <p className="text-sm font-bold text-brand-dark">
                Información principal
              </p>

              <div className="mt-5 space-y-4">
                <InfoRow
                  icon={<UsersIcon />}
                  label="Capacidad máxima"
                  value={`${community.max_members} personas`}
                />

                <InfoRow
                  icon={<UsersIcon />}
                  label="Miembros actuales"
                  value={`${community.member_count} de ${community.max_members}`}
                />

                <InfoRow
                  icon={<LocationIcon />}
                  label="Ubicación"
                  value={location}
                />

                <InfoRow
                  icon={<StatusIcon />}
                  label="Estado"
                  value={
                    community.is_full
                      ? "Capacidad máxima alcanzada"
                      : community.open_spots <= 0
                        ? "No buscan nuevos miembros ahora"
                        : community.join_type === "OPEN"
                          ? "Entrada directa disponible"
                          : "Aceptan solicitudes"
                  }
                />
              </div>
            </aside>

            {isLookingForMembers ? (
              <div className="lg:col-span-2">
                <AvailableSpotSection community={community} />
              </div>
            ) : (
              <div className="lg:col-span-2 rounded-24 border border-border bg-surface-muted p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-18 bg-surface text-primary shadow-soft">
                    <UsersIcon />
                  </span>

                  <div>
                    <p className="text-sm font-bold text-brand-dark">
                      {community.is_full
                        ? "Capacidad máxima alcanzada"
                        : "No buscan nuevos miembros ahora"}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-muted">
                      {community.is_full
                        ? "Esta comunidad ya tiene todos los miembros que puede tener. Puedes consultar su información, pero no puedes solicitar entrar."
                        : "Esta comunidad no está buscando nuevos miembros actualmente. Puedes consultar su información, pero no puedes solicitar entrar."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isOwner && (
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Forma de acceso
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {community.is_member ? (
                  <button
                    type="button"
                    disabled
                    className="flex h-14 cursor-default items-center justify-center gap-2 rounded-18 bg-primary-dark px-5 text-sm font-bold text-white"
                  >
                    <CheckIcon />
                    Ya formas parte de esta comunidad
                  </button>
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

                <Link
                  href={`/personas/${community.owner_id}`}
                  className="flex h-14 items-center justify-center gap-2 rounded-18 border border-border bg-surface px-5 text-sm font-bold text-brand-dark transition hover:border-primary/30 hover:bg-mint-50/40"
                >
                  <MessageIcon />
                  Ver perfil del administrador
                </Link>
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

              {!joinError &&
                !joinSuccess &&
                !community.is_member &&
                isLookingForMembers && (
                  <p className="mt-3 text-center text-xs text-muted">
                    {community.join_type === "OPEN"
                      ? "Te convertirás en miembro inmediatamente."
                      : "El administrador revisará tu perfil antes de decidir."}
                  </p>
                )}
            </div>
          )}
        </div>
      </header>

      <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:rounded-24 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Quiénes forman la comunidad
        </p>

        <p className="mt-4 text-lg font-bold text-brand-dark">
          {getProfileTypeLabel(community.profile_type)}
        </p>

        {community.profile_description && (
          <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-7 text-secondary">
            {community.profile_description}
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <CommunityPreferencesSection
          preferences={community.preferences}
        />

        <MembersSection
          members={community.members}
          memberCount={community.member_count}
          maxMembers={community.max_members}
          openSpots={community.open_spots}
        />
      </section>
    </div>
  );
}

function AvailableSpotSection({
  community,
}: {
  community: Community;
}) {
  const urgency = getUrgencyData(
    community.urgency
  );

  return (
    <section className="rounded-24 border border-primary/30 bg-mint-50/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {community.open_spots === 1
              ? "Plaza abierta"
              : "Plazas abiertas"}
          </p>

          <h2 className="mt-2 text-xl font-bold text-brand-dark">
            Buscan{" "}
            {community.open_spots === 1
              ? "una persona nueva"
              : `${community.open_spots} personas nuevas`}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            Condiciones para la persona que ocupe esta plaza.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-2 text-xs font-bold ${urgency.detailClass}`}
        >
          {urgency.label}
        </span>
      </div>

      {community.monthly_rent !== null && (
        <p className="mt-4 rounded-18 bg-surface px-4 py-3 text-sm leading-6 text-secondary">
          La persona que ocupe esta plaza pagaría aproximadamente{" "}
          <span className="font-bold text-brand-dark">
            {community.monthly_rent.toLocaleString("es-ES")} €/mes
          </span>
          .
          {community.total_monthly_rent !== null &&
            community.total_monthly_rent > 0 && (
              <>
                {" "}
                Aproximadamente el{" "}
                <span className="font-bold text-brand-dark">
                  {
                    Math.round(
                      (community.monthly_rent /
                        community.total_monthly_rent) *
                        1000
                    ) / 10
                  }{" "}
                  %
                </span>{" "}
                del alquiler total.
              </>
            )}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SpotData
          label="Plazas abiertas"
          value={String(community.open_spots)}
        />

        <SpotData
          label="Aportación mensual esperada"
          value={
            community.monthly_rent !== null
              ? `${community.monthly_rent.toLocaleString("es-ES")} €`
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
          value={formatMoveInDate(
            community.move_in_date
          )}
        />
      </div>

      {community.room_description && (
        <div className="mt-5 rounded-18 bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Sobre la habitación
          </p>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-secondary">
            {community.room_description}
          </p>
        </div>
      )}
    </section>
  );
}

function SpotData({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-18 bg-surface p-4 shadow-soft">
      <p className="text-xs font-semibold text-muted">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-brand-dark">
        {value}
      </p>
    </div>
  );
}

function CommunityPreferencesSection({
  preferences,
}: {
  preferences: CommunityPreferences | null;
}) {
  if (!preferences) {
    return (
      <article className="rounded-18 border border-border bg-surface p-6 shadow-soft sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Compatibilidad
        </p>

        <h2 className="mt-2 text-xl font-bold text-brand-dark">
          Lo que busca esta comunidad
        </h2>

        <div className="mt-6 rounded-18 bg-surface-muted p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-18 bg-surface text-primary shadow-soft">
            <PreferencesIcon />
          </div>

          <p className="mt-4 text-sm font-bold text-brand-dark">
            Preferencias todavía no configuradas
          </p>

          <p className="mt-2 text-sm leading-6 text-muted">
            El administrador aún no ha indicado cómo quiere organizar la
            convivencia.
          </p>
        </div>
      </article>
    );
  }

  const highlightedPreferences = [
    {
      key: "cleanliness",
      label: "Limpieza",
      value: preferences.cleanliness,
      icon: <SparklesIcon />,
    },
    {
      key: "atmosphere",
      label: "Ambiente",
      value: preferences.atmosphere,
      icon: <VolumeIcon />,
    },
    {
      key: "visits",
      label: "Visitas",
      value: preferences.visits,
      icon: <VisitorsIcon />,
    },
    {
      key: "pets",
      label: "Mascotas",
      value: preferences.pets,
      icon: <PetIcon />,
    },
  ];

  const secondaryPreferences = [
    {
      key: "sleepovers",
      label: "Invitados que se quedan a dormir",
      value: preferences.sleepovers,
    },
    {
      key: "smoking",
      label: "Tabaco",
      value: preferences.smoking,
    },
    {
      key: "rules",
      label: "Reglas de convivencia",
      value: preferences.rules,
    },
    {
      key: "lifestyle",
      label: "Tipo de convivencia",
      value: preferences.lifestyle,
    },
  ];

  return (
    <article className="rounded-18 border border-border bg-surface p-6 shadow-soft sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Compatibilidad
          </p>

          <h2 className="mt-2 text-xl font-bold text-brand-dark">
            Lo que busca esta comunidad
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Estas son las principales condiciones y preferencias definidas por
            el administrador.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-mint-50 px-3 py-2 text-xs font-bold text-primary-dark">
          8 preferencias
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {highlightedPreferences.map((preference) => (
          <PreferenceCard
            key={preference.key}
            label={preference.label}
            value={preference.value}
            icon={preference.icon}
          />
        ))}
      </div>

      <details className="group mt-5 overflow-hidden rounded-18 border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-surface px-4 py-4 text-sm font-bold text-brand-dark transition hover:bg-surface-soft">
          <span>Ver todas las condiciones</span>

          <span className="transition duration-200 group-open:rotate-180">
            <ChevronIcon />
          </span>
        </summary>

        <div className="space-y-2 border-t border-border bg-surface-soft p-4">
          {secondaryPreferences.map((preference) => (
            <div
              key={preference.key}
              className="rounded-14 bg-surface px-4 py-3"
            >
              <p className="text-xs font-semibold text-muted">
                {preference.label}
              </p>

              <p className="mt-1 text-sm font-bold leading-6 text-brand-dark">
                {preference.value}
              </p>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}

function PreferenceCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-18 border border-border bg-surface-muted p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-14 bg-surface text-primary shadow-soft">
          {icon}
        </span>

        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          {label}
        </p>
      </div>

      <p className="mt-3 text-sm font-bold leading-6 text-brand-dark">
        {value}
      </p>
    </div>
  );
}

function MembersSection({
  members,
  memberCount,
  maxMembers,
  openSpots,
}: {
  members: CommunityMember[];
  memberCount: number;
  maxMembers: number;
  openSpots: number;
}) {
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "OWNER" && b.role !== "OWNER") {
      return -1;
    }

    if (a.role !== "OWNER" && b.role === "OWNER") {
      return 1;
    }

    return (
      new Date(a.joined_at).getTime() -
      new Date(b.joined_at).getTime()
    );
  });

  return (
    <article className="rounded-18 border border-border bg-surface p-6 shadow-soft sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Miembros actuales
          </p>

          <h2 className="mt-2 text-xl font-bold text-brand-dark">
            Personas que ya forman parte
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted">
            Estas son las personas que ya viven en la comunidad dentro de
            CoFlow.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-mint-50 px-3 py-2 text-xs font-bold text-primary-dark">
          {memberCount} de {maxMembers} miembros
        </span>
      </div>

      {sortedMembers.length === 0 ? (
        <div className="mt-6 rounded-18 bg-surface-muted p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-18 bg-surface text-primary shadow-soft">
            <UsersIcon />
          </div>

          <p className="mt-4 text-sm font-bold text-brand-dark">
            Todavía no hay miembros registrados
          </p>

          <p className="mt-2 text-sm leading-6 text-muted">
            Esta comunidad puede haberse creado antes de activar el sistema de
            miembros.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {sortedMembers.map((member) => (
            <CommunityMemberItem
              key={member.id}
              member={member}
            />
          ))}
        </div>
      )}

      {openSpots > 0 && (
        <div className="mt-5 rounded-18 border border-dashed border-primary/30 bg-mint-50/50 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-14 bg-surface text-primary shadow-soft">
              <PlusPersonIcon />
            </span>

            <div>
              <p className="text-sm font-bold text-brand-dark">
                {openSpots}{" "}
                {openSpots === 1
                  ? "plaza abierta"
                  : "plazas abiertas"}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                La comunidad está buscando activamente nuevos miembros.
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function CommunityMemberItem({
  member,
}: {
  member: CommunityMember;
}) {
  const fullName = [
    member.user.first_name,
    member.user.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const initials = [
    member.user.first_name,
    member.user.last_name,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const joinedDate = formatMemberDate(member.joined_at);

  return (
    <Link
      href={`/personas/${member.user_id}`}
      className="flex items-center gap-4 rounded-18 border border-border bg-surface-muted p-4 transition active:scale-[0.98] hover:border-primary/30"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-18 text-sm font-bold ${
          member.role === "OWNER"
            ? "bg-brand-dark text-white"
            : "bg-surface text-primary-dark shadow-soft"
        }`}
      >
        {initials || "CF"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-brand-dark">
            {fullName || "Miembro de CoFlow"}
          </p>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              member.role === "OWNER"
                ? "bg-mint-100 text-primary-dark"
                : "bg-surface text-muted"
            }`}
          >
            {member.role === "OWNER"
              ? "Administrador"
              : "Miembro"}
          </span>
        </div>

        <p className="mt-1 text-xs text-muted">
          {member.role === "OWNER"
            ? "Creador de la comunidad"
            : `Se unió ${joinedDate}`}
        </p>
      </div>

      {member.role === "OWNER" && (
        <span
          title="Administrador"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-14 bg-mint-100 text-primary-dark"
        >
          <CrownIcon />
        </span>
      )}
    </Link>
  );
}

function formatMemberDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "recientemente";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoveInDate(value: string | null) {
  if (!value) {
    return "Fecha flexible";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Por consultar";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getUrgencyData(
  urgency: Community["urgency"]
) {
  switch (urgency) {
    case "URGENT":
      return {
        label: "Urgente",
        heroClass: "bg-red-500 text-white",
        detailClass: "bg-red-100 text-red-700",
      };

    case "SOON":
      return {
        label: "Próximamente",
        heroClass: "bg-amber-400 text-amber-950",
        detailClass: "bg-amber-100 text-amber-800",
      };

    default:
      return {
        label: "Sin prisa",
        heroClass: "bg-surface text-brand-dark",
        detailClass: "bg-mint-100 text-primary-dark",
      };
  }
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-14 bg-surface text-primary shadow-soft">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted">
          {label}
        </p>

        <p className="mt-1 text-sm font-bold leading-5 text-brand-dark">
          {value}
        </p>
      </div>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
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

function StatusIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
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

function PreferencesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M1 14h6" />
      <path d="M9 8h6" />
      <path d="M17 16h6" />
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function PlusPersonIcon() {
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
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </svg>
  );
}

function CrownIcon() {
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
      <path d="m3 7 4 5 5-8 5 8 4-5-2 11H5Z" />
      <path d="M5 18h14" />
    </svg>
  );
}