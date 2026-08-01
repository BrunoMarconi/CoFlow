"use client";

import { useCallback, useEffect, useState } from "react";
import { getCommunities } from "@/services/communities";
import type { Community, GetCommunitiesParams } from "@/types/community";

export function useCommunities(params?: GetCommunitiesParams) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const city = params?.city;
  const province = params?.province;
  const profileType = params?.profile_type;
  const skip = params?.skip;
  const limit = params?.limit;

  const refetch = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");

    getCommunities({
      city,
      province,
      profile_type: profileType,
      skip,
      limit,
    })
      .then((data) => {
        if (active) setCommunities(data);
      })
      .catch(() => {
        if (active) {
          setCommunities([]);
          setError("No pudimos cargar las comunidades. Intenta de nuevo.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [city, province, profileType, skip, limit]);

  useEffect(() => {
    const cancel = refetch();
    return cancel;
  }, [refetch]);

  return { communities, loading, error, refetch };
}
