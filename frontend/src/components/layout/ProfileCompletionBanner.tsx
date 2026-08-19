"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getProfileCompletionChecklist } from "@/lib/profileCompletion";

const EXCLUDED_PATHS = ["/perfil", "/perfil/editar", "/usuarios"];
const MAX_LISTED = 3;

export default function ProfileCompletionBanner() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  if (EXCLUDED_PATHS.includes(pathname)) return null;

  const missingItems = getProfileCompletionChecklist(user).filter(
    (item) => !item.done
  );

  if (missingItems.length === 0) return null;

  const listed = missingItems.slice(0, MAX_LISTED).map((item) => item.label);
  const remaining = missingItems.length - listed.length;
  const missingLabel =
    listed.join(", ") + (remaining > 0 ? ` y ${remaining} más` : "");

  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/25 bg-mint-50 px-4 py-3 text-sm sm:flex-row sm:items-center">
      <p className="font-semibold text-primary-dark">
        Te falta por completar: {missingLabel}.
      </p>

      <Link
        href="/perfil"
        className="shrink-0 rounded-xl border border-primary/30 bg-white px-4 py-2 text-xs font-bold text-primary-dark transition hover:bg-primary/10"
      >
        Completar perfil
      </Link>
    </div>
  );
}
