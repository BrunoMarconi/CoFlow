export default function PeopleHero({
  firstName,
  lookingCount,
  inCommunityCount,
}: {
  firstName?: string;
  lookingCount: number;
  inCommunityCount: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-24 bg-gradient-to-br from-[#0d3b2a] via-[#0f4a35] to-[#16a05d] px-6 py-8 sm:px-10 sm:py-10">
      <div
        aria-hidden="true"
        className="animate-blob-drift pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-blob-drift pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-mint-200/20 blur-3xl"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative">
        {firstName && (
          <p className="text-sm font-bold text-mint-200">Hola, {firstName}</p>
        )}

        <h1 className="mt-2 max-w-lg text-2xl font-black tracking-[-0.01em] text-white sm:text-3xl">
          Personas que buscan un hogar como el tuyo
        </h1>

        <p className="mt-2 max-w-md text-sm font-medium text-white/70">
          Conecta con gente real, con estilos de vida y ciudades afines.
        </p>

        <div className="mt-6 flex flex-wrap gap-6 sm:gap-10">
          <div>
            <p className="text-2xl font-black text-white">{lookingCount}</p>
            <p className="text-xs font-semibold text-white/60">
              {lookingCount === 1
                ? "persona buscando piso"
                : "personas buscando piso"}
            </p>
          </div>

          <div>
            <p className="text-2xl font-black text-white">
              {inCommunityCount}
            </p>
            <p className="text-xs font-semibold text-white/60">
              {inCommunityCount === 1
                ? "persona ya en comunidad"
                : "personas ya en comunidad"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
