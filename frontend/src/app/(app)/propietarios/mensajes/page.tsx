"use client";

import { MessageCircle, Search } from "lucide-react";

export default function OwnerMessagesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#717171]">Espacio propietario</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#191919] sm:text-5xl">Mensajes</h1><p className="mt-2 text-sm text-[#717171]">Conversaciones sobre tus pisos</p></header>
      <label className="mt-7 flex h-14 items-center gap-3 rounded-full border border-[#cfcfcf] bg-white px-5 shadow-[0_5px_16px_rgba(0,0,0,0.05)] focus-within:border-black focus-within:ring-1 focus-within:ring-black"><Search className="h-5 w-5 text-[#717171]" /><input aria-label="Buscar conversaciones" placeholder="Buscar persona o mensaje" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8c8c8c]" /></label>
      <section className="mt-5 flex min-h-90 flex-col items-center justify-center rounded-[1.75rem] border border-[#dddddd] bg-white px-6 py-14 text-center shadow-[0_7px_24px_rgba(0,0,0,0.055)]"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f5]"><MessageCircle className="h-8 w-8" strokeWidth={1.6} /></span><h2 className="mt-6 text-2xl font-semibold">Aún no hay conversaciones</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#717171]">Cuando recibas una solicitud para un piso, su conversación aparecerá aquí sin mezclarse con tus chats personales.</p></section>
    </div>
  );
}
