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
      ? "border-primary/30 bg-mint-100 text-primary-dark"
      : "border-transparent bg-mint-50 text-primary-dark hover:bg-mint-100",
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
