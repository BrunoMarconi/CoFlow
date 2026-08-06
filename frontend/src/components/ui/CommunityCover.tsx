import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-[#163B2E] via-[#237154] to-green-400",
  "from-emerald-800 via-teal-600 to-emerald-400",
  "from-teal-800 via-cyan-700 to-teal-400",
  "from-green-900 via-lime-700 to-lime-400",
  "from-[#12382C] via-emerald-700 to-teal-300",
];

function hashId(id: number | string) {
  const value = String(id);
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export default function CommunityCover({
  communityId,
  name,
  className,
}: {
  communityId: number | string;
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const gradient = GRADIENTS[hashId(communityId) % GRADIENTS.length];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradient,
        className
      )}
    >
      <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/5" />

      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white/25">
        {initials || "CF"}
      </div>
    </div>
  );
}
