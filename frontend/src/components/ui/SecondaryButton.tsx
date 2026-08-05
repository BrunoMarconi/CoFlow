"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SecondaryButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  children: ReactNode;
  className?: string;
  href?: string;
  /** Borde rojo tenue, texto rojo — para acciones destructivas. */
  destructive?: boolean;
};

export default function SecondaryButton({
  children,
  className,
  href,
  destructive = false,
  type = "button",
  ...props
}: SecondaryButtonProps) {
  const classes = cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-14 border bg-surface px-5 text-sm font-bold",
    "transition-all duration-180 ease-out hover:-translate-y-0.5",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
    destructive
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : "border-border text-foreground hover:bg-surface-muted",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
