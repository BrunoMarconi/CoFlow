"use client";

import { Building2, Mail, Pencil, Phone, Repeat2, ShieldCheck, UserRound } from "lucide-react";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import type { OwnerProfile, OwnerType } from "@/types/owner";

const OWNER_TYPE_LABELS: Record<OwnerType, string> = { INDIVIDUAL: "Particular", COMPANY: "Empresa", AGENCY: "Agencia" };

export function maskTaxId(taxId: string) {
  return "•".repeat(Math.max(taxId.length - 3, 0)) + taxId.slice(-3);
}

export default function OwnerProfileSummary({ ownerProfile, onEdit }: { ownerProfile: OwnerProfile; onEdit: () => void }) {
  const { requestModeSwitch } = useOwnerMode();

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <header><p className="text-sm font-bold text-primary">Espacio propietario</p><h1 className="mt-1 font-rounded text-4xl font-bold tracking-[-0.04em] text-brand-dark sm:text-5xl">Perfil</h1></header>

      <section className="mt-8 rounded-24 border border-border bg-surface p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-4"><span className="flex h-18 w-18 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">{ownerProfile.display_name.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><h2 className="truncate text-2xl font-bold text-brand-dark">{ownerProfile.display_name}</h2><p className="mt-1 text-sm font-semibold text-primary">{OWNER_TYPE_LABELS[ownerProfile.owner_type]}</p></div></div>
        <div className="mt-7 divide-y divide-border border-y border-border"><ProfileRow icon={<UserRound />} label="Tipo de propietario" value={OWNER_TYPE_LABELS[ownerProfile.owner_type]} /><ProfileRow icon={<Phone />} label="Teléfono" value={ownerProfile.phone} /><ProfileRow icon={<Mail />} label="Email de contacto" value={ownerProfile.contact_email} />{ownerProfile.company_name ? <ProfileRow icon={<Building2 />} label="Empresa" value={ownerProfile.company_name} /> : null}{ownerProfile.tax_id ? <ProfileRow icon={<ShieldCheck />} label="Identificación fiscal" value={maskTaxId(ownerProfile.tax_id)} /> : null}</div>
        <button type="button" onClick={onEdit} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border font-bold text-brand-dark sm:w-auto sm:px-6"><Pencil className="h-5 w-5" />Editar perfil</button>
      </section>

      <button type="button" onClick={() => requestModeSwitch("member")} className="mt-5 flex w-full items-center gap-4 rounded-24 border border-border bg-surface p-5 text-left shadow-soft transition hover:-translate-y-0.5"><span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/12 text-primary"><Repeat2 className="h-6 w-6" /></span><span className="flex-1"><span className="block font-bold text-brand-dark">Volver a CoFlow</span><span className="mt-1 block text-sm text-secondary">Cambiar a la perspectiva de usuario</span></span></button>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 py-4"><span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="min-w-0 flex-1 text-sm font-semibold text-secondary">{label}</span><span className="max-w-[55%] truncate text-sm font-bold text-brand-dark">{value}</span></div>; }
