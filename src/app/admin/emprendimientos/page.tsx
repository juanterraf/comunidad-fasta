import Link from "next/link";
import { and, desc, eq, ilike, or, sql, SQL } from "drizzle-orm";
import { db } from "@/db";
import { businesses, categories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUS = ["", "pending", "active", "paused", "rejected"] as const;

export default async function EmprendimientosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = STATUS.includes((sp.status ?? "") as never) ? sp.status ?? "" : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const conds: SQL[] = [];
  if (q) {
    const wc = or(
      ilike(businesses.name, `%${q}%`),
      ilike(businesses.ownerEmail, `%${q}%`),
    );
    if (wc) conds.push(wc);
  }
  if (status) conds.push(eq(businesses.status, status));

  const where = conds.length ? and(...conds) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        status: businesses.status,
        ownerEmail: businesses.ownerEmail,
        createdAt: businesses.createdAt,
        categoryName: categories.name,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(where)
      .orderBy(desc(businesses.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(businesses).where(where),
  ]);
  const total = totalRow[0]?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="font-serif text-3xl">Emprendimientos</h1>
      </div>

      <form className="flex gap-2 mb-4">
        <Input name="q" type="search" defaultValue={q} placeholder="Nombre o mail del dueño…" />
        <Select name="status" defaultValue={status} className="md:w-48">
          <option value="">Todos</option>
          <option value="pending">Pending</option>
          <option value="active">Activos</option>
          <option value="paused">En pausa</option>
          <option value="rejected">Rechazados</option>
        </Select>
        <button
          type="submit"
          className="h-11 px-4 rounded-md bg-[var(--color-ink)] text-[var(--color-bg)] text-sm font-medium"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto border border-[var(--color-border)] rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-border)]/40 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Nombre</th>
              <th className="text-left px-3 py-2 font-medium">Rubro</th>
              <th className="text-left px-3 py-2 font-medium">Dueño</th>
              <th className="text-left px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.map((b) => (
              <tr key={b.id}>
                <td className="px-3 py-2">
                  <Link href={`/admin/emprendimientos/${b.id}`} className="font-medium hover:underline">
                    {b.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-[var(--color-muted)]">
                  {b.categoryName ?? "—"}
                </td>
                <td className="px-3 py-2 text-[var(--color-muted)]">{b.ownerEmail}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/e/${b.slug}`}
                    target="_blank"
                    className="text-xs text-[var(--color-muted)] underline"
                  >
                    ver →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[var(--color-muted)]">
                  Sin resultados.
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
              href={`/admin/emprendimientos?${new URLSearchParams({ q, status, page: String(p) }).toString()}`}
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

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: "bg-[var(--color-border)]/60 text-[var(--color-muted)]",
    active: "bg-[var(--color-ink)] text-[var(--color-bg)]",
    paused: "bg-white border border-[var(--color-border)] text-[var(--color-ink)]",
    rejected: "bg-[var(--color-accent)] text-white",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls[status] ?? ""}`}>{status}</span>
  );
}
