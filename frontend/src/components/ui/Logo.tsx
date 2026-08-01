import Image from "next/image";

const SIZES = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
} as const;

const PIXEL_SIZES = {
  sm: 36,
  md: 44,
  lg: 56,
} as const;

export type LogoSize = keyof typeof SIZES;

export default function Logo({
  size = "md",
  className = "",
}: {
  size?: LogoSize;
  className?: string;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center ${SIZES[size]} ${className}`}
    >
      <Image
        src="/logo-coflow.png"
        alt="CoFlow"
        width={PIXEL_SIZES[size]}
        height={PIXEL_SIZES[size]}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  );
}
