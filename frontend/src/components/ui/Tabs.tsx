"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  active: boolean;
  href?: string;
  onClick?: () => void;
}

export default function Tabs({
  items,
  className,
  "aria-label": ariaLabel,
}: {
  items: TabItem[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-5 overflow-x-auto snap-x snap-proximity scroll-fade-x border-b border-border",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {items.map((item) => {
        const tabClassName = cn(
          "relative flex h-11 shrink-0 items-center whitespace-nowrap px-1 text-sm font-bold transition-colors duration-200",
          item.active
            ? "text-primary-dark"
            : "text-muted hover:text-foreground"
        );

        const indicator = item.active && (
          <motion.span
            layoutId="tabs-active-indicator"
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
          />
        );

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              role="tab"
              aria-selected={item.active}
              className={tabClassName}
            >
              {item.label}
              {indicator}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={item.active}
            onClick={item.onClick}
            className={tabClassName}
          >
            {item.label}
            {indicator}
          </button>
        );
      })}
    </div>
  );
}
