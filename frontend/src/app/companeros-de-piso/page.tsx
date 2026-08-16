import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { seoCities } from "@/lib/seoCities";

export const metadata: Metadata = {
  title: "Compañeros de piso en España",
  description:
    "Encuentra compañeros de piso compatibles en toda España. Compara hábitos, presupuesto y forma de convivir antes de decidir. Elige tu ciudad y regístrate gratis en CoFlow.",
  alternates: {
    canonical: "/companeros-de-piso",
  },
  openGraph: {
    title: "Compañeros de piso en España | CoFlow",
    description:
      "Encuentra compañeros de piso compatibles en toda España. Elige tu ciudad y regístrate gratis.",
    type: "website",
    locale: "es_ES",
    siteName: "CoFlow",
    url: "/companeros-de-piso",
  },
};

export default function CompanerosDePisoPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-brand-dark">
      <Navbar />

      <section className="px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.13em] text-brand-dark shadow-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
            Disponible en toda España
          </div>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-[-0.04em] text-brand-dark sm:text-5xl">
            Compañeros de piso en España
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
            CoFlow te ayuda a encontrar compañeros de piso compatibles según hábitos, presupuesto y forma de convivir —
            no solo por disponibilidad. Elige tu ciudad para ver cómo funciona donde vives.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seoCities.map((city) => (
            <Link
              key={city.slug}
              href={`/companeros-de-piso/${city.slug}`}
              className="group relative min-h-48 overflow-hidden rounded-[2rem] bg-brand-dark shadow-sm"
            >
              <Image
                src={city.image}
                alt={`Vista de ${city.name}`}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="rounded-full border border-white/25 bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                  {city.region}
                </span>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white">
                  Compañeros de piso en {city.name}
                </h2>
              </div>
            </Link>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-7 text-muted">
          ¿No ves tu ciudad? CoFlow funciona en toda España — puedes{" "}
          <Link href="/register" className="font-bold text-primary-dark underline underline-offset-2">
            crear tu perfil gratis
          </Link>{" "}
          igualmente y explorar personas y comunidades compatibles allí donde estés.
        </p>
      </section>

      <Footer />
    </main>
  );
}
