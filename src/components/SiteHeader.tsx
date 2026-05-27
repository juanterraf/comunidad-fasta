"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/explorar", label: "Explorar" },
  { href: "/necesito", label: "Necesito algo" },
  { href: "/mapa", label: "Mapa" },
  { href: "/como-funciona", label: "Cómo funciona" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 md:h-18 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-display font-semibold tracking-[-0.02em]"
        >
          <span className="font-display text-[19px] md:text-[21px] leading-none">
            Comunidad
          </span>
          <span className="font-display text-[19px] md:text-[21px] leading-none text-[var(--color-accent)]">
            FASTA
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink key={n.href} href={n.href} active={isActive(pathname, n.href)}>
              {n.label}
            </NavLink>
          ))}
          <Link
            href="/sumarte"
            className="ml-3 inline-flex items-center h-10 px-5 text-sm font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
          >
            Sumar el mío
          </Link>
        </nav>
        <Link
          href="/sumarte"
          className="md:hidden inline-flex items-center h-9 px-4 text-sm font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)]"
        >
          Sumar
        </Link>
      </div>
    </header>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-2 text-sm transition-colors ${
        active
          ? "text-[var(--color-ink)] font-medium"
          : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
      {active ? (
        <span className="absolute left-3 right-3 -bottom-[1px] h-[2px] bg-[var(--color-accent)]" />
      ) : null}
    </Link>
  );
}
