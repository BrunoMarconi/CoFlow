"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import EditProfileForm from "@/components/perfil/EditProfileForm";
import AvatarUploader from "@/components/perfil/AvatarUploader";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { updateProfile } from "@/services/users";
import { computeProfileCompletion } from "@/lib/profileCompletion";
import type { UpdateProfileRequest } from "@/types/user";

export default function EditarPerfilPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  if (loading || !user) return <Spinner />;

  async function handleSubmit(data: UpdateProfileRequest) {
    await updateProfile(data);
    await refresh();
  }

  const completion = computeProfileCompletion(user);

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <header className="flex items-center gap-4 border-b border-black/[0.07] pb-5">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex h-10 w-10 items-center justify-start text-brand-dark"
        >
          <ArrowLeftIcon />
        </button>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6a756f]">Tu identidad</p><h1 className="mt-1 text-[34px] font-semibold tracking-[-0.05em] text-[#17392c]">
          Editar perfil
        </h1></div>
      </header>

      <section className="mt-6 overflow-hidden rounded-[26px] bg-[#183c2d] p-5 text-white shadow-[0_22px_55px_rgba(24,60,45,.15)] sm:p-7">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0 rounded-full border-4 border-white/20 shadow-[0_10px_28px_rgba(0,0,0,.16)]">
            <Avatar
              name={`${user.first_name} ${user.last_name}`}
              imageUrl={user.avatar_url}
              size={96}
            />
            <AvatarUploader
              hasAvatar={Boolean(user.avatar_url)}
              onUpdated={async () => {
                await refresh();
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-2xl font-semibold tracking-[-0.03em] text-white">
                {user.first_name} {user.last_name}
              </h2>
              {user.is_email_verified && <VerifiedIcon />}
            </div>
            <p className="mt-3 text-xs font-medium text-white/60">
              Perfil completado <span className="font-semibold text-white">{completion}%</span>
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-white" style={{ width: `${completion}%` }} />
            </div>
            <Link href={`/personas/${user.id}`} className="mt-4 inline-flex min-h-10 items-center text-xs font-semibold text-white underline decoration-white/25 underline-offset-4">Ver perfil público</Link>
          </div>
        </div>
      </section>

      <div className="mt-8">
        <EditProfileForm user={user} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
}

function VerifiedIcon() {
  return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white" aria-label="Email verificado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg></span>;
}
