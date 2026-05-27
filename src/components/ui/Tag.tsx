import type { HTMLAttributes } from "react";

type Variant = "default" | "muted" | "outline" | "accent" | "secondary" | "editorial";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default:
    "border-transparent bg-[var(--color-ink)] text-[var(--color-bg)] rounded-full px-2.5 py-0.5 text-[11px]",
  muted:
    "border-transparent bg-[var(--color-border)] text-[var(--color-ink-soft)] rounded-full px-2.5 py-0.5 text-[11px]",
  outline:
    "border-[var(--color-border-strong)] bg-transparent text-[var(--color-ink-soft)] rounded-full px-2.5 py-0.5 text-[11px]",
  accent:
    "border-transparent bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-full px-2.5 py-0.5 text-[11px]",
  secondary:
    "border-transparent bg-[var(--color-secondary)]/12 text-[var(--color-secondary)] rounded-full px-2.5 py-0.5 text-[11px]",
  editorial:
    "border-transparent bg-transparent text-[var(--color-muted)] px-0 py-0 text-[10px] tracking-[0.18em] uppercase font-medium",
};

export function Tag({ variant = "muted", className = "", children, ...props }: TagProps) {
  return (
    <span
      className={`inline-flex items-center border font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
