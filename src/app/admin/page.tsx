import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { businesses, communityNeeds, events, families, validationRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const [
    bizCounts,
    famCount,
    pendingValidations,
    expiringSoon,
    latestEvents,
    newNeeds,
    needsNoResults,
  ] = await Promise.all([
    db
      .select({ status: businesses.status, count: sql<number>`count(*)::int` })
      .from(businesses)
      .groupBy(businesses.status),
    db.select({ count: sql<number>`count(*)::int` }).from(families),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(validationRequests)
      .where(eq(validationRequests.status, "pending")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(validationRequests)
      .where(
        and(
          eq(validationRequests.status, "pending"),
          sql`${validationRequests.expiresAt} <= now() + interval '2 days'`,
        ),
      ),
    db.select().from(events).orderBy(desc(events.createdAt)).limit(8),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityNeeds)
      .where(eq(communityNeeds.status, "new")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityNeeds)
      .where(sql`jsonb_array_length(coalesce(${communityNeeds.matchedResults}, '[]'::jsonb)) = 0`),
  ]);

  const byStatus = Object.fromEntries(bizCounts.map((r) => [r.status, r.count]));

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Inicio</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card label="Pending" value={byStatus.pending ?? 0} href="/admin/emprendimientos?status=pending" />
        <Card label="Activos" value={byStatus.active ?? 0} href="/admin/emprendimientos?status=active" />
        <Card label="En pausa" value={byStatus.paused ?? 0} href="/admin/emprendimientos?status=paused" />
        <Card label="Familias" value={famCount[0]?.count ?? 0} href="/admin/familias" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-[var(--color-border)] rounded-md p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
            Validaciones pendientes
          </p>
          <p className="font-serif text-3xl">{pendingValidations[0]?.count ?? 0}</p>
          {expiringSoon[0]?.count ? (
            <p className="text-xs text-[var(--color-accent)] mt-2">
              {expiringSoon[0].count} vencen en menos de 2 días
            </p>
          ) : null}
        </div>
        <Link
          href="/admin/necesidades?status=new"
          className="block border border-[var(--color-border)] rounded-md p-4 hover:border-[var(--color-ink)]"
        >
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
            Necesidades nuevas
          </p>
          <p className="font-serif text-3xl">{newNeeds[0]?.count ?? 0}</p>
          {needsNoResults[0]?.count ? (
            <p className="text-xs text-[var(--color-muted)] mt-2">
              {needsNoResults[0].count} sin resultados
            </p>
          ) : null}
        </Link>
        <div className="border border-[var(--color-border)] rounded-md p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
            Rechazados
          </p>
          <p className="font-serif text-3xl">{byStatus.rejected ?? 0}</p>
        </div>
      </div>

      <h2 className="font-serif text-xl mb-3">Últimos eventos</h2>
      <ul className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-md">
        {latestEvents.map((e) => (
          <li key={e.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-medium">{e.type}</span>
              {e.actorEmail ? (
                <span className="text-[var(--color-muted)]"> · {e.actorEmail}</span>
              ) : null}
            </div>
            <time className="text-xs text-[var(--color-muted)] whitespace-nowrap">
              {new Date(e.createdAt).toLocaleString("es-AR")}
            </time>
          </li>
        ))}
        {latestEvents.length === 0 ? (
          <li className="px-3 py-6 text-sm text-center text-[var(--color-muted)]">
            Sin eventos todavía.
          </li>
        ) : null}
      </ul>
      <Link href="/admin/logs" className="text-xs text-[var(--color-muted)] inline-block mt-3">
        Ver todos →
      </Link>
    </div>
  );
}

function Card({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="block border border-[var(--color-border)] rounded-md p-4 hover:border-[var(--color-ink)]"
    >
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
        {label}
      </p>
      <p className="font-serif text-3xl">{value}</p>
    </Link>
  );
}
