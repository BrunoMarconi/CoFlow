import { cn } from "@/lib/utils";

export default function ProfileCompletionRing({
  completion,
  className,
}: {
  completion: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className={cn("pointer-events-none", className)}
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary/15"
      />
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        pathLength="100"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${completion} 100`}
        className="origin-center -rotate-90 text-primary"
      />
    </svg>
  );
}
