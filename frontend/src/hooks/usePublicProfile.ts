"use client";

import { useEffect, useState } from "react";
import { getPublicUserProfile } from "@/services/users";
import type { UserPublicProfile } from "@/types/userPublic";

export function usePublicProfile(id: string) {
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    function fetchProfile() {
      setLoading(true);
      setNotFound(false);

      getPublicUserProfile(id)
        .then((data) => {
          if (active) setProfile(data);
        })
        .catch(() => {
          if (!active) return;
          setProfile(null);
          setNotFound(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [id]);

  return { profile, loading, notFound };
}
