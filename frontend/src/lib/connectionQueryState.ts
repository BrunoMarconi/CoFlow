import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { UserConnectionStatusLabel, UserPublicProfile } from "@/types/userPublic";

export const CONNECTION_OVERVIEW_QUERY_KEY = ["connection-overview"] as const;
export const CONNECTION_REQUESTS_QUERY_KEY = ["connection-requests"] as const;
export const CONNECTIONS_QUERY_KEY = ["connections-with-last-message"] as const;

function withConnectionState(
  profile: UserPublicProfile,
  userId: string,
  status: UserConnectionStatusLabel,
  connectionId: number | null
) {
  if (profile.id !== userId) return profile;

  return {
    ...profile,
    connection_status: status,
    connection_id: connectionId,
  };
}

/** Mantiene Personas, el perfil completo y la vista rápida de una persona
 * con el mismo estado sin esperar a otra petición de red. */
export function setCachedProfileConnection(
  queryClient: QueryClient,
  userId: string,
  status: UserConnectionStatusLabel,
  connectionId: number | null
) {
  queryClient.setQueryData<UserPublicProfile>(
    ["public-profile", userId],
    (profile) =>
      profile
        ? withConnectionState(profile, userId, status, connectionId)
        : profile
  );

  queryClient.setQueriesData<InfiniteData<UserPublicProfile[]>>(
    { queryKey: ["public-users"] },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) =>
          page.map((profile) =>
            withConnectionState(profile, userId, status, connectionId)
          )
        ),
      }
  );
}

export function refreshConnectionQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: CONNECTION_OVERVIEW_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: CONNECTION_REQUESTS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
}
