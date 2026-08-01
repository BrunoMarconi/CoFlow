import CommunityCard from "./CommunityCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Community } from "@/types/community";

export default function CommunityGrid({
  communities,
}: {
  communities: Community[];
}) {
  if (communities.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-gray-200 bg-white">
        <EmptyState
          title="Todavía no hay comunidades"
          description="Sé la primera persona en crear una comunidad en esta zona."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard
          key={community.id}
          community={community}
        />
      ))}
    </div>
  );
}