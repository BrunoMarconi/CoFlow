"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CircleAlert, MapPin, Sparkles, UsersRound, WalletCards } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { getAdminCommunities, updateAdminCommunityStatus } from "@/services/admin";
import { COMMUNITY_STATUS_LABELS } from "@/lib/admin";
import { cn } from "@/lib/utils";
import type { AdminCommunitySummary, CommunityFormationStatus } from "@/types/admin";

export default function AdminCommunitiesPage() {
  const queryClient = useQueryClient();
  const { data = [], isPending, isError, refetch } = useQuery({ queryKey: ["admin-communities"], queryFn: getAdminCommunities, staleTime: 10_000 });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CommunityFormationStatus }) => updateAdminCommunityStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-communities"] }),
  });

  if (isPending) return <PageSkeleton variant="cards" />;
  if (isError) return <ErrorState title="No hemos podido cargar las comunidades" description="Comprueba la conexión e inténtalo de nuevo." onRetry={() => void refetch()} />;

  const forming = data.filter((community) => community.formation_status === "FORMING").length;
  const recommendations = data.reduce((total, community) => total + community.candidates.filter((candidate) => candidate.eligible).length, 0);
  return (
    <div>
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#627D70]">Operaciones de comunidad</p>
        <h1 className="mt-2 font-rounded text-3xl font-semibold tracking-[-0.045em] text-[#243a31] sm:text-4xl">Comunidades reales</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65756e]">Grupos con dos o más personas, estado operativo y candidatos compatibles para completar cada convivencia.</p>
      </header>

      <dl className="mt-6 grid grid-cols-3 divide-x divide-[#627D70]/10 overflow-hidden rounded-2xl border border-[#627D70]/10 bg-white shadow-[0_10px_30px_rgba(67,91,80,0.07)]">
        <Metric label="Comunidades" value={data.length} />
        <Metric label="En formación" value={forming} />
        <Metric label="Candidatos" value={recommendations} />
      </dl>

      {data.length === 0 ? <div className="mt-6 rounded-[28px] border border-dashed border-[#627D70]/25 bg-white px-6 py-14 text-center"><UsersRound className="mx-auto h-7 w-7 text-[#627D70]" /><p className="mt-3 font-rounded text-lg font-semibold text-[#243a31]">Aún no hay comunidades activas</p><p className="mt-1 text-sm text-[#65756e]">Cuando exista el primer grupo real, aparecerá aquí.</p></div> : <div className="mt-6 grid gap-5">{data.map((community) => <CommunityCard key={community.id} community={community} busy={statusMutation.isPending && statusMutation.variables?.id === community.id} onStatus={(status) => statusMutation.mutate({ id: community.id, status })} />)}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="px-2 py-4 text-center sm:px-5"><dd className="font-rounded text-2xl font-semibold tabular-nums tracking-[-0.04em] text-[#243a31] sm:text-3xl">{value}</dd><dt className="mt-0.5 truncate text-[11px] font-semibold text-[#65756e] sm:text-xs">{label}</dt></div>; }

