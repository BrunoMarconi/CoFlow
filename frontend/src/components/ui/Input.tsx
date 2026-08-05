import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useId,
} from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  leftElement?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      leftElement,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            {label}

            {required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftElement && (
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            className={clsx(
              "h-11.5 w-full rounded-14 border bg-surface px-4 text-[15px] text-foreground",
              "outline-none transition-all duration-180",
              "placeholder:text-muted",
              "hover:border-secondary/40",
              "focus:border-primary focus:ring-4 focus:ring-mint-100",
              leftElement && "pl-11",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                : "border-border",
              className
            )}
            {...props}
          />
        </div>

        {error ? (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm font-medium text-red-600"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm leading-5 text-muted"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;