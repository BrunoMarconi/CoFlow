import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IconProps } from "@/components/layout/NavIcons";

export default function NavigationItem({
  href,
  label,
  icon: Icon,
  active,
  count,
  onClick,
}: {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactElement;
  active: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        active
          ? "bg-brand/10 text-brand"
          : "text-muted hover:bg-surface-soft hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-brand" : "text-muted"
        )}
      />

      <span className="min-w-0 flex-1 truncate">{label}</span>

      {typeof count === "number" && count > 0 && (
        <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
