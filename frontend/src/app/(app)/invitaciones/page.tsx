"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Inbox, Send, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import CommunityApplicationsManager from "@/components/comunidad/CommunityApplicationsManager";
import CommunityInvitationsManager from "@/components/comunidad/CommunityInvitationsManager";
import { cancelApplication, getMyApplications } from "@/services/applications";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { CommunityApplication } from "@/types/application";

type Tab = "RECEIVED" | "SENT";

export default function InvitationsPage() {
  const { user, community, loading, communityLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("RECEIVED");

  if (loading || communityLoading || !user) return <Spinner />;
  const isCommunityOwner = Boolean(community && community.owner_id === user.id);

  return (
    <div className="mx-auto w-full max-w-4xl pb-6 sm:pb-10">
      <header>
        <div className="flex items-center gap-3 md:block">
          <Link href="/perfil" aria-label="Volver al perfil" className="flex h-10 w-10 shrink-0 items-center justify-start text-brand-dark md:hidden"><ArrowLeft className="h-6 w-6" /></Link>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-brand-dark sm:text-4xl">Invitaciones</h1>
        </div>
        <p className="mt-1 max-w-xl text-sm leading-6 text-secondary sm:mt-2 sm:text-base">Gestiona las invitaciones por enlace y las solicitudes para entrar en comunidades.</p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3" role="tablist" aria-label="Tipo de invitaciones">
        <TabButton active={tab === "RECEIVED"} onClick={() => setTab("RECEIVED")} icon={<Inbox className="h-5 w-5" />} label="Recibidas" />
        <TabButton active={tab === "SENT"} onClick={() => setTab("SENT")} icon={<Send className="h-5 w-5" />} label="Enviadas" />
      </div>

      {tab === "RECEIVED" ? (
        <div className="mt-6 space-y-5">
          <section>
            <SectionHeading title="Invitaciones a comunidades" description="Las invitaciones personales se abren desde el enlace que te comparte una comunidad." />
            <div className="mt-3 rounded-18 border border-dashed border-border bg-surface p-6 text-center shadow-soft">
              <Inbox className="mx-auto h-7 w-7 text-primary" />
              <p className="mt-3 text-sm font-bold text-foreground">Tus invitaciones llegan mediante un enlace</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-secondary sm:text-sm">Cuando recibas uno, ábrelo para ver la comunidad y aceptar o rechazar la invitación de forma segura.</p>
            </div>
          </section>

          <section>
            <SectionHeading title="Solicitudes para tu comunidad" description="Personas que quieren ocupar una plaza en tu comunidad." />
            <div className="mt-3">
              {isCommunityOwner && community ? (
                <CommunityApplicationsManager communityId={community.id} />
              ) : (
                <EmptyState text={community ? "Solo la persona administradora puede gestionar las solicitudes." : "Cuando crees una comunidad, aquí podrás gestionar sus solicitudes."} />
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <section>
            <SectionHeading title="Tus solicitudes" description="Solicitudes que has enviado para unirte a otras comunidades." />
            <div className="mt-3"><MyApplications /></div>
          </section>

          <section>
            <SectionHeading title="Enlaces enviados" description="Genera y gestiona los enlaces para invitar a miembros actuales." />
            <div className="mt-3 overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
              {isCommunityOwner && community ? (
                <CommunityInvitationsManager communityId={community.id} />
              ) : (
                <EmptyState text={community ? "Solo la persona administradora puede crear invitaciones." : "Necesitas una comunidad para generar invitaciones."} />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("flex h-14 items-center justify-center gap-2 rounded-18 border bg-surface text-sm font-bold shadow-soft transition sm:text-base", active ? "border-primary text-primary-dark" : "border-border text-secondary hover:border-primary/30")}>{icon}{label}</button>;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center text-primary"><Users className="h-5 w-5" /></span><div><h2 className="text-lg font-extrabold text-foreground">{title}</h2><p className="mt-0.5 text-sm leading-5 text-secondary">{description}</p></div></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-18 border border-dashed border-border bg-surface p-6 text-center text-sm text-secondary shadow-soft">{text}</div>;
}

function MyApplications() {
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyApplications().then((data) => { if (active) setApplications(data); }).catch(() => { if (active) setError("No pudimos cargar tus solicitudes."); }).finally(() => { if (active) setLoading(false); });
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
      toast.error("No pudimos cancelar la solicitud");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="rounded-18 border border-border bg-surface p-6 text-center text-sm text-secondary shadow-soft">Cargando...</div>;
  if (error) return <div className="rounded-18 border border-red-200 bg-surface p-5 text-center text-sm font-semibold text-red-600 shadow-soft">{error}</div>;
  if (applications.length === 0) return <EmptyState text="Todavía no has enviado solicitudes a ninguna comunidad." />;

  return <div className="space-y-3">{applications.map((application) => (
    <article key={application.id} className="rounded-18 border border-border bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-sm font-extrabold text-foreground">Solicitud a la comunidad #{application.community_id}</p><p className="mt-1 text-xs text-secondary">Enviada el {formatDate(application.created_at)}</p></div>
        <Status status={application.status} />
      </div>
      {application.message && <p className="mt-3 text-sm leading-6 text-secondary">{application.message}</p>}
      <div className="mt-4 flex gap-2">
        <Link href={`/comunidades/${application.community_id}`} className="flex h-10 flex-1 items-center justify-center rounded-12 border border-border bg-surface text-sm font-bold text-foreground shadow-soft">Ver comunidad</Link>
        {application.status === "PENDING" && <button type="button" disabled={busyId !== null} onClick={() => cancel(application)} className="h-10 rounded-12 border border-red-200 bg-surface px-4 text-sm font-bold text-red-600 shadow-soft disabled:opacity-50">{busyId === application.id ? "Cancelando..." : "Cancelar"}</button>}
      </div>
    </article>
  ))}</div>;
}

function Status({ status }: { status: CommunityApplication["status"] }) {
  const labels = { PENDING: "Pendiente", ACCEPTED: "Aceptada", REJECTED: "Rechazada", CANCELLED: "Cancelada" };
  return <span className={cn("shrink-0 rounded-full border bg-surface px-2.5 py-1 text-[10px] font-bold uppercase shadow-soft", status === "ACCEPTED" ? "border-primary/30 text-primary-dark" : status === "REJECTED" ? "border-red-200 text-red-600" : "border-border text-secondary")}>{labels[status]}</span>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
