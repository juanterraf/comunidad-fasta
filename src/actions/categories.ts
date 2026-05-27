"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { logEvent } from "@/lib/log";
import { slugify } from "@/lib/slugify";

const Schema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(40).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function createCategory(_prev: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const parsed = Schema.safeParse({
    name: fd.get("name"),
    icon: fd.get("icon") || null,
    displayOrder: fd.get("displayOrder") || 0,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  try {
    const [row] = await db
      .insert(categories)
      .values({
        slug: slugify(parsed.data.name),
        name: parsed.data.name,
        icon: parsed.data.icon,
        displayOrder: parsed.data.displayOrder ?? 0,
      })
      .returning();
    await logEvent({
      type: "category.created",
      actorEmail: admin.email,
      entityType: "categories",
      entityId: row.id,
    });
  } catch (err) {
    if (String(err).includes("categories_slug_unique") || String(err).includes("duplicate")) {
      return { ok: false as const, error: "Ya existe una categoría con ese slug." };
    }
    throw err;
  }
  revalidatePath("/admin/categorias");
  return { ok: true as const };
}

export async function updateCategory(_prev: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return { ok: false as const, error: "Falta id." };
  const parsed = Schema.safeParse({
    name: fd.get("name"),
    icon: fd.get("icon") || null,
    displayOrder: fd.get("displayOrder") || 0,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  await db
    .update(categories)
    .set({
      name: parsed.data.name,
      icon: parsed.data.icon,
      displayOrder: parsed.data.displayOrder ?? 0,
    })
    .where(eq(categories.id, id));
  await logEvent({
    type: "category.updated",
    actorEmail: admin.email,
    entityType: "categories",
    entityId: id,
  });
  revalidatePath("/admin/categorias");
  return { ok: true as const };
}

export async function deleteCategory(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  try {
    await db.delete(categories).where(eq(categories.id, id));
    await logEvent({
      type: "category.deleted",
      actorEmail: admin.email,
      entityType: "categories",
      entityId: id,
    });
  } catch {
    // hay emprendimientos asociados: no eliminamos
  }
  revalidatePath("/admin/categorias");
}
