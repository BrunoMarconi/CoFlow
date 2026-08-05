"use client";

import { useMemo, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import UserGrid from "@/components/usuario/UserGrid";
import PersonasTabs from "@/components/usuario/PersonasTabs";
import PeopleHero from "@/components/usuario/PeopleHero";
import UserFilters, {
  defaultUserFilters,
  isUserFiltersActive,
  type UserFilterState,
} from "@/components/usuario/UserFilters";
import SectionHeader from "@/components/ui/SectionHeader";
import SearchInput from "@/components/ui/SearchInput";
import SoftButton from "@/components/ui/SoftButton";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilterState>(
    defaultUserFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { user: currentUser } = useAuth();

  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : undefined;

  const { users, loading } = useUsers({ max_budget: maxBudget });

  const lookingUsers = useMemo(
    () => users.filter((u) => u.is_looking_for_roommates && !u.community),
    [users]
  );

  const inCommunityUsers = useMemo(
    () => users.filter((u) => Boolean(u.community)),
    [users]
  );

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedCity = filters.city.trim().toLowerCase();

    return users.filter((user) => {
      if (normalizedSearch) {
        const fullName =
          `${user.first_name} ${user.last_name}`.toLowerCase();

        const matchesName = fullName.includes(normalizedSearch);
        const matchesCity = user.community?.city
          .toLowerCase()
          .includes(normalizedSearch);

        if (!matchesName && !matchesCity) return false;
      }

      if (
        normalizedCity &&
        !user.community?.city.toLowerCase().includes(normalizedCity)
      ) {
        return false;
      }

      if (
        filters.communityStatus === "HAS_COMMUNITY" &&
        !user.community
      ) {
        return false;
      }

      if (filters.communityStatus === "LOOKING" && user.community) {
        return false;
      }

      return true;
    });
  }, [users, search, filters]);

  const visibleLooking = useMemo(
    () => visibleUsers.filter((u) => u.is_looking_for_roommates && !u.community),
    [visibleUsers]
  );

  const visibleInCommunity = useMemo(
    () => visibleUsers.filter((u) => Boolean(u.community)),
    [visibleUsers]
  );

  return (
    <div>
      <PeopleHero
        firstName={currentUser?.first_name}
        lookingCount={lookingUsers.length}
        inCommunityCount={inCommunityUsers.length}
      />

      <div className="mt-6">
        <PersonasTabs />
      </div>

      <div className="mt-4 flex flex-row gap-2">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch("")}
          placeholder="Buscar por nombre o ciudad"
          className="flex-1"
        />

        <SoftButton
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          aria-label="Filtros"
          active={filtersOpen || isUserFiltersActive(filters)}
          className="px-4 sm:px-5"
        >
          <FilterIcon />
          <span className="hidden sm:inline">Filtros</span>
        </SoftButton>
      </div>

      {filtersOpen && (
        <div className="mt-4">
          <UserFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(defaultUserFilters)}
            resultCount={visibleUsers.length}
          />
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <>
          <section className="mt-8">
            <SectionHeader
              title="Buscando compañeros de piso"
              subtitle={`${visibleLooking.length} ${
                visibleLooking.length === 1 ? "persona" : "personas"
              }`}
            />

            <div className="mt-4">
              <UserGrid users={visibleLooking} />
            </div>
          </section>

          <section className="mt-10">
            <SectionHeader
              title="Ya en una comunidad"
              subtitle={`${visibleInCommunity.length} ${
                visibleInCommunity.length === 1 ? "persona" : "personas"
              }`}
            />

            <div className="mt-4">
              <UserGrid users={visibleInCommunity} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}
