"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import CommunityChat from "@/components/comunidad/CommunityChat";
import CommunityMembersList from "@/components/comunidad/CommunityMembersList";
import LeaveCommunityButton from "@/components/comunidad/LeaveCommunityButton";
import OpenSpotsManager from "@/components/comunidad/OpenSpotsManager";
import CommunityOwnerActions from "@/components/comunidad/CommunityOwnerActions";
import CommunityRentSplit from "@/components/comunidad/CommunityRentSplit";
import CommunityRentSplitManager from "@/components/comunidad/CommunityRentSplitManager";
import CommunityInvitationsManager from "@/components/comunidad/CommunityInvitationsManager";
import CommunityApplicationsManager from "@/components/comunidad/CommunityApplicationsManager";
import { SettingsRow, SettingsSection } from "@/components/comunidad/SettingsRow";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import type { Community } from "@/types/community";

type Tab = "resumen" | "chat" | "miembros" | "solicitudes" | "gestion";

const VALID_TABS: Tab[] = ["resumen", "chat", "miembros", "solicitudes", "gestion"];

function isValidTab(value: string | null): value is Tab {
  return value !== null && (VALID_TABS as string[]).includes(value);
}

export default function MiComunidadPage() {
  const { user, community, communityLoading } = useAuth();
  const { setChatActive } = useMobileChrome();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>(
    isValidTab(searchParams.get("tab")) ? (searchParams.get("tab") as Tab) : "resumen"
  );

  // Con el chat de la comunidad activo en móvil, se libera el espacio de
  // BottomNavigation igual que en el chat 1:1 dedicado.
  useEffect(() => {
    setChatActive(tab === "chat");
    return () => setChatActive(false);
  }, [tab, setChatActive]);

  if (communityLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!community || !user) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-dark">
          Sin comunidad activa
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Todavía no formas parte de ninguna comunidad
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-muted">
          Explora las comunidades disponibles o crea la tuya propia para
          tener aquí tu espacio privado.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/comunidades"
            className="inline-flex h-12 items-center justify-center rounded-18 bg-brand px-6 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            Explorar comunidades
          </Link>

          <Link
            href="/crear/comunidad"
            className="inline-flex h-12 items-center justify-center rounded-18 border border-line bg-surface px-6 text-sm font-bold text-foreground transition hover:border-brand/40"
          >
            Crear una comunidad
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = community.current_user_role === "OWNER";

  const location = [
    community.neighborhood,
    community.city,
    community.province,
  ]
    .filter(Boolean)
    .join(", ");

  const statusLabel = community.is_full
    ? "Capacidad máxima alcanzada"
    : community.open_spots > 0
      ? "Buscando nuevos miembros"
      : "No buscan nuevos miembros ahora";

  const statusClass = community.is_full
    ? "bg-surface-soft text-secondary"
    : community.open_spots > 0
      ? "bg-surface-soft text-brand-dark"
      : "bg-amber-50 text-amber-700";

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "chat", label: "Chat" },
    { key: "miembros", label: "Miembros" },
    ...(isOwner
      ? [
          { key: "solicitudes" as Tab, label: "Solicitudes" },
          { key: "gestion" as Tab, label: "Gestión" },
        ]
      : []),
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="rounded-18 border border-line bg-surface p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground sm:text-2xl">
              {community.name}
            </h1>

            {location && (
              <p className="mt-0.5 truncate text-xs font-medium text-muted sm:text-sm">
                {location}
              </p>
            )}
          </div>

          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:py-1.5 sm:text-xs",
              isOwner
                ? "bg-brand/10 text-brand-dark"
                : "bg-surface-soft text-secondary"
            )}
          >
            {isOwner ? "Administrador" : "Miembro"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs sm:text-sm">
          <span className="font-bold text-foreground">
            {community.member_count} de {community.max_members} miembros
          </span>

          <span className="text-muted">·</span>

          <span className="font-semibold text-muted">
            {community.open_spots}{" "}
            {community.open_spots === 1
              ? "plaza abierta"
              : "plazas abiertas"}
          </span>

          <span
            className={cn(
              "ml-auto rounded-full px-2.5 py-1 text-[11px] font-bold",
              statusClass
            )}
          >
            {statusLabel}
          </span>
        </div>
      </header>

      {!isOwner && (
        <div className="mt-3">
          <LeaveCommunityButton communityId={community.id} />
        </div>
      )}

      <CommunityTabs tab={tab} tabs={tabs} onChange={setTab} />

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="mt-4"
      >
        {tab === "resumen" && (
          <ResumenTab community={community} isOwner={isOwner} />
        )}

        {tab === "chat" && (
          <CommunityChat
            communityId={community.id}
            currentUserId={user.id}
          />
        )}

        {tab === "miembros" && (
          <CommunityMembersList members={community.members} />
        )}

        {tab === "solicitudes" && isOwner && (
          <CommunityApplicationsManager communityId={community.id} />
        )}

        {tab === "gestion" && isOwner && (
          <GestionTab
            community={community}
            onOpenSolicitudes={() => setTab("solicitudes")}
          />
        )}
      </div>
    </div>
  );
}

