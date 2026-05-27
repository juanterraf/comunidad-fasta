import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { CampaignForm } from "../CampaignForm";

export default async function NuevaCampanaPage() {
  await requireAdmin();
  const cats = await db.select().from(categories).orderBy(asc(categories.displayOrder));
  return (
    <div>
      <Link href="/admin/campanas" className="text-sm text-[var(--color-muted)]">
        ← Campañas
      </Link>
      <h1 className="font-display text-3xl my-4">Nueva campaña</h1>
      <CampaignForm categories={cats} />
    </div>
  );
}
