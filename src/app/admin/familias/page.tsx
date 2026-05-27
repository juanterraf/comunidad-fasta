import Link from "next/link";
import { asc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { families } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { Input } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function FamiliasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = q
    ? or(ilike(families.displayName, `%${q}%`), ilike(families.email, `%${q}%`))
    : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(families)
      .where(where)
      .orderBy(asc(families.displayName))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(families).where(where),
  ]);
  const total = totalRow[0]?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="font-serif text-3xl">Familias</h1>
        <Link
          href="/admin/familias/nueva"
          className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-[var(--color-ink)] text-[var(--color-bg)] text-sm font-medium"
        >
          + Nueva
        </Link>
      </div>

      <form className="mb-4">
        <Input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por nombre o mail…"
        />
      </form>

      <div className="overflow-x-auto border border-[var(--color-border)] rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-border)]/40 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Nombre</th>
              <th className="text-left px-3 py-2 font-medium">Mail</th>
              <th className="text-left px-3 py-2 font-medium">Rol</th>
              <th className="text-left px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.map((f) => (
              <tr key={f.id}>
                <td className="px-3 py-2">{f.displayName}</td>
                <td className="px-3 py-2 text-[var(--color-muted)]">{f.email}</td>
                <td className="px-3 py-2">{f.role}</td>
                <td className="px-3 py-2">
                  {f.isSeed ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-ink)] text-[var(--color-bg)]">
                      semilla
                    </span>
                  ) : f.validated ? (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                      validada
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">pending</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/familias/${f.id}`}
                    className="text-xs underline text-[var(--color-muted)]"
                  >
                    editar
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[var(--color-muted)]">
                  No hay familias con esa búsqueda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <nav className="flex gap-2 mt-4 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/familias?${new URLSearchParams({ q, page: String(p) }).toString()}`}
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
