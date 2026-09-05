"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, Clock3, Inbox, MapPin, Send, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SkeletonCard from "@/components/ui/SkeletonCard";
import CommunityApplicationsManager from "@/components/comunidad/CommunityApplicationsManager";
import CommunityInvitationsManager from "@/components/comunidad/CommunityInvitationsManager";
import { cancelApplication, getMyApplications } from "@/services/applications";
import { getReceivedInvitations } from "@/services/invitations";
import { getCommunity } from "@/services/communities";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { CommunityApplication } from "@/types/application";
import type { CommunityInvitationInboxItem } from "@/types/invitation";
import type { Community } from "@/types/community";

type Tab = "RECEIVED" | "SENT";

export default function InvitationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, community, loading, communityLoading } = useAuth();
  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "sent" ? "SENT" : "RECEIVED");

  if (loading || communityLoading || !user) {
    return <div className="mx-auto grid w-full max-w-4xl gap-4 pt-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  const isCommunityOwner = Boolean(community && community.owner_id === user.id);

  return (
    <main className="mx-auto w-full max-w-4xl pb-8 sm:pb-12">
      <header>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 shrink-0 items-center justify-start md:hidden">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Tu comunidad</p>
            <h1 className="font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">Solicitudes e invitaciones</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-secondary sm:text-base">Sigue tus solicitudes y decide con calma quién entra en vuestra comunidad.</p>
          </div>
        </div>
      </header>

      <div className="mt-7 grid grid-cols-2 rounded-[18px] border border-black/[0.06] bg-[#f1f3f1] p-1" role="tablist" aria-label="Tipo de solicitudes e invitaciones">
        <TabButton active={tab === "RECEIVED"} onClick={() => setTab("RECEIVED")} icon={<Inbox className="h-4 w-4" />} label="Para ti" />
        <TabButton active={tab === "SENT"} onClick={() => setTab("SENT")} icon={<Send className="h-4 w-4" />} label="Enviadas" />
      </div>

      {tab === "RECEIVED" ? (
        <div className="mt-8 space-y-10">
          <section>
            <SectionHeading title="Invitaciones a comunidades" description="Comunidades que quieren contar contigo." />
            <ReceivedInvitations />
          </section>

          <section>
            <SectionHeading title="Solicitudes para tu comunidad" description="Personas que quieren ocupar una plaza disponible." />
            <div className="mt-4">
              {isCommunityOwner && community ? (
                <CommunityApplicationsManager communityId={community.id} />
              ) : (
                <EmptyState icon={<Users className="h-6 w-6" />} text={community ? "Solo la persona administradora puede gestionar las solicitudes." : "Cuando crees una comunidad, sus solicitudes aparecerán aquí."} />
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <SectionHeading title="Tus solicitudes" description="Peticiones que has enviado para unirte a una comunidad." />
            <div className="mt-4"><MyApplications /></div>
          </section>

          <section>
            <SectionHeading title="Invitar personas" description="Invita directamente o comparte un enlace privado." />
            <div className="mt-4">
              {isCommunityOwner && community ? (
                <CommunityInvitationsManager communityId={community.id} />
              ) : (
                <EmptyState icon={<Send className="h-6 w-6" />} text={community ? "Solo la persona administradora puede crear invitaciones." : "Necesitas una comunidad para invitar personas."} />
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function ReceivedInvitations() {
  const { markNotificationsForLinkAsRead } = useAuth();
  const [items, setItems] = useState<CommunityInvitationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void markNotificationsForLinkAsRead("/invitaciones").catch(() => {});
    getReceivedInvitations()
      .then((data) => { if (active) setItems(data); })
      .catch(() => { if (active) setError("No hemos podido cargar tus invitaciones."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [markNotificationsForLinkAsRead]);

  if (loading) return <div className="mt-4 grid gap-3 sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>;
  if (error) return <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-white p-5 text-sm font-medium text-red-600">{error}</p>;
  if (items.length === 0) return <div className="mt-4"><EmptyState icon={<Inbox className="h-6 w-6" />} text="No tienes invitaciones pendientes. Cuando una comunidad te invite directamente, la verás aquí." /></div>;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const remaining = Math.max(item.community.max_members - item.community.member_count, 0);
        return (
          <Link key={item.id} href={`/invitaciones/${item.token}`} className="group flex min-h-48 flex-col rounded-2xl border border-[#dddddd] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#b0b0b0] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f7f7]"><Users className="h-5 w-5" /></span>
              <ChevronRight className="h-5 w-5 text-[#717171] transition group-hover:translate-x-0.5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-[#222222]">{item.community.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#717171]"><MapPin className="h-4 w-4" />{item.community.city}</p>
            <p className="mt-auto pt-5 text-sm font-medium text-[#222222]">{item.community.member_count} miembros · {remaining} {remaining === 1 ? "plaza" : "plazas"}</p>
          </Link>
        );
      })}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-[14px] px-3 text-sm font-semibold transition", active ? "bg-white text-brand-dark shadow-sm" : "text-secondary hover:text-brand-dark")}>{icon}{label}</button>;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-xl font-semibold tracking-[-0.025em] text-[#222222]">{title}</h2><p className="mt-1 text-sm leading-6 text-[#717171]">{description}</p></div>;
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-[#b0b0b0] bg-white p-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f7f7]">{icon}</span><p className="mt-3 max-w-md text-sm leading-6 text-[#717171]">{text}</p></div>;
}

function MyApplications() {
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
  const [communities, setCommunities] = useState<Record<number, Community>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getMyApplications().then(async (data) => {
      if (!active) return;
      setApplications(data);
      const uniqueIds = [...new Set(data.map((item) => item.community_id))];
      const results = await Promise.allSettled(uniqueIds.map((id) => getCommunity(id)));
      if (!active) return;
      const next: Record<number, Community> = {};
      results.forEach((result) => { if (result.status === "fulfilled") next[result.value.id] = result.value; });
      setCommunities(next);
    }).catch(() => { if (active) setError("No hemos podido cargar tus solicitudes."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function cancel(application: CommunityApplication) {
    if (busyId !== null) return;
    setBusyId(application.id);
    try {
      const updated = await cancelApplication(application.id);
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      setConfirmingId(null);
      toast.success("Solicitud cancelada");
    } catch {
      toast.error("No hemos podido cancelar la solicitud");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="rounded-2xl border border-[#dddddd] bg-white p-6 text-center text-sm text-[#717171]">Cargando…</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-white p-5 text-center text-sm font-medium text-red-600">{error}</div>;
  if (applications.length === 0) return <EmptyState icon={<Send className="h-6 w-6" />} text="Todavía no has enviado solicitudes a ninguna comunidad." />;

  const ordered = [...applications].sort((left, right) => {
    if (left.status === "PENDING" && right.status !== "PENDING") return -1;
    if (right.status === "PENDING" && left.status !== "PENDING") return 1;
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  return <div className="grid gap-3 sm:grid-cols-2">{ordered.map((application) => {
    const community = communities[application.community_id];
    const dateLabel = application.status === "PENDING" ? `Enviada el ${formatDate(application.created_at)}` : application.reviewed_at ? `Resuelta el ${formatDate(application.reviewed_at)}` : `Actualizada el ${formatDate(application.cancelled_at ?? application.created_at)}`;
    return (
    <article key={application.id} className="flex min-h-56 flex-col rounded-[20px] border border-black/[0.06] bg-[#fbfcfa] p-5 shadow-[0_8px_26px_rgba(20,42,32,.045)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-base font-semibold text-brand-dark">{community?.name ?? "Comunidad"}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-secondary">{community ? <><MapPin className="h-3.5 w-3.5" />{community.city}</> : `Solicitud #${application.id}`}</p></div>
        <Status status={application.status} />
      </div>
      {application.message && <p className="mt-4 line-clamp-3 text-sm leading-6 text-secondary">“{application.message}”</p>}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted"><Clock3 className="h-3.5 w-3.5" />{dateLabel}</p>
      <div className="mt-auto flex gap-2 pt-4">
        <Link href={`/comunidades/${application.community_id}`} className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand-dark px-4 text-sm font-semibold text-white">Ver comunidad</Link>
        {application.status === "PENDING" && <button type="button" disabled={busyId !== null} onClick={() => setConfirmingId(application.id)} aria-label="Cancelar solicitud" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-white text-secondary hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><X className="h-4 w-4" /></button>}
      </div>
      {confirmingId === application.id && <div className="mt-3 rounded-[14px] border border-red-100 bg-red-50/70 p-3"><p className="text-xs leading-5 text-red-800">¿Retirar esta solicitud? La comunidad dejará de verla como pendiente.</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => void cancel(application)} disabled={busyId !== null} className="h-9 flex-1 rounded-full bg-red-600 px-3 text-xs font-bold text-white disabled:opacity-50">{busyId === application.id ? "Retirando…" : "Sí, retirar"}</button><button type="button" onClick={() => setConfirmingId(null)} disabled={busyId !== null} className="h-9 flex-1 rounded-full bg-white px-3 text-xs font-bold text-brand-dark">Mantener</button></div></div>}
    </article>
  );})}</div>;
}

function Status({ status }: { status: CommunityApplication["status"] }) {
  const labels = { PENDING: "Pendiente", ACCEPTED: "Aceptada", REJECTED: "Rechazada", CANCELLED: "Cancelada" };
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold", status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : status === "REJECTED" ? "bg-red-50 text-red-600" : status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-[#eef0ed] text-secondary")}>{labels[status]}</span>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
