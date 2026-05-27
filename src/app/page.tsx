import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { db } from "@/db";
import { businesses, categories, families } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { BusinessCard } from "@/components/BusinessCard";
import { CampaignBanner } from "@/components/CampaignBanner";

export const dynamic = "force-dynamic";

async function getStats() {
  const [activeRow, catRow, famRow] = await Promise.all([
    db
      .select({ active: sql<number>`count(*)::int` })
      .from(businesses)
      .where(eq(businesses.status, "active")),
    db.select({ catCount: sql<number>`count(*)::int` }).from(categories),
    db
      .select({ famCount: sql<number>`count(*)::int` })
      .from(families)
      .where(eq(families.validated, true)),
  ]);
  return {
    active: activeRow[0]?.active ?? 0,
    catCount: catRow[0]?.catCount ?? 0,
    famCount: famRow[0]?.famCount ?? 0,
  };
}

async function getRecent() {
  return db
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
    .where(eq(businesses.status, "active"))
    .orderBy(desc(businesses.approvedAt))
    .limit(9);
}

async function getFeaturedStory() {
  const [row] = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      name: businesses.name,
      story: businesses.story,
      photoFilename: businesses.photoFilename,
      neighborhood: businesses.neighborhood,
      categoryName: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(
      sql`${businesses.isFeaturedStory} = true and ${businesses.status} = 'active' and ${businesses.story} is not null`,
    )
    .orderBy(desc(businesses.approvedAt))
    .limit(1);
  return row ?? null;
}

async function getCategoriesWithCount() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      count: sql<number>`count(${businesses.id})::int`,
    })
    .from(categories)
    .leftJoin(
      businesses,
      sql`${businesses.categoryId} = ${categories.id} and ${businesses.status} = 'active'`,
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.displayOrder));
}

