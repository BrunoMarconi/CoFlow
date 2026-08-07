"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getPublicUsers } from "@/services/users";
import type { GetPublicUsersParams } from "@/types/userPublic";
import type { UserPublicProfile } from "@/types/userPublic";

const PAGE_SIZE = 20;

export function useUsers(params?: GetPublicUsersParams) {
  const maxBudget = params?.max_budget;

  const query = useInfiniteQuery({
    queryKey: ["public-users", { maxBudget }],
    queryFn: ({ pageParam }): Promise<UserPublicProfile[]> =>
      getPublicUsers({ max_budget: maxBudget, skip: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  });

  return {
    users: query.data?.pages.flat() ?? [],
    loading: query.isLoading,
    hasMore: Boolean(query.hasNextPage),
    loadingMore: query.isFetchingNextPage,
    loadMore: () => {
      query.fetchNextPage();
    },
  };
}
