"use client";

import {
  ReactNode,
  TouchEvent,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

const routes = [
  "/comunidades",
  "/usuarios",
  "/pisos",
  "/perfil",
];

const minimumSwipeDistance = 70;
const maximumVerticalMovement = 60;

type SwipeNavigationProps = {
  children: ReactNode;
};

export default function SwipeNavigation({
  children,
}: SwipeNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const [dragOffset, setDragOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const currentRouteIndex = routes.findIndex(
    (route) => pathname === route
  );

  const swipeEnabled = currentRouteIndex !== -1;

  function isInteractiveElement(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
      target.closest(
        "input, textarea, select, button, a, [contenteditable='true']"
      )
    );
  }

  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (!swipeEnabled || isInteractiveElement(event.target)) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
  }

  function handleTouchMove(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      return;
    }

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;

    const horizontalDistance =
      currentX - touchStartX.current;

    const verticalDistance =
      currentY - touchStartY.current;

    if (
      Math.abs(verticalDistance) >
      Math.abs(horizontalDistance)
    ) {
      setDragOffset(0);
      return;
    }

    const resistance =
      (currentRouteIndex === 0 && horizontalDistance > 0) ||
      (currentRouteIndex === routes.length - 1 &&
        horizontalDistance < 0)
        ? 0.18
        : 0.35;

    setDragOffset(horizontalDistance * resistance);
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      return;
    }

    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;

    const horizontalDistance =
      endX - touchStartX.current;

    const verticalDistance =
      endY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    const isHorizontalSwipe =
      Math.abs(horizontalDistance) >=
        minimumSwipeDistance &&
      Math.abs(verticalDistance) <=
        maximumVerticalMovement &&
      Math.abs(horizontalDistance) >
        Math.abs(verticalDistance);

    if (!isHorizontalSwipe) {
      setDragOffset(0);
      return;
    }

    let targetIndex = currentRouteIndex;

    if (
      horizontalDistance < 0 &&
      currentRouteIndex < routes.length - 1
    ) {
      targetIndex = currentRouteIndex + 1;
    }

    if (
      horizontalDistance > 0 &&
      currentRouteIndex > 0
    ) {
      targetIndex = currentRouteIndex - 1;
    }

    if (targetIndex === currentRouteIndex) {
      setDragOffset(0);
      return;
    }

    setTransitioning(true);

    setDragOffset(
      horizontalDistance < 0 ? -80 : 80
    );

    window.setTimeout(() => {
      router.push(routes[targetIndex]);
      setDragOffset(0);
      setTransitioning(false);
    }, 140);
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-full touch-pan-y"
      style={{
        // Sin arrastre activo, se omite `transform` del todo (no basta
        // con translateX(0px)): un transform, aunque sea nulo, crea un
        // containing block nuevo y rompe `position: sticky` en todo lo
        // que cuelgue de children (buscadores, tabs...).
        transform:
          dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
        opacity: transitioning ? 0.82 : 1,
        transition:
          dragOffset === 0 || transitioning
            ? "transform 180ms ease-out, opacity 180ms ease-out"
            : "none",
      }}
    >
      {children}
    </div>
  );
}