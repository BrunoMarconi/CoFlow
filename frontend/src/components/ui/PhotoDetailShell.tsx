"use client";

import { ViewTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function PhotoDetailShell({
  transitionName,
  media,
  actions,
  children,
  mediaClassName,
  contentClassName,
}: {
  transitionName: string;
  media: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  mediaClassName?: string;
  contentClassName?: string;
}) {
  return (
    <div className="-mx-6 sm:mx-auto sm:w-full sm:max-w-5xl">
      <div className="relative">
        <ViewTransition name={transitionName} share="coflow-detail-morph">
          <div
            className={cn(
              "relative h-[48svh] min-h-[21rem] max-h-[36rem] overflow-hidden bg-[#f1f1f1] sm:h-[34rem] sm:rounded-[2rem]",
              mediaClassName
            )}
          >
            {media}
          </div>
        </ViewTransition>

        {actions ? (
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
            {actions}
          </div>
        ) : null}
      </div>

      <section
        className={cn(
          "relative z-10 -mt-8 min-h-64 rounded-t-[2rem] bg-white px-6 pb-8 pt-8 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] sm:mx-6 sm:-mt-10 sm:rounded-[2rem] sm:border sm:border-[#e5e5e5] sm:px-9 sm:pb-10 sm:pt-9",
          contentClassName
        )}
      >
        {children}
      </section>
    </div>
  );
}
