import Link from "next/link";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { businesses, categories } from "@/db/schema";
import { MapBrowser } from "@/components/map/MapBrowserLoader";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const rows = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      name: businesses.name,
      lat: businesses.lat,
      lng: businesses.lng,
      neighborhood: businesses.neighborhood,
      categoryName: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(
      and(
        eq(businesses.status, "active"),
        eq(businesses.onlineOnly, false),
        isNotNull(businesses.lat),
        isNotNull(businesses.lng),
      ),
    );

  const items = rows
    .filter((r): r is typeof r & { lat: number; lng: number } => r.lat !== null && r.lng !== null);

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-20 md:pb-24">
      <header className="mb-10 md:mb-14 max-w-3xl">
        <p className="editorial-rule mb-6">En el mapa</p>
        <h1 className="display-xl text-5xl md:text-7xl mb-4">
          Los que tienen local.
        </h1>
        <p className="text-[var(--color-muted)] text-lg md:text-xl leading-relaxed">
          {items.length === 0
            ? "Todavía no hay emprendimientos geolocalizados."
            : items.length === 1
              ? "1 emprendimiento con dirección física."
              : `${items.length} emprendimientos con dirección física.`}{" "}
          Los que trabajan solo online no aparecen acá —{" "}
          <Link
            href="/explorar?online=1"
            className="underline decoration-[var(--color-border-strong)] underline-offset-4 hover:decoration-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
          >
            buscalos en /explorar
          </Link>
          .
        </p>
      </header>
      <MapBrowser items={items} />
    </section>
  );
}
