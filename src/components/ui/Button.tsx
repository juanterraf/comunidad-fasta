import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-ink)] text-[var(--color-bg)] hover:bg-[var(--color-ink-soft)]",
  secondary:
    "bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-ink)] hover:border-[var(--color-ink)]",
  ghost:
    "bg-transparent text-[var(--color-ink-soft)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-ink)]",
  accent:
    "bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:bg-[#a8421f]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-7 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    className = "",
    iconLeft,
    iconRight,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {iconLeft ? <span className="flex-shrink-0 -ml-1">{iconLeft}</span> : null}
      {children}
      {iconRight ? <span className="flex-shrink-0 -mr-1">{iconRight}</span> : null}
    </button>
  );
});
