import UserAvatar, { type UserAvatarSize } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

export interface AvatarGroupMember {
  id: string;
  firstName: string;
  lastName?: string | null;
}

export default function AvatarGroup({
  members,
  max = 3,
  size = "sm",
  totalCount,
  className,
}: {
  members: AvatarGroupMember[];
  max?: number;
  size?: UserAvatarSize;
  /** Si se pasa, se usa para calcular el "+N" en vez de members.length
   * (útil cuando `members` ya viene recortado por el backend). */
  totalCount?: number;
  className?: string;
}) {
  const visible = members.slice(0, max);
  const total = totalCount ?? members.length;
  const extra = total - visible.length;

  if (visible.length === 0) return null;

  return (
    <div className={cn("flex shrink-0 -space-x-2", className)}>
      {visible.map((member) => (
        <UserAvatar
          key={member.id}
          firstName={member.firstName}
          lastName={member.lastName}
          userId={member.id}
          size={size}
          className="border-2 border-surface"
        />
      ))}

      {extra > 0 && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border-2 border-surface bg-surface-muted text-xs font-bold text-secondary",
            size === "sm" ? "h-8 w-8" : "h-11 w-11"
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
