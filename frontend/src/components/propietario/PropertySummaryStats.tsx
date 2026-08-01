import type { PropertySummary } from "@/types/property";

export default function PropertySummaryStats({
  properties,
}: {
  properties: PropertySummary[];
}) {
  const stats = [
    { label: "Pisos totales", value: properties.length },
    {
      label: "Borradores",
      value: properties.filter((item) => item.status === "DRAFT").length,
    },
    {
      label: "Preparados",
      value: properties.filter((item) => item.status === "READY").length,
    },
    {
      label: "Pausados",
      value: properties.filter((item) => item.status === "PAUSED").length,
    },
    {
      label: "Alquilados",
      value: properties.filter((item) => item.status === "RENTED").length,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-line bg-surface p-4 text-center"
        >
          <p className="text-2xl font-black text-brand-dark">{stat.value}</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