export default async function HomePage() {
  const [stats, recent, cats, story] = await Promise.all([
    getStats(),
    getRecent(),
    getCategoriesWithCount(),
    getFeaturedStory(),
  ]);

  const featured = recent[0];
  const secondaries = recent.slice(1, 3);
  const recentRest = recent.slice(3, 9);
  const year = new Date().getFullYear();

  return (
    <>
      <CampaignBanner />

      {/* HERO EDITORIAL */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-14 md:pt-24 pb-14 md:pb-20">
          <p className="editorial-rule mb-10 md:mb-14">
            Comunidad FASTA · Colegio Boisdron · Tucumán · {year}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
            <div className="lg:col-span-7">
              <h1 className="display-xl text-[44px] sm:text-[64px] md:text-[88px] lg:text-[104px] mb-8">
                <span className="block">Lo que somos,</span>
                <span className="block">lo que hacemos,</span>
                <span className="block text-[var(--color-accent)]">
                  lo que compartimos.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-[var(--color-muted)] max-w-xl leading-relaxed mb-8">
                Un espacio para descubrir talentos, servicios, comercios y
                proyectos de las familias que forman parte de la comunidad
                FASTA.
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <Link
                  href="/explorar"
                  className="inline-flex items-center gap-2 h-12 px-6 bg-[var(--color-ink)] text-[var(--color-bg)] text-[15px] font-medium hover:bg-[var(--color-accent)] transition-colors"
                >
                  Explorar emprendimientos
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/sumarte"
                  className="inline-flex items-center gap-1 text-[15px] font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                >
                  Sumar el mío
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HeroVisualPlaceholder />
            </div>
          </div>

          {/* Stats integrados como dato editorial */}
          <div className="mt-14 md:mt-20 pt-6 border-t border-[var(--color-border)] flex flex-wrap gap-x-10 gap-y-4 items-baseline">
            <span className="metric">
              <strong>{stats.active}</strong>
              <span>emprendimientos activos</span>
            </span>
            <span className="hidden md:inline-block w-px h-3 bg-[var(--color-border-strong)]" />
            <span className="metric">
              <strong>{stats.famCount}</strong>
              <span>familias validadas</span>
            </span>
            <span className="hidden md:inline-block w-px h-3 bg-[var(--color-border-strong)]" />
            <span className="metric">
              <strong>{stats.catCount}</strong>
              <span>rubros</span>
            </span>
          </div>
        </div>
      </section>

      {/* DESTACADOS — 1 grande + 2 secundarias */}
      {featured ? (
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="flex items-end justify-between mb-8 md:mb-10 gap-3 flex-wrap">
            <div>
              <p className="eyebrow mb-2">Destacados de la comunidad</p>
              <h2 className="font-display text-3xl md:text-4xl tracking-[-0.025em]">
                Lo que están haciendo.
              </h2>
            </div>
            <Link
              href="/explorar"
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 group"
            >
              Ver todos
              <ArrowUpRight
                size={14}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-7">
              <BusinessCard b={featured} size="featured" />
            </div>
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-8">
              {secondaries.map((b) => (
                <BusinessCard key={b.id} b={b} size="editorial" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* NECESITO ALGO — strip editorial */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-warm)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
          <Link
            href="/necesito"
            className="group grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-12 items-end"
          >
            <div>
              <p className="editorial-rule mb-5">Necesito algo</p>
              <p className="font-display text-2xl md:text-4xl lg:text-5xl tracking-[-0.03em] leading-[1.05] max-w-3xl">
                Decinos qué necesitás.{" "}
                <span className="text-[var(--color-muted)]">
                  Quizá ya lo hace alguien adentro.
                </span>
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-[15px] font-medium border-b-2 border-[var(--color-ink)] pb-1 group-hover:text-[var(--color-accent)] group-hover:border-[var(--color-accent)] transition-colors whitespace-nowrap">
              Buscar en la comunidad
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      {/* CATEGORÍAS — bloque editorial, no chip-list */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-10 md:mb-12">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-3">Por rubro</p>
            <h2 className="font-display text-3xl md:text-4xl tracking-[-0.025em] leading-[1.05]">
              Doce maneras de encontrar lo que necesitás.
            </h2>
          </div>
          <p className="lg:col-span-7 lg:col-start-6 text-[var(--color-muted)] text-base md:text-lg leading-relaxed">
            Desde tortas y catering hasta clases particulares, oficios y diseño.
            Cada rubro lista los emprendimientos activos en la comunidad.
          </p>
        </div>

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-l border-[var(--color-border)]">
          {cats.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/explorar?cat=${c.slug}`}
                className="group flex items-baseline justify-between gap-3 px-4 md:px-6 py-5 md:py-7 border-r border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors h-full"
              >
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.18em] uppercase font-medium text-[var(--color-subtle)] mb-2">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="font-display text-[17px] md:text-[19px] leading-tight tracking-[-0.015em] group-hover:text-[var(--color-accent)] transition-colors">
                    {c.name}
                  </p>
                </div>
                <span className="text-xs text-[var(--color-subtle)] font-medium tabular-nums flex-shrink-0">
                  {c.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* HISTORIA DESTACADA — full-width oscuro */}
      {story && story.story ? (
        <section className="bg-[var(--color-ink)] text-[var(--color-bg)]">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-5">
                <Link href={`/e/${story.slug}`} className="block group">
                  <div className="aspect-[4/5] overflow-hidden bg-[var(--color-ink-soft)]">
                    {story.photoFilename ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/image/${story.id}/orig`}
                        alt={story.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      />
                    ) : null}
                  </div>
                </Link>
              </div>
              <div className="lg:col-span-7">
                <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-[var(--color-bg)]/55 mb-6 font-medium">
                  <BookOpen size={13} /> La historia
                </p>
                <h2 className="font-display text-4xl md:text-6xl tracking-[-0.035em] leading-[0.98] mb-8">
                  {story.name}
                </h2>
                <p className="text-lg md:text-xl leading-relaxed text-[var(--color-bg)]/80 mb-8 clamp-5">
                  {story.story}
                </p>
                <Link
                  href={`/e/${story.slug}`}
                  className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--color-bg)] border-b-2 border-[var(--color-bg)] pb-1 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                >
                  Leer la historia completa
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* RECIÉN SUMADOS — grilla limpia */}
      {recentRest.length > 0 ? (
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="flex items-end justify-between mb-8 md:mb-10 gap-3 flex-wrap">
            <div>
              <p className="eyebrow mb-2">Recién sumados</p>
              <h2 className="font-display text-3xl md:text-4xl tracking-[-0.025em]">
                Lo último de la comunidad.
              </h2>
            </div>
            <Link
              href="/explorar"
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 group"
            >
              Ver todos
              <ArrowUpRight
                size={14}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {recentRest.map((b) => (
              <BusinessCard key={b.id} b={b} size="default" />
            ))}
          </div>
        </section>
      ) : null}

      {/* CIERRE — sumar el mío + qué es esto */}
      <section className="border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-3">Sumarte</p>
              <h2 className="font-display text-4xl md:text-6xl tracking-[-0.035em] leading-[0.98] mb-6">
                ¿También tenés algo
                <br />
                <span className="text-[var(--color-accent)]">para ofrecer?</span>
              </h2>
              <p className="text-lg text-[var(--color-muted)] max-w-2xl mb-8 leading-relaxed">
                Si formás parte de la comunidad, sumá tu emprendimiento. Dos
                familias ya validadas confirman que te conocen y sale al aire.
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <Link
                  href="/sumarte"
                  className="inline-flex items-center gap-2 h-12 px-6 bg-[var(--color-ink)] text-[var(--color-bg)] text-[15px] font-medium hover:bg-[var(--color-accent)] transition-colors"
                >
                  Sumar el mío
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/como-funciona"
                  className="text-[15px] font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                >
                  Cómo funciona
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 lg:border-l lg:border-[var(--color-border)] lg:pl-12">
              <p className="eyebrow mb-3">Qué es esto</p>
              <p className="text-[15px] md:text-base leading-relaxed text-[var(--color-ink-soft)] mb-4">
                La confianza acá no se construye con estrellas: se construye con
                pertenecer. Para sumarse, dos familias ya validadas confirman que
                conocen al solicitante.
              </p>
              <p className="text-[15px] md:text-base leading-relaxed text-[var(--color-muted)]">
                No es marketplace. No hay transacciones, comisiones ni
                calificaciones públicas. Es una vidriera de quienes pertenecen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroVisualPlaceholder() {
  return (
    <div
      className="relative aspect-[4/5] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={`border-[var(--color-border)] ${
                i % 3 !== 2 ? "border-r" : ""
              } ${i < 6 ? "border-b" : ""}`}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <p className="text-[10px] tracking-[0.22em] uppercase font-medium text-[var(--color-muted)] mb-3">
          Edición 01 · {new Date().getFullYear()}
        </p>
        <p className="font-display text-[22px] md:text-[28px] tracking-[-0.025em] leading-[1.05] mb-1">
          Una vidriera con un filtro de pertenencia.
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          Familias, docentes, egresados y miembros del colegio.
        </p>
      </div>
      <span className="absolute top-6 left-6 inline-flex items-center justify-center w-9 h-9 border border-[var(--color-ink)] text-[var(--color-ink)] font-display text-[15px] font-bold">
        f
      </span>
    </div>
  );
}
