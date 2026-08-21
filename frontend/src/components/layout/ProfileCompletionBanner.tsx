"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  computeProfileCompletion,
  getProfileCompletionChecklist,
} from "@/lib/profileCompletion";

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
  const completion = computeProfileCompletion(user);

  return (
    <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-primary/25 bg-mint-50 px-5 py-4 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p className="font-bold text-primary-dark">Tu perfil está al {completion}%</p>
          <span className="hidden text-xs font-semibold text-secondary sm:inline">Mejora tus recomendaciones</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/12" aria-hidden="true">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${completion}%` }} />
        </div>
        <p className="mt-2 truncate text-xs font-medium text-secondary">
          Te falta: {missingLabel}.
        </p>
      </div>

      <Link
        href="/perfil"
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-white px-4 text-xs font-bold text-primary-dark transition hover:bg-primary/10"
      >
        Completar perfil
      </Link>
    </div>
  );
}
