interface OptionButtonProps {
  index: number;
  option: string;
  selected: boolean;
  onClick: () => void;
}

export default function OptionButton({
  index,
  option,
  selected,
  onClick,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-18 border p-5 text-left transition duration-200 md:p-6 ${
        selected
          ? "scale-[1.01] border-primary bg-mint-50 shadow-soft"
          : "border-border bg-surface shadow-soft hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-14 text-sm font-bold transition ${
            selected
              ? "bg-primary text-white"
              : "bg-surface-soft text-muted group-hover:bg-mint-100 group-hover:text-primary-dark"
          }`}
        >
          {index + 1}
        </span>

        <span
          className={`text-base font-semibold md:text-lg ${
            selected ? "text-brand-dark" : "text-secondary"
          }`}
        >
          {option}
        </span>
      </div>

      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
          selected
            ? "border-primary bg-primary text-sm text-white"
            : "border-border text-transparent group-hover:border-primary/30"
        }`}
      >
        ✓
      </span>
    </button>
  );
}