function CommunityTabs({
  tab,
  tabs,
  onChange,
}: {
  tab: Tab;
  tabs: { key: Tab; label: string }[];
  onChange: (tab: Tab) => void;
}) {
  const buttonRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>(
    {}
  );

  useEffect(() => {
    buttonRefs.current[tab]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [tab]);

  return (
    <div
      role="tablist"
      aria-label="Secciones de tu comunidad"
      className="mt-4 flex gap-1 overflow-x-auto snap-x snap-proximity scroll-fade-x border-b border-line [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((item) => {
        const active = tab === item.key;

        return (
          <button
            key={item.key}
            ref={(element) => {
              buttonRefs.current[item.key] = element;
            }}
            type="button"
            role="tab"
            id={`tab-${item.key}`}
            aria-selected={active}
            aria-controls={`panel-${item.key}`}
            onClick={() => onChange(item.key)}
            className={cn(
              "min-h-11 shrink-0 snap-start scroll-mx-4 whitespace-nowrap border-b-2 px-3.5 text-sm font-bold transition active:scale-95",
              active
                ? "border-brand text-brand-dark"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ResumenTab({
  community,
  isOwner,
}: {
  community: Community;
  isOwner: boolean;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-18 border border-line bg-surface p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Sobre la comunidad
        </p>

        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
          {community.description}
        </p>
      </section>

      <section className="rounded-18 border border-line bg-surface p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Quiénes forman la comunidad
        </p>

        <p className="mt-2 text-sm font-bold text-foreground">
          {getProfileTypeLabel(community.profile_type)}
        </p>

        {community.profile_description && (
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
            {community.profile_description}
          </p>
        )}
      </section>

      {community.preferences && (
        <section className="rounded-18 border border-line bg-surface p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
            Información de convivencia
          </p>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <PreferenceRow
              label="Limpieza"
              value={community.preferences.cleanliness}
            />
            <PreferenceRow
              label="Ambiente"
              value={community.preferences.atmosphere}
            />
            <PreferenceRow
              label="Visitas"
              value={community.preferences.visits}
            />
            <PreferenceRow
              label="Invitados a dormir"
              value={community.preferences.sleepovers}
            />
            <PreferenceRow
              label="Tabaco"
              value={community.preferences.smoking}
            />
            <PreferenceRow
              label="Mascotas"
              value={community.preferences.pets}
            />
            <PreferenceRow
              label="Reglas"
              value={community.preferences.rules}
            />
            <PreferenceRow
              label="Tipo de convivencia"
              value={community.preferences.lifestyle}
            />
          </div>
        </section>
      )}

      <section className="rounded-18 border border-line bg-surface p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Condiciones de la plaza
        </p>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <PreferenceRow
            label="Aportación mensual esperada"
            value={
              community.monthly_rent !== null
                ? `${community.monthly_rent.toLocaleString("es-ES")} €/mes`
                : "Por consultar"
            }
          />

          <PreferenceRow
            label="Fianza"
            value={
              community.deposit !== null
                ? `${community.deposit.toLocaleString("es-ES")} €`
                : "Por consultar"
            }
          />

          <PreferenceRow
            label="Fecha de entrada"
            value={formatMoveInDate(community.move_in_date)}
          />

          <PreferenceRow
            label="Plazas abiertas"
            value={String(community.open_spots)}
          />
        </div>

        <p className="mt-3 text-sm text-muted">
          Forma de acceso:{" "}
          <span className="font-bold text-foreground">
            {community.join_type === "OPEN"
              ? "Entrada directa"
              : "Acceso mediante solicitud"}
          </span>
        </p>
      </section>

      {!isOwner && <CommunityRentSplit communityId={community.id} />}

      <Link
        href={`/comunidades/${community.id}`}
        className="flex min-h-11 items-center gap-2 text-sm font-bold text-brand-dark active:scale-[0.98] sm:inline-flex"
      >
        Ver perfil público de la comunidad
        <ArrowRightIcon />
      </Link>
    </div>
  );
}

function GestionTab({
  community,
  onOpenSolicitudes,
}: {
  community: Community;
  onOpenSolicitudes: () => void;
}) {
  const [expanded, setExpanded] = useState<
    "plazas" | "invitaciones" | "reparto" | null
  >(null);

  function toggle(key: "plazas" | "invitaciones" | "reparto") {
    setExpanded((current) => (current === key ? null : key));
  }

  return (
    <div className="space-y-5">
      <SettingsSection label="Comunidad">
        <SettingsRow
          icon={EditIcon}
          title="Editar información"
          subtitle="Cambia nombre, descripción y preferencias"
          href={`/comunidades/${community.id}/editar`}
        />

        <SettingsRow
          icon={SpotsIcon}
          title="Gestionar plazas"
          subtitle="Abre o cierra plazas para nuevos miembros"
          onClick={() => toggle("plazas")}
          expanded={expanded === "plazas"}
        />

        {expanded === "plazas" && (
          <div className="border-t border-line bg-surface-soft/40">
            <OpenSpotsManager community={community} onUpdated={() => {}} />
          </div>
        )}

        <SettingsRow
          icon={MailIcon}
          title="Invitaciones para compañeros actuales"
          subtitle="Para personas que ya viven contigo"
          iconClassName="bg-amber-100 text-amber-700"
          onClick={() => toggle("invitaciones")}
          expanded={expanded === "invitaciones"}
        />

        {expanded === "invitaciones" && (
          <div className="border-t border-line bg-surface-soft/40">
            <CommunityInvitationsManager communityId={community.id} />
          </div>
        )}

        <SettingsRow
          icon={InboxIcon}
          title="Solicitudes para ocupar plazas"
          subtitle="Para personas nuevas interesadas en entrar"
          iconClassName="bg-brand/10 text-brand-dark"
          onClick={onOpenSolicitudes}
        />
      </SettingsSection>

      <div className="flex items-start gap-3 rounded-18 border border-amber-100 bg-amber-50/70 p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-14 bg-amber-100 text-amber-700">
          <InfoIcon />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900">
            Eres el administrador
          </p>

          <p className="mt-0.5 text-xs leading-5 text-amber-800/90">
            Para salir, primero tendrás que transferir la administración
            o cerrar la comunidad.
          </p>
        </div>
      </div>

      <SettingsSection label="Economía">
        <SettingsRow
          icon={WalletIcon}
          title="Reparto del alquiler"
          subtitle="Alquiler total y aportación de cada miembro"
          onClick={() => toggle("reparto")}
          expanded={expanded === "reparto"}
        />

        {expanded === "reparto" && (
          <div className="border-t border-line bg-surface-soft/40">
            <CommunityRentSplitManager communityId={community.id} />
          </div>
        )}
      </SettingsSection>

      <section>
        <p className="px-1 text-xs font-bold uppercase tracking-[0.12em] text-red-500">
          Zona peligrosa
        </p>

        <div className="mt-2">
          <CommunityOwnerActions community={community} />
        </div>
      </section>
    </div>
  );
}

function PreferenceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-14 bg-surface-soft px-3.5 py-2.5">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
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

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function SpotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18v12H3z" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h4l2 3h4l2-3h4" />
      <path d="M5.5 5h13l2 7v6a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-6Z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-4a2 2 0 1 1 0-4h4a1 1 0 0 0 1-1" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4.5 w-4.5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v4h1" />
    </svg>
  );
}
