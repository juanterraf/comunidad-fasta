import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type CardBusiness = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  neighborhood: string | null;
  photoFilename: string | null;
  categoryName: string | null;
};

type Size = "default" | "featured" | "editorial" | "compact";

export function BusinessCard({
  b,
  size = "default",
}: {
  b: CardBusiness;
  size?: Size;
}) {
  if (size === "editorial") return <EditorialCard b={b} />;
  if (size === "compact") return <CompactCard b={b} />;
  if (size === "featured") return <FeaturedCard b={b} />;
  return <DefaultCard b={b} />;
}

function DefaultCard({ b }: { b: CardBusiness }) {
  return (
    <Link
      href={`/e/${b.slug}`}
      className="group block rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-ink)] transition-colors"
    >
      <div className="aspect-[4/3] bg-[var(--color-border)] overflow-hidden relative">
        {b.photoFilename ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/image/${b.id}/card`}
            alt={b.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="p-4 md:p-5">
        {b.categoryName ? (
          <p className="text-[10px] tracking-[0.18em] uppercase font-medium text-[var(--color-muted)] mb-2">
            {b.categoryName}
          </p>
        ) : null}
        <h3 className="font-display text-[19px] leading-tight tracking-[-0.02em] mb-1.5">
          {b.name}
        </h3>
        {b.description ? (
          <p className="text-sm text-[var(--color-muted)] clamp-2">{b.description}</p>
        ) : null}
        {b.neighborhood ? (
          <p className="text-xs text-[var(--color-subtle)] mt-3">{b.neighborhood}</p>
        ) : null}
      </div>
    </Link>
  );
}

function FeaturedCard({ b }: { b: CardBusiness }) {
  return (
    <Link
      href={`/e/${b.slug}`}
      className="group block rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-ink)] transition-colors"
    >
      <div className="aspect-[5/6] bg-[var(--color-border)] overflow-hidden relative">
        {b.photoFilename ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/image/${b.id}/orig`}
            alt={b.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
            loading="lazy"
          />
        ) : null}
        <span className="absolute top-4 left-4 inline-flex items-center h-7 px-3 bg-[var(--color-bg)]/95 text-[10px] tracking-[0.18em] uppercase font-medium">
          Destacado
        </span>
      </div>
      <div className="p-5 md:p-6">
        {b.categoryName ? (
          <p className="text-[10px] tracking-[0.18em] uppercase font-medium text-[var(--color-muted)] mb-2">
            {b.categoryName}
          </p>
        ) : null}
        <h3 className="font-display text-2xl md:text-[26px] leading-[1.05] tracking-[-0.025em] mb-2.5">
          {b.name}
        </h3>
        {b.description ? (
          <p className="text-[14.5px] text-[var(--color-muted)] clamp-3 leading-relaxed">
            {b.description}
          </p>
        ) : null}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-subtle)]">{b.neighborhood ?? ""}</p>
          <ArrowUpRight
            size={16}
            className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors"
          />
        </div>
      </div>
    </Link>
  );
}

function EditorialCard({ b }: { b: CardBusiness }) {
  return (
    <Link href={`/e/${b.slug}`} className="group block">
      <div className="aspect-[4/5] bg-[var(--color-border)] overflow-hidden mb-4 relative">
        {b.photoFilename ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/image/${b.id}/card`}
            alt={b.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
            loading="lazy"
          />
        ) : null}
      </div>
      {b.categoryName ? (
        <p className="text-[10px] tracking-[0.18em] uppercase font-medium text-[var(--color-muted)] mb-2">
          {b.categoryName}
        </p>
      ) : null}
      <h3 className="font-display text-xl leading-tight tracking-[-0.02em] mb-1.5 group-hover:text-[var(--color-accent)] transition-colors">
        {b.name}
      </h3>
      {b.neighborhood ? (
        <p className="text-xs text-[var(--color-subtle)]">{b.neighborhood}</p>
      ) : null}
    </Link>
  );
}

function CompactCard({ b }: { b: CardBusiness }) {
  return (
    <Link
      href={`/e/${b.slug}`}
      className="group flex items-center gap-4 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-warm)] -mx-2 px-2 transition-colors"
    >
      <div className="w-16 h-16 flex-shrink-0 bg-[var(--color-border)] overflow-hidden rounded-[var(--radius-sm)]">
        {b.photoFilename ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/image/${b.id}/card`}
            alt={b.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        {b.categoryName ? (
          <p className="text-[10px] tracking-[0.18em] uppercase font-medium text-[var(--color-muted)] mb-0.5">
            {b.categoryName}
          </p>
        ) : null}
        <p className="font-display text-[16px] tracking-[-0.015em] truncate">{b.name}</p>
        {b.neighborhood ? (
          <p className="text-xs text-[var(--color-subtle)] truncate">{b.neighborhood}</p>
        ) : null}
      </div>
      <ArrowUpRight
        size={16}
        className="text-[var(--color-subtle)] group-hover:text-[var(--color-ink)] transition-colors flex-shrink-0"
      />
    </Link>
  );
}
