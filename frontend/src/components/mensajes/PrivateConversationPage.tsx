"use client";

import { useEffect, useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import PrivateChat from "@/components/mensajes/PrivateChat";
import ChatSettingsSheet from "@/components/chat/ChatSettingsSheet";
import UserSafetyActions from "@/components/usuario/UserSafetyActions";
import { getConnections, getPrivateMessages } from "@/services/connections";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { markConversationReadNow } from "@/lib/conversationReadState";
import { NAV_TRANSITION } from "@/lib/navTransition";
import type { UserConnection } from "@/types/connection";

export default function PrivateConversationPage({ connectionId, owner = false }: { connectionId: number; owner?: boolean }) {
  const router = useRouter();
  const { user, markNotificationsForLinkAsRead } = useAuth();
  const { setChatActive } = useMobileChrome();
  const [connection, setConnection] = useState<UserConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const listHref = owner ? "/propietarios/mensajes" : "/mensajes";

  useEffect(() => {
    setChatActive(true);
    return () => setChatActive(false);
  }, [setChatActive]);

  useEffect(() => {
    if (Number.isFinite(connectionId)) {
      markConversationReadNow(`connection:${connectionId}`);
      void markNotificationsForLinkAsRead(`/mensajes/${connectionId}`).catch(() => {});
    }
  }, [connectionId, markNotificationsForLinkAsRead]);

  useEffect(() => {
    let active = true;
    getConnections().then((connections) => {
      if (!active) return;
      const match = connections.find((item) => item.id === connectionId);
      if (match) setConnection(match); else setNotFound(true);
    }).catch(() => { if (active) setNotFound(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [connectionId]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  if (notFound || !connection || !user) return <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center"><h1 className="text-3xl font-bold tracking-tight text-brand-dark">No hemos encontrado esta conversación</h1><p className="mt-4 text-base leading-7 text-muted">Puede que la conexión haya sido eliminada o ya no esté disponible.</p><Link href={listHref} className="mt-7 inline-flex h-12 items-center justify-center rounded-14 bg-primary px-6 text-sm font-bold text-white shadow-button transition hover:bg-primary-hover">Volver a mensajes</Link></div>;

  const other = connection.requester.id === user.id ? connection.recipient : connection.requester;
  const fullName = `${other.first_name} ${other.last_name}`.trim();
  const initials = [other.first_name, other.last_name].filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <ViewTransition enter={NAV_TRANSITION} exit={NAV_TRANSITION} default="none">
      <div className="mx-auto flex h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] w-full max-w-4xl flex-col sm:h-auto sm:block">
        <div className="mb-2 flex shrink-0 items-center gap-3 border-b border-border/70 pb-2 sm:mb-4 sm:border-0 sm:pb-0">
          <Link href={listHref} aria-label="Volver a mensajes" transitionTypes={["nav-back"]} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-soft hover:text-brand-dark"><ArrowLeftIcon /></Link>
          <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Ajustes del chat" className="flex min-w-0 flex-1 items-center gap-3 rounded-14 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
            {other.avatar_url && !avatarError ? <Image src={other.avatar_url} alt="" width={44} height={44} unoptimized onError={() => setAvatarError(true)} className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-sm font-bold text-primary-dark">{initials || "CF"}</div>}
            <div className="min-w-0"><p className="truncate text-base font-bold text-foreground">{fullName || "Persona de CoFlow"}</p><p className="text-xs font-medium text-muted">{owner ? "Conversación sobre tu piso" : "Toca para ver ajustes"}</p></div>
          </button>
        </div>
        <div className="min-h-0 flex-1 sm:flex-none"><PrivateChat connectionId={connection.id} currentUserId={user.id} variant="full" /></div>
        <ChatSettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          threadKey={`connection:${connection.id}`}
          avatar={other.avatar_url && !avatarError ? <Image src={other.avatar_url} alt="" width={64} height={64} unoptimized className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-lg font-bold text-primary-dark">{initials || "CF"}</div>}
          title={fullName || "Persona de CoFlow"}
          viewLabel="Ver perfil"
          onView={() => router.push(`/personas/${other.id}`)}
          onOpenSafety={() => setSafetyOpen(true)}
          fetchMessages={(params) => getPrivateMessages(connection.id, params)}
        />
        <UserSafetyActions open={safetyOpen} userId={other.id} firstName={other.first_name || "esta persona"} onClose={() => setSafetyOpen(false)} onBlocked={() => router.replace(listHref)} />
      </div>
    </ViewTransition>
  );
}

function ArrowLeftIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>; }
