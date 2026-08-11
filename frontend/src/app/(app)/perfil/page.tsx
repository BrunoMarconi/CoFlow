"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import IdentityHeader from "@/components/perfil/IdentityHeader";
import ProfileCompletionCard from "@/components/perfil/ProfileCompletionCard";
import ViewPublicProfileRow from "@/components/perfil/ViewPublicProfileRow";
import TrustSection from "@/components/perfil/TrustProfileCard";
import MyCoflowSection from "@/components/perfil/MyCoflowSection";
import OwnerCTACard from "@/components/perfil/OwnerCTACard";
import YourProfileSection from "@/components/perfil/YourProfileSection";
import RoommateSearchCard from "@/components/perfil/RoommateSearchCard";
import ProfilePhotoGallery from "@/components/perfil/ProfilePhotoGallery";
import AccountSection from "@/components/perfil/AccountSection";
import SupportSection from "@/components/perfil/SupportSection";
import DangerZoneSection from "@/components/perfil/DangerZoneSection";
import { SettingsIcon } from "@/components/layout/NavIcons";
import Spinner from "@/components/ui/Spinner";
import { getMyOnboarding } from "@/services/onboarding";
import { getSavedProfiles, deleteUserPhoto, reorderUserPhotos, uploadUserPhotos } from "@/services/users";
import { getConnectionRequests, getConnections } from "@/services/connections";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import type { OnboardingAnswers } from "@/types/onboarding";

export default function PerfilPage() {
  const { user, loading, ownerProfile, community, logout, refresh } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [loadingAnswers, setLoadingAnswers] = useState(true);

  const [savedCount, setSavedCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [pendingReceivedCount, setPendingReceivedCount] = useState(0);

  useEffect(() => {
    let active = true;

    getMyOnboarding()
      .then((profile) => {
        if (!active) return;

        const { id, user_id, created_at, updated_at, ...onboardingAnswers } =
          profile;

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

  useEffect(() => {
    let active = true;

    getSavedProfiles()
      .then((profiles) => {
        if (active) setSavedCount(profiles.length);
      })
      .catch(() => {});

    getConnections()
      .then((connections) => {
        if (active) setConnectionsCount(connections.length);
      })
      .catch(() => {});

    getConnectionRequests()
      .then((requests) => {
        if (active) setPendingReceivedCount(requests.received.length);
      })
      .catch(() => {});

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
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
      className="mx-auto w-full max-w-2xl space-y-7 pb-4"
    >
      <header className="flex items-center justify-between">
        <h1 className="font-rounded text-xl font-semibold text-brand-dark">
          Perfil
        </h1>

        <Link
          href="/ajustes"
          aria-label="Ajustes"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <SettingsIcon className="h-5 w-5" />
        </Link>
      </header>

      <div className="space-y-3">
        <IdentityHeader
          user={user}
          cityLabel={community?.city ?? null}
          onAvatarUpdated={async () => {
            await refresh();
          }}
        />

        {user.bio && (
          <p className="text-sm leading-6 text-secondary">{user.bio}</p>
        )}
      </div>

      <ProfileCompletionCard user={user} />

      <ViewPublicProfileRow userId={user.id} />

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-dark">Confianza</h2>
        <TrustSection user={user} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-dark">Mi CoFlow</h2>
        <MyCoflowSection
          community={community}
          savedCount={savedCount}
          connectionsCount={connectionsCount}
          pendingReceivedCount={pendingReceivedCount}
        />
      </section>

      <OwnerCTACard isOwner={ownerProfile !== null} />

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-dark">Tu perfil</h2>

        <YourProfileSection
          user={user}
          answers={answers}
          cityLabel={community?.city ?? null}
        />

        <div id="fotos">
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

        <RoommateSearchCard
          user={user}
          onUpdated={async () => {
            await refresh();
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-dark">Cuenta</h2>
        <AccountSection />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-dark">Soporte</h2>
        <SupportSection />
      </section>

      <DangerZoneSection onLogout={logout} />
    </motion.div>
  );
}
