import type { OwnerProfile, OwnerType } from "@/types/owner";

const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  INDIVIDUAL: "Particular",
  COMPANY: "Empresa",
  AGENCY: "Agencia",
};

export function maskTaxId(taxId: string): string {
  const visible = taxId.slice(-3);
  const hiddenLength = Math.max(taxId.length - 3, 0);
  return "•".repeat(hiddenLength) + visible;
}

export default function OwnerProfileSummary({
  ownerProfile,
  onEdit,
}: {
  ownerProfile: OwnerProfile;
  onEdit: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
        Panel de propietarios
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Perfil de propietario
      </h1>

      <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        <SummaryRow
          label="Tipo de propietario"
          value={OWNER_TYPE_LABELS[ownerProfile.owner_type]}
        />
        <SummaryRow label="Nombre visible" value={ownerProfile.display_name} />
        <SummaryRow label="Teléfono" value={ownerProfile.phone} />
        <SummaryRow
          label="Email de contacto"
          value={ownerProfile.contact_email}
        />
        {ownerProfile.company_name && (
          <SummaryRow label="Empresa" value={ownerProfile.company_name} />
        )}
        {ownerProfile.tax_id && (
          <SummaryRow
            label="Identificación fiscal"
            value={maskTaxId(ownerProfile.tax_id)}
          />
        )}
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark sm:w-auto sm:px-8"
      >
        Editar perfil
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
