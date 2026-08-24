"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Mail, Pencil, Phone, Repeat2, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import Avatar from "@/components/ui/Avatar";
import ViewportPortal from "@/components/ui/ViewportPortal";
import type { OwnerProfile, OwnerType } from "@/types/owner";

const OWNER_TYPE_LABELS: Record<OwnerType, string> = { INDIVIDUAL: "Particular", COMPANY: "Empresa", AGENCY: "Agencia" };

export function maskTaxId(taxId: string) { return "•".repeat(Math.max(taxId.length - 3, 0)) + taxId.slice(-3); }

export default function OwnerProfileSummary({ ownerProfile, onEdit }: { ownerProfile: OwnerProfile; onEdit: () => void }) {
  const { user } = useAuth();
  const { requestModeSwitch } = useOwnerMode();
  const name = user ? `${user.first_name} ${user.last_name}` : ownerProfile.display_name;

  return (
    <div className="mx-auto w-full max-w-4xl pb-28">
      <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#717171]">Espacio propietario</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#191919] sm:text-5xl">Perfil</h1></header>

      <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-[#dddddd] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-5 p-6 sm:p-8"><Avatar name={name} imageUrl={user?.avatar_url} size={88} /><div className="min-w-0 flex-1"><h2 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[#191919] sm:text-3xl">{ownerProfile.display_name}</h2><p className="mt-1 text-sm text-[#717171]">{OWNER_TYPE_LABELS[ownerProfile.owner_type]}</p><span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#dddddd] px-3 py-1.5 text-xs font-semibold"><ShieldCheck className="h-4 w-4" />Propietario verificado</span></div><button type="button" onClick={onEdit} aria-label="Editar perfil" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd]"><Pencil className="h-5 w-5" /></button></div>
      </section>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <OwnerShortcut href="/propietarios/pisos" image="/images/profile-owner-house-3d.webp" title="Mis pisos" />
        <OwnerShortcut href="/propietarios/solicitudes" image="/images/profile-community-3d.webp" title="Solicitudes" />
        <OwnerShortcut href="/propietarios/mensajes" image="/images/profile-connections-3d.webp" title="Mensajes" />
      </div>

      <section className="mt-5 divide-y divide-[#e6e6e6] rounded-[1.5rem] border border-[#dddddd] bg-white px-5 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <ProfileRow icon={<UserRound />} label="Tipo de propietario" value={OWNER_TYPE_LABELS[ownerProfile.owner_type]} />
        <ProfileRow icon={<Phone />} label="Teléfono" value={ownerProfile.phone} />
        <ProfileRow icon={<Mail />} label="Email de contacto" value={ownerProfile.contact_email} />
        {ownerProfile.company_name ? <ProfileRow icon={<Building2 />} label="Empresa" value={ownerProfile.company_name} /> : null}
        {ownerProfile.tax_id ? <ProfileRow icon={<ShieldCheck />} label="Identificación fiscal" value={maskTaxId(ownerProfile.tax_id)} /> : null}
      </section>

      {user?.is_looking_for_roommates ? (
        <ViewportPortal><button type="button" onClick={() => requestModeSwitch("member")} className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.75rem)] left-5 right-5 z-50 mx-auto flex h-14 max-w-lg items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)] transition hover:bg-[#282828] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black sm:bottom-7 sm:left-auto sm:right-8 md:right-10"><Repeat2 className="h-5 w-5" />Volver a buscar hogar</button></ViewportPortal>
      ) : null}
    </div>
  );
}

function OwnerShortcut({ href, image, title }: { href: string; image: string; title: string }) { return <Link href={href} className="overflow-hidden rounded-[1.25rem] border border-[#dddddd] bg-white pb-3 text-center shadow-[0_5px_16px_rgba(0,0,0,0.05)]"><div className="relative aspect-[4/3]"><Image src={image} alt="" fill sizes="180px" className="object-contain p-2" /></div><span className="text-xs font-semibold text-[#191919] sm:text-sm">{title}</span></Link>; }
function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 py-4"><span className="text-[#191919] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="min-w-0 flex-1 text-sm font-medium text-[#717171]">{label}</span><span className="max-w-[55%] truncate text-sm font-semibold text-[#191919]">{value}</span></div>; }
