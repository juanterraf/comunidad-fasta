import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const base =
  "w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] p-3.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-subtle)] focus:outline-none focus:border-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-ink)]/10 disabled:opacity-50 disabled:bg-transparent transition-colors";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", invalid = false, rows = 4, ...props },
  ref,
) {
  const borderClass = invalid
    ? "border-[var(--color-accent)]"
    : "border-[var(--color-border-strong)]";
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${base} ${borderClass} ${className}`}
      {...props}
    />
  );
});
