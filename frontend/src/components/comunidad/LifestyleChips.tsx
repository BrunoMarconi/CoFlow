import { COMMUNITY_PROFILE_TYPE_OPTIONS } from "@/lib/communityProfileType";
import type { CommunityProfileType } from "@/types/community";
import { cn } from "@/lib/utils";

export default function LifestyleChips({
  active,
  onSelect,
}: {
  active: CommunityProfileType | "ALL";
  onSelect: (value: CommunityProfileType | "ALL") => void;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground">
        Explora por estilo de vida
      </h2>

      <div className="scroll-fade-x mt-4 flex gap-2 overflow-x-auto pb-1">
        {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onSelect(active === option.value ? "ALL" : option.value)
            }
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-180",
              active === option.value
                ? "border-primary bg-mint-100 text-brand-dark"
                : "border-border bg-surface text-secondary hover:border-primary/40 hover:text-brand-dark"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
