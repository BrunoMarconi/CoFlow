export default function PopularCityChips({
  cities,
  onSelect,
}: {
  cities: { city: string; count: number }[];
  onSelect: (city: string) => void;
}) {
  if (cities.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground">
        Ciudades populares
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {cities.map(({ city, count }) => (
          <button
            key={city}
            type="button"
            onClick={() => onSelect(city)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-secondary transition-colors duration-180 hover:border-primary/40 hover:text-brand-dark"
          >
            {city}
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-bold text-muted">
              {count}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
