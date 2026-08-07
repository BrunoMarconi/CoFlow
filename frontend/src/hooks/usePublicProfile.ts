"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicUserProfile } from "@/services/users";
import type { UserPublicProfile } from "@/types/userPublic";

export function usePublicProfile(id: string) {
  const query = useQuery<UserPublicProfile>({
    queryKey: ["public-profile", id],
    queryFn: () => getPublicUserProfile(id),
    enabled: Boolean(id),
  });

  return {
    profile: query.data ?? null,
    loading: Boolean(id) && query.isLoading,
    notFound: query.isError,
  };
}
