"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { motion } from "framer-motion";
import CommunityCover from "@/components/ui/CommunityCover";
import AvatarGroup from "@/components/ui/AvatarGroup";
import SaveHeartButton from "@/components/ui/SaveHeartButton";
import { useCommunitySave } from "@/hooks/useCommunitySave";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import { detailTransitionName } from "@/lib/detailTransitions";
import type { Community } from "@/types/community";

/* Fila horizontal (foto a la izquierda, contenido a la derecha) en vez
 * del formato de tarjeta vertical anterior — mismo contenido, misma
 * lógica de navegación/estado, solo cambia la estructura visual. */
export default function CommunityCard({
  community,
  isOwn = false,
}: {
  community: Community;
  isOwn?: boolean;
}) {
  const { saved, savingToggle, toggleSave } = useCommunitySave(community);

  const location = community.neighborhood
    ? `${community.neighborhood}, ${community.city}`
    : community.city;

  const isLookingForMembers =
    community.open_spots > 0 && !community.is_full;

  const capacityReachedLabel = "Capacidad máxima";
  const notLookingLabel = "No busca miembros";

  const tag = community.preferences?.atmosphere;

  const visibleMembers = community.members.slice(0, 4);

  return (
    <div className="relative">
      <Link
        href={`/comunidades/${community.id}`}
        transitionTypes={["nav-forward"]}
        className="group block"
      >
        <ViewTransition name={detailTransitionName("community", community.id)} share="coflow-detail-morph">
          <motion.article
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            className={`flex min-h-36 items-stretch overflow-hidden rounded-18 border shadow-soft transition-shadow duration-200 ease-out sm:hover:shadow-[0_16px_32px_-12px_rgb(13_59_42/0.18)] ${
              isLookingForMembers
                ? "border-border bg-surface"
                : "border-border bg-surface-muted opacity-85"
            }`}
          >
            <CommunityCover
              name={community.name}
              coverColor={community.cover_color}
              coverImageUrl={community.cover_image_url}
              members={visibleMembers.map((member) => ({
                id: member.id.toString(),
                firstName: member.user.first_name,
                lastName: member.user.last_name,
                imageUrl: member.user.avatar_url,
              }))}
              memberCount={community.member_count}
              isOwn={isOwn}
              className={`w-28 shrink-0 sm:w-36 ${
                !isLookingForMembers ? "grayscale" : ""
              }`}
            />

            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3.5 sm:p-4">
              <div className="min-w-0 pr-9">
                <h3 className="truncate font-rounded text-lg font-semibold tracking-[-0.01em] text-foreground transition-colors duration-180 group-hover:text-brand-dark sm:text-xl">
                  {community.name}
                </h3>

                <div className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-secondary">
                  <LocationIcon />
                  <span className="truncate">{location}</span>
                </div>

                {isLookingForMembers ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-bold text-primary-dark shadow-soft">
                      {community.open_spots}{" "}
                      {community.open_spots === 1 ? "plaza libre" : "plazas libres"}
                    </span>
                    {community.monthly_rent !== null && (
                      <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-foreground">
                        {community.monthly_rent.toLocaleString("es-ES")} €/mes
                      </span>
                    )}
                    {!isOwn && community.urgency !== "NORMAL" && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                        {community.urgency === "URGENT" ? "Urgente" : "Próximamente"}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-secondary">
                      {community.is_full ? capacityReachedLabel : notLookingLabel}
                    </span>
                  </div>
                )}

                {tag && (
                  <p className="mt-2 line-clamp-1 text-xs font-semibold text-primary-dark">
                    🌿 {tag}
                  </p>
                )}

                <p className="mt-1 text-xs font-medium text-muted">
                  {getProfileTypeLabel(community.profile_type)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <AvatarGroup
                    members={visibleMembers.map((member) => ({
                      id: member.id.toString(),
                      firstName: member.user.first_name,
                      lastName: member.user.last_name,
                      imageUrl: member.user.avatar_url,
                    }))}
                    size="sm"
                  />
                  <span className="truncate text-xs font-medium text-muted">
                    {community.member_count}{" "}
                    {community.member_count === 1 ? "miembro" : "miembros"}
                  </span>
                </div>

                <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand-dark px-4 py-2.5 text-sm font-bold text-white transition-colors duration-180 group-hover:bg-primary-dark">
                  {isOwn ? "Mi comunidad" : "Ver comunidad"}
                  <ArrowIcon />
                </span>
              </div>
            </div>
          </motion.article>
        </ViewTransition>
      </Link>

      {!isOwn && (
        <SaveHeartButton
          saved={saved}
          saving={savingToggle}
          onToggle={toggleSave}
          className="absolute right-3 top-3"
        />
      )}
    </div>
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

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
