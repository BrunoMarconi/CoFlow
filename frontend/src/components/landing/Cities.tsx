import Image from "next/image";
import { SectionHeader } from "./shared";
import { ArrowRightIcon } from "./icons";
import { cities } from "./content";

export default function Cities() {
  return (
    <section
      id="ciudades"
      className="scroll-mt-24 px-4 py-12 sm:px-6 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Encuentra tu lugar"
          title="La convivencia que buscas puede estar en tu ciudad"
          description="Descubre personas y comunidades que buscan una forma más compatible de compartir hogar."
        />

        <div className="mt-8 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <article
              key={city.name}
              className={`group relative min-h-80 overflow-hidden rounded-[2rem] bg-brand-dark shadow-sm ${
                city.available ? "ring-2 ring-brand ring-offset-2" : ""
              }`}
            >
              <Image
                src={city.image}
                alt={`Vista de ${city.name}`}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-black/5" />

              <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-5">
                <span className="rounded-full border border-white/25 bg-black/20 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                  {city.region}
                </span>

                <span
                  className={`rounded-full px-3 py-2 text-xs font-bold backdrop-blur ${
                    city.available
                      ? "bg-brand text-white"
                      : "border border-white/25 bg-black/20 text-white"
                  }`}
                >
                  {city.available ? "Disponible" : "Próximamente"}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {city.name}
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                  {city.description}
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-white">
                  {city.available
                    ? `Explorar comunidades en ${city.name}`
                    : "Muy pronto en CoFlow"}

                  <span className="transition group-hover:translate-x-1">
                    <ArrowRightIcon />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
