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
import { MOTION_SPRING } from "@/lib/motionTokens";
import type { Community } from "@/types/community";

export default function CommunityCard({ community, isOwn = false }: { community: Community; isOwn?: boolean }) {
  const { saved, savingToggle, toggleSave } = useCommunitySave(community);
  const location = community.neighborhood ? `${community.neighborhood}, ${community.city}` : community.city;
  const available = community.open_spots > 0 && !community.is_full;
  const members = community.members.slice(0, 4);
  const scores = community.average_compatibility?.categories.map((item) => item.score) ?? [];
  const affinity = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  const residents = members.map(({ user }) => `${user.first_name}${user.age ? `, ${user.age}` : ""}`).join(" · ");
  const verified = members.length > 0 && members.every(({ user }) => user.is_email_verified);
  const tags = [
    community.move_in_date ? `Entrada ${formatDate(community.move_in_date)}` : null,
    community.preferences?.atmosphere,
    community.preferences?.lifestyle,
    community.preferences?.cleanliness,
  ].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index).slice(0, 3);

  return (
    <div className="relative h-full">
      <Link href={`/comunidades/${community.id}`} transitionTypes={["nav-forward"]} className="group block h-full">
        <ViewTransition name={detailTransitionName("community", community.id)} share="coflow-detail-morph">
          <motion.article whileHover={{ y: -2 }} whileTap={{ scale: .965 }} transition={MOTION_SPRING.snappy} className={`flex h-full flex-col overflow-hidden rounded-card border border-black/[0.055] bg-surface p-[7px] shadow-card transition-shadow hover:shadow-raised ${available ? "" : "opacity-85"}`}>
            <div className="relative aspect-[1.72] overflow-hidden rounded-[17px]">
              <CommunityCover name={community.name} coverColor={community.cover_color} coverImageUrl={community.cover_image_url} members={members.map(({ user }) => ({ id: user.id, firstName: user.first_name, lastName: user.last_name, imageUrl: user.avatar_url }))} memberCount={community.member_count} isOwn={isOwn} className={`h-full w-full ${available ? "" : "grayscale"}`} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
              {affinity !== null && <Overlay className="left-2.5 top-2.5 bg-brand-dark/85 text-white">✦ {affinity}% afinidad</Overlay>}
              <Overlay className="bottom-2.5 left-2.5 max-w-[64%] truncate bg-black/65 text-white"><PinIcon />{location}</Overlay>
              {community.monthly_rent !== null && <Overlay className="bottom-2.5 right-2.5 bg-white/95 text-brand-dark">{community.monthly_rent.toLocaleString("es-ES")} €/mes</Overlay>}
            </div>

            {/* El cuerpo va en el orden en que se decide mirar una
                comunidad: qué es -> de qué va -> quién vive -> cómo es
                -> cómo se entra. Antes eran once elementos al mismo
                peso visual (tres frases de estilo de vida, dos chips de
                dato, un icono decorativo y un botón "Conocer" que
                repetía lo que ya hacía la tarjeta entera): con todo
                gritando igual, no destacaba nada. */}
            <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
              <div className="flex items-start gap-2">
                <h3 className="type-card-title min-w-0 flex-1 truncate font-rounded text-brand-dark">{community.name}</h3>
                <span className="shrink-0 rounded-full bg-surface-soft px-2.5 py-1 text-3xs font-semibold text-brand-mid">{available ? "Busca personas" : community.is_full ? "Completa" : "Sin plazas"}</span>
              </div>

              <p className="mt-1 line-clamp-2 min-h-8 text-2xs leading-[1.45] text-secondary">{community.description || getProfileTypeLabel(community.profile_type)}</p>

              <div className="mt-2.5 flex min-w-0 items-center gap-2">
                <AvatarGroup members={members.map(({ user }) => ({ id: user.id, firstName: user.first_name, lastName: user.last_name, imageUrl: user.avatar_url }))} totalCount={community.member_count} size="sm" />
                <span className="truncate text-2xs font-medium text-secondary">{residents || `${community.member_count} residentes`}</span>
              </div>

              {/* Dos rasgos como mucho. Eran tres frases largas que
                  ocupaban media tarjeta y se leían como un bloque de
                  texto gris; el resto vive en el detalle, que es donde
                  se comparan de verdad. */}
              {tags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {tags.slice(0, 2).map((tag) => <MiniTag key={tag}>{tag}</MiniTag>)}
                  {tags.length > 2 && <span className="text-3xs font-semibold text-muted">+{tags.length - 2}</span>}
                </div>
              )}

              {/* Los datos de confianza bajan a metadato tenue: son
                  comprobaciones, no rasgos que elijas. Con la misma
                  píldora que los rasgos competían con ellos. */}
              <div className="mt-auto flex items-center gap-3 border-t border-black/5 pt-3 text-3xs font-medium text-muted">
                <span className="flex min-w-0 items-center gap-1 truncate"><HomeIcon />{community.join_type === "OPEN" ? "Entrada abierta" : "Acceso con solicitud"}</span>
                <span className="flex shrink-0 items-center gap-1"><ProfileIcon />{getProfileTypeLabel(community.profile_type)}</span>
                {verified && <span className="ml-auto flex shrink-0 items-center gap-1 text-brand-mid"><VerifiedIcon /><span className="sr-only">Email verificado</span></span>}
              </div>
            </div>
          </motion.article>
        </ViewTransition>
      </Link>
      {!isOwn && <SaveHeartButton saved={saved} saving={savingToggle} onToggle={toggleSave} className="absolute right-3 top-3 left-auto z-10 h-8 w-8 bg-white/90 shadow-sm backdrop-blur" />}
    </div>
  );
}

function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(value)); }
function Overlay({ children, className }: { children: React.ReactNode; className: string }) { return <span className={`absolute inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-3xs font-semibold shadow-sm backdrop-blur ${className}`}>{children}</span>; }
function MiniTag({ children }: { children: React.ReactNode }) { return <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-surface-soft px-2.5 py-1.5 text-3xs font-medium text-secondary">{children}</span>; }
function PinIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function VerifiedIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>; }
function ProfileIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>; }
function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0" aria-hidden="true"><path d="m3 11 9-7 9 7v9H3Z" /></svg>; }
