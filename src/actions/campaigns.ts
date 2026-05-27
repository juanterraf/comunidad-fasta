"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, asc, eq, gte, lte, or, sql, SQL } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { logEvent } from "@/lib/log";
import { slugify } from "@/lib/slugify";

const Schema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/u)
    .optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  ctaText: z.string().trim().max(60).optional().nullable(),
  ctaHref: z.string().trim().max(300).optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
  isActive: z.coerce.boolean().optional(),
});

function fdObj(fd: FormData) {
  return {
    title: fd.get("title"),
    slug: fd.get("slug") || undefined,
    description: fd.get("description") || null,
    colorHex: (fd.get("colorHex") as string) || undefined,
    startsAt: (fd.get("startsAt") as string) || null,
    endsAt: (fd.get("endsAt") as string) || null,
    ctaText: fd.get("ctaText") || null,
    ctaHref: fd.get("ctaHref") || null,
    categoryIds: fd.getAll("categoryIds").map(String).filter(Boolean),
    isActive: fd.get("isActive") === "on",
  };
}

function toDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function upsertCampaign(_prev: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const id = (fd.get("id") as string) || null;
  const parsed = Schema.safeParse(fdObj(fd));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const slug = slugify(v.slug || v.title);

  const payload = {
    title: v.title,
    slug,
    description: v.description,
    colorHex: v.colorHex || "#c4502c",
    startsAt: toDate(v.startsAt),
    endsAt: toDate(v.endsAt),
    ctaText: v.ctaText,
    ctaHref: v.ctaHref,
    categoryIds: v.categoryIds && v.categoryIds.length ? v.categoryIds : null,
    isActive: v.isActive ?? false,
  };

  try {
    if (id) {
      await db.update(campaigns).set(payload).where(eq(campaigns.id, id));
      await logEvent({
        type: "campaign.updated",
        actorEmail: admin.email,
        entityType: "campaigns",
        entityId: id,
      });
    } else {
      const [row] = await db.insert(campaigns).values(payload).returning();
      await logEvent({
        type: "campaign.created",
        actorEmail: admin.email,
        entityType: "campaigns",
        entityId: row.id,
      });
    }
  } catch (err) {
    if (String(err).includes("campaigns_slug_unique") || String(err).includes("duplicate")) {
      return { ok: false as const, error: "Ya existe una campaña con ese slug." };
    }
    throw err;
  }
  revalidatePath("/admin/campanas");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteCampaign(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await db.delete(campaigns).where(eq(campaigns.id, id));
  await logEvent({
    type: "campaign.deleted",
    actorEmail: admin.email,
    entityType: "campaigns",
    entityId: id,
  });
  revalidatePath("/admin/campanas");
  revalidatePath("/");
}

export async function getActiveCampaign() {
  const now = new Date();
  const conds: SQL[] = [eq(campaigns.isActive, true)];
  const startOk = or(sql`${campaigns.startsAt} is null`, lte(campaigns.startsAt, now));
  const endOk = or(sql`${campaigns.endsAt} is null`, gte(campaigns.endsAt, now));
  if (startOk) conds.push(startOk);
  if (endOk) conds.push(endOk);
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(...conds))
    .orderBy(asc(campaigns.endsAt))
    .limit(1);
  return row ?? null;
}

export async function getCampaignBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, slug))
    .limit(1);
  return row ?? null;
}
