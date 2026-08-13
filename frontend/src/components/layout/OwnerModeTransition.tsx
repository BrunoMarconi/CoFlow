"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ClipboardCheck,
  KeyRound,
  MapPin,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import type { CoFlowMode } from "@/providers/OwnerModeProvider";

const TRANSITION_DURATION_MS = 1550;
const REDUCED_DURATION_MS = 240;

const COPY = {
  owner: { title: "Tus pisos" },
  member: { title: "Encuentra tu comunidad" },
} satisfies Record<CoFlowMode, { title: string }>;

function FloatingTile({
  children,
  className,
  delay,
  reduced,
}: {
  children: ReactNode;
  className: string;
  delay: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      className={`absolute flex size-14 items-center justify-center rounded-[18px] bg-[#f8f7f2] text-[#123b2a] shadow-[0_12px_35px_rgba(0,0,0,0.16)] sm:size-16 sm:rounded-[20px] ${className}`}
      initial={reduced ? false : { opacity: 0, scale: 0.55, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: reduced ? 0 : delay,
        duration: reduced ? 0 : 0.46,
        type: reduced ? "tween" : "spring",
        stiffness: 250,
        damping: 18,
      }}
    >
      {children}
    </motion.div>
  );
}

function HouseDrawing({ reduced }: { reduced: boolean }) {
  const pathTransition = {
    delay: reduced ? 0 : 0.16,
    duration: reduced ? 0 : 0.62,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <motion.svg
      viewBox="0 0 280 250"
      className="h-full w-full overflow-visible"
      fill="none"
      aria-hidden="true"
      initial={reduced ? false : { opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduced ? 0 : 0.44, delay: reduced ? 0 : 0.08 }}
    >
      <motion.path
        d="M52 112 140 42l88 70v104H52V112Z"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={pathTransition}
      />
      <motion.path
        d="M111 216v-66h58v66M76 140h24v25H76zM180 140h24v25h-24z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ ...pathTransition, delay: reduced ? 0 : 0.35 }}
      />
      <motion.path
        d="M37 217h206"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...pathTransition, delay: reduced ? 0 : 0.44 }}
      />
    </motion.svg>
  );
}

function OwnerIllustration({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative mx-auto aspect-square w-[min(72vw,19rem)] text-[#f8f7f2] sm:w-[20rem]">
      <div className="absolute inset-[12%]">
        <HouseDrawing reduced={reduced} />
      </div>
      <FloatingTile className="left-0 top-[16%]" delay={0.38} reduced={reduced}>
        <KeyRound className="size-6 sm:size-7" strokeWidth={1.8} />
      </FloatingTile>
      <FloatingTile className="right-0 top-[12%]" delay={0.5} reduced={reduced}>
        <ClipboardCheck className="size-6 sm:size-7" strokeWidth={1.8} />
      </FloatingTile>
      <FloatingTile className="bottom-[7%] right-[3%]" delay={0.62} reduced={reduced}>
        <MessageCircle className="size-6 sm:size-7" strokeWidth={1.8} />
      </FloatingTile>
    </div>
  );
}

function CommunityIllustration({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative mx-auto aspect-square w-[min(72vw,19rem)] text-[#f8f7f2] sm:w-[20rem]">
      <motion.div
        className="absolute inset-[13%]"
        initial={reduced ? false : { opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.08 }}
      >
        <HouseDrawing reduced={reduced} />
      </motion.div>

      <motion.div
        className="absolute inset-x-0 bottom-[4%] mx-auto flex w-fit items-center -space-x-3 rounded-full border-4 border-[#123b2a] bg-[#123b2a] px-1"
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: reduced ? 0 : 0.42,
          duration: reduced ? 0 : 0.52,
          type: reduced ? "tween" : "spring",
          stiffness: 230,
          damping: 18,
        }}
      >
        {["#f0c9a7", "#8f5d45", "#dca98c"].map((skin, index) => (
          <motion.span
            key={skin}
            className="relative flex size-16 items-end justify-center overflow-hidden rounded-full border-[3px] border-[#f8f7f2] bg-[#d9e3dc] sm:size-[4.5rem]"
            initial={reduced ? false : { x: index === 0 ? 18 : index === 2 ? -18 : 0 }}
            animate={{ x: 0 }}
            transition={{ delay: reduced ? 0 : 0.5 + index * 0.06, duration: reduced ? 0 : 0.36 }}
          >
            <span
              className="absolute top-[18%] size-[42%] rounded-full"
              style={{ backgroundColor: skin }}
            />
            <span
              className="h-[46%] w-[72%] rounded-t-full"
              style={{ backgroundColor: index === 1 ? "#a9bcad" : "#f3eee5" }}
            />
          </motion.span>
        ))}
      </motion.div>

      <FloatingTile className="left-0 top-[13%]" delay={0.55} reduced={reduced}>
        <MapPin className="size-6 sm:size-7" strokeWidth={1.8} />
      </FloatingTile>
      <FloatingTile className="right-0 top-[16%]" delay={0.65} reduced={reduced}>
        <UsersRound className="size-6 sm:size-7" strokeWidth={1.8} />
      </FloatingTile>
    </div>
  );
}

export default function OwnerModeTransition({
  target,
  onComplete,
}: {
  target: CoFlowMode;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const reduced = Boolean(reducedMotion);
  const completedRef = useRef(false);
  const copy = COPY[target];

  useEffect(() => {
    completedRef.current = false;
    const id = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, reduced ? REDUCED_DURATION_MS : TRANSITION_DURATION_MS);

    return () => window.clearTimeout(id);
  }, [onComplete, reduced, target]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={copy.title}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#f7f6f2] p-4 text-[#f8f7f2] sm:p-7"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.08 : 0.16 }}
    >
      <motion.section
        className="relative flex h-[min(82dvh,46rem)] w-full max-w-[48rem] flex-col overflow-hidden rounded-[36px] bg-[#123b2a] px-6 pb-8 pt-6 shadow-[0_24px_80px_rgba(10,35,25,0.20)] sm:rounded-[48px] sm:px-10 sm:pb-10 sm:pt-8"
        initial={reduced ? false : { opacity: 0, y: 40, scale: 0.86, borderRadius: 64 }}
        animate={{ opacity: 1, y: 0, scale: 1, borderRadius: 40 }}
        transition={{
          duration: reduced ? 0 : 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          className="flex items-center gap-2 text-[13px] font-medium tracking-[-0.01em] text-white/76 sm:text-sm"
          initial={reduced ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.24, duration: reduced ? 0 : 0.35 }}
        >
          <span className="relative flex h-5 w-8 items-center">
            <span className="absolute left-0 size-5 rounded-full border border-white/55" />
            <span className="absolute right-0 size-5 rounded-full bg-[#f8f7f2]" />
          </span>
          CoFlow
        </motion.div>

        <div className="flex min-h-0 flex-1 items-center justify-center py-2 sm:py-4">
          {target === "owner" ? (
            <OwnerIllustration reduced={reduced} />
          ) : (
            <CommunityIllustration reduced={reduced} />
          )}
        </div>

        <motion.div
          className="border-t border-white/18 pt-5 sm:pt-7"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduced ? 0 : 0.68,
            duration: reduced ? 0 : 0.48,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <h2 className="max-w-[12ch] text-[clamp(2.35rem,10vw,5.2rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
            {copy.title}
          </h2>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
