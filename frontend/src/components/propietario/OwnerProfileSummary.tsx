"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, CheckCircle2, Eye, FileKey2, Mail, Pencil, Phone, Repeat2, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import Avatar from "@/components/ui/Avatar";
import ViewportPortal from "@/components/ui/ViewportPortal";
import { getMyProperties } from "@/services/properties";
import type { OwnerProfile, OwnerType } from "@/types/owner";

const OWNER_TYPE_LABELS: Record<OwnerType, string> = { INDIVIDUAL: "Particular", COMPANY: "Empresa", AGENCY: "Agencia" };

export function maskTaxId(taxId: string) { return "•".repeat(Math.max(taxId.length - 3, 0)) + taxId.slice(-3); }

export default function OwnerProfileSummary({ ownerProfile, onEdit }: { ownerProfile: OwnerProfile; onEdit: () => void }) {
  const { user } = useAuth();
  const { requestModeSwitch } = useOwnerMode();
  const { data: properties = [] } = useQuery({ queryKey: ["my-properties"], queryFn: () => getMyProperties() });
  const name = user ? `${user.first_name} ${user.last_name}` : ownerProfile.display_name;
  const checks = [Boolean(ownerProfile.display_name), Boolean(ownerProfile.phone), Boolean(ownerProfile.contact_email), Boolean(ownerProfile.tax_id), Boolean(user?.is_email_verified)];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const published = properties.filter((item) => ["READY", "PUBLISHED"].includes(item.status)).length;
  const rented = properties.filter((item) => item.status === "RENTED").length;
  const drafts = properties.filter((item) => item.status === "DRAFT").length;

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-6 pb-28 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-6xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Identidad profesional</p><h1 className="mt-1 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">Perfil de propietario</h1><p className="mt-2 text-sm leading-6 text-secondary">La información que respalda tus viviendas.</p></div><button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-4 text-sm font-bold text-white shadow-button"><Pencil className="h-4 w-4" /> Editar</button></header>

      <section className="relative mt-6 overflow-hidden rounded-[28px] bg-brand-dark p-5 text-white shadow-[0_18px_45px_rgba(20,55,41,.17)] sm:p-7"><span className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[36px] border-white/[0.035]" aria-hidden="true" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-center"><Avatar name={name} imageUrl={user?.avatar_url} size={88} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-rounded text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{ownerProfile.display_name}</h2><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/75">{OWNER_TYPE_LABELS[ownerProfile.owner_type]}</span></div><p className="mt-2 text-sm text-white/60">Contacto profesional de tus anuncios en CoFlow.</p><div className="mt-4 flex flex-wrap gap-2">{user?.is_email_verified && <TrustPill icon={<CheckCircle2 />} label="Correo confirmado" />}{ownerProfile.phone && <TrustPill icon={<Phone />} label="Teléfono añadido" />}{ownerProfile.tax_id && <TrustPill icon={<FileKey2 />} label="Datos fiscales añadidos" />}</div></div><div className="w-full rounded-[20px] bg-white/8 p-4 sm:w-48"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white/60">Completitud</span><strong className="text-sm">{completion}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white" style={{ width: `${completion}%` }} /></div><p className="mt-3 text-[11px] leading-4 text-white/55">{completion === 100 ? "Perfil preparado" : "Completa las señales que faltan"}</p></div></div></section>

      <section className="mt-4 grid grid-cols-3 gap-3"><PortfolioStat value={published} label="Publicadas" /><PortfolioStat value={rented} label="Alquiladas" /><PortfolioStat value={drafts} label="Borradores" /></section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_.82fr]">
        <section className="rounded-[24px] bg-surface p-5 shadow-soft sm:p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Identidad y contacto</p><h2 className="mt-1 font-rounded text-xl font-semibold text-brand-dark">Información profesional</h2></div><UserRound className="h-5 w-5 text-primary" /></div><div className="mt-4 divide-y divide-border/70"><ProfileRow icon={<UserRound />} label="Tipo" value={OWNER_TYPE_LABELS[ownerProfile.owner_type]} /><ProfileRow icon={<Phone />} label="Teléfono" value={ownerProfile.phone} /><ProfileRow icon={<Mail />} label="Email de contacto" value={ownerProfile.contact_email} />{ownerProfile.company_name && <ProfileRow icon={<Building2 />} label="Empresa" value={ownerProfile.company_name} />}</div></section>

        <section className="rounded-[24px] bg-surface p-5 shadow-soft sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Privacidad y confianza</p><h2 className="mt-1 font-rounded text-xl font-semibold text-brand-dark">Qué se comparte</h2><div className="mt-4 space-y-3"><VisibilityRow icon={<Eye />} title="Nombre profesional" text="Visible junto a tus futuros anuncios." enabled /><VisibilityRow icon={<ShieldCheck />} title="Señales de confianza" text="Se muestra su estado, no los datos sensibles." enabled /><VisibilityRow icon={<FileKey2 />} title="Datos fiscales" text="Siempre privados y solo para gestión interna." /></div>{ownerProfile.tax_id ? <p className="mt-4 rounded-14 bg-surface-soft p-3 text-xs font-semibold text-secondary">Identificación fiscal guardada: {maskTaxId(ownerProfile.tax_id)}</p> : <button type="button" onClick={onEdit} className="mt-4 min-h-11 rounded-full bg-mint-50 px-4 text-xs font-bold text-primary-dark">Añadir identificación fiscal</button>}</section>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-3"><Shortcut href="/propietarios/pisos" icon={<Building2 />} title="Mis viviendas" text="Gestiona tu cartera" /><Shortcut href="/propietarios/solicitudes" icon={<UserRound />} title="Solicitudes" text="Revisa el interés" /><Shortcut href="/ajustes" icon={<ShieldCheck />} title="Cuenta y seguridad" text="Privacidad y sesiones" /></section>

      {user?.is_looking_for_roommates && <ViewportPortal><button type="button" onClick={() => requestModeSwitch("member")} className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.75rem)] left-5 right-5 z-50 mx-auto flex h-14 max-w-lg items-center justify-center gap-2 rounded-full bg-brand-dark px-6 text-sm font-bold text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)] sm:bottom-7 sm:left-auto sm:right-8 md:right-10"><Repeat2 className="h-5 w-5" />Volver a buscar hogar</button></ViewportPortal>}
    </div>
  );
}

function TrustPill({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}{label}</span>; }
function PortfolioStat({ value, label }: { value: number; label: string }) { return <div className="rounded-[20px] bg-surface p-4 text-center shadow-soft"><strong className="font-rounded text-2xl font-semibold text-brand-dark">{value}</strong><span className="mt-1 block text-xs font-semibold text-secondary">{label}</span></div>; }
function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex min-h-14 items-center gap-3 py-2"><span className="text-primary [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span><span className="min-w-0 flex-1 text-sm text-secondary">{label}</span><span className="max-w-[55%] truncate text-sm font-bold text-brand-dark">{value}</span></div>; }
function VisibilityRow({ icon, title, text, enabled = false }: { icon: React.ReactNode; title: string; text: string; enabled?: boolean }) { return <div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint-50 text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-brand-dark">{title}</p><p className="mt-0.5 text-xs leading-5 text-secondary">{text}</p></div>{enabled && <Check className="mt-2 h-4 w-4 text-primary" />}</div>; }
function Shortcut({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) { return <Link href={href} className="group flex min-h-20 items-center gap-3 rounded-[20px] bg-surface p-4 shadow-soft"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-50 text-primary [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span><span><span className="block text-sm font-bold text-brand-dark">{title}</span><span className="mt-0.5 block text-xs text-secondary">{text}</span></span></Link>; }
