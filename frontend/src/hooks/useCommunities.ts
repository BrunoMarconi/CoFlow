"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getCommunities } from "@/services/communities";
import type { Community, GetCommunitiesParams } from "@/types/community";

const PAGE_SIZE = 20;

export function useCommunities(params?: GetCommunitiesParams) {
  const city = params?.city;
  const province = params?.province;
  const profileType = params?.profile_type;
  const joinType = params?.join_type;
  const urgency = params?.urgency;
  const maxBudget = params?.max_budget;
  const moveInBefore = params?.move_in_before;
  const onlyWithSpots = params?.only_with_spots;

  const query = useInfiniteQuery({
    queryKey: [
      "communities",
      { city, province, profileType, joinType, urgency, maxBudget, moveInBefore, onlyWithSpots },
    ],
    queryFn: ({ pageParam }): Promise<Community[]> =>
      getCommunities({
        city,
        province,
        profile_type: profileType,
        join_type: joinType,
        urgency,
        max_budget: maxBudget,
        move_in_before: moveInBefore,
        only_with_spots: onlyWithSpots,
        skip: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  });

  return {
    communities: query.data?.pages.flat() ?? [],
    loading: query.isLoading,
    error: query.isError
      ? "No pudimos cargar las comunidades. Intenta de nuevo."
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
