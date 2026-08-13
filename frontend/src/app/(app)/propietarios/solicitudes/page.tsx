"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Inbox, KeyRound, Plus, ShieldCheck } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { getMyProperties } from "@/services/properties";

export default function SolicitudesPropietarioPage() {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["my-properties"],
    queryFn: () => getMyProperties(),
  });

  if (isLoading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <header>
        <p className="text-sm font-bold text-primary">Espacio propietario</p>
        <h1 className="mt-1 font-rounded text-4xl font-bold tracking-[-0.04em] text-brand-dark sm:text-5xl">Solicitudes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">Aquí podrás revisar las personas interesadas en cada vivienda y responder con calma.</p>
      </header>

      <section className="mt-8 rounded-24 border border-border bg-surface px-6 py-12 text-center shadow-soft sm:px-10 sm:py-16">
        <span className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border border-primary/12 text-primary"><Inbox className="h-9 w-9" /></span>
        <h2 className="mt-6 text-2xl font-bold text-brand-dark">Todavía no tienes solicitudes</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary">Cuando alguien se interese por uno de tus pisos, aparecerá aquí con su perfil y el piso correspondiente.</p>
        {properties.length === 0 ? <Link href="/propietarios/pisos/nuevo" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-bold text-white"><Plus className="h-5 w-5" />Publicar un piso</Link> : null}
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <InfoCard icon={<KeyRound />} title={`${properties.length} ${properties.length === 1 ? "vivienda" : "viviendas"}`} text="Las solicitudes se organizarán automáticamente por piso." />
        <InfoCard icon={<ShieldCheck />} title="Tú decides" text="Revisa cada perfil antes de aceptar o rechazar una solicitud." />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="flex items-start gap-4 rounded-24 border border-border bg-surface p-5 shadow-soft"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-16 border border-primary/10 text-primary [&>svg]:h-6 [&>svg]:w-6">{icon}</span><div><h3 className="font-bold text-brand-dark">{title}</h3><p className="mt-1 text-sm leading-6 text-secondary">{text}</p></div></article>;
}
