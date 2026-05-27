import { forwardRef, type SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const base =
  "h-11 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 pr-9 text-[15px] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-ink)]/10 disabled:opacity-50 disabled:bg-transparent appearance-none bg-no-repeat bg-[right_0.85rem_center] transition-colors";

const chevron =
  "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%235e574f'><path d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z'/></svg>\")]";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", invalid = false, children, ...props },
  ref,
) {
  const borderClass = invalid
    ? "border-[var(--color-accent)]"
    : "border-[var(--color-border-strong)]";
  return (
    <select
      ref={ref}
      className={`${base} ${chevron} ${borderClass} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
