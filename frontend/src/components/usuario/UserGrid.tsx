import UserCard from "./UserCard";
import EmptyState from "@/components/ui/EmptyState";
import type { UserPublicProfile } from "@/types/userPublic";

export default function UserGrid({
  users,
  onOpen,
}: {
  users: UserPublicProfile[];
  onOpen: (userId: string) => void;
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay personas para mostrar"
        description="A medida que se registren usuarios compatibles, los verás aquí."
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user, index) => (
        <div
          key={user.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        >
          <UserCard user={user} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}
