"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { MOTION_SPRING } from "@/lib/motionTokens";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import Spinner from "@/components/ui/Spinner";
import CommunityCover from "@/components/ui/CommunityCover";
import UserAvatar from "@/components/ui/UserAvatar";
import CommunityChat from "@/components/comunidad/CommunityChat";
import CommunityMembersList from "@/components/comunidad/CommunityMembersList";
import CommunityInvitationsManager from "@/components/comunidad/CommunityInvitationsManager";
import CommunityApplicationsManager from "@/components/comunidad/CommunityApplicationsManager";
import CommunityOwnerActions from "@/components/comunidad/CommunityOwnerActions";
import CommunityRentSplit from "@/components/comunidad/CommunityRentSplit";
import CommunityRentSplitManager from "@/components/comunidad/CommunityRentSplitManager";
import OpenSpotsManager from "@/components/comunidad/OpenSpotsManager";
import LeaveCommunityButton from "@/components/comunidad/LeaveCommunityButton";
import { SettingsRow, SettingsSection } from "@/components/comunidad/SettingsRow";
import CompatibilityRadar, { CompatibilityRadarIcon } from "@/components/convivencia/CompatibilityRadar";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import type { Community } from "@/types/community";

type Panel = "dashboard" | "chat" | "members" | "applications";
type ExpandedSection = "invitations" | "spots" | "preferences" | "rent" | "danger" | null;

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

function Expandable({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function initialPanel(value: string | null): Panel {
  if (value === "chat") return "chat";
  if (value === "miembros") return "members";
  if (value === "solicitudes") return "applications";
  return "dashboard";
}

export default function MiComunidadPage() {
  const { user, community, communityLoading, refreshCommunity } = useAuth();
  const { setChatActive } = useMobileChrome();
  const searchParams = useSearchParams();
  const [panel, setPanel] = useState<Panel>(() => initialPanel(searchParams.get("tab")));

  useEffect(() => {
    setChatActive(panel === "chat");
    return () => setChatActive(false);
  }, [panel, setChatActive]);

  if (communityLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!community || !user) {
    return <NoCommunity />;
  }

  const isOwner = community.current_user_role === "OWNER";

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        {panel !== "dashboard" ? (
          <motion.div
            key={panel}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <PrivatePanel
              panel={panel}
              community={community}
              currentUserId={user.id}
              isOwner={isOwner}
              onUpdated={refreshCommunity}
              onBack={() => setPanel("dashboard")}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <CommunityDashboard
              community={community}
              currentUserId={user.id}
              isOwner={isOwner}
              onUpdated={refreshCommunity}
              onOpenPanel={setPanel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

function CommunityDashboard({
  community,
  currentUserId,
  isOwner,
  onUpdated,
  onOpenPanel,
}: {
  community: Community;
  currentUserId: string;
  isOwner: boolean;
  onUpdated: () => Promise<unknown> | void;
  onOpenPanel: (panel: Panel) => void;
}) {
  const [expanded, setExpanded] = useState<ExpandedSection>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [shareLabel, setShareLabel] = useState("Compartir comunidad");

  const owner = useMemo(
    () => community.members.find((member) => member.role === "OWNER"),
    [community.members]
  );

  const coverMembers = community.members.map((member) => ({
    id: member.user.id,
    firstName: member.user.first_name,
    lastName: member.user.last_name,
    imageUrl: member.user.avatar_url,
  }));

  const availablePlaces = Math.max(community.max_members - community.member_count, 0);
  const visibleDescription = descriptionExpanded
    ? community.description
    : truncateText(community.description, 210);

  function toggle(section: Exclude<ExpandedSection, null>) {
    setExpanded((current) => (current === section ? null : section));
  }

  async function handleShare() {
    const url = `${window.location.origin}/comunidades/${community.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: community.name,
          text: `Conoce nuestra comunidad en CoFlow: ${community.name}`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareLabel("Enlace copiado");
      window.setTimeout(() => setShareLabel("Compartir comunidad"), 1800);
    } catch {
      // Cancelar el menú nativo de compartir no debe mostrar un error.
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl pb-4">
      <header className="relative flex h-11 items-center justify-between">
        <Link
          href="/comunidades"
          aria-label="Volver a comunidades"
          className="flex h-10 w-10 items-center justify-start text-brand-dark"
        >
          <ArrowLeftIcon />
        </Link>

        <h1 className="absolute inset-x-12 text-center text-lg font-extrabold text-brand-dark">
          Mi comunidad
        </h1>

        <Link
          href={`/comunidades/${community.id}`}
          aria-label="Ver perfil público"
          title="Ver perfil público"
          className="flex h-10 w-10 items-center justify-end text-brand-dark"
        >
          <MoreIcon />
        </Link>
      </header>

      <motion.section
        initial="hidden"
        animate="show"
        variants={sectionVariants}
        className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr] sm:items-center lg:grid-cols-[280px_1fr]"
      >
        <CommunityCover
          name={community.name}
          coverColor={community.cover_color}
          coverImageUrl={community.cover_image_url}
          members={coverMembers}
          memberCount={community.member_count}
          className="h-48 w-full rounded-24 border border-border shadow-soft sm:h-56 lg:h-64"
        />

        <div className="min-w-0">
          <h2 className="truncate font-rounded text-3xl font-semibold tracking-[-0.03em] text-brand-dark lg:text-4xl">
            {community.name}
          </h2>

          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-secondary">
            <LocationIcon />
            {community.city}
          </p>

          <span className="mt-2 inline-flex rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary-dark">
            {isOwner ? "Administrador" : "Miembro"}
          </span>

          <p className="mt-2 text-sm font-semibold text-secondary">
            {community.member_count} de {community.max_members} miembros
          </p>

          <div className="mt-3 flex items-center -space-x-2">
            {community.members.slice(0, 5).map((member) => (
              <UserAvatar
                key={member.id}
                firstName={member.user.first_name}
                lastName={member.user.last_name}
                userId={member.user.id}
                imageUrl={member.user.avatar_url}
                size="md"
                className="border-2 border-white"
              />
            ))}

            {availablePlaces > 0 && isOwner && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => toggle("invitations")}
                aria-label="Invitar personas"
                className="ml-2 flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-primary/40 bg-surface text-xl text-primary transition hover:border-primary hover:bg-primary/5"
              >
                +
              </motion.button>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section initial="hidden" animate="show" variants={sectionVariants} className="mt-7">
        <h2 className="mb-3 text-lg font-extrabold text-foreground">Vuestra comunidad</h2>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="divide-y divide-border overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
            {owner && (
              <Link
                href={`/personas/${owner.user_id}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition hover:bg-surface-soft"
              >
                <UserAvatar
                  firstName={owner.user.first_name}
                  lastName={owner.user.last_name}
                  userId={owner.user.id}
                  imageUrl={owner.user.avatar_url}
                  size="md"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {`${owner.user.first_name} ${owner.user.last_name}`.trim()}
                    {owner.user_id === currentUserId ? " (tú)" : ""}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-secondary">Administrador</span>
                </span>
                <ChevronIcon />
              </Link>
            )}

            <button
              type="button"
              onClick={() => (isOwner ? toggle("invitations") : onOpenPanel("members"))}
              className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-xl text-primary-dark">+</span>
              <span className="flex-1 text-sm font-bold text-foreground">
                {isOwner ? "Invitar personas" : "Ver miembros"}
              </span>
              <ChevronIcon />
            </button>
          </div>

          <Link
            href="/usuarios"
            className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-linear-to-br from-primary/6 to-transparent p-4 transition hover:border-primary/30 hover:shadow-soft"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft">
              <PeopleIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold text-foreground">
                {availablePlaces} {availablePlaces === 1 ? "plaza disponible" : "plazas disponibles"}
              </span>
              <span className="mt-1 block text-xs leading-5 text-secondary">
                Encuentra personas que encajen con vuestro estilo de convivencia.
              </span>
              <span className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
                Buscar personas <ArrowRightIcon />
              </span>
            </span>
          </Link>
        </div>
      </motion.section>

      {community.average_compatibility && community.average_compatibility.categories.length > 0 && (
        <motion.section initial="hidden" animate="show" variants={sectionVariants} className="mt-7">
          <CompatibilityRadar
            categories={community.average_compatibility.categories}
            icon={<CompatibilityRadarIcon />}
            title="Así convive vuestra comunidad"
            subtitle="Media del perfil de convivencia de sus miembros"
          />
        </motion.section>
      )}

      {isOwner && (
        <Expandable open={expanded === "invitations"}>
          <section className="mt-5">
            <SectionTitle title="Invitaciones" onClose={() => setExpanded(null)} />
            <div className="overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
              <CommunityInvitationsManager communityId={community.id} />
            </div>
          </section>
        </Expandable>
      )}

      <motion.div
        initial="hidden"
        animate="show"
        variants={sectionVariants}
        className="mt-8 grid gap-5 md:grid-cols-2"
      >
        <section>
          <h2 className="mb-3 text-lg font-extrabold text-foreground">Cómo queréis vivir</h2>
          <div className="overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
            <div className="grid grid-cols-2 gap-px bg-border">
              <Fact icon={<MoneyIcon />} label={community.monthly_rent !== null ? `${community.monthly_rent.toLocaleString("es-ES")} €/persona` : "Presupuesto por acordar"} />
              <Fact icon={<PeopleIcon />} label={`${community.max_members} personas`} />
              <Fact icon={<CalendarIcon />} label={formatMoveInDate(community.move_in_date)} />
              <Fact icon={<LeafIcon />} label={community.preferences?.atmosphere || getProfileTypeLabel(community.profile_type)} />
            </div>

            <button
              type="button"
              onClick={() => toggle("preferences")}
              className="flex h-13 w-full items-center justify-between border-t border-border px-4 text-sm font-bold text-primary-dark transition hover:bg-surface-soft"
            >
              Ver preferencias
              <motion.span animate={{ rotate: expanded === "preferences" ? 90 : 0 }} transition={MOTION_SPRING.snappy}>
                <ArrowRightIcon />
              </motion.span>
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold text-foreground">Sobre {community.name}</h2>
          <div className="flex min-h-[196px] flex-col rounded-18 border border-border bg-surface p-4 shadow-soft">
            <p className="whitespace-pre-line text-sm leading-6 text-secondary">
              {visibleDescription}
            </p>
            {community.profile_description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-secondary">
                {descriptionExpanded
                  ? community.profile_description
                  : truncateText(community.profile_description, 120)}
              </p>
            )}
            {(community.description.length > 210 || (community.profile_description?.length ?? 0) > 120) && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((current) => !current)}
                className="mt-auto pt-3 text-left text-sm font-bold text-primary-dark"
              >
                {descriptionExpanded ? "Ver menos" : "Ver más"}
              </button>
            )}
          </div>
        </section>
      </motion.div>

      <Expandable open={expanded === "preferences" && Boolean(community.preferences)}>
        {community.preferences && (
          <section className="mt-5 rounded-18 border border-border bg-surface p-4 shadow-soft">
            <SectionTitle title="Preferencias de convivencia" onClose={() => setExpanded(null)} />
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Preference label="Limpieza" value={community.preferences.cleanliness} />
              <Preference label="Ambiente" value={community.preferences.atmosphere} />
              <Preference label="Visitas" value={community.preferences.visits} />
              <Preference label="Invitados" value={community.preferences.sleepovers} />
              <Preference label="Tabaco" value={community.preferences.smoking} />
              <Preference label="Mascotas" value={community.preferences.pets} />
              <Preference label="Reglas" value={community.preferences.rules} />
              <Preference label="Estilo" value={community.preferences.lifestyle} />
            </div>
          </section>
        )}
      </Expandable>

      <motion.section initial="hidden" animate="show" variants={sectionVariants} className="mt-7">
        <h2 className="mb-3 text-lg font-extrabold text-foreground">Gestionar comunidad</h2>

        <SettingsSection label="">
          <SettingsRow icon={MessageIcon} title="Mensajes de la comunidad" onClick={() => onOpenPanel("chat")} />
          <SettingsRow icon={MembersIcon} title="Gestionar miembros" onClick={() => onOpenPanel("members")} />

          {isOwner && (
            <>
              <SettingsRow icon={EditIcon} title="Editar información" href={`/comunidades/${community.id}/editar`} />
              <SettingsRow icon={ApplicationsIcon} title="Solicitudes para entrar" onClick={() => onOpenPanel("applications")} />
              <SettingsRow icon={InviteIcon} title="Invitaciones" onClick={() => toggle("invitations")} expanded={expanded === "invitations"} />
              <SettingsRow icon={SpotsIcon} title="Gestionar plazas" onClick={() => toggle("spots")} expanded={expanded === "spots"} />
              <SettingsRow icon={WalletIcon} title="Reparto del alquiler" onClick={() => toggle("rent")} expanded={expanded === "rent"} />
              <SettingsRow icon={ShareIcon} title={shareLabel} onClick={handleShare} />
            </>
          )}

          <SettingsRow icon={PublicIcon} title="Ver perfil público" href={`/comunidades/${community.id}`} />
        </SettingsSection>

        <Expandable open={expanded === "spots"}>
          <div className="mt-3 rounded-18 border border-border bg-surface shadow-soft">
            <OpenSpotsManager community={community} onUpdated={onUpdated} />
          </div>
        </Expandable>

        <Expandable open={expanded === "rent" && isOwner}>
          <div className="mt-3 rounded-18 border border-border bg-surface shadow-soft">
            <CommunityRentSplitManager communityId={community.id} />
          </div>
        </Expandable>

        {!isOwner && (
          <div className="mt-3 space-y-3">
            <CommunityRentSplit communityId={community.id} />
            <LeaveCommunityButton communityId={community.id} />
          </div>
        )}
      </motion.section>

      {isOwner && (
        <motion.section initial="hidden" animate="show" variants={sectionVariants} className="mt-5">
          <button
            type="button"
            onClick={() => toggle("danger")}
            className="flex h-13 w-full items-center justify-between rounded-18 border border-red-200 bg-surface px-4 text-sm font-bold text-red-600 shadow-soft transition hover:bg-red-50/50"
          >
            Cerrar comunidad
            <motion.span animate={{ rotate: expanded === "danger" ? 90 : 0 }} transition={MOTION_SPRING.snappy}>
              <ChevronIcon />
            </motion.span>
          </button>

          <Expandable open={expanded === "danger"}>
            <div className="mt-3">
              <CommunityOwnerActions community={community} />
            </div>
          </Expandable>
        </motion.section>
      )}
    </div>
  );
}

function PrivatePanel({
  panel,
  community,
  currentUserId,
  isOwner,
  onUpdated,
  onBack,
}: {
  panel: Exclude<Panel, "dashboard">;
  community: Community;
  currentUserId: string;
  isOwner: boolean;
  onUpdated: () => Promise<unknown> | void;
  onBack: () => void;
}) {
  const titles: Record<Exclude<Panel, "dashboard">, string> = {
    chat: "Mensajes",
    members: "Miembros",
    applications: "Solicitudes",
  };

  return (
    <div className={`mx-auto w-full ${panel === "chat" ? "max-w-4xl" : "max-w-3xl"}`}>
      <header className="mb-5 flex h-11 items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Volver al resumen" className="flex h-10 w-10 items-center justify-start text-brand-dark">
          <ArrowLeftIcon />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-foreground">{titles[panel]}</h1>
          <p className="truncate text-xs text-secondary">{community.name}</p>
        </div>
      </header>

      {panel === "chat" && <CommunityChat communityId={community.id} currentUserId={currentUserId} />}
      {panel === "members" && (
        <CommunityMembersList
          communityId={community.id}
          members={community.members}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onUpdated={onUpdated}
        />
      )}
      {panel === "applications" && isOwner && <CommunityApplicationsManager communityId={community.id} />}
      {panel === "applications" && !isOwner && (
        <p className="rounded-18 border border-border bg-surface p-5 text-sm text-secondary shadow-soft">
          Solo el anfitrión puede gestionar las solicitudes.
        </p>
      )}
    </div>
  );
}

function NoCommunity() {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center px-6 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 text-primary-dark">
          <PeopleIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-brand-dark">Todavía no tienes comunidad</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-secondary">
          Explora las comunidades disponibles o crea la tuya para tener aquí vuestro espacio privado.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/comunidades" className="flex h-11 items-center rounded-14 border border-border bg-surface px-5 text-sm font-bold text-foreground shadow-soft transition hover:border-primary/30">Explorar</Link>
          <Link href="/crear/comunidad" className="flex h-11 items-center rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button transition hover:bg-primary-hover">Crear comunidad</Link>
        </div>
      </motion.div>
    </MotionConfig>
  );
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-17 items-center gap-2 bg-surface p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-primary">{icon}</span>
      <span className="text-xs font-bold leading-5 text-foreground">{label}</span>
    </div>
  );
}

function Preference({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-14 border border-border bg-surface px-3 py-2.5 shadow-soft">
      <p className="text-[11px] font-semibold text-secondary">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
      <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-secondary shadow-soft" aria-label="Cerrar">×</button>
    </div>
  );
}

function truncateText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength).trim()}…`;
}

function formatMoveInDate(value: string | null) {
  if (!value) return "Entrada flexible";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Entrada por acordar";
  return `Entrada en ${new Intl.DateTimeFormat("es-ES", { month: "long" }).format(date)}`;
}

type IconProps = { className?: string };

function BaseIcon({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>;
}

function ArrowLeftIcon() { return <BaseIcon className="h-6 w-6"><path d="M19 12H5M11 18l-6-6 6-6" /></BaseIcon>; }
function ArrowRightIcon() { return <BaseIcon className="h-4 w-4"><path d="M5 12h14M13 6l6 6-6 6" /></BaseIcon>; }
function ChevronIcon() { return <BaseIcon className="h-4 w-4 text-muted"><path d="m9 6 6 6-6 6" /></BaseIcon>; }
function MoreIcon() { return <BaseIcon className="h-6 w-6"><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></BaseIcon>; }
function LocationIcon() { return <BaseIcon className="h-4 w-4"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></BaseIcon>; }
function PeopleIcon({ className }: IconProps) { return <BaseIcon className={className ?? "h-6 w-6"}><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 7a3 3 0 0 1 0 6M22 21a5 5 0 0 0-5-5" /></BaseIcon>; }
function MoneyIcon() { return <BaseIcon><circle cx="12" cy="12" r="9" /><path d="M15 8.5a4 4 0 1 0 0 7M7 11h7M7 14h7" /></BaseIcon>; }
function CalendarIcon() { return <BaseIcon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></BaseIcon>; }
function LeafIcon() { return <BaseIcon><path d="M20 4S8 3 5 12c-2 6 4 8 7 5 4-4 4-8 8-13Z" /><path d="M4 20c4-6 8-8 13-11" /></BaseIcon>; }
function MessageIcon({ className }: IconProps) { return <BaseIcon className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></BaseIcon>; }
function MembersIcon({ className }: IconProps) { return <PeopleIcon className={className} />; }
function EditIcon({ className }: IconProps) { return <BaseIcon className={className}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></BaseIcon>; }
function ApplicationsIcon({ className }: IconProps) { return <BaseIcon className={className}><path d="M3 6h18v12H3zM3 7l9 6 9-6" /></BaseIcon>; }
function InviteIcon({ className }: IconProps) { return <BaseIcon className={className}><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" /></BaseIcon>; }
function SpotsIcon({ className }: IconProps) { return <PeopleIcon className={className} />; }
function WalletIcon({ className }: IconProps) { return <BaseIcon className={className}><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M16 10h5v5h-5a2.5 2.5 0 0 1 0-5Z" /></BaseIcon>; }
function ShareIcon({ className }: IconProps) { return <BaseIcon className={className}><path d="M12 16V3M7 8l5-5 5 5M5 12v8h14v-8" /></BaseIcon>; }
function PublicIcon({ className }: IconProps) { return <BaseIcon className={className}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></BaseIcon>; }
