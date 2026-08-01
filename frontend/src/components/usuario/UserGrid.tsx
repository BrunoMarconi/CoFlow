import UserCard from "./UserCard";
import EmptyState from "@/components/ui/EmptyState";
import type { UserPublicProfile } from "@/types/userPublic";

export default function UserGrid({ users }: { users: UserPublicProfile[] }) {
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
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
