"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import OwnerProfileForm, {
  type OwnerProfileFormValues,
} from "@/components/propietario/OwnerProfileForm";
import OwnerProfileSummary from "@/components/propietario/OwnerProfileSummary";
import RoommateIntentPrompt from "@/components/propietario/RoommateIntentPrompt";
import {
  createOwnerProfile,
  updateOwnerProfile,
} from "@/services/owners";
import { updateProfile } from "@/services/users";
import { getCommunityErrorMessage } from "@/lib/communityErrors";

type View = "summary" | "edit" | "ask-intent";

export default function OwnerProfilePage() {
  const router = useRouter();
  const {
    user,
    ownerProfile,
    ownerProfileLoading,
    refresh,
    refreshOwnerProfile,
  } = useAuth();

  const [view, setView] = useState<View>("summary");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  async function handleCreate(values: OwnerProfileFormValues) {
    if (submitting) return;

    setSubmitting(true);
    setServerError("");

    try {
      await createOwnerProfile(values);
      await refreshOwnerProfile();
      setView("ask-intent");
    } catch (error) {
      setServerError(
        getCommunityErrorMessage(
          error,
          "No pudimos guardar tu perfil de propietario. Inténtalo de nuevo."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(values: OwnerProfileFormValues) {
    if (submitting) return;

    setSubmitting(true);
    setServerError("");

    try {
      await updateOwnerProfile(values);
      await refreshOwnerProfile();
      setView("summary");
    } catch (error) {
      setServerError(
        getCommunityErrorMessage(
          error,
          "No pudimos guardar los cambios. Inténtalo de nuevo."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIntentAnswer(lookingForRoommates: boolean) {
    if (!user || submitting) return;

    setSubmitting(true);

    try {
      await updateProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        rental_budget: user.rental_budget,
        is_looking_for_roommates: lookingForRoommates,
      });
      await refresh();
    } catch {
      // Si falla, el usuario puede ajustarlo después desde Mi perfil.
    } finally {
      setSubmitting(false);
      router.push("/propietarios/pisos");
    }
  }

  if (ownerProfileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!ownerProfile) {
    return (
      <OwnerProfileForm
        mode="create"
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleCreate}
      />
    );
  }

  if (view === "ask-intent") {
    return (
      <RoommateIntentPrompt
        submitting={submitting}
        onAnswer={handleIntentAnswer}
      />
    );
  }

  if (view === "edit") {
    return (
      <OwnerProfileForm
        mode="edit"
        initialValues={ownerProfile}
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleEdit}
        onCancel={() => {
          setServerError("");
          setView("summary");
        }}
      />
    );
  }

  return (
    <OwnerProfileSummary
      ownerProfile={ownerProfile}
      onEdit={() => setView("edit")}
    />
  );
}
