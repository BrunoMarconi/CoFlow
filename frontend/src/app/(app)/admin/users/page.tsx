"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle, Search, Sparkles, UserRoundCheck, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { getAdminUsers } from "@/services/admin";
import { ADMIN_USER_STATUSES, ADMIN_USER_STATUS_LABELS, adminStatusTone } from "@/lib/admin";
import { cn } from "@/lib/utils";
import type { AdminUserStatus, AdminUserSummary } from "@/types/admin";

type StatusFilter = AdminUserStatus | "ALL";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const deferredQuery = useDeferredValue(query.trim());
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin-users", deferredQuery, status],
    queryFn: () => getAdminUsers({ q: deferredQuery || undefined, status: status === "ALL" ? undefined : status }),
    staleTime: 10_000,
  });

  if (isPending) return <PageSkeleton variant="cards" />;
  if (isError || !data) return <ErrorState title="No hemos podido cargar las personas" description="Comprueba que el backend está disponible e inténtalo de nuevo." onRetry={() => void refetch()} />;

  const activeMatches = data.items.reduce((total, user) => total + user.suggested_matches, 0);
  const inCommunity = data.status_counts.IN_COMMUNITY ?? 0;

  return (
    <div>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#627D70]">Operaciones de comunidad</p>
          <h1 className="mt-2 font-rounded text-3xl font-semibold tracking-[-0.045em] text-[#243a31] sm:text-4xl">Personas y compatibilidad</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65756e]">Perfiles reales, filtros obligatorios y una puntuación que el equipo puede explicar.</p>
        </div>
        {isFetching ? <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#627D70]"><LoaderCircle className="h-4 w-4 animate-spin" /> Actualizando</span> : null}
      </header>

      <dl className="mt-6 grid grid-cols-3 divide-x divide-[#627D70]/10 overflow-hidden rounded-2xl border border-[#627D70]/10 bg-white shadow-[0_10px_30px_rgba(67,91,80,0.07)]">
        <Stat icon={<Users />} label="Perfiles" value={data.total} />
        <Stat icon={<Sparkles />} label="Matches elegibles" value={activeMatches} />
        <Stat icon={<UserRoundCheck />} label="En comunidad" value={inCommunity} />
      </dl>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(17rem,25rem)_1fr] lg:items-center">
        <label className="relative block">
          <span className="sr-only">Buscar personas</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#627D70]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o email" className="h-12 w-full rounded-2xl border border-[#627D70]/15 bg-white pl-11 pr-4 text-sm text-[#243a31] shadow-sm outline-none transition placeholder:text-[#91a099] focus:border-[#627D70] focus:ring-4 focus:ring-[#627D70]/10" />
        </label>
        <div role="tablist" aria-label="Estado de usuario" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["ALL", ...ADMIN_USER_STATUSES] as StatusFilter[]).map((value) => {
            const count = value === "ALL" ? Object.values(data.status_counts).reduce((sum, item) => sum + item, 0) : data.status_counts[value] ?? 0;
            return (
              <button key={value} type="button" role="tab" aria-selected={status === value} onClick={() => setStatus(value)} className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition", status === value ? "bg-[#627D70] text-white" : "border border-[#627D70]/10 bg-white text-[#52655c] hover:bg-[#ecf1f1]") }>
                {value === "ALL" ? "Todos" : ADMIN_USER_STATUS_LABELS[value]}
                <span className={cn("rounded-full px-1.5 py-0.5 tabular-nums", status === value ? "bg-white/15" : "bg-[#ecf1f1]")}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-[#627D70]/25 bg-white px-6 py-14 text-center">
          <p className="font-rounded text-lg font-semibold text-[#243a31]">No hay perfiles que coincidan</p>
          <p className="mt-1 text-sm text-[#65756e]">Prueba con otra búsqueda o cambia el estado.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:hidden">{data.items.map((user) => <UserMobileCard key={user.id} user={user} />)}</div>
          <div className="mt-5 hidden overflow-hidden rounded-3xl border border-[#627D70]/10 bg-white shadow-[0_12px_36px_rgba(67,91,80,0.07)] md:block">
            <table className="w-full text-left">
              <thead className="border-b border-[#627D70]/10 bg-[#ecf1f1]/70 text-xs font-bold uppercase tracking-[0.08em] text-[#627D70]">
                <tr><th className="px-5 py-4">Persona</th><th className="px-4 py-4">Estado</th><th className="px-4 py-4">Presupuesto</th><th className="px-4 py-4">Perfil</th><th className="px-4 py-4">Matches</th><th className="px-5 py-4"><span className="sr-only">Abrir</span></th></tr>
              </thead>
              <tbody className="divide-y divide-[#627D70]/10">{data.items.map((user) => <UserRow key={user.id} user={user} />)}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="min-w-0 px-2 py-4 text-center sm:px-5"><span className="mx-auto hidden h-8 w-8 items-center justify-center rounded-full bg-[#ecf1f1] text-[#627D70] sm:flex [&>svg]:h-4 [&>svg]:w-4">{icon}</span><dd className="font-rounded text-2xl font-semibold tabular-nums tracking-[-0.04em] text-[#243a31] sm:mt-2 sm:text-3xl">{value}</dd><dt className="mt-0.5 truncate text-[11px] font-semibold text-[#65756e] sm:text-xs">{label}</dt></div>;
}

function StatusChip({ status }: { status: AdminUserStatus }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", adminStatusTone(status))}>{ADMIN_USER_STATUS_LABELS[status]}</span>;
}

function UserIdentity({ user }: { user: AdminUserSummary }) {
  return <div className="flex min-w-0 items-center gap-3"><Avatar name={`${user.first_name} ${user.last_name}`} imageUrl={user.avatar_url} size={42} /><div className="min-w-0"><p className="truncate text-sm font-bold text-[#243a31]">{user.first_name} {user.last_name}</p><p className="truncate text-xs text-[#718078]">{user.email}</p>{user.community_name ? <p className="mt-0.5 truncate text-[11px] font-semibold text-[#627D70]">{user.community_name}</p> : null}</div></div>;
}

function UserRow({ user }: { user: AdminUserSummary }) {
  return <tr className="group transition hover:bg-[#f6fdfc]"><td className="px-5 py-4"><UserIdentity user={user} /></td><td className="px-4 py-4"><StatusChip status={user.admin_status} /></td><td className="px-4 py-4 text-sm font-semibold text-[#52655c]">{user.rental_budget ? `${user.rental_budget.toLocaleString("es-ES")} €` : <span className="text-[#9aa69f]">Sin indicar</span>}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#ecf1f1]"><div className="h-full rounded-full bg-[#627D70]" style={{ width: `${user.profile_completion}%` }} /></div><span className="text-xs font-semibold tabular-nums text-[#65756e]">{user.profile_completion}%</span></div></td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6fdfc] px-2.5 py-1 text-xs font-bold text-[#4f6d60]"><Sparkles className="h-3.5 w-3.5" />{user.suggested_matches}</span></td><td className="px-5 py-4 text-right"><Link href={`/admin/users/${user.id}`} aria-label={`Abrir perfil de ${user.first_name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#627D70] transition group-hover:bg-[#ecf1f1]"><ArrowRight className="h-4 w-4" /></Link></td></tr>;
}

function UserMobileCard({ user }: { user: AdminUserSummary }) {
  return <Link href={`/admin/users/${user.id}`} className="rounded-3xl border border-[#627D70]/10 bg-white p-4 shadow-[0_8px_24px_rgba(67,91,80,0.07)] transition active:scale-[0.99]"><div className="flex items-start justify-between gap-3"><UserIdentity user={user} /><ArrowRight className="mt-2 h-4 w-4 shrink-0 text-[#627D70]" /></div><div className="mt-4 flex flex-wrap items-center gap-2"><StatusChip status={user.admin_status} /><span className="rounded-full bg-[#f6fdfc] px-2.5 py-1 text-xs font-semibold text-[#52655c]">Perfil {user.profile_completion}%</span><span className="rounded-full bg-[#f6fdfc] px-2.5 py-1 text-xs font-semibold text-[#52655c]">{user.suggested_matches} matches</span></div></Link>;
}
