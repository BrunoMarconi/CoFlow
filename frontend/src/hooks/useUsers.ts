"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicUsers } from "@/services/users";
import type { GetPublicUsersParams } from "@/types/userPublic";
import type { UserPublicProfile } from "@/types/userPublic";

export function useUsers(params?: GetPublicUsersParams) {
  const [users, setUsers] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const maxBudget = params?.max_budget;
  const skip = params?.skip;
  const limit = params?.limit;

  const refetch = useCallback(() => {
    let active = true;
    setLoading(true);

    getPublicUsers({ max_budget: maxBudget, skip, limit })
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch(() => {
        if (active) setUsers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [maxBudget, skip, limit]);

  useEffect(() => {
    function run() {
      return refetch();
    }

    const cancel = run();
    return cancel;
  }, [refetch]);

  return { users, loading };
}
