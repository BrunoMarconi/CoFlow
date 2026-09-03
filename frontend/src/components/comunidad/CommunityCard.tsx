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
          <motion.article whileHover={{ y: -2 }} whileTap={{ scale: .988 }} className={`flex h-full flex-col overflow-hidden rounded-[22px] border border-black/[0.055] bg-white p-[7px] shadow-[0_8px_24px_rgba(25,54,43,.09)] transition-shadow hover:shadow-[0_15px_34px_rgba(25,54,43,.14)] ${available ? "" : "opacity-85"}`}>
            <div className="relative aspect-[1.72] overflow-hidden rounded-[17px]">
              <CommunityCover name={community.name} coverColor={community.cover_color} coverImageUrl={community.cover_image_url} members={members.map(({ user }) => ({ id: user.id, firstName: user.first_name, lastName: user.last_name, imageUrl: user.avatar_url }))} memberCount={community.member_count} isOwn={isOwn} className={`h-full w-full ${available ? "" : "grayscale"}`} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
              {affinity !== null && <Overlay className="left-2.5 top-2.5 bg-[#233c32]/85 text-white">✦ {affinity}% afinidad</Overlay>}
              <Overlay className="bottom-2.5 left-2.5 max-w-[64%] truncate bg-black/65 text-white"><PinIcon />{location}</Overlay>
              {community.monthly_rent !== null && <Overlay className="bottom-2.5 right-2.5 bg-white/95 text-[#1f3028]">{community.monthly_rent.toLocaleString("es-ES")} €/mes</Overlay>}
            </div>

            <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
              <div className="flex items-center gap-2"><h3 className="min-w-0 flex-1 truncate font-rounded text-[17px] font-semibold leading-tight tracking-[-.025em] text-brand-dark">{community.name}</h3><span className="shrink-0 rounded-full bg-[#edf4f0] px-2.5 py-1 text-[9px] font-semibold text-[#416151]">{available ? "Busca personas" : community.is_full ? "Completa" : "Sin plazas"}</span></div>
              <p className="mt-1 line-clamp-2 min-h-8 text-[10px] leading-4 text-secondary">{community.description || getProfileTypeLabel(community.profile_type)}</p>

              <div className="mt-2.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2"><AvatarGroup members={members.map(({ user }) => ({ id: user.id, firstName: user.first_name, lastName: user.last_name, imageUrl: user.avatar_url }))} totalCount={community.member_count} size="sm" /><span className="truncate text-[10px] font-medium text-secondary">{residents || `${community.member_count} residentes`}</span></div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf4f0] text-[#315f4b]"><PeopleIcon /></span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {tags.map((tag) => <MiniTag key={tag}>{tag}</MiniTag>)}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {verified && <MiniTag><VerifiedIcon /> Email verificado</MiniTag>}
                <MiniTag><ProfileIcon /> {getProfileTypeLabel(community.profile_type)}</MiniTag>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/5 pt-3">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-[10px] font-medium text-secondary"><HomeIcon />{community.join_type === "OPEN" ? "Entrada abierta" : "Acceso con solicitud"}</span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#315f4b] px-4 py-2 text-[10px] font-bold text-white">Conocer <ArrowIcon /></span>
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
function Overlay({ children, className }: { children: React.ReactNode; className: string }) { return <span className={`absolute inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[9px] font-semibold shadow-sm backdrop-blur ${className}`}>{children}</span>; }
function MiniTag({ children }: { children: React.ReactNode }) { return <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-[#eef4f1] px-2.5 py-1.5 text-[9px] font-medium text-[#50625a]">{children}</span>; }
function ArrowIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function PinIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function PeopleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4" /><circle cx="8.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.2a4 4 0 0 1 0 7.6" /></svg>; }
function VerifiedIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>; }
function ProfileIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>; }
function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0" aria-hidden="true"><path d="m3 11 9-7 9 7v9H3Z" /></svg>; }
