"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, Globe2, ShieldCheck, UserRoundCheck } from "lucide-react";
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
    <main className="mx-auto w-full max-w-2xl pb-10">
      <header className="flex items-center gap-3">
        <Link href="/perfil" aria-label="Volver al perfil" className="flex h-11 w-11 items-center justify-start"><ChevronLeft className="h-6 w-6" /></Link>
        <div><h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#191919]">Privacidad y seguridad</h1><p className="mt-1 text-sm text-[#717171]">Tú decides quién puede conocerte.</p></div>
      </header>

      {loading ? <div className="flex min-h-72 items-center justify-center"><Spinner /></div> : (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#191919]">¿Quién puede ver tu perfil?</h2>
          <p className="mt-2 text-sm leading-6 text-[#717171]">Esta elección se aplica a tus fotos, bio, edad, ocupación, gustos y preferencias.</p>
          <div className="mt-7 grid gap-3">
            {OPTIONS.map((option) => {
              const active = value === option.value;
              return (
                <button key={option.value} type="button" disabled={saving} onClick={() => void select(option.value)} className={`flex min-h-32 items-center gap-4 rounded-[1.5rem] border p-5 text-left transition disabled:cursor-wait ${active ? "border-black bg-[#f7f7f7] ring-1 ring-black" : "border-[#dddddd] bg-white hover:border-[#b0b0b0]"}`}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#191919] shadow-sm [&>svg]:h-6 [&>svg]:w-6">{option.icon}</span>
                  <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-[#191919]">{option.title}</span><span className="mt-1 block text-sm leading-6 text-[#717171]">{option.description}</span></span>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? "border-black bg-black text-white" : "border-[#b0b0b0]"}`}>{active ? <Check className="h-4 w-4" /> : null}</span>
                </button>
              );
            })}
          </div>
          {error ? <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
        </section>
      )}

      <aside className="mt-8 flex gap-4 rounded-[1.5rem] border border-[#dddddd] bg-white p-5">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" />
        <div><h2 className="text-sm font-semibold text-[#191919]">Tus datos siguen siendo tuyos</h2><p className="mt-1 text-xs leading-5 text-[#717171]">El email, el teléfono y los datos privados de tu cuenta nunca aparecen en tu perfil público.</p></div>
      </aside>
    </main>
  );
}
