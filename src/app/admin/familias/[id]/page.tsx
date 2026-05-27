import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, categories, families } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteFamily, updateFamily } from "@/actions/families";
import { FamilyForm } from "../FamilyForm";

export const dynamic = "force-dynamic";

export default async function EditarFamiliaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [row] = await db.select().from(families).where(eq(families.id, id)).limit(1);
  if (!row) notFound();

  const ownedBusinesses = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      status: businesses.status,
      categoryName: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(eq(businesses.ownerFamilyId, id))
    .orderBy(asc(businesses.name));

  return (
    <div>
      <Link href="/admin/familias" className="text-sm text-[var(--color-muted)]">
        ← Familias
      </Link>
      <h1 className="font-serif text-3xl my-4">{row.displayName}</h1>
      <FamilyForm family={row} action={updateFamily} deleteAction={deleteFamily} />

      <section className="mt-12">
        <h2 className="font-serif text-xl mb-3">Emprendimientos vinculados</h2>
        {ownedBusinesses.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Esta familia no tiene emprendimientos cargados.
          </p>
        ) : (
          <ul className="border border-[var(--color-border)] rounded-md divide-y divide-[var(--color-border)]">
            {ownedBusinesses.map((b) => (
              <li key={b.id} className="px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/emprendimientos/${b.id}`}
                    className="font-medium hover:underline"
                  >
                    {b.name}
                  </Link>
                  <p className="text-xs text-[var(--color-muted)]">
                    {b.categoryName ?? "—"} · estado {b.status}
                  </p>
                </div>
                <Link
                  href={`/e/${b.slug}`}
                  target="_blank"
                  className="text-xs text-[var(--color-muted)] underline whitespace-nowrap"
                >
                  ver ficha →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
