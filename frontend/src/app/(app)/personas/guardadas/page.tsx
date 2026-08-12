"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import PersonPreviewPanel from "@/components/usuario/PersonPreviewPanel";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { getSavedProfiles } from "@/services/users";
import type { UserPublicProfile } from "@/types/userPublic";

type SavedCategory = "people" | "communities";

export default function PersonasGuardadasPage() {
  const [category, setCategory] = useState<SavedCategory>("people");
  const [profiles, setProfiles] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getSavedProfiles()
      .then((data) => {
        if (active) setProfiles(data);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar tus perfiles guardados.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-4xl pb-4">
        <header>
          <h1 className="font-rounded text-3xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">
            Guardados
          </h1>
        </header>

        <div
          role="tablist"
          aria-label="Tipos de elementos guardados"
          className="mt-5 grid grid-cols-2 rounded-18 border border-border bg-surface p-1 shadow-soft"
        >
          <CategoryTab
            active={category === "people"}
            onClick={() => setCategory("people")}
            icon={<PersonIcon />}
          >
            Personas
          </CategoryTab>
          <CategoryTab
            active={category === "communities"}
            onClick={() => setCategory("communities")}
            icon={<CommunityIcon />}
          >
            Comunidades
          </CategoryTab>
        </div>

        <p className="mt-5 text-sm leading-6 text-secondary">
          Perfiles y comunidades que quieres revisar más tarde.
        </p>

        <section className="mt-5">
          {category === "people" ? (
            loading ? (
              <div className="flex min-h-40 items-center justify-center"><Spinner /></div>
            ) : error ? (
              <p className="rounded-18 border border-red-200 bg-surface p-6 text-center text-sm font-semibold text-red-600 shadow-soft">
                {error}
              </p>
            ) : profiles.length === 0 ? (
              <EmptyState
                title="Todavía no tienes perfiles guardados"
                description="Pulsa el corazón de una persona para poder revisarla más tarde."
                action={<Link href="/usuarios" className="flex h-11 items-center rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button">Explorar personas</Link>}
              />
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <SavedPersonRow
                    key={profile.id}
                    profile={profile}
                    onOpen={() => setOpenUserId(profile.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <EmptyState
              title="Guardar comunidades llegará pronto"
              description="Actualmente CoFlow permite guardar perfiles de personas. El guardado de comunidades todavía no está disponible."
              icon={<CommunityIcon />}
              action={<Link href="/comunidades" className="flex h-11 items-center rounded-14 border border-primary bg-surface px-5 text-sm font-bold text-primary-dark shadow-soft">Explorar comunidades</Link>}
            />
          )}
        </section>

        <AnimatePresence>
          {openUserId && (
            <PersonPreviewPanel
              key={openUserId}
              userId={openUserId}
              onClose={() => setOpenUserId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function CategoryTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-14 px-3 text-sm font-bold transition-colors duration-200 ${
        active
          ? "border border-primary/30 bg-surface text-primary-dark shadow-soft"
          : "border border-transparent text-secondary"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function SavedPersonRow({
  profile,
  onOpen,
}: {
  profile: UserPublicProfile;
  onOpen: () => void;
}) {
  const traits = [
    profile.preferences?.smoking,
    profile.preferences?.cleanliness,
    profile.preferences?.lifestyle,
  ].filter((item): item is string => Boolean(item));
  const location = profile.community?.city ?? (profile.is_owner ? "Propietario" : "Busca comunidad");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-18 border border-border bg-surface p-3 text-left shadow-soft transition-transform duration-200 active:scale-[0.99] sm:p-4"
    >
      <UserAvatar
        firstName={profile.first_name}
        lastName={profile.last_name}
        userId={profile.id}
        imageUrl={profile.avatar_url}
        size="xl"
        className="h-20 w-20 sm:h-24 sm:w-24"
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-base font-extrabold text-brand-dark sm:text-lg">
            {`${profile.first_name} ${profile.last_name}`.trim()}
          </span>
          {profile.is_verified && <VerifiedIcon />}
        </span>

        <span className="mt-1 block truncate text-xs text-secondary sm:text-sm">
          {[profile.age !== null ? `${profile.age} años` : null, location].filter(Boolean).join(" · ")}
        </span>

        {traits.length > 0 && (
          <span className="mt-1.5 block truncate text-xs text-secondary">
            {traits.join(" · ")}
          </span>
        )}

        {profile.rental_budget !== null && (
          <span className="mt-2 inline-flex rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-bold text-primary-dark shadow-soft">
            Hasta {profile.rental_budget.toLocaleString("es-ES")} € / mes
          </span>
        )}
      </span>

      <span className="flex items-center gap-3 text-primary">
        <HeartIcon />
        <ChevronIcon />
      </span>
    </button>
  );
}

function PersonIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>; }
function CommunityIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 7a3 3 0 0 1 0 6M22 21a5 5 0 0 0-5-5" /></svg>; }
function VerifiedIcon() { return <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-white"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg></span>; }
function HeartIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" /></svg>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>; }
