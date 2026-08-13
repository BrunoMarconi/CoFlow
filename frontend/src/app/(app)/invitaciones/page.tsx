"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, Inbox, MapPin, Send, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SkeletonCard from "@/components/ui/SkeletonCard";
import CommunityApplicationsManager from "@/components/comunidad/CommunityApplicationsManager";
import CommunityInvitationsManager from "@/components/comunidad/CommunityInvitationsManager";
import { cancelApplication, getMyApplications } from "@/services/applications";
import { getReceivedInvitations } from "@/services/invitations";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { CommunityApplication } from "@/types/application";
import type { CommunityInvitationInboxItem } from "@/types/invitation";

type Tab = "RECEIVED" | "SENT";

export default function InvitationsPage() {
  const { user, community, loading, communityLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("RECEIVED");

  if (loading || communityLoading || !user) {
    return <div className="mx-auto grid w-full max-w-4xl gap-4 pt-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  const isCommunityOwner = Boolean(community && community.owner_id === user.id);

  return (
    <main className="mx-auto w-full max-w-4xl pb-8 sm:pb-12">
      <header>
        <div className="flex items-center gap-3">
          <Link href="/perfil" aria-label="Volver al perfil" className="flex h-11 w-11 shrink-0 items-center justify-start md:hidden">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#222222] sm:text-4xl">Invitaciones</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#717171] sm:text-base">Decide con calma quién entra en vuestra comunidad.</p>
          </div>
        </div>
      </header>

      <div className="mt-7 grid grid-cols-2 rounded-2xl border border-[#dddddd] bg-white p-1" role="tablist" aria-label="Tipo de invitaciones">
        <TabButton active={tab === "RECEIVED"} onClick={() => setTab("RECEIVED")} icon={<Inbox className="h-4 w-4" />} label="Recibidas" />
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
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition", active ? "bg-black text-white shadow-sm" : "text-[#717171] hover:bg-[#f7f7f7] hover:text-[#222222]")}>{icon}{label}</button>;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-xl font-semibold tracking-[-0.025em] text-[#222222]">{title}</h2><p className="mt-1 text-sm leading-6 text-[#717171]">{description}</p></div>;
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-[#b0b0b0] bg-white p-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f7f7]">{icon}</span><p className="mt-3 max-w-md text-sm leading-6 text-[#717171]">{text}</p></div>;
}

function MyApplications() {
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyApplications().then((data) => { if (active) setApplications(data); }).catch(() => { if (active) setError("No hemos podido cargar tus solicitudes."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function cancel(application: CommunityApplication) {
    if (busyId !== null || !window.confirm("¿Quieres cancelar esta solicitud?")) return;
    setBusyId(application.id);
    try {
      const updated = await cancelApplication(application.id);
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
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

  return <div className="divide-y divide-[#ebebeb] overflow-hidden rounded-2xl border border-[#dddddd] bg-white">{applications.map((application) => (
    <article key={application.id} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-sm font-semibold text-[#222222]">Comunidad #{application.community_id}</p><p className="mt-1 text-xs text-[#717171]">Enviada el {formatDate(application.created_at)}</p></div>
        <Status status={application.status} />
      </div>
      {application.message && <p className="mt-3 text-sm leading-6 text-[#717171]">{application.message}</p>}
      <div className="mt-4 flex gap-2">
        <Link href={`/comunidades/${application.community_id}`} className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-black bg-white px-4 text-sm font-semibold text-[#222222]">Ver comunidad</Link>
        {application.status === "PENDING" && <button type="button" disabled={busyId !== null} onClick={() => cancel(application)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">{busyId === application.id ? "Cancelando…" : "Cancelar"}</button>}
      </div>
    </article>
  ))}</div>;
}

function Status({ status }: { status: CommunityApplication["status"] }) {
  const labels = { PENDING: "Pendiente", ACCEPTED: "Aceptada", REJECTED: "Rechazada", CANCELLED: "Cancelada" };
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase", status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-[#f7f7f7] text-[#717171]")}>{labels[status]}</span>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
