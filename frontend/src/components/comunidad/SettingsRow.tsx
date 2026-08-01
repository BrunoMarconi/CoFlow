import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

export function SettingsSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="px-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>

      <div className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  href,
  onClick,
  expanded,
  badge,
  iconClassName,
}: {
  icon: (props: IconProps) => ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  expanded?: boolean;
  badge?: number;
  iconClassName?: string;
}) {
  const content = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-brand-dark",
          iconClassName
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-foreground">
            {title}
          </span>

          {typeof badge === "number" && badge > 0 && (
            <span className="shrink-0 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>

        {subtitle && (
          <span className="mt-0.5 block truncate text-xs leading-4 text-muted">
            {subtitle}
          </span>
        )}
      </span>

      <ChevronIcon
        className={cn(
          "h-4 w-4 shrink-0 text-muted transition-transform",
          expanded && "rotate-90"
        )}
      />
    </>
  );

  const className =
    "flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-soft focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={className}
    >
      {content}
    </button>
  );
}

function ChevronIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
