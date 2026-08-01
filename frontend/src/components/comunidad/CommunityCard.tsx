import Link from "next/link";
import CommunityCover from "@/components/ui/CommunityCover";
import UserAvatar from "@/components/ui/UserAvatar";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import type {
  Community,
  CommunityUrgency,
} from "@/types/community";

export default function CommunityCard({
  community,
}: {
  community: Community;
}) {
  const location = community.neighborhood
    ? `${community.neighborhood}, ${community.city}`
    : community.city;

  const isLookingForMembers =
    community.open_spots > 0 && !community.is_full;

  const capacityReachedLabel = "Capacidad máxima alcanzada";
  const notLookingLabel = "No buscan nuevos miembros ahora";

  const urgency = getUrgencyData(community.urgency);

  const traits = [
    community.preferences?.atmosphere,
    community.preferences?.smoking,
  ].filter((trait): trait is string => Boolean(trait));

  const visibleMembers = community.members.slice(0, 3);

  return (
    <Link
      href={`/comunidades/${community.id}`}
      className="group block h-full active:scale-[0.99]"
    >
      <article
        className={`flex h-full flex-col overflow-hidden rounded-[1.5rem] border shadow-sm transition duration-300 sm:hover:-translate-y-1 sm:hover:shadow-[0_18px_40px_rgba(18,56,44,0.12)] ${
          isLookingForMembers
            ? "border-line bg-surface"
            : "border-line bg-surface-soft opacity-85"
        }`}
      >
        <CommunityCover
          communityId={community.id}
          name={community.name}
          className={`h-28 sm:h-32 ${
            !isLookingForMembers ? "grayscale" : ""
          }`}
        />

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {isLookingForMembers ? (
              <>
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand-dark">
                  {community.open_spots}{" "}
                  {community.open_spots === 1
                    ? "plaza abierta"
                    : "plazas abiertas"}
                </span>

                {community.urgency !== "NORMAL" && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${urgency.badgeClass}`}
                  >
                    {urgency.label}
                  </span>
                )}
              </>
            ) : (
              <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-600">
                {community.is_full
                  ? capacityReachedLabel
                  : notLookingLabel}
              </span>
            )}
          </div>

          <h3 className="mt-3 truncate text-lg font-bold tracking-tight text-foreground transition group-hover:text-brand-dark sm:text-xl">
            {community.name}
          </h3>

          <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-surface-soft px-2.5 py-1 text-xs font-bold text-brand-dark">
            {getProfileTypeLabel(community.profile_type)}
          </span>

          <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted">
            <LocationIcon />
            <span className="truncate">{location}</span>
          </div>

          {community.monthly_rent !== null && isLookingForMembers && (
            <p className="mt-3 text-xl font-bold text-brand-dark">
              {community.monthly_rent.toLocaleString("es-ES")} €
              <span className="text-sm font-semibold text-muted">
                /mes por persona
              </span>
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            {visibleMembers.length > 0 ? (
              <div className="flex -space-x-2">
                {visibleMembers.map((member) => (
                  <UserAvatar
                    key={member.id}
                    firstName={member.user.first_name}
                    lastName={member.user.last_name}
                    userId={member.user_id}
                    size="sm"
                    className="border-2 border-surface"
                  />
                ))}
              </div>
            ) : null}

            <span className="text-xs font-semibold text-muted">
              {community.member_count} de {community.max_members} miembros
              actuales
            </span>
          </div>

          {isLookingForMembers && (
            <p className="mt-2 text-xs font-semibold text-muted">
              Entrada desde{" "}
              {formatMoveInDate(community.move_in_date)}
            </p>
          )}

          {traits.length > 0 && (
            <p className="mt-3 truncate text-xs font-semibold text-brand-dark">
              {traits.join(" · ")}
            </p>
          )}

          <div className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-bold text-brand-dark">
            Ver comunidad
            <ArrowIcon />
          </div>
        </div>
      </article>
    </Link>
  );
}

function getUrgencyData(urgency: CommunityUrgency) {
  switch (urgency) {
    case "URGENT":
      return {
        label: "Urgente",
        badgeClass: "bg-red-100 text-red-700",
      };

    case "SOON":
      return {
        label: "Próximamente",
        badgeClass: "bg-amber-100 text-amber-800",
      };

    default:
      return {
        label: "Sin prisa",
        badgeClass: "bg-gray-100 text-gray-600",
      };
  }
}

function formatMoveInDate(value: string | null) {
  if (!value) {
    return "fecha flexible";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "por consultar";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
  }).format(date);
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
