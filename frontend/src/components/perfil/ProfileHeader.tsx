import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import type { User } from "@/types/auth";

export default function ProfileHeader({
  user,
  isOwner = false,
}: {
  user: User;
  isOwner?: boolean;
}) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();

  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
      <div className="h-28 bg-gradient-to-br from-green-100 via-emerald-50 to-white sm:h-36" />

      <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
        <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="rounded-full border-4 border-white bg-white shadow-md">
              <Avatar name={fullName} size={88} />
            </div>

            <div className="pb-1">
              <h1 className="text-2xl font-bold tracking-tight text-[#163B2E] sm:text-3xl">
                {fullName}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Perfil de CoFlow
              </p>
            </div>
          </div>

          <Link
            href="/perfil/editar"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-[#163B2E] shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50"
          >
            <EditIcon />
            Editar perfil
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Perfil activo
          </span>

          {user.onboarding_completed && (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F3F6F4] px-3 py-2 text-xs font-bold text-[#476257]">
              <CheckIcon />
              Preferencias completadas
            </span>
          )}

          {isOwner && (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#163B2E] px-3 py-2 text-xs font-bold text-white shadow-sm">
              <KeyIcon />
              Propietario
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.5-8.5" />
      <path d="m16.5 6 2.5 2.5" />
      <path d="m14 8.5 2.5 2.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}