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
import { FamilyStatusBadge } from "@/components/ui/FamilyStatusBadge";
import { FAMILY_ROLE_LABEL, type FamilyRole } from "@/config/roles";

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

  const [cats, ownerRows, validators] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.displayOrder)),
    b.ownerFamilyId
      ? db.select().from(families).where(eq(families.id, b.ownerFamilyId)).limit(1)
      : Promise.resolve([] as Array<typeof families.$inferSelect>),
    db
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
      .where(eq(validationRequests.businessId, id)),
  ]);
  const owner = ownerRows[0];

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

      <section className="border border-[var(--color-border)] rounded-md p-4 mb-8 bg-[var(--color-surface-warm)]">
        <p className="eyebrow mb-3">Dueño</p>
        {owner ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase text-[var(--color-muted)] mb-0.5">Nombre</p>
              <p className="font-medium">{owner.displayName}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-[var(--color-muted)] mb-0.5">Rol</p>
              <p>
                {owner.role && owner.role in FAMILY_ROLE_LABEL
                  ? FAMILY_ROLE_LABEL[owner.role as FamilyRole]
                  : owner.role ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-[var(--color-muted)] mb-0.5">Mail</p>
              <a className="underline" href={`mailto:${owner.email}`}>
                {owner.email}
              </a>
            </div>
            <div>
              <p className="text-xs uppercase text-[var(--color-muted)] mb-0.5">Teléfono</p>
              <p>{owner.phone ?? "—"}</p>
            </div>
            <div className="md:col-span-2 flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)] mt-1">
              <FamilyStatusBadge isSeed={owner.isSeed} validated={owner.validated} />
              <Link
                href={`/admin/familias/${owner.id}`}
                className="text-xs underline text-[var(--color-muted)]"
              >
                editar familia →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <p className="text-[var(--color-muted)] mb-2">
              Este emprendimiento no tiene familia vinculada. Solo registramos
              el mail del dueño:
            </p>
            <p className="font-medium">{b.ownerEmail}</p>
            <p className="text-xs text-[var(--color-subtle)] mt-2">
              Cargás de un seed previo o creado antes del cambio de modelo.
              Podés vincularlo desde el form de abajo (campo Familia dueña)
              o creando la familia en /admin/familias/nueva con este mail.
            </p>
          </div>
        )}
      </section>

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
