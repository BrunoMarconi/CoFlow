"use client";

import Link from "next/link";
import { useUsers } from "@/hooks/useUsers";
import UserAvatar from "@/components/ui/UserAvatar";

export default function PeopleTeaserStrip() {
  const { users, loading } = useUsers({ limit: 8 });

  if (!loading && users.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground">
          Personas buscando piso
        </h2>

        <Link
          href="/usuarios"
          className="text-sm font-bold text-brand-dark transition-colors duration-180 hover:text-primary"
        >
          Ver todas
        </Link>
      </div>

      <div className="scroll-fade-x mt-4 flex gap-3 overflow-x-auto pb-1">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-24 w-24 shrink-0 animate-pulse rounded-18 bg-surface-muted"
              />
            ))
          : users.map((user) => (
              <Link
                key={user.id}
                href="/usuarios"
                className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-18 border border-border bg-surface p-3 text-center transition-all duration-180 hover:-translate-y-0.5 hover:shadow-soft"
              >
                <UserAvatar
                  firstName={user.first_name}
                  lastName={user.last_name}
                  userId={user.id}
                  size="lg"
                />
                <span className="truncate text-xs font-bold text-foreground">
                  {user.first_name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
