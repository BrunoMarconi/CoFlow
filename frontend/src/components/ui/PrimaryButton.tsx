"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PrimaryButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  children: ReactNode;
  className?: string;
  /** Si se pasa, se renderiza como <Link> en vez de <button> (mismos
   * estilos). No combina con los handlers/atributos de <button>. */
  href?: string;
};

export default function PrimaryButton({
  children,
  className,
  href,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  const classes = cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button",
    "transition-all duration-180 ease-out hover:-translate-y-0.5 hover:bg-primary-hover",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
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
