import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { families } from "@/db/schema";
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
  return (
    <div>
      <Link href="/admin/familias" className="text-sm text-[var(--color-muted)]">
        ← Familias
      </Link>
      <h1 className="font-serif text-3xl my-4">{row.displayName}</h1>
      <FamilyForm family={row} action={updateFamily} deleteAction={deleteFamily} />
    </div>
  );
}
