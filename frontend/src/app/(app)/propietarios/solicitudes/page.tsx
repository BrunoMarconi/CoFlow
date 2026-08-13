"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Plus } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { getMyProperties } from "@/services/properties";

type Tab = "new" | "review" | "archived";

export default function SolicitudesPropietarioPage() {
  const [tab, setTab] = useState<Tab>("new");
  const { data: properties = [], isLoading } = useQuery({ queryKey: ["my-properties"], queryFn: () => getMyProperties() });
  if (isLoading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#717171]">Espacio propietario</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#191919] sm:text-5xl">Solicitudes</h1><p className="mt-2 text-sm text-[#717171]">Personas interesadas en tus viviendas</p></header>
      <div className="mt-7 grid grid-cols-3 rounded-full border border-[#dddddd] bg-white p-1 shadow-[0_4px_14px_rgba(0,0,0,0.045)]">
        <TabButton active={tab === "new"} onClick={() => setTab("new")}>Nuevas</TabButton>
        <TabButton active={tab === "review"} onClick={() => setTab("review")}>En revisión</TabButton>
        <TabButton active={tab === "archived"} onClick={() => setTab("archived")}>Archivadas</TabButton>
      </div>
      <section className="mt-5 flex min-h-90 flex-col items-center justify-center rounded-[1.75rem] border border-[#dddddd] bg-white px-6 py-14 text-center shadow-[0_7px_24px_rgba(0,0,0,0.055)]">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f5]"><Inbox className="h-8 w-8" strokeWidth={1.6} /></span>
        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.025em] text-[#191919]">{tab === "new" ? "No hay solicitudes nuevas" : tab === "review" ? "Nada en revisión" : "No hay solicitudes archivadas"}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#717171]">Cuando una comunidad se interese por uno de tus pisos, podrás revisar aquí su perfil y responderle.</p>
        {properties.length === 0 ? <Link href="/propietarios/pisos/nuevo" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-black px-6 font-semibold text-white"><Plus className="h-5 w-5" />Publicar un piso</Link> : null}
      </section>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`h-11 rounded-full text-sm font-semibold transition ${active ? "bg-black text-white" : "text-[#717171]"}`}>{children}</button>; }
