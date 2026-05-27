import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <p className="font-display text-lg font-semibold mb-2">
              Comunidad <span className="text-[var(--color-accent)]">FASTA</span>
            </p>
            <p className="text-sm text-[var(--color-muted)] max-w-sm">
              Lo que somos, lo que hacemos, lo que compartimos. Colegio Boisdron, Tucumán.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3">Navegá</p>
            <ul className="space-y-2 text-sm">
              <FooterLink href="/explorar">Explorar</FooterLink>
              <FooterLink href="/necesito">Necesito algo</FooterLink>
              <FooterLink href="/mapa">Mapa</FooterLink>
              <FooterLink href="/como-funciona">Cómo funciona</FooterLink>
              <FooterLink href="/sumarte">Sumar el mío</FooterLink>
              <FooterLink href="/editar">Editar el mío</FooterLink>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-3">Internas</p>
            <ul className="space-y-2 text-sm">
              <FooterLink href="/admin">Admin</FooterLink>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-[var(--color-border)]">
          <Disclaimer />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
