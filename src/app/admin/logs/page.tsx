import Link from "next/link";
import { desc, eq, sql, SQL, and } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { Input } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const type = sp.type?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const conds: SQL[] = [];
  if (type) conds.push(eq(events.type, type));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, totalRow, distinctTypes] = await Promise.all([
    db
      .select()
      .from(events)
      .where(where)
      .orderBy(desc(events.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(events).where(where),
    db.selectDistinct({ type: events.type }).from(events).orderBy(events.type),
  ]);
  const total = totalRow[0]?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-serif text-3xl mb-4">Logs</h1>

      <form className="flex flex-wrap gap-2 mb-4 items-center">
        <Input name="type" defaultValue={type} placeholder="Filtrar por tipo (ej. business.created)" />
        <button
          type="submit"
          className="h-11 px-4 rounded-md bg-[var(--color-ink)] text-[var(--color-bg)] text-sm font-medium"
        >
          Filtrar
        </button>
        {distinctTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {distinctTypes.slice(0, 12).map((t) => (
              <Link
                key={t.type}
                href={`?type=${encodeURIComponent(t.type)}`}
                className="text-xs px-2 py-1 rounded-full border border-[var(--color-border)] hover:border-[var(--color-ink)]"
              >
                {t.type}
              </Link>
            ))}
          </div>
        ) : null}
      </form>

      <ul className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-md">
        {rows.map((e) => (
          <li key={e.id} className="px-3 py-2 text-sm">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <span className="font-medium">{e.type}</span>
                {e.actorEmail ? (
                  <span className="text-[var(--color-muted)]"> · {e.actorEmail}</span>
                ) : null}
                {e.entityType ? (
                  <span className="text-[var(--color-muted)]">
                    {" "}
                    · {e.entityType}/{e.entityId?.slice(0, 8) ?? "—"}
                  </span>
                ) : null}
              </div>
              <time className="text-xs text-[var(--color-muted)] whitespace-nowrap">
                {new Date(e.createdAt).toLocaleString("es-AR")}
              </time>
            </div>
            {e.metadata ? (
              <pre className="text-xs text-[var(--color-muted)] mt-1 overflow-x-auto">
                {JSON.stringify(e.metadata)}
              </pre>
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-3 py-6 text-sm text-center text-[var(--color-muted)]">Sin eventos.</li>
        ) : null}
      </ul>

      {pages > 1 ? (
        <nav className="flex gap-2 mt-4 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 20).map((p) => (
            <Link
              key={p}
              href={`/admin/logs?${new URLSearchParams({ type, page: String(p) }).toString()}`}
              className={`px-3 py-1 rounded-md border ${p === page ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]" : "border-[var(--color-border)]"}`}
            >
              {p}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
