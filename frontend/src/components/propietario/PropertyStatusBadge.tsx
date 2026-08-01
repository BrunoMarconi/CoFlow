import type { PropertyStatus } from "@/types/property";

const STATUS_META: Record<
  PropertyStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Borrador",
    className: "bg-gray-100 text-gray-600",
  },
  READY: {
    label: "Preparado para el lanzamiento",
    className: "bg-brand/10 text-brand-dark",
  },
  PAUSED: {
    label: "Pausado",
    className: "bg-amber-100 text-amber-800",
  },
  PUBLISHED: {
    label: "Publicado",
    className: "bg-brand text-white",
  },
  RENTED: {
    label: "Alquilado",
    className: "bg-blue-100 text-blue-700",
  },
  ARCHIVED: {
    label: "Archivado",
    className: "bg-gray-200 text-gray-500",
  },
};

export default function PropertyStatusBadge({
  status,
}: {
  status: PropertyStatus;
}) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
