"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getPublicUsers } from "@/services/users";
import type { GetPublicUsersParams } from "@/types/userPublic";
import type { UserPublicProfile } from "@/types/userPublic";

const PAGE_SIZE = 20;

export function useUsers(params?: GetPublicUsersParams) {
  const maxBudget = params?.max_budget;
  const city = params?.city;
  const communityStatus = params?.community_status;

  const query = useInfiniteQuery({
    queryKey: ["public-users", { maxBudget, city, communityStatus }],
    queryFn: ({ pageParam }): Promise<UserPublicProfile[]> =>
      getPublicUsers({
        max_budget: maxBudget,
        city,
        community_status: communityStatus,
        skip: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  });

  return {
    users: query.data?.pages.flat() ?? [],
    loading: query.isLoading,
    error: query.isError
      ? "No pudimos cargar las personas. Inténtalo de nuevo."
      : "",
    refetch: () => {
      query.refetch();
    },
    hasMore: Boolean(query.hasNextPage),
    loadingMore: query.isFetchingNextPage,
    loadMore: () => {
      query.fetchNextPage();
    },
  };
}
