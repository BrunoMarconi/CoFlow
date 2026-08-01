import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-[#163B2E] via-[#237154] to-green-400",
  "from-emerald-700 via-teal-600 to-emerald-400",
  "from-lime-700 via-green-600 to-lime-400",
  "from-teal-700 via-cyan-600 to-teal-400",
  "from-green-800 via-emerald-600 to-teal-400",
  "from-amber-700 via-orange-600 to-amber-400",
];

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl",
} as const;

export type UserAvatarSize = keyof typeof SIZES;

function hashId(id: string) {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export default function UserAvatar({
  firstName,
  lastName,
  userId,
  size = "md",
  className,
}: {
  firstName: string;
  lastName?: string | null;
  userId: string;
  size?: UserAvatarSize;
  className?: string;
}) {
  const initials = [firstName, lastName]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part?.[0])
    .join("")
    .toUpperCase();

  const gradient = GRADIENTS[hashId(userId) % GRADIENTS.length];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white/40 bg-gradient-to-br font-bold text-white shadow-sm",
        gradient,
        SIZES[size],
        className
      )}
    >
      {initials || "CF"}
    </div>
  );
}
