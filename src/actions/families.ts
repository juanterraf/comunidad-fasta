"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { families } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { logEvent } from "@/lib/log";
import { FAMILY_ROLES } from "@/config/roles";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  displayName: z.string().trim().min(1).max(120),
  role: z.enum(FAMILY_ROLES),
  phone: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  isSeed: z.coerce.boolean().optional(),
  validated: z.coerce.boolean().optional(),
});

function fdToObj(fd: FormData) {
  return {
    email: fd.get("email"),
    displayName: fd.get("displayName"),
    role: fd.get("role"),
    phone: fd.get("phone") || null,
    notes: fd.get("notes") || null,
    isSeed: fd.get("isSeed") === "on",
    validated: fd.get("validated") === "on",
  };
}

export async function createFamily(_prev: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const parsed = Schema.safeParse(fdToObj(fd));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const validated = v.validated ?? v.isSeed ?? false;
  try {
    const [row] = await db
      .insert(families)
      .values({
        email: v.email,
        displayName: v.displayName,
        role: v.role,
        phone: v.phone,
        notes: v.notes,
        isSeed: v.isSeed ?? false,
        validated,
        validatedAt: validated ? new Date() : null,
      })
      .returning();
    await logEvent({
      type: "family.created",
      actorEmail: admin.email,
      entityType: "families",
      entityId: row.id,
    });
  } catch (err) {
    if (String(err).includes("families_email_unique") || String(err).includes("duplicate")) {
      return { ok: false as const, error: "Ya existe una familia con ese mail." };
    }
    throw err;
  }
  revalidatePath("/admin/familias");
  return { ok: true as const };
}

export async function updateFamily(_prev: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return { ok: false as const, error: "Falta id." };
  const parsed = Schema.safeParse(fdToObj(fd));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const validated = v.validated ?? false;
  const [existing] = await db.select().from(families).where(eq(families.id, id)).limit(1);
  if (!existing) return { ok: false as const, error: "No encontrada." };

  await db
    .update(families)
    .set({
      email: v.email,
      displayName: v.displayName,
      role: v.role,
      phone: v.phone,
      notes: v.notes,
      isSeed: v.isSeed ?? false,
      validated,
      validatedAt: validated ? existing.validatedAt ?? new Date() : null,
    })
    .where(eq(families.id, id));
  await logEvent({
    type: "family.updated",
    actorEmail: admin.email,
    entityType: "families",
    entityId: id,
  });
  revalidatePath("/admin/familias");
  return { ok: true as const };
}

export async function deleteFamily(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await db.delete(families).where(eq(families.id, id));
  await logEvent({
    type: "family.deleted",
    actorEmail: admin.email,
    entityType: "families",
    entityId: id,
  });
  revalidatePath("/admin/familias");
}

export async function searchValidatedFamilies(q: string) {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  return db
    .select({
      id: families.id,
      email: families.email,
      displayName: families.displayName,
    })
    .from(families)
    .where(
      and(
        eq(families.validated, true),
        or(
          ilike(families.displayName, `%${term}%`),
          ilike(families.email, `%${term}%`),
        )!,
      ),
    )
    .limit(8);
}
