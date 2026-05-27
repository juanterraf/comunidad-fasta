import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  businesses,
  categories,
  families,
  validationRequests,
} from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { BusinessAdminForm } from "./BusinessAdminForm";

export const dynamic = "force-dynamic";

export default async function EmprendimientoAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [b] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  if (!b) notFound();
  const cats = await db.select().from(categories).orderBy(asc(categories.displayOrder));
  const validators = await db
    .select({
      id: validationRequests.id,
      status: validationRequests.status,
      createdAt: validationRequests.createdAt,
      respondedAt: validationRequests.respondedAt,
      expiresAt: validationRequests.expiresAt,
      validatorName: families.displayName,
      validatorEmail: families.email,
    })
    .from(validationRequests)
    .leftJoin(families, eq(validationRequests.validatorFamilyId, families.id))
    .where(eq(validationRequests.businessId, id));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/emprendimientos" className="text-sm text-[var(--color-muted)]">
        ← Emprendimientos
      </Link>
      <h1 className="font-serif text-3xl my-4">{b.name}</h1>
      <p className="text-sm text-[var(--color-muted)] mb-6">
        <Link href={`/e/${b.slug}`} target="_blank" className="underline">
          /e/{b.slug}
        </Link>
      </p>

      <BusinessAdminForm business={b} categories={cats} />

      <section className="mt-12">
        <h2 className="font-serif text-xl mb-3">Validadores</h2>
        {validators.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Sin pedidos de validación.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-md">
            {validators.map((v) => (
              <li key={v.id} className="px-3 py-2 text-sm flex items-center justify-between">
                <div>
                  <p className="font-medium">{v.validatorName ?? "—"}</p>
                  <p className="text-xs text-[var(--color-muted)]">{v.validatorEmail}</p>
                </div>
                <div className="text-xs text-right text-[var(--color-muted)]">
                  <p>{v.status}</p>
                  {v.respondedAt ? (
                    <p>respondió {new Date(v.respondedAt).toLocaleString("es-AR")}</p>
                  ) : (
                    <p>vence {new Date(v.expiresAt).toLocaleString("es-AR")}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
