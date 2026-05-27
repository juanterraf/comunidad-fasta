import Link from "next/link";
import { FamilyForm } from "../FamilyForm";
import { createFamily } from "@/actions/families";
import { requireAdmin } from "@/lib/admin-guard";

export default async function NuevaFamiliaPage() {
  await requireAdmin();
  return (
    <div>
      <Link href="/admin/familias" className="text-sm text-[var(--color-muted)]">
        ← Familias
      </Link>
      <h1 className="font-serif text-3xl my-4">Nueva familia</h1>
      <FamilyForm action={createFamily} />
    </div>
  );
}
