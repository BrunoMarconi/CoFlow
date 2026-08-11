"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import EditProfileForm from "@/components/perfil/EditProfileForm";
import AvatarUploader from "@/components/perfil/AvatarUploader";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { updateProfile } from "@/services/users";
import type { UpdateProfileRequest } from "@/types/user";

export default function EditarPerfilPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  if (loading || !user) return <Spinner />;

  async function handleSubmit(data: UpdateProfileRequest) {
    await updateProfile(data);
    await refresh();
    router.push("/perfil");
  }

  const completion = computeProfileCompletion(user);

  return (
    <div className="mx-auto max-w-2xl pb-4">
      <header className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex h-10 w-10 items-center justify-start text-brand-dark"
        >
          <ArrowLeftIcon />
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark">
          Editar perfil
        </h1>
      </header>

      <section className="mt-6 rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0 rounded-full border-4 border-white shadow-soft">
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
              <h2 className="truncate text-2xl font-bold text-brand-dark">
                {user.first_name}
              </h2>
              {user.is_email_verified && <VerifiedIcon />}
            </div>
            <p className="mt-4 text-sm font-semibold text-secondary">
              Perfil completado <span className="text-primary">{completion}%</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-soft">
              <div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <EditProfileForm user={user} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

function computeProfileCompletion(user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
  const checks = [
    Boolean(user.avatar_url), Boolean(user.bio), Boolean(user.phone),
    user.age !== null, Boolean(user.occupation), user.rental_budget !== null,
    user.is_email_verified, user.onboarding_completed, user.photos.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
}

function VerifiedIcon() {
  return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white" aria-label="Email verificado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg></span>;
}
