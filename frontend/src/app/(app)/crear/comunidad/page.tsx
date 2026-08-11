"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import CreateCommunityWizard from "@/components/comunidad/CreateCommunityWizard";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

export default function CrearComunidadPage() {
  const router = useRouter();
  const { community, communityLoading } = useAuth();

  useEffect(() => {
    if (!communityLoading && community) {
      router.replace(`/comunidades/${community.id}`);
    }
  }, [communityLoading, community, router]);

  if (communityLoading || community) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <CreateCommunityWizard onCancel={() => router.back()} />;
}
