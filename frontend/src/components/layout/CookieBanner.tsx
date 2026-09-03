"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Settings2, X } from "lucide-react";
import { getCookieConsent, saveCookieConsent } from "@/lib/cookieNotice";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = getCookieConsent();
      if (!saved) setVisible(true);
      else { setAnalytics(saved.analytics); setPreferences(saved.preferences); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function decide(nextAnalytics: boolean, nextPreferences: boolean) {
    saveCookieConsent({ analytics: nextAnalytics, preferences: nextPreferences });
    setAnalytics(nextAnalytics); setPreferences(nextPreferences); setPanel(false); setVisible(false);
  }

  function reopen() {
    const saved = getCookieConsent();
    setAnalytics(saved?.analytics ?? false); setPreferences(saved?.preferences ?? false);
    setPanel(true); setVisible(true);
  }

  return <>
    {!visible && <button type="button" onClick={reopen} className="fixed bottom-[calc(1rem+var(--safe-bottom))] left-4 z-(--z-modal) flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-[#294a3b] shadow-lg backdrop-blur transition hover:-translate-y-0.5" aria-label="Gestionar preferencias de cookies"><Settings2 size={14} />Cookies</button>}

    <AnimatePresence>{visible && !panel && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-(--z-modal) flex items-end justify-center bg-black/20 p-3 backdrop-blur-[2px] sm:p-6">
      <motion.section initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-description" className="w-full max-w-[1040px] rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_30px_90px_rgba(18,40,31,.25)] sm:p-7 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex max-w-[690px] items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3ee] text-[#315f4b]"><CookieIcon /></span><div><h2 id="cookie-title" className="text-lg font-extrabold tracking-[-.02em] text-[#183126]">Tu privacidad, bajo tu control</h2><p id="cookie-description" className="mt-2 text-sm leading-6 text-[#64716b]">Usamos almacenamiento necesario para iniciar sesión y proteger la web. Actualmente no usamos analítica externa ni publicidad. Puedes aceptar, rechazar o configurar las preferencias opcionales.</p><p className="mt-2 text-xs text-[#76817c]">No activaremos tecnologías opcionales antes de tu elección. <Link href="/legal/cookies" className="font-bold text-[#315f4b] underline underline-offset-4">Política de cookies</Link></p></div></div>
          <div className="grid grid-cols-2 gap-2 sm:flex"><ConsentButton onClick={() => decide(false, false)} secondary>Rechazar opcionales</ConsentButton><ConsentButton onClick={() => setPanel(true)} secondary>Configurar</ConsentButton><ConsentButton onClick={() => decide(false, false)} className="col-span-2">Aceptar necesarias</ConsentButton></div>
        </div>
      </motion.section>
    </motion.div>}</AnimatePresence>

    <AnimatePresence>{visible && panel && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[calc(var(--z-modal)+1)] grid place-items-center bg-black/35 p-4 backdrop-blur-sm">
      <motion.section initial={{ y: 20, opacity: 0, scale: .98 }} animate={{ y: 0, opacity: 1, scale: 1 }} role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="w-full max-w-xl rounded-[28px] bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#64716b]">Centro de privacidad</p><h2 id="cookie-settings-title" className="mt-2 text-2xl font-extrabold tracking-[-.035em] text-[#183126]">Configurar cookies</h2></div><button type="button" onClick={() => setPanel(false)} className="rounded-full bg-[#eff4f1] p-2.5 text-[#315f4b]" aria-label="Volver al aviso"><X size={17} /></button></div>
        <p className="mt-3 text-sm leading-6 text-[#68746e]">Las opciones no necesarias permanecen desactivadas salvo que las aceptes expresamente.</p>
        <div className="mt-6 space-y-3"><Preference title="Necesarias" text="Sesión, seguridad y funciones solicitadas. No pueden desactivarse." checked disabled onChange={() => undefined} /><Preference title="Analítica" text="No utilizada actualmente." checked={analytics} disabled onChange={setAnalytics} /><Preference title="Preferencias opcionales" text="No utilizadas actualmente." checked={preferences} disabled onChange={setPreferences} /></div>
        <div className="mt-7 grid gap-2 sm:grid-cols-2"><ConsentButton onClick={() => decide(false, false)} secondary>Rechazar opcionales</ConsentButton><ConsentButton onClick={() => decide(false, false)}>Guardar y continuar</ConsentButton></div>
      </motion.section>
    </motion.div>}</AnimatePresence>
  </>;
}

function ConsentButton({ children, onClick, secondary = false, className = "" }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; className?: string }) { return <button type="button" onClick={onClick} className={`${className} min-h-11 rounded-full border border-[#315f4b] px-5 text-xs font-bold transition ${secondary ? "bg-white text-[#315f4b] hover:bg-[#f0f6f3]" : "bg-[#315f4b] text-white hover:bg-[#284e3e]"}`}>{children}</button>; }
function Preference({ title, text, checked, disabled = false, onChange }: { title: string; text: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-center justify-between gap-5 rounded-2xl border border-black/7 bg-[#f7faf8] p-4"><div><h3 className="text-sm font-bold text-[#213b30]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#6d7973]">{text}</p></div><button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-[#315f4b]" : "bg-[#cbd4cf]"} disabled:cursor-not-allowed disabled:opacity-70`}><span className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`}>{disabled && <Check size={11} className="text-[#315f4b]" />}</span></button></div>; }
function CookieIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5.5 w-5.5" aria-hidden="true"><path d="M12 2a10 10 0 1 0 9.5 13.2c-.4.1-.8.1-1.2.1a4 4 0 0 1-4-4c0-.3 0-.6.1-.9a3.5 3.5 0 0 1-4.4-4.4c-.3.1-.6.1-.9.1a4 4 0 0 1-4-4c0-.3 0-.7.1-1A10 10 0 0 0 12 2Z" /><circle cx="8.5" cy="12.5" r="1" fill="currentColor" stroke="none" /><circle cx="13" cy="16" r="1" fill="currentColor" stroke="none" /></svg>; }
