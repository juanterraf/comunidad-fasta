import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, categories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { CampaignForm } from "../CampaignForm";

export const dynamic = "force-dynamic";

export default async function EditarCampanaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!c) notFound();
  const cats = await db.select().from(categories).orderBy(asc(categories.displayOrder));
  return (
    <div>
      <Link href="/admin/campanas" className="text-sm text-[var(--color-muted)]">
        ← Campañas
      </Link>
      <h1 className="font-display text-3xl my-4">{c.title}</h1>
      <CampaignForm campaign={c} categories={cats} />
    </div>
  );
}
