import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-18 bg-surface p-6 shadow-soft border border-border",
        className
      )}
    >
      {children}
    </div>
  );
}