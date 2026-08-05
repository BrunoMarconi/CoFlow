export default function CommunitiesHero({
  firstName,
  communitiesWithSpots,
  totalOpenSpots,
  cityCount,
}: {
  firstName?: string;
  communitiesWithSpots: number;
  totalOpenSpots: number;
  cityCount: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-24 bg-gradient-to-br from-[#0d3b2a] via-[#0f4a35] to-[#16a05d] px-6 py-10 sm:px-10 sm:py-12">
      <div
        aria-hidden="true"
        className="animate-blob-drift pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-blob-drift pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-mint-200/20 blur-3xl"
        style={{ animationDelay: "2s" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/5 blur-2xl"
      />

      <div className="relative">
        {firstName && (
          <p className="text-sm font-bold text-mint-200">Hola, {firstName}</p>
        )}

        <h1 className="mt-2 max-w-xl text-3xl font-black tracking-[-0.01em] text-white sm:text-4xl">
          Encuentra una comunidad que se sienta como casa
        </h1>

        <p className="mt-3 max-w-md text-sm font-medium text-white/70 sm:text-base">
          Explora comunidades reales, con gente afín y plazas abiertas ahora
          mismo.
        </p>

        <div className="mt-7 flex flex-wrap gap-6 sm:gap-10">
          <HeroStat
            value={communitiesWithSpots}
            label={
              communitiesWithSpots === 1
                ? "comunidad con plazas"
                : "comunidades con plazas"
            }
          />
          <HeroStat
            value={totalOpenSpots}
            label={totalOpenSpots === 1 ? "plaza disponible" : "plazas disponibles"}
          />
          <HeroStat
            value={cityCount}
            label={cityCount === 1 ? "ciudad activa" : "ciudades activas"}
          />
        </div>
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs font-semibold text-white/60">{label}</p>
    </div>
  );
}
