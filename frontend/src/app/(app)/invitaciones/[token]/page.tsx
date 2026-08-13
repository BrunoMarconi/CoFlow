"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, MapPin, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { acceptInvitation, declineInvitation, getInvitationByToken } from "@/services/invitations";
import type { CommunityInvitationDetail } from "@/types/invitation";

const STATUS_MESSAGES: Record<string, string> = {
  ACCEPTED: "Esta invitación ya fue aceptada.",
  DECLINED: "Esta invitación fue rechazada.",
  CANCELLED: "La comunidad ha cancelado esta invitación.",
  EXPIRED: "Esta invitación ha caducado.",
};

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { refreshCommunity } = useAuth();
  const [invitation, setInvitation] = useState<CommunityInvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    let active = true;
    getInvitationByToken(params.token)
      .then((data) => { if (active) setInvitation(data); })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.token]);

  async function handleAccept() {
    if (submitting) return;
    setSubmitting(true);
    setActionError("");
    try {
      await acceptInvitation(params.token);
      await refreshCommunity();
      router.replace("/mi-comunidad");
    } catch (error) {
      setActionError(getCommunityErrorMessage(error, "No hemos podido aceptar la invitación. Inténtalo de nuevo."));
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (submitting) return;
    setSubmitting(true);
    setActionError("");
    try {
      await declineInvitation(params.token);
      setDeclined(true);
    } catch (error) {
      setActionError(getCommunityErrorMessage(error, "No hemos podido rechazar la invitación. Inténtalo de nuevo."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;

  if (notFound || !invitation) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f7f7f7]"><Users className="h-6 w-6" /></span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#222222]">Este enlace ya no está disponible</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#717171]">Puede que esté mal copiado o que la invitación ya no exista.</p>
        <Link href="/invitaciones" className="mt-7 flex min-h-12 items-center justify-center rounded-xl bg-black px-6 text-sm font-semibold text-white">Volver a invitaciones</Link>
      </main>
    );
  }

  const isPending = invitation.status === "PENDING" && !declined;
  const remaining = Math.max(invitation.community.max_members - invitation.community.member_count, 0);

  return (
    <main className="mx-auto w-full max-w-2xl pb-8">
      <Link href="/invitaciones" aria-label="Volver a invitaciones" className="flex h-11 w-11 items-center justify-start"><ArrowLeft className="h-6 w-6" /></Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-[#dddddd] bg-white">
        <div className="flex min-h-48 flex-col justify-end bg-[linear-gradient(135deg,#f7f7f7_0%,#ececec_100%)] p-6 sm:min-h-56 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"><Users className="h-5 w-5" /></span>
          <p className="mt-8 text-sm font-medium text-[#717171]">Te han invitado a formar parte de</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#222222] sm:text-4xl">{invitation.community.name}</h1>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-5 border-b border-[#ebebeb] pb-6 sm:grid-cols-3">
            <Fact icon={<MapPin className="h-5 w-5" />} label="Ubicación" value={invitation.community.city} />
            <Fact icon={<Users className="h-5 w-5" />} label="Miembros" value={`${invitation.community.member_count}/${invitation.community.max_members}`} />
            <Fact icon={<Check className="h-5 w-5" />} label="Disponibles" value={`${remaining} ${remaining === 1 ? "plaza" : "plazas"}`} />
          </div>

          <p className="mt-6 text-sm leading-6 text-[#717171]">{invitation.community.owner_first_name} {invitation.community.owner_last_name} te invita a compartir este espacio. Si aceptas, entrarás en la comunidad y tendrás acceso a su conversación privada.</p>

          {isPending ? <p className="mt-4 flex items-center gap-2 text-xs font-medium text-[#717171]"><CalendarDays className="h-4 w-4" />Caduca el {formatExpiry(invitation.expires_at)}</p> : null}

          {declined ? (
            <div className="mt-6 rounded-2xl bg-[#f7f7f7] p-4 text-center text-sm font-medium text-[#717171]">Has rechazado esta invitación.</div>
          ) : !isPending ? (
            <div className="mt-6 rounded-2xl bg-[#f7f7f7] p-4 text-center text-sm font-medium text-[#717171]">{STATUS_MESSAGES[invitation.status] ?? "Esta invitación ya no está disponible."}</div>
          ) : (
            <>
              {actionError ? <p role="alert" className="mt-5 rounded-2xl border border-red-200 p-4 text-sm font-medium text-red-600">{actionError}</p> : null}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
                <button type="button" onClick={handleAccept} disabled={submitting || remaining === 0} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-black px-6 text-sm font-semibold text-white transition hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-1">{submitting ? "Procesando…" : remaining === 0 ? "Comunidad completa" : "Aceptar invitación"}</button>
                <button type="button" onClick={handleDecline} disabled={submitting} className="flex min-h-12 w-full items-center justify-center rounded-xl border border-black bg-white px-6 text-sm font-semibold text-[#222222] transition hover:bg-[#f7f7f7] disabled:opacity-40 sm:flex-1">Rechazar</button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div><span className="text-[#222222]">{icon}</span><p className="mt-2 text-xs text-[#717171]">{label}</p><p className="mt-0.5 text-sm font-semibold text-[#222222]">{value}</p></div>;
}

function formatExpiry(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
