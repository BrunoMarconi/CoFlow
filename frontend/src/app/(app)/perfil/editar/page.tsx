"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import EditProfileForm from "@/components/perfil/EditProfileForm";
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

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold text-[#163B2E]">Editar perfil</h1>
      <div className="mt-8">
        <EditProfileForm user={user} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
