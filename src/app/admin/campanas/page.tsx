import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function CampanasPage() {
  await requireAdmin();
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-3xl">Campañas</h1>
        <Link
          href="/admin/campanas/nueva"
          className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[var(--color-ink)] text-[var(--color-bg)] text-sm font-medium"
        >
          + Nueva
        </Link>
      </div>

      <div className="overflow-x-auto border border-[var(--color-border)] rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-border)]/40 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Título</th>
              <th className="text-left px-3 py-2 font-medium">Slug</th>
              <th className="text-left px-3 py-2 font-medium">Termina</th>
              <th className="text-left px-3 py-2 font-medium">Activa</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.colorHex }}
                    />
                    <Link
                      href={`/admin/campanas/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.title}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-2 text-[var(--color-muted)]">{c.slug}</td>
                <td className="px-3 py-2 text-[var(--color-muted)]">
                  {c.endsAt ? new Date(c.endsAt).toLocaleString("es-AR") : "—"}
                </td>
                <td className="px-3 py-2">
                  {c.isActive ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-ink)] text-[var(--color-bg)]">
                      activa
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">off</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/campanas/${c.id}`}
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
                  Sin campañas todavía.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
