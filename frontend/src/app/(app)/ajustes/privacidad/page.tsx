"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Check, ChevronLeft, ChevronRight, Globe2, LockKeyhole, ShieldCheck, UserRoundCheck } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { getProfilePrivacy, updateProfilePrivacy } from "@/services/users";
import type { ProfileVisibility } from "@/types/user";

const OPTIONS: Array<{
  value: ProfileVisibility;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "PUBLIC",
    title: "Perfil público",
    description: "Las personas de CoFlow pueden encontrarte y conocer tu perfil.",
    icon: <Globe2 />,
  },
  {
    value: "CONNECTIONS",
    title: "Solo mis conexiones",
    description: "Tu perfil completo solo estará disponible para personas con las que ya has conectado.",
    icon: <UserRoundCheck />,
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  const [value, setValue] = useState<ProfileVisibility>("PUBLIC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProfilePrivacy()
      .then((data) => { if (active) setValue(data.profile_visibility); })
      .catch(() => { if (active) setError("No hemos podido cargar tu privacidad."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function select(nextValue: ProfileVisibility) {
    if (saving || nextValue === value) return;
    const previous = value;
    setValue(nextValue);
    setSaving(true);
    setError("");
    try {
      await updateProfilePrivacy(nextValue);
      toast.success("Privacidad actualizada");
    } catch {
      setValue(previous);
      setError("No hemos podido guardar el cambio. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-10">
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 items-center justify-start"><ChevronLeft className="h-6 w-6" /></button>
        <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Control de privacidad</p><h1 className="font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark">Privacidad</h1><p className="mt-1 text-sm text-secondary">Tú decides quién puede encontrarte y conocerte.</p></div>
      </header>

      {loading ? <div className="flex min-h-72 items-center justify-center"><Spinner /></div> : (
        <section className="mt-8">
          <h2 className="font-rounded text-2xl font-semibold tracking-[-0.035em] text-brand-dark">¿Quién puede ver tu perfil?</h2>
          <p className="mt-2 text-sm leading-6 text-[#717171]">Esta elección se aplica a tus fotos, bio, edad, ocupación, gustos y preferencias.</p>
          <div className="mt-7 grid gap-3">
            {OPTIONS.map((option) => {
              const active = value === option.value;
              return (
                <button key={option.value} type="button" disabled={saving} onClick={() => void select(option.value)} className={`flex min-h-28 items-center gap-4 rounded-[22px] border p-5 text-left transition disabled:cursor-wait ${active ? "border-primary/35 bg-[#f0f6f2] ring-1 ring-primary/20" : "border-black/[0.07] bg-[#fbfcfa] hover:bg-[#f5f7f4]"}`}>
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full [&>svg]:h-6 [&>svg]:w-6 ${active ? "bg-primary text-white" : "bg-[#e9eeea] text-primary-dark"}`}>{option.icon}</span>
                  <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-brand-dark">{option.title}</span><span className="mt-1 block text-sm leading-6 text-secondary">{option.description}</span></span>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? "border-primary bg-primary text-white" : "border-black/20"}`}>{active ? <Check className="h-4 w-4" /> : null}</span>
                </button>
              );
            })}
          </div>
          {error ? <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Seguridad y control</h2>
        <div className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-[#fbfcfa] shadow-[0_10px_30px_rgba(20,42,32,.04)]">
          <Link href="/ajustes/privacidad/bloqueados" className="flex min-h-18 items-center gap-3 border-b border-black/[0.055] px-4 py-3 transition hover:bg-[#f5f7f4]">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e9eeea] text-primary-dark"><Ban className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-brand-dark">Personas bloqueadas</span><span className="mt-0.5 block text-xs text-secondary">Revisa y gestiona a quién has bloqueado</span></span><ChevronRight className="h-4 w-4 text-muted" />
          </Link>
          <div className="flex min-h-18 items-center gap-3 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e9eeea] text-primary-dark"><LockKeyhole className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-brand-dark">Datos privados</span><span className="mt-0.5 block text-xs leading-5 text-secondary">Tu email y tus datos de acceso nunca aparecen en el perfil</span></span><ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        </div>
      </section>
    </main>
  );
}
