"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProfileHeader from "@/components/perfil/ProfileHeader";
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
  const { user, loading, ownerProfile, refresh } = useAuth();

  const [answers, setAnswers] = useState<
    Partial<OnboardingAnswers>
  >({});

  const [loadingAnswers, setLoadingAnswers] =
    useState(true);

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

  if (loading || !user || loadingAnswers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <ProfileHeader
        user={user}
        isOwner={ownerProfile !== null}
        onAvatarUpdated={async () => {
          await refresh();
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <ProfileInfo user={user} />
          <RoommateSearchCard
            user={user}
            onUpdated={async () => {
              await refresh();
            }}
          />
        </div>

        <Preferences answers={answers} />
      </div>

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
    </div>
  );
}