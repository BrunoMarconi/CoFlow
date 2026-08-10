"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProfileHeader from "@/components/perfil/ProfileHeader";
import TrustProfileCard from "@/components/perfil/TrustProfileCard";
import ProfileInfo from "@/components/perfil/ProfileInfo";
import Preferences from "@/components/perfil/Preferences";
import RoommateSearchCard from "@/components/perfil/RoommateSearchCard";
import ProfilePhotoGallery from "@/components/perfil/ProfilePhotoGallery";
import Spinner from "@/components/ui/Spinner";
import { getMyOnboarding } from "@/services/onboarding";
import {
  deleteUserPhoto,
  reorderUserPhotos,
  uploadUserPhotos,
} from "@/services/users";
import type { OnboardingAnswers } from "@/types/onboarding";

export default function PerfilPage() {
  const { user, loading, ownerProfile, community, refresh } = useAuth();

  const [answers, setAnswers] = useState<
    Partial<OnboardingAnswers>
  >({});

  const [loadingAnswers, setLoadingAnswers] =
    useState(true);

  const [shared, setShared] = useState(false);

  useEffect(() => {
    let active = true;

    getMyOnboarding()
      .then((profile) => {
        if (!active) return;

        const {
          id,
          user_id,
          created_at,
          updated_at,
          ...onboardingAnswers
        } = profile;

        setAnswers(onboardingAnswers);
      })
      .catch(() => {
        if (active) setAnswers({});
      })
      .finally(() => {
        if (active) setLoadingAnswers(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleShare() {
    if (!user) return;

    const url = `${window.location.origin}/personas/${user.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ url, title: "Mi perfil en CoFlow" });
        return;
      } catch {
        // El usuario canceló el share nativo; probamos copiar el enlace.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Sin permisos de portapapeles: no hacemos nada más.
    }
  }

  if (loading || !user || loadingAnswers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <ProfileHeader
        user={user}
        isOwner={ownerProfile !== null}
        cityLabel={community?.city ?? null}
        onAvatarUpdated={async () => {
          await refresh();
        }}
        onShare={handleShare}
        shared={shared}
      />

      <TrustProfileCard user={user} />

      <ProfilePhotoGallery
        photos={user.photos}
        onUpload={async (files) => {
          await uploadUserPhotos(files);
          await refresh();
        }}
        onDelete={async (photoId) => {
          await deleteUserPhoto(photoId);
          await refresh();
        }}
        onReorder={async (photoIds) => {
          await reorderUserPhotos(photoIds);
          await refresh();
        }}
      />

      {user.bio && (
        <section className="rounded-18 border border-border bg-surface p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-bold text-brand-dark">Sobre mí</h2>
          <p className="mt-3 text-sm leading-6 text-secondary">{user.bio}</p>
        </section>
      )}

      <Preferences answers={answers} />

      <ProfileInfo user={user} />

      <RoommateSearchCard
        user={user}
        onUpdated={async () => {
          await refresh();
        }}
      />
    </div>
  );
}
