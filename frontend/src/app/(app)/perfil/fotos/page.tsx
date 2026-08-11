"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import ProfilePhotosManager from "@/components/perfil/ProfilePhotosManager";
import { deleteUserPhoto, reorderUserPhotos, uploadUserPhotos } from "@/services/users";
import { toast } from "@/components/ui/Toast";

export default function ProfilePhotosPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  if (loading || !user) return <Spinner />;

  return (
    <div className="mx-auto w-full max-w-3xl pb-6 sm:pb-10">
      <header className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-10 w-10 items-center justify-start text-brand-dark"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="text-xl font-extrabold tracking-[-0.02em] text-foreground sm:text-2xl">Fotos del perfil</h1>
        <button type="button" onClick={() => router.push("/perfil/editar")} className="h-10 min-w-10 text-right text-sm font-bold text-primary">Listo</button>
      </header>

      <div className="mt-6">
        <ProfilePhotosManager
          photos={user.photos}
          onUpload={async (files) => { await uploadUserPhotos(files); await refresh(); toast.success("Fotos añadidas"); }}
          onDelete={async (photoId) => { await deleteUserPhoto(photoId); await refresh(); toast.success("Foto eliminada"); }}
          onReorder={async (photoIds) => { await reorderUserPhotos(photoIds); await refresh(); toast.success("Orden actualizado"); }}
        />
      </div>
    </div>
  );
}
