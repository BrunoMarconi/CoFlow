import Link from "next/link";
import CommunityCover from "@/components/ui/CommunityCover";
import AvatarGroup from "@/components/ui/AvatarGroup";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import type { Community } from "@/types/community";

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

  const capacityReachedLabel = "Capacidad máxima";
  const notLookingLabel = "No busca miembros";

  const tag =
    community.preferences?.atmosphere ?? community.preferences?.smoking;

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
            className={`h-40 sm:h-44 ${
              !isLookingForMembers ? "grayscale" : ""
            }`}
          />

          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            {isOwn ? (
              <span className="inline-flex h-6.5 items-center rounded-full bg-white/95 px-3 text-xs font-bold text-primary-dark shadow-soft backdrop-blur">
                Tu comunidad
              </span>
            ) : community.urgency !== "NORMAL" && isLookingForMembers ? (
              <span className="inline-flex h-6.5 items-center rounded-full bg-white/95 px-3 text-xs font-bold text-amber-700 shadow-soft backdrop-blur">
                {community.urgency === "URGENT" ? "Urgente" : "Próximamente"}
              </span>
            ) : (
              <span />
            )}
          </div>

          {isLookingForMembers ? (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-brand-dark/90 px-3 py-1.5 text-xs font-bold text-white shadow-soft backdrop-blur">
              {community.open_spots}{" "}
              {community.open_spots === 1 ? "plaza libre" : "plazas libres"}
            </div>
          ) : (
            <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
              {community.is_full ? capacityReachedLabel : notLookingLabel}
            </div>
          )}

          {community.monthly_rent !== null && (
            <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-brand-dark shadow-soft backdrop-blur">
              {community.monthly_rent.toLocaleString("es-ES")} €/mes
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="truncate font-serif text-xl font-medium tracking-[-0.01em] text-foreground transition-colors duration-180 group-hover:text-brand-dark">
            {community.name}
          </h3>

          <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-secondary">
            <LocationIcon />
            <span className="truncate">{location}</span>
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <AvatarGroup
                members={visibleMembers.map((member) => ({
                  id: member.id.toString(),
                  firstName: member.user.first_name,
                  lastName: member.user.last_name,
                  imageUrl: member.user.avatar_url,
                }))}
              />

              <span className="min-w-0 truncate text-xs font-semibold text-muted">
                {isLookingForMembers
                  ? `${community.open_spots} ${
                      community.open_spots === 1 ? "plaza" : "plazas"
                    } libre${community.open_spots === 1 ? "" : "s"}`
                  : `${community.member_count} miembros`}
              </span>
            </div>

            {tag && (
              <span className="shrink-0 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-primary-dark">
                {tag}
              </span>
            )}
          </div>

          <span className="mt-3.5 inline-flex w-fit items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-brand-dark">
            {getProfileTypeLabel(community.profile_type)}
          </span>
        </div>
      </article>
    </Link>
  );
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
