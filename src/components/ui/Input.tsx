import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const base =
  "h-11 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-subtle)] focus:outline-none focus:border-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-ink)]/10 disabled:opacity-50 disabled:bg-transparent transition-colors";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", invalid = false, ...props },
  ref,
) {
  const borderClass = invalid
    ? "border-[var(--color-accent)]"
    : "border-[var(--color-border-strong)]";
  return (
    <input ref={ref} className={`${base} ${borderClass} ${className}`} {...props} />
  );
});
