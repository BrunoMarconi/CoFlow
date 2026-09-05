"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Mail, Phone, ShieldCheck } from "lucide-react";
import { MOTION_DURATION, MOTION_EASE, MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";
import type { User } from "@/types/auth";

export default function TrustSection({ user }: { user: User }) {
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-3">
        <TrustItem href={user.is_email_verified ? undefined : "/verificacion-pendiente"} icon={<Mail />} title="Correo electrónico" value={user.is_email_verified ? "Confirmado" : "Pendiente de confirmar"} tone={user.is_email_verified ? "positive" : "pending"} />
        <TrustItem href="/perfil/editar" icon={<Phone />} title="Teléfono" value={user.phone ? "Añadido al perfil" : "Sin añadir"} tone={user.phone ? "neutral" : "pending"} />
        <TrustItem href="/ajustes/privacidad" icon={<Eye />} title="Visibilidad" value={user.profile_visibility === "PUBLIC" ? "Visible en CoFlow" : "Solo conexiones"} tone="neutral" />
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-[18px] border border-black/[0.06] bg-[#f3f6f4] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-bold text-brand-dark">Qué significa la verificación actual</p>
          <p className="mt-1 text-xs leading-5 text-secondary">CoFlow confirma que la persona controla su dirección de correo. No supone una verificación documental de identidad ni garantiza el comportamiento de un usuario.</p>
          <Link href="/legal/normas-comunidad" className="mt-2 inline-flex text-xs font-bold text-primary-dark underline underline-offset-3">Consulta las normas de seguridad</Link>
        </div>
      </div>
    </div>
  );
}

function TrustItem({ href, icon, title, value, tone }: { href?: string; icon: React.ReactNode; title: string; value: string; tone: "positive" | "pending" | "neutral" }) {
  const content = (
    <motion.div whileTap={href ? { scale: MOTION_HOME_TAP_SCALE } : undefined} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }} className="flex min-h-20 items-center gap-3 rounded-[16px] border border-black/[0.06] bg-[#fbfcfa] p-3.5 transition hover:bg-[#f5f7f4]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8eeea] text-primary-dark [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-brand-dark">{title}</span><span className={`mt-0.5 block truncate text-[11px] font-semibold ${tone === "positive" ? "text-emerald-700" : tone === "pending" ? "text-amber-700" : "text-secondary"}`}>{value}</span></span>
      {href && <span className="text-muted" aria-hidden="true">›</span>}
    </motion.div>
  );
  return href ? <Link href={href} className="rounded-[16px]">{content}</Link> : content;
}
