import Link from "next/link";
import type { OwnerProfile } from "@/types/owner";

function formatMemberSince(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function OwnerTrustSummary({
  ownerProfile,
}: {
  ownerProfile: OwnerProfile;
}) {
  const items = [
    { label: "Teléfono de contacto", complete: true },
    { label: "Email de contacto", complete: true },
    {
      label: "Identificación fiscal (NIF/CIF)",
      complete: Boolean(ownerProfile.tax_id),
    },
  ];

  const completedCount = items.filter((item) => item.complete).length;
  const allComplete = completedCount === items.length;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">
          Confianza de tu perfil
        </p>

        <span className="text-xs font-semibold text-muted">
          Miembro desde {formatMemberSince(ownerProfile.created_at)}
        </span>
      </div>

      <p className="mt-1 text-xs leading-5 text-muted">
        Esto es lo que verán los inquilinos cuando el marketplace esté
        activo. Cuanta más información añadas, más confianza genera tu
        perfil.
      </p>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            {item.complete ? (
              <CheckIcon className="text-primary" />
            ) : (
              <DashIcon className="text-muted" />
            )}
            <span className={item.complete ? "text-foreground" : "text-muted"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {!allComplete && (
        <Link
          href="/propietarios/perfil"
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-dark hover:text-brand-dark"
        >
          Completar mi perfil de propietario →
        </Link>
      )}
    </div>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function DashIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    </svg>
  );
}
