"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import PersonPreviewPanel from "@/components/usuario/PersonPreviewPanel";
import MatchScoreBadge from "@/components/usuario/MatchScoreBadge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { getSavedProfiles, saveUserProfile, unsaveUserProfile } from "@/services/users";
import type { UserConnectionStatusLabel, UserPublicProfile } from "@/types/userPublic";

type SavedFilter = "all" | "available" | "connected";
type SavedSort = "match" | "name";

const CONNECTION_LABELS: Partial<Record<UserConnectionStatusLabel, string>> = {
  ACCEPTED: "Conectados",
  PENDING_SENT: "Solicitud enviada",
  PENDING_RECEIVED: "Quiere conectar",
};

export default function PersonasGuardadasPage() {
  const [profiles, setProfiles] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SavedFilter>("all");
  const [sort, setSort] = useState<SavedSort>("match");
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [removedProfile, setRemovedProfile] = useState<UserPublicProfile | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSavedProfiles()
      .then((data) => { if (active) setProfiles(data); })
      .catch(() => { if (active) setError("No pudimos cargar tus perfiles guardados."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return profiles
      .filter((profile) => {
        if (filter === "available" && !profile.is_looking_for_roommates) return false;
        if (filter === "connected" && profile.connection_status !== "ACCEPTED") return false;
        if (!normalizedQuery) return true;
        return [profile.first_name, profile.last_name, profile.occupation, profile.community?.city, ...profile.interests]
          .filter(Boolean).join(" ").toLocaleLowerCase("es").includes(normalizedQuery);
      })
      .sort((left, right) => sort === "name"
        ? `${left.first_name} ${left.last_name}`.localeCompare(`${right.first_name} ${right.last_name}`, "es")
        : (right.match_score ?? -1) - (left.match_score ?? -1));
  }, [filter, profiles, query, sort]);

  async function removeSavedProfile(profile: UserPublicProfile) {
    if (updatingId) return;
    setUpdatingId(profile.id);
    setProfiles((current) => current.filter((item) => item.id !== profile.id));
    setRemovedProfile(profile);
    try {
      await unsaveUserProfile(profile.id);
    } catch {
      setProfiles((current) => [profile, ...current]);
      setRemovedProfile(null);
      setError("No pudimos quitar este perfil. Inténtalo de nuevo.");
    } finally { setUpdatingId(null); }
  }

  async function undoRemove() {
    if (!removedProfile || updatingId) return;
    const profile = removedProfile;
    setUpdatingId(profile.id);
    setProfiles((current) => [profile, ...current]);
    setRemovedProfile(null);
    try {
      await saveUserProfile(profile.id);
    } catch {
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      setRemovedProfile(profile);
      setError("No pudimos volver a guardar este perfil.");
    } finally { setUpdatingId(null); }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-5xl pb-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Tu selección</p>
            <h1 className="font-rounded text-3xl font-semibold tracking-[-0.035em] text-brand-dark sm:text-4xl">Personas guardadas</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">Vuelve a los perfiles que te interesan y decide con calma con quién conectar.</p>
          </div>
          <Link href="/usuarios" className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-semibold text-white transition-transform active:scale-[0.98] sm:flex">
            Explorar personas <ArrowIcon />
          </Link>
        </header>

        {!loading && profiles.length > 0 && (
          <section className="mt-7 rounded-[22px] border border-black/[0.06] bg-[#fbfcfa] p-3 shadow-[0_10px_30px_rgba(20,42,32,.045)] sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Buscar entre personas guardadas</span><SearchIcon />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, ciudad o interés" className="h-11 w-full rounded-[14px] border border-black/[0.07] bg-white pl-10 pr-4 text-sm text-brand-dark outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
              </label>
              <label className="relative shrink-0">
                <span className="sr-only">Ordenar perfiles</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as SavedSort)} className="h-11 w-full appearance-none rounded-[14px] border border-black/[0.07] bg-white pl-4 pr-10 text-sm font-semibold text-brand-dark outline-none focus:border-primary/40 sm:w-auto">
                  <option value="match">Mayor afinidad</option><option value="name">Nombre</option>
                </select><SelectChevronIcon />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Filtrar personas guardadas">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Todos · {profiles.length}</FilterChip>
              <FilterChip active={filter === "available"} onClick={() => setFilter("available")}>Buscan convivencia</FilterChip>
              <FilterChip active={filter === "connected"} onClick={() => setFilter("connected")}>Conectados</FilterChip>
            </div>
          </section>
        )}

        <section className="mt-5" aria-live="polite">
          {loading ? <div className="flex min-h-48 items-center justify-center"><Spinner /></div>
          : error && profiles.length === 0 ? <p className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">{error}</p>
          : profiles.length === 0 ? <EmptyState variant="saved" title="Tu lista está lista para empezar" description="Guarda los perfiles que te llamen la atención y compáralos aquí cuando quieras." action={<Link href="/usuarios" className="flex h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-white">Explorar personas</Link>} />
          : visibleProfiles.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-black/10 bg-[#fbfcfa] px-6 py-12 text-center">
              <p className="font-semibold text-brand-dark">No hay coincidencias</p><p className="mt-1 text-sm text-secondary">Prueba con otra búsqueda o cambia el filtro.</p>
              <button type="button" onClick={() => { setQuery(""); setFilter("all"); }} className="mt-4 text-sm font-bold text-primary-dark underline underline-offset-4">Limpiar filtros</button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence initial={false}>
                {visibleProfiles.map((profile) => <SavedPersonCard key={profile.id} profile={profile} removing={updatingId === profile.id} onOpen={() => setOpenUserId(profile.id)} onRemove={() => removeSavedProfile(profile)} />)}
              </AnimatePresence>
            </div>
          )}
        </section>

        <Link href="/usuarios" className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-brand-dark text-sm font-semibold text-white sm:hidden">Explorar más personas <ArrowIcon /></Link>

        <AnimatePresence>
          {removedProfile && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+.75rem)] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-[16px] border border-white/10 bg-brand-dark px-4 py-3 text-sm text-white shadow-[0_16px_45px_rgba(8,30,21,.3)] sm:bottom-6" role="status">
            <span className="min-w-0 flex-1 truncate">Perfil eliminado de guardados</span>
            <button type="button" onClick={undoRemove} disabled={Boolean(updatingId)} className="shrink-0 font-bold text-[#bfe5d3] disabled:opacity-50">Deshacer</button>
            <button type="button" onClick={() => setRemovedProfile(null)} aria-label="Cerrar aviso" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10"><CloseIcon /></button>
          </motion.div>}
        </AnimatePresence>
        <AnimatePresence>{openUserId && <PersonPreviewPanel key={openUserId} userId={openUserId} onClose={() => setOpenUserId(null)} />}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors ${active ? "bg-brand-dark text-white" : "border border-black/[0.07] bg-white text-secondary hover:text-brand-dark"}`}>{children}</button>;
}

function SavedPersonCard({ profile, removing, onOpen, onRemove }: { profile: UserPublicProfile; removing: boolean; onOpen: () => void; onRemove: () => void }) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const location = profile.community?.city ?? (profile.is_owner ? "Propietario/a" : "Busca comunidad");
  const status = CONNECTION_LABELS[profile.connection_status];
  const details = [profile.occupation, location].filter(Boolean).join(" · ");
  const interests = profile.interests.slice(0, 2);
  return (
    <motion.article layout exit={{ opacity: 0, scale: 0.97 }} className="group relative flex min-h-44 flex-col rounded-[20px] border border-black/[0.06] bg-[#fbfcfa] p-4 shadow-[0_8px_26px_rgba(20,42,32,.045)] transition-shadow sm:hover:shadow-[0_16px_36px_rgba(20,42,32,.09)]">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0"><UserAvatar firstName={profile.first_name} lastName={profile.last_name} userId={profile.id} imageUrl={profile.avatar_url} size="lg" />{profile.is_online && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" aria-label="En línea" />}</div>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-1.5"><span className="truncate text-[16px] font-semibold tracking-[-0.02em] text-brand-dark">{fullName}</span>{profile.is_verified && <VerifiedIcon />}</span>
          <span className="mt-1 block truncate text-xs text-secondary">{[profile.age !== null ? `${profile.age} años` : null, details].filter(Boolean).join(" · ")}</span>
        </button>
        <button type="button" onClick={onRemove} disabled={removing} aria-label={`Quitar a ${fullName} de guardados`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white text-primary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><HeartIcon /></button>
      </div>
      {(status || profile.is_looking_for_roommates || interests.length > 0) && <div className="mt-4 flex flex-wrap gap-1.5">{status && <span className="rounded-full bg-[#dfece5] px-2.5 py-1 text-[10px] font-bold text-primary-dark">{status}</span>}{!status && profile.is_looking_for_roommates && <span className="rounded-full bg-[#dfece5] px-2.5 py-1 text-[10px] font-bold text-primary-dark">Busca convivencia</span>}{interests.map((interest) => <span key={interest} className="rounded-full bg-[#eef0ed] px-2.5 py-1 text-[10px] font-semibold text-secondary">{interest}</span>)}</div>}
      <button type="button" onClick={onOpen} className="mt-auto flex items-end justify-between gap-3 border-t border-black/[0.06] pt-4 text-left">
        <span className="text-xs text-secondary">{profile.rental_budget !== null ? <><strong className="font-semibold text-brand-dark">{profile.rental_budget.toLocaleString("es-ES")} €</strong> / mes</> : "Presupuesto por definir"}</span>
        {profile.match_score !== null ? <MatchScoreBadge score={profile.match_score} size="sm" /> : <span className="text-xs font-semibold text-primary-dark">Ver perfil <span aria-hidden="true">→</span></span>}
      </button>
    </motion.article>
  );
}

function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
function SelectChevronIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>; }
function ArrowIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>; }
function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>; }
function VerifiedIcon() { return <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-white"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg></span>; }
function HeartIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" /></svg>; }
