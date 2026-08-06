import Link from "next/link";
import CommunityCover from "@/components/ui/CommunityCover";
import AvatarGroup from "@/components/ui/AvatarGroup";
import StatusBadge from "@/components/ui/StatusBadge";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import type {
  Community,
  CommunityUrgency,
} from "@/types/community";

export default function CommunityCard({
  community,
  isOwn = false,
}: {
  community: Community;
  isOwn?: boolean;
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
        className={`flex h-full flex-col overflow-hidden rounded-18 border shadow-soft transition-all duration-180 ease-out sm:hover:-translate-y-0.5 sm:hover:shadow-[0_16px_32px_-12px_rgb(13_59_42/0.18)] ${
          isLookingForMembers
            ? "border-border bg-surface"
            : "border-border bg-surface-muted opacity-85"
        }`}
      >
        <div className="relative">
          <CommunityCover
            communityId={community.id}
            name={community.name}
            className={`h-32 sm:h-36 ${
              !isLookingForMembers ? "grayscale" : ""
            }`}
          />

          <div className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-2">
            {isLookingForMembers ? (
              <>
                <StatusBadge variant="success">
                  {community.open_spots}{" "}
                  {community.open_spots === 1
                    ? "plaza abierta"
                    : "plazas abiertas"}
                </StatusBadge>

                {community.urgency !== "NORMAL" && (
                  <StatusBadge variant={urgency.variant}>
                    {urgency.label}
                  </StatusBadge>
                )}
              </>
            ) : (
              <StatusBadge variant="neutral">
                {community.is_full
                  ? capacityReachedLabel
                  : notLookingLabel}
              </StatusBadge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="truncate text-lg font-bold tracking-[-0.01em] text-foreground transition-colors duration-180 group-hover:text-brand-dark sm:text-xl">
            {community.name}
          </h3>

          <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-brand-dark">
            {getProfileTypeLabel(community.profile_type)}
          </span>

          <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-secondary">
            <LocationIcon />
            <span className="truncate">{location}</span>
          </div>

          {community.monthly_rent !== null && isLookingForMembers && (
            <p className="mt-3 text-2xl font-black tracking-[-0.01em] text-brand-dark">
              {community.monthly_rent.toLocaleString("es-ES")} €
              <span className="text-sm font-semibold text-muted">
                /mes por persona
              </span>
            </p>
          )}

          <div className="mt-4 flex min-w-0 items-center gap-2">
            <AvatarGroup
              members={visibleMembers.map((member) => ({
                id: member.id.toString(),
                firstName: member.user.first_name,
                lastName: member.user.last_name,
              }))}
            />

            <span className="min-w-0 truncate text-xs font-semibold text-muted">
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
            <p className="mt-3 line-clamp-2 text-xs font-semibold text-brand-dark">
              {traits.join(" · ")}
            </p>
          )}

          <div className="-mx-4 mt-auto flex items-center justify-between gap-1.5 border-t border-border px-4 pt-3 text-sm font-bold text-brand-dark sm:-mx-5 sm:px-5">
            {isOwn ? "Mi comunidad" : "Ver comunidad"}
            <ArrowIcon />
          </div>
        </div>
      </article>
    </Link>
  );
}

function getUrgencyData(
  urgency: CommunityUrgency
): { label: string; variant: "warning" | "info" | "neutral" } {
  switch (urgency) {
    case "URGENT":
      return { label: "Urgente", variant: "warning" };

    case "SOON":
      return { label: "Próximamente", variant: "info" };

    default:
      return { label: "Sin prisa", variant: "neutral" };
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
