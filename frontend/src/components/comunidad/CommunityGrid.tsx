import CommunityCard from "./CommunityCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Community } from "@/types/community";

export default function CommunityGrid({
  communities,
  ownCommunityId,
}: {
  communities: Community[];
  ownCommunityId?: number;
}) {
  if (communities.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay comunidades"
        description="Sé la primera persona en crear una comunidad en esta zona."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
      {communities.map((community, index) => (
        <div
          key={community.id}
          className="h-full animate-fade-in-up"
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        >
          <CommunityCard
            community={community}
            isOwn={community.id === ownCommunityId}
          />
        </div>
      ))}
    </div>
  );
}