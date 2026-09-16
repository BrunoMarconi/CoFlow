"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Check, ChevronLeft, CircleAlert, CircleCheck, CircleDashed, Mail, MapPin, PawPrint, Phone, Sparkles, UserRound, Users, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { getAdminUser, reviewAdminMatch, updateAdminUserStatus } from "@/services/admin";
import { ADMIN_USER_STATUSES, ADMIN_USER_STATUS_LABELS, HABIT_LABELS, adminStatusTone } from "@/lib/admin";
import { cn } from "@/lib/utils";
import type { AdminHardFilter, AdminMatchSuggestion, AdminScoreFactor, AdminUserDetail, AdminUserStatus, MatchReviewStatus } from "@/types/admin";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["admin-user", userId], queryFn: () => getAdminUser(userId), enabled: Boolean(userId) });
  const statusMutation = useMutation({
    mutationFn: (status: AdminUserStatus) => updateAdminUserStatus(userId, status),
    onSuccess: (_, status) => queryClient.setQueryData<AdminUserDetail>(["admin-user", userId], (current) => current ? { ...current, user: { ...current.user, admin_status: status } } : current),
  });
  const matchMutation = useMutation({
    mutationFn: ({ candidateId, action }: { candidateId: string; action: "SAVE" | "DISMISS" | "PROPOSE" }) => reviewAdminMatch(userId, candidateId, action),
    onSuccess: (result, variables) => queryClient.setQueryData<AdminUserDetail>(["admin-user", userId], (current) => current ? { ...current, matches: current.matches.map((match) => match.user.id === variables.candidateId ? { ...match, review_status: result.status } : match), user: variables.action === "PROPOSE" && ["NEW", "INCOMPLETE", "LOOKING"].includes(current.user.admin_status) ? { ...current.user, admin_status: "MATCH_FOUND" } : current.user } : current),
  });

  if (isPending) return <PageSkeleton variant="community" />;
  if (isError || !data) return <ErrorState title="No pudimos abrir este perfil" description="Puede que ya no exista o que haya un problema de conexión." onRetry={() => void refetch()} action={<Link href="/admin/users" className="inline-flex h-11 items-center rounded-full bg-[#627D70] px-5 text-sm font-bold text-white">Volver a personas</Link>} />;

  const user = data.user;
  return (
    <div>
      <Link href="/admin/users" className="inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-[#627D70] hover:bg-[#ecf1f1]"><ChevronLeft className="h-4 w-4" /> Personas</Link>
      <header className="mt-3 grid gap-5 rounded-[28px] border border-[#627D70]/10 bg-white p-5 shadow-[0_12px_36px_rgba(67,91,80,0.08)] sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={`${user.first_name} ${user.last_name}`} imageUrl={user.avatar_url} size={72} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 className="truncate font-rounded text-2xl font-semibold tracking-[-0.04em] text-[#243a31] sm:text-3xl">{user.first_name} {user.last_name}</h1><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", adminStatusTone(user.admin_status))}>{ADMIN_USER_STATUS_LABELS[user.admin_status]}</span></div>
            <p className="mt-1 truncate text-sm text-[#65756e]">{user.age ? `${user.age} años` : "Edad sin indicar"}{user.occupation ? ` · ${user.occupation}` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[#627D70]"><a href={`mailto:${user.email}`} className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</a>{data.phone ? <a href={`tel:${data.phone}`} className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{data.phone}</a> : null}</div>
          </div>
        </div>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#718078]">
          Estado operativo
          <select value={user.admin_status} disabled={statusMutation.isPending} onChange={(event) => statusMutation.mutate(event.target.value as AdminUserStatus)} className="h-11 rounded-xl border border-[#627D70]/15 bg-[#f6fdfc] px-3 text-sm font-semibold normal-case tracking-normal text-[#243a31] outline-none focus:border-[#627D70]">
            {ADMIN_USER_STATUSES.map((status) => <option key={status} value={status}>{ADMIN_USER_STATUS_LABELS[status]}</option>)}
          </select>
        </label>
      </header>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <main className="min-w-0 space-y-5">
          <section className="rounded-[28px] border border-[#627D70]/10 bg-white p-5 sm:p-6">
            <SectionTitle eyebrow="Datos de decisión" title="Filtros obligatorios" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoTile icon={<MapPin />} label="Zona" value="No recogida todavía" missing />
              <InfoTile icon={<UserRound />} label="Presupuesto" value={user.rental_budget ? `Hasta ${user.rental_budget.toLocaleString("es-ES")} €/mes` : "Sin indicar"} missing={!user.rental_budget} />
              <InfoTile icon={<CircleDashed />} label="Entrada" value="No recogida todavía" missing />
              <InfoTile icon={<Users />} label="Situación" value={user.community_name ?? "Sin comunidad"} />
            </div>
            <p className="mt-3 rounded-xl bg-[#f6fdfc] px-3 py-2.5 text-xs leading-5 text-[#65756e]">Zona y fecha aparecen como datos ausentes: el algoritmo no los convierte en un rechazo silencioso.</p>
          </section>

          <section className="rounded-[28px] border border-[#627D70]/10 bg-white p-5 sm:p-6">
            <SectionTitle eyebrow="Perfil completo" title="Hábitos y preferencias" />
            {Object.keys(data.habits).length ? <dl className="mt-4 grid gap-x-7 sm:grid-cols-2">{Object.entries(data.habits).map(([key, value]) => <div key={key} className="border-b border-[#627D70]/10 py-3"><dt className="text-xs font-bold text-[#627D70]">{HABIT_LABELS[key] ?? key}</dt><dd className="mt-1 text-sm leading-5 text-[#43574e]">{value}</dd></div>)}</dl> : <p className="mt-4 rounded-2xl bg-[#fff6e8] p-4 text-sm text-[#805d28]">Este perfil aún no ha completado el test de convivencia.</p>}
          </section>

          <section>
            <div className="flex items-end justify-between gap-3"><SectionTitle eyebrow="Matching transparente" title="Matches sugeridos" /><span className="rounded-full bg-[#e5eeeb] px-3 py-1 text-xs font-bold text-[#4f6d60]">{data.matches.filter((match) => match.eligible).length} elegibles</span></div>
            <div className="mt-4 grid gap-4">{data.matches.length ? data.matches.map((match) => <MatchCard key={match.user.id} match={match} busy={matchMutation.isPending && matchMutation.variables?.candidateId === match.user.id} onAction={(action) => matchMutation.mutate({ candidateId: match.user.id, action })} />) : <div className="rounded-[28px] border border-dashed border-[#627D70]/25 bg-white p-8 text-center text-sm text-[#65756e]">No hay otras personas con las que comparar todavía.</div>}</div>
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-[28px] bg-[#29453a] p-5 text-white shadow-[0_18px_44px_rgba(41,69,58,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Lectura rápida</p><p className="mt-3 font-rounded text-4xl font-semibold tracking-[-0.05em]">{user.profile_completion}%</p><p className="mt-1 text-sm text-white/70">Perfil completado</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#bcd1c7]" style={{ width: `${user.profile_completion}%` }} /></div>
            <div className="mt-5 grid grid-cols-2 gap-2"><MiniStat label="Elegibles" value={data.matches.filter((match) => match.eligible).length} /><MiniStat label="Guardados" value={data.matches.filter((match) => match.review_status === "SAVED").length} /></div>
          </section>
          <section className="rounded-[28px] border border-[#627D70]/10 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#627D70]">Sobre la persona</p><p className="mt-3 text-sm leading-6 text-[#52655c]">{data.bio || "Sin biografía todavía."}</p><div className="mt-4 flex flex-wrap gap-2">{data.interests.length ? data.interests.map((interest) => <span key={interest} className="rounded-full bg-[#ecf1f1] px-3 py-1.5 text-xs font-semibold text-[#52655c]">{interest}</span>) : <span className="text-xs text-[#8b9892]">Sin intereses indicados</span>}</div></section>
        </aside>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#627D70]">{eyebrow}</p><h2 className="mt-1 font-rounded text-xl font-semibold tracking-[-0.03em] text-[#243a31] sm:text-2xl">{title}</h2></div>; }
function InfoTile({ icon, label, value, missing = false }: { icon: React.ReactNode; label: string; value: string; missing?: boolean }) { return <div className={cn("flex items-start gap-3 rounded-2xl p-3.5", missing ? "bg-[#fff8ed]" : "bg-[#f6fdfc]")}><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full [&>svg]:h-4 [&>svg]:w-4", missing ? "bg-[#f4e7d0] text-[#8b6128]" : "bg-[#e5eeeb] text-[#627D70]")}>{icon}</span><div><p className="text-xs font-bold text-[#718078]">{label}</p><p className="mt-0.5 text-sm font-semibold text-[#344a40]">{value}</p></div></div>; }
function MiniStat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-white/10 px-3 py-3"><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-[11px] font-semibold text-white/65">{label}</p></div>; }

function FilterRow({ filter }: { filter: AdminHardFilter }) {
  const Icon = filter.passed === true ? CircleCheck : filter.passed === false ? CircleAlert : CircleDashed;
  return <li className="flex gap-2.5 text-xs"><Icon className={cn("mt-0.5 h-4 w-4 shrink-0", filter.passed === true ? "text-[#4f8067]" : filter.passed === false ? "text-[#b15e4d]" : "text-[#9a8770]")} /><span><strong className="text-[#344a40]">{filter.label}:</strong> <span className="text-[#718078]">{filter.detail}</span></span></li>;
}
function FactorBar({ factor }: { factor: AdminScoreFactor }) { return <div><div className="flex items-center justify-between gap-2 text-xs"><span className="font-semibold text-[#52655c]">{factor.label} <span className="font-normal text-[#91a099]">· {factor.weight}%</span></span><strong className="tabular-nums text-[#344a40]">{factor.score}%</strong></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#ecf1f1]"><div className="h-full rounded-full bg-[#627D70]" style={{ width: `${factor.score}%` }} /></div></div>; }

function MatchCard({ match, busy, onAction }: { match: AdminMatchSuggestion; busy: boolean; onAction: (action: "SAVE" | "DISMISS" | "PROPOSE") => void }) {
  return <article className={cn("overflow-hidden rounded-[28px] border bg-white shadow-[0_10px_32px_rgba(67,91,80,0.06)]", match.eligible ? "border-[#627D70]/14" : "border-[#b76d5d]/20")}>
    <div className="p-5 sm:p-6"><div className="flex items-start gap-4"><Avatar name={`${match.user.first_name} ${match.user.last_name}`} imageUrl={match.user.avatar_url} size={52} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-rounded text-lg font-semibold text-[#243a31]">{match.user.first_name} {match.user.last_name}</h3>{match.review_status ? <ReviewBadge status={match.review_status} /> : null}</div><p className="mt-0.5 text-xs text-[#718078]">{match.user.age ? `${match.user.age} años` : "Edad sin indicar"}{match.user.occupation ? ` · ${match.user.occupation}` : ""}</p></div><div className={cn("flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4", match.eligible ? "border-[#c8ddd2] bg-[#f6fdfc] text-[#3e6653]" : "border-[#edd7d2] bg-[#fff8f6] text-[#9d594c]")}><strong className="text-lg tabular-nums">{match.score}%</strong><span className="text-[9px] font-bold uppercase">afinidad</span></div></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#627D70]">Filtros obligatorios</p><ul className="mt-3 grid gap-2.5">{match.hard_filters.map((filter) => <FilterRow key={filter.key} filter={filter} />)}</ul></div><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#627D70]">Cómo se calcula</p><div className="mt-3 grid gap-3">{match.factors.map((factor) => <FactorBar key={factor.key} factor={factor} />)}</div></div></div>
      {match.shared_interests.length ? <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#f6fdfc] px-3 py-2 text-xs text-[#52655c]"><Sparkles className="h-4 w-4 shrink-0 text-[#627D70]" /><span><strong>En común:</strong> {match.shared_interests.join(", ")}</span></p> : null}
    </div>
    <div className="flex flex-wrap gap-2 border-t border-[#627D70]/10 bg-[#f6fdfc]/70 px-5 py-3.5 sm:px-6"><button type="button" disabled={busy} onClick={() => onAction("SAVE")} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#627D70]/15 bg-white px-4 text-xs font-bold text-[#52655c] disabled:opacity-50 sm:flex-none"><Bookmark className="h-4 w-4" /> Guardar</button><button type="button" disabled={busy} onClick={() => onAction("DISMISS")} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#627D70]/15 bg-white px-4 text-xs font-bold text-[#756b67] disabled:opacity-50 sm:flex-none"><X className="h-4 w-4" /> Descartar</button><button type="button" disabled={busy || !match.eligible} onClick={() => onAction("PROPOSE")} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-[#627D70] px-5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto sm:w-auto"><Check className="h-4 w-4" /> Proponer match</button></div>
  </article>;
}
function ReviewBadge({ status }: { status: MatchReviewStatus }) { const label = status === "SAVED" ? "Guardado" : status === "DISMISSED" ? "Descartado" : "Propuesto"; return <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]", status === "PROPOSED" ? "bg-[#dfece5] text-[#3f6352]" : status === "SAVED" ? "bg-[#e8edf5] text-[#52647d]" : "bg-[#eee] text-[#6f6f6f]")}>{label}</span>; }
