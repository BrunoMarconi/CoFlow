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
      className={`group flex w-full items-center justify-between rounded-2xl border p-5 text-left transition duration-200 md:p-6 ${
        selected
          ? "scale-[1.01] border-green-500 bg-green-50 shadow-lg shadow-green-100"
          : "border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
            selected
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-700"
          }`}
        >
          {index + 1}
        </span>

        <span
          className={`text-base font-semibold md:text-lg ${
            selected ? "text-[#163B2E]" : "text-gray-700"
          }`}
        >
          {option}
        </span>
      </div>

      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
          selected
            ? "border-green-500 bg-green-500 text-sm text-white"
            : "border-gray-200 text-transparent group-hover:border-green-300"
        }`}
      >
        ✓
      </span>
    </button>
  );
}
