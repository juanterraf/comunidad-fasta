import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { communityNeeds, categories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUS_OPTIONS = [
  "",
  "new",
  "reviewed",
  "resolved",
  "discarded",
  "spam",
  "featured",
] as const;

const STATUS_LABEL: Record<string, string> = {
  new: "Nueva",
  reviewed: "Revisada",
  resolved: "Resuelta",
  discarded: "Descartada",
  spam: "Spam",
  featured: "Destacada",
};

export default async function NecesidadesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = STATUS_OPTIONS.includes((sp.status ?? "") as never) ? sp.status ?? "" : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const conds: SQL[] = [];
  if (q) {
    const wc = or(
      ilike(communityNeeds.queryOriginal, `%${q}%`),
      ilike(communityNeeds.email, `%${q}%`),
      ilike(communityNeeds.whatsapp, `%${q}%`),
      ilike(communityNeeds.zone, `%${q}%`),
    );
    if (wc) conds.push(wc);
  }
  if (status) conds.push(eq(communityNeeds.status, status));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, totalRow, statusCountsRaw, noResultsRow, withoutResultsRow] = await Promise.all([
    db
      .select({
        id: communityNeeds.id,
        queryOriginal: communityNeeds.queryOriginal,
        zone: communityNeeds.zone,
        status: communityNeeds.status,
        consent: communityNeeds.consent,
        email: communityNeeds.email,
        whatsapp: communityNeeds.whatsapp,
        createdAt: communityNeeds.createdAt,
        categoryName: categories.name,
        matchedResults: communityNeeds.matchedResults,
      })
      .from(communityNeeds)
      .leftJoin(categories, eq(communityNeeds.categoryHintId, categories.id))
      .where(where)
      .orderBy(desc(communityNeeds.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(communityNeeds).where(where),
    db
      .select({ status: communityNeeds.status, count: sql<number>`count(*)::int` })
      .from(communityNeeds)
      .groupBy(communityNeeds.status),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityNeeds)
      .where(sql`jsonb_array_length(coalesce(${communityNeeds.matchedResults}, '[]'::jsonb)) = 0`),
    db.select({ count: sql<number>`count(*)::int` }).from(communityNeeds),
  ]);

  const total = totalRow[0]?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const counts = Object.fromEntries(statusCountsRaw.map((r) => [r.status, r.count]));
  const noResults = noResultsRow[0]?.count ?? 0;
  const totalAll = withoutResultsRow[0]?.count ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="font-serif text-3xl">Necesidades</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card label="Total" value={totalAll} href="/admin/necesidades" />
        <Card label="Nuevas" value={counts.new ?? 0} href="/admin/necesidades?status=new" />
        <Card
          label="Resueltas"
          value={counts.resolved ?? 0}
          href="/admin/necesidades?status=resolved"
        />
        <Card
          label="Destacadas"
          value={counts.featured ?? 0}
          href="/admin/necesidades?status=featured"
        />
        <Card label="Sin resultados" value={noResults} href="/admin/necesidades" />
      </div>

      <form className="flex gap-2 mb-4 flex-wrap">
        <Input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar en consulta, mail, zona…"
          className="md:max-w-md"
        />
        <Select name="status" defaultValue={status} className="md:w-48">
          <option value="">Todos los estados</option>
          {(["new", "reviewed", "resolved", "featured", "discarded", "spam"] as const).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
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
              <th className="text-left px-3 py-2 font-medium">Consulta</th>
              <th className="text-left px-3 py-2 font-medium">Zona</th>
              <th className="text-left px-3 py-2 font-medium">Rubro sugerido</th>
              <th className="text-left px-3 py-2 font-medium">Resultados</th>
              <th className="text-left px-3 py-2 font-medium">Contacto</th>
              <th className="text-left px-3 py-2 font-medium">Estado</th>
              <th className="text-left px-3 py-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.map((r) => {
              const matched = Array.isArray(r.matchedResults) ? r.matchedResults.length : 0;
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2 max-w-md">
                    <Link
                      href={`/admin/necesidades/${r.id}`}
                      className="font-medium hover:underline line-clamp-2"
                    >
                      {r.queryOriginal}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[var(--color-muted)]">{r.zone ?? "—"}</td>
                  <td className="px-3 py-2 text-[var(--color-muted)]">
                    {r.categoryName ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-muted)]">{matched}</td>
                  <td className="px-3 py-2 text-[var(--color-muted)] text-xs">
                    {r.consent ? r.email ?? r.whatsapp ?? "—" : "Sin consent."}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--color-muted)]">
                    {new Date(r.createdAt).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[var(--color-muted)]">
                  Sin necesidades cargadas.
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
              href={`/admin/necesidades?${new URLSearchParams({ q, status, page: String(p) }).toString()}`}
              className={`px-3 py-1 rounded-md border ${
                p === page
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                  : "border-[var(--color-border)]"
              }`}
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
    new: "bg-[var(--color-secondary)] text-white",
    reviewed: "bg-[var(--color-border)]/60 text-[var(--color-ink-soft)]",
    resolved: "bg-[var(--color-ink)] text-[var(--color-bg)]",
    featured: "bg-[var(--color-accent)] text-white",
    discarded: "bg-white border border-[var(--color-border)] text-[var(--color-muted)]",
    spam: "bg-white border border-[var(--color-border)] text-[var(--color-muted)] line-through",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls[status] ?? ""}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function Card({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="block border border-[var(--color-border)] rounded-md p-3 hover:border-[var(--color-ink)]"
    >
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
        {label}
      </p>
      <p className="font-serif text-2xl">{value}</p>
    </Link>
  );
}
