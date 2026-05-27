import Link from "next/link";
import { db } from "@/db";
import { businesses, categories } from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, or, sql, SQL } from "drizzle-orm";
import { Filters } from "@/components/Filters";
import { BusinessCard } from "@/components/BusinessCard";
import { getCampaignBySlug } from "@/actions/campaigns";
import { ArrowRight } from "lucide-react";

type SearchParams = {
  q?: string;
  cat?: string;
  barrio?: string;
  envia?: string;
  online?: string;
  cita?: string;
  campana?: string;
};

export const dynamic = "force-dynamic";

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const cats = await db.select().from(categories).orderBy(asc(categories.displayOrder));

  const barriosRes = await db
    .selectDistinct({ neighborhood: businesses.neighborhood })
    .from(businesses)
    .where(eq(businesses.status, "active"));
  const barrios = barriosRes
    .map((r) => r.neighborhood)
    .filter((n): n is string => Boolean(n))
    .sort();

  const conditions: SQL[] = [eq(businesses.status, "active")];
  if (sp.q?.trim()) {
    const q = `%${sp.q.trim()}%`;
    const wildcard = or(ilike(businesses.name, q), ilike(businesses.description, q));
    if (wildcard) conditions.push(wildcard);
  }
  if (sp.cat) {
    const cat = cats.find((c) => c.slug === sp.cat);
    if (cat) conditions.push(eq(businesses.categoryId, cat.id));
  }
  if (sp.barrio) conditions.push(eq(businesses.neighborhood, sp.barrio));
  if (sp.envia === "1") conditions.push(eq(businesses.delivers, true));
  if (sp.online === "1") conditions.push(eq(businesses.onlineOnly, true));
  if (sp.cita === "1") conditions.push(eq(businesses.byAppointment, true));

  let campaign: { title: string; description: string | null; colorHex: string } | null = null;
  if (sp.campana) {
    const c = await getCampaignBySlug(sp.campana);
    if (c) {
      campaign = { title: c.title, description: c.description, colorHex: c.colorHex };
      if (c.categoryIds && c.categoryIds.length) {
        conditions.push(inArray(businesses.categoryId, c.categoryIds));
      }
    }
  }

  const rows = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      name: businesses.name,
      description: businesses.description,
      neighborhood: businesses.neighborhood,
      photoFilename: businesses.photoFilename,
      categoryName: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(businesses.approvedAt))
    .limit(120);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(businesses)
    .where(and(...conditions));

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-20 md:pb-24">
      <header className="mb-10 md:mb-14 max-w-3xl">
        {campaign ? (
          <span
            className="inline-flex items-center px-3 py-1 text-[10px] tracking-[0.18em] uppercase font-semibold mb-4 text-white"
            style={{ backgroundColor: campaign.colorHex }}
          >
            Campaña · {campaign.title}
          </span>
        ) : (
          <p className="editorial-rule mb-6">Explorar la comunidad</p>
        )}
        <h1 className="display-xl text-5xl md:text-7xl mb-4">
          {campaign ? campaign.title : "Lo que ofrece la comunidad."}
        </h1>
        <p className="text-[var(--color-muted)] text-lg md:text-xl leading-relaxed">
          {campaign?.description ??
            "Buscá por nombre, rubro o barrio. Filtrá por cómo trabajan."}
        </p>
      </header>

      <Filters categories={cats} barrios={barrios} initial={sp} />

      <div className="flex items-baseline justify-between mt-10 mb-8 gap-3 flex-wrap">
        <p className="metric">
          <strong>{total}</strong>
          <span>{total === 1 ? "resultado" : "resultados"}</span>
        </p>
        {sp.q ? (
          <p className="text-xs text-[var(--color-subtle)]">
            buscando “<span className="text-[var(--color-ink-soft)]">{sp.q}</span>”
          </p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="border border-[var(--color-border)] py-20 md:py-28 px-5 text-center">
          <div className="flex justify-center mb-6">
            <p className="editorial-rule">Sin coincidencias</p>
          </div>
          <h2 className="font-display text-3xl md:text-4xl tracking-[-0.025em] mb-3">
            No encontramos lo que buscás.
          </h2>
          <p className="text-[var(--color-muted)] max-w-md mx-auto mb-8 leading-relaxed">
            Probá quitando algún filtro, o decinos qué necesitás en lenguaje
            natural y buscamos por vos.
          </p>
          <Link
            href="/necesito"
            className="inline-flex items-center gap-2 h-11 px-5 bg-[var(--color-ink)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)] transition-colors"
          >
            Necesito algo
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {rows.map((b) => (
            <BusinessCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </section>
  );
}
