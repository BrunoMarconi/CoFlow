import { CheckIcon } from "./icons";
import Logo from "@/components/ui/Logo";

export { Logo };

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-3xl text-center"
          : "max-w-2xl"
      }
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
          isDark ? "text-green-300" : "text-brand"
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-3 text-[2rem] font-bold leading-[1.08] tracking-[-0.045em] sm:text-4xl lg:text-[2.8rem] ${
          isDark ? "text-white" : "text-brand-dark"
        }`}
      >
        {title}
      </h2>

      {description ? (
        <p
          className={`${
            align === "center"
              ? "mx-auto mt-4 max-w-2xl"
              : "mt-4 max-w-xl"
          } text-base leading-7 sm:text-lg sm:leading-8 ${
            isDark ? "text-green-50/75" : "text-muted"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function CheckItem({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
        <CheckIcon />
      </span>

      {text}
    </span>
  );
}
