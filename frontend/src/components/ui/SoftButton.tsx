"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SoftButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  children: ReactNode;
  className?: string;
  href?: string;
  /** Estado "encendido" (ej. filtro activo, guardado). */
  active?: boolean;
};

export default function SoftButton({
  children,
  className,
  href,
  active = false,
  type = "button",
  ...props
}: SoftButtonProps) {
  const classes = cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-14 border px-5 text-sm font-bold",
    "transition-all duration-180 ease-out hover:-translate-y-0.5",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
    active
      ? "border-primary/40 bg-surface text-primary-dark shadow-soft"
      : "border-border bg-surface text-primary-dark shadow-soft hover:border-primary/30",
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
