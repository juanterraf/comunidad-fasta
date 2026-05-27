import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { CategoriesEditor } from "./CategoriesEditor";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  await requireAdmin();
  const rows = await db.select().from(categories).orderBy(asc(categories.displayOrder));
  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Categorías</h1>
      <CategoriesEditor categories={rows} />
    </div>
  );
}
