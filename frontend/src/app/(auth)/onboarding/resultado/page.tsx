"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import Logo from "@/components/ui/Logo";
import CompatibilityRadar, { CompatibilityRadarIcon } from "@/components/convivencia/CompatibilityRadar";
import { getMyCompatibilityScore } from "@/services/users";
import type { CompatibilityScore } from "@/types/compatibilityScore";

export default function OnboardingResultadoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [score, setScore] = useState<CompatibilityScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.onboarding_completed) {
      router.replace("/onboarding");
      return;
    }
    let active = true;
    getMyCompatibilityScore()
      .then((data) => { if (active) setScore(data); })
      .catch(() => { if (active) router.replace("/comunidades"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user?.onboarding_completed, router]);

  if (authLoading || loading || !score) {
    return <main className="flex min-h-dvh items-center justify-center bg-surface"><Spinner /></main>;
  }

  return (
    <main className="min-h-dvh bg-surface px-5 pb-10 pt-[calc(var(--safe-top)+1.5rem)] sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex justify-center"><Logo size="sm" /></div>

        <div className="mt-6 animate-fade-in-up">
          <CompatibilityRadar
            categories={score.categories}
            icon={<CompatibilityRadarIcon />}
            title="¡Tu Perfil de Convivencia!"
            subtitle="Así te ven tus futuros compañeros"
            actions={
              <>
                <Link href="/comunidades" className="flex h-14 items-center justify-center gap-2 rounded-14 bg-primary px-6 text-base font-bold text-white shadow-button transition hover:bg-primary-hover">
                  Explorar Comunidades <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/perfil" className="flex h-14 items-center justify-center rounded-14 border border-border bg-surface px-6 text-base font-bold text-brand-dark transition hover:border-primary/30">
                  Ver mi perfil completo
                </Link>
              </>
            }
          />
        </div>
      </div>
    </main>
  );
}