function CommunityCard({ community, busy, onStatus }: { community: AdminCommunitySummary; busy: boolean; onStatus: (status: CommunityFormationStatus) => void }) {
  const location = [community.neighborhood, community.city].filter(Boolean).join(" · ");
  return <article className="overflow-hidden rounded-[30px] border border-[#627D70]/10 bg-white shadow-[0_12px_38px_rgba(67,91,80,0.07)]">
    <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><h2 className="font-rounded text-2xl font-semibold tracking-[-0.035em] text-[#243a31]">{community.name}</h2><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", community.formation_status === "FORMED" ? "bg-[#dfece5] text-[#3f6352]" : "bg-[#f0eadc] text-[#7d653c]")}>{COMMUNITY_STATUS_LABELS[community.formation_status]}</span></div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#65756e]"><MapPin className="h-4 w-4 text-[#627D70]" />{location}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3"><Detail icon={<UsersRound />} label="Miembros" value={`${community.members.length} de ${community.max_members}`} /><Detail icon={<WalletCards />} label="Presupuesto" value={community.monthly_rent ? `${community.monthly_rent.toLocaleString("es-ES")} €/persona` : "Sin indicar"} /><Detail icon={<CalendarDays />} label="Entrada" value={community.move_in_date ? new Date(community.move_in_date).toLocaleDateString("es-ES") : "Sin indicar"} /></div>
        <div className="mt-5"><p className="text-xs font-bold uppercase tracking-[0.11em] text-[#627D70]">Miembros</p><div className="mt-3 flex flex-wrap gap-3">{community.members.map((member) => <div key={member.id} className="flex items-center gap-2 rounded-full bg-[#f6fdfc] py-1.5 pl-1.5 pr-3"><Avatar name={`${member.first_name} ${member.last_name}`} imageUrl={member.avatar_url} size={32} /><span className="text-xs font-semibold text-[#43574e]">{member.first_name} {member.last_name}</span>{member.role === "OWNER" ? <span className="text-[9px] font-bold uppercase text-[#627D70]">admin</span> : null}</div>)}</div></div>
      </div>
      <aside className="rounded-2xl bg-[#ecf1f1] p-4"><label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#627D70]">Estado<select value={community.formation_status} disabled={busy} onChange={(event) => onStatus(event.target.value as CommunityFormationStatus)} className="h-11 rounded-xl border border-[#627D70]/15 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#243a31] outline-none"><option value="FORMING">En formación</option><option value="FORMED">Formada</option></select></label><div className="mt-4 border-t border-[#627D70]/10 pt-4"><p className="text-xs font-bold text-[#344a40]">{community.open_spots} {community.open_spots === 1 ? "plaza abierta" : "plazas abiertas"}</p><p className="mt-1 text-xs leading-5 text-[#65756e]">{community.formation_status === "FORMING" ? "Sigue incorporando personas compatibles." : "El grupo está consolidado para buscar vivienda."}</p></div></aside>
    </div>
    <div className="border-t border-[#627D70]/10 bg-[#f6fdfc]/75 p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#627D70]">Siguiente incorporación</p><h3 className="mt-1 font-rounded text-lg font-semibold text-[#243a31]">Candidatos recomendados</h3></div><span className="text-xs font-semibold text-[#718078]">Media frente al grupo</span></div>{community.candidates.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{community.candidates.map((candidate) => <div key={candidate.user.id} className={cn("rounded-2xl border bg-white p-4", candidate.eligible ? "border-[#627D70]/12" : "border-[#b76d5d]/20 opacity-75")}><div className="flex items-center gap-3"><Avatar name={`${candidate.user.first_name} ${candidate.user.last_name}`} imageUrl={candidate.user.avatar_url} size={40} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#344a40]">{candidate.user.first_name} {candidate.user.last_name}</p><p className="truncate text-xs text-[#718078]">{candidate.user.rental_budget ? `Hasta ${candidate.user.rental_budget.toLocaleString("es-ES")} €` : "Presupuesto sin indicar"}</p></div><span className={cn("rounded-full px-2 py-1 text-xs font-bold tabular-nums", candidate.eligible ? "bg-[#e5eeeb] text-[#4f6d60]" : "bg-[#f5e5e1] text-[#9d594c]")}>{candidate.score}%</span></div><ul className="mt-3 grid gap-1.5">{candidate.reasons.map((reason) => <li key={reason} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#65756e]"><Sparkles className="h-3 w-3 text-[#627D70]" />{reason}</li>)}</ul>{!candidate.eligible ? <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#9d594c]"><CircleAlert className="h-3.5 w-3.5" />No supera todos los filtros</p> : null}</div>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-[#627D70]/20 bg-white px-4 py-6 text-center text-sm text-[#718078]">Todavía no hay perfiles elegibles para esta comunidad.</p>}</div>
  </article>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-start gap-2 rounded-2xl bg-[#f6fdfc] p-3"><span className="mt-0.5 text-[#627D70] [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#85938c]">{label}</p><p className="mt-0.5 text-xs font-semibold text-[#43574e]">{value}</p></div></div>; }
