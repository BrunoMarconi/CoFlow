import {
  forwardRef,
  TextareaHTMLAttributes,
  useId,
} from "react";
import clsx from "clsx";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-2 block text-sm font-semibold text-[#163B2E]"
          >
            {label}

            {required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
                ? `${textareaId}-helper`
                : undefined
          }
          className={clsx(
            "min-h-32 w-full resize-none rounded-2xl border bg-white px-4 py-4",
            "text-base leading-6 text-[#163B2E] outline-none",
            "placeholder:text-gray-500",
            "transition-all duration-200",
            "hover:border-gray-300",
            "focus:border-green-500 focus:ring-4 focus:ring-green-500/10",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
              : "border-gray-200",
            className
          )}
          {...props}
        />

        {error ? (
          <p
            id={`${textareaId}-error`}
            className="mt-2 text-sm font-medium text-red-600"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${textareaId}-helper`}
            className="mt-2 text-sm leading-5 text-gray-500"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;