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
        "rounded-3xl bg-white p-6 shadow-sm border border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}