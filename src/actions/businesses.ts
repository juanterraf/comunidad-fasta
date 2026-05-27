"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { accessTokens, businesses, families, validationRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { logEvent } from "@/lib/log";
import { slugify } from "@/lib/slugify";
import { sendMail, templates } from "@/lib/mail";
import { inHours, newToken } from "@/lib/tokens";
import { appUrl } from "@/lib/env";
import { emailLocalPart } from "@/lib/text";

const STATUS = ["pending", "active", "paused", "rejected"] as const;

const EditSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  neighborhood: z.string().trim().max(120).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  ownerEmail: z.string().trim().toLowerCase().email(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  instagram: z.string().trim().max(60).optional().nullable(),
  website: z.string().trim().max(300).optional().nullable(),
  delivers: z.coerce.boolean().optional(),
  onlineOnly: z.coerce.boolean().optional(),
  byAppointment: z.coerce.boolean().optional(),
  tags: z.string().optional(),
  status: z.enum(STATUS).optional(),
  story: z.string().trim().max(8000).optional().nullable(),
  isFeaturedStory: z.coerce.boolean().optional(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
});

function fdObj(fd: FormData) {
  return {
    name: fd.get("name"),
    slug: fd.get("slug") || undefined,
    description: fd.get("description") || null,
    address: fd.get("address") || null,
    neighborhood: fd.get("neighborhood") || null,
    categoryId: (fd.get("categoryId") as string) || null,
    ownerEmail: fd.get("ownerEmail"),
    whatsapp: fd.get("whatsapp") || null,
    instagram: fd.get("instagram") || null,
    website: fd.get("website") || null,
    delivers: fd.get("delivers") === "on",
    onlineOnly: fd.get("onlineOnly") === "on",
    byAppointment: fd.get("byAppointment") === "on",
    tags: (fd.get("tags") as string) ?? "",
    status: (fd.get("status") as string) || undefined,
    story: (fd.get("story") as string) || null,
    isFeaturedStory: fd.get("isFeaturedStory") === "on",
    lat: fd.get("lat") ? (fd.get("lat") as string) : null,
    lng: fd.get("lng") ? (fd.get("lng") as string) : null,
  };
}

async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  let candidate = slugify(base);
  let n = 2;
  while (true) {
    const existing = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(
        exceptId
          ? and(eq(businesses.slug, candidate), ne(businesses.id, exceptId))
          : eq(businesses.slug, candidate),
      )
      .limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${slugify(base)}-${n++}`;
  }
}

export async function updateBusinessAdmin(_prev: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return { ok: false as const, error: "Falta id." };
  const parsed = EditSchema.safeParse(fdObj(fd));
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const v = parsed.data;
  const slug = await uniqueSlug(v.slug || v.name, id);
  const tags = (v.tags ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);

  const setStatus = v.status ?? "pending";
  const approvedAt = setStatus === "active" ? new Date() : null;

  const [prev] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  if (!prev) return { ok: false as const, error: "No encontrado." };

  await db
    .update(businesses)
    .set({
      name: v.name,
      slug,
      description: v.description,
      address: v.address,
      neighborhood: v.neighborhood,
      categoryId: v.categoryId,
      ownerEmail: v.ownerEmail,
      whatsapp: v.whatsapp,
      instagram: v.instagram,
      website: v.website,
      delivers: v.delivers ?? false,
      onlineOnly: v.onlineOnly ?? false,
      byAppointment: v.byAppointment ?? false,
      tags,
      story: v.story,
      isFeaturedStory: v.isFeaturedStory ?? false,
      lat: v.lat ?? null,
      lng: v.lng ?? null,
      status: setStatus,
      approvedAt: setStatus === "active" ? prev.approvedAt ?? approvedAt : prev.approvedAt,
    })
    .where(eq(businesses.id, id));

  await logEvent({
    type: "business.updated",
    actorEmail: admin.email,
    entityType: "businesses",
    entityId: id,
    metadata: { prevStatus: prev.status, newStatus: setStatus },
  });
  revalidatePath("/admin/emprendimientos");
  revalidatePath(`/e/${slug}`);
  return { ok: true as const };
}

export async function setBusinessStatus(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!id || !STATUS.includes(status as never)) return;
  const approvedAt = status === "active" ? new Date() : null;
  const [prev] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  if (!prev) return;
  await db
    .update(businesses)
    .set({
      status: status as (typeof STATUS)[number],
      approvedAt:
        status === "active" ? prev.approvedAt ?? approvedAt : prev.approvedAt,
    })
    .where(eq(businesses.id, id));
  await logEvent({
    type: `business.status.${status}`,
    actorEmail: admin.email,
    entityType: "businesses",
    entityId: id,
    metadata: { from: prev.status },
  });
  revalidatePath("/admin/emprendimientos");
}

export async function adminApproveBusiness(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return;

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  if (!biz) return;
  if (biz.status === "active") {
    revalidatePath(`/admin/emprendimientos/${id}`);
    return;
  }

  const editToken = newToken(24);

  await db.transaction(async (tx) => {
    await tx
      .update(businesses)
      .set({ status: "active", approvedAt: biz.approvedAt ?? new Date() })
      .where(eq(businesses.id, id));

    // Expira los pedidos pendientes para que los links viejos no
    // confundan a los validadores ahora que ya está aprobado.
    await tx
      .update(validationRequests)
      .set({ status: "expired" })
      .where(
        and(
          eq(validationRequests.businessId, id),
          eq(validationRequests.status, "pending"),
        ),
      );

    await tx.insert(accessTokens).values({
      token: editToken,
      email: biz.ownerEmail,
      purpose: "edit_business",
      targetId: id,
      expiresAt: inHours(24 * 30),
    });
  });

  await logEvent({
    type: "business.admin_approved",
    actorEmail: admin.email,
    entityType: "businesses",
    entityId: id,
    metadata: { from: biz.status },
  });

  const ownerName = biz.ownerFamilyId
    ? (
        await db
          .select({ displayName: families.displayName })
          .from(families)
          .where(eq(families.id, biz.ownerFamilyId))
          .limit(1)
      )[0]?.displayName ?? emailLocalPart(biz.ownerEmail)
    : emailLocalPart(biz.ownerEmail);

  const publicUrl = `${appUrl()}/e/${biz.slug}`;
  const editUrl = `${appUrl()}/editar/${editToken}`;
  const msg = templates.applicantApproved({
    applicantName: ownerName,
    businessName: biz.name,
    publicUrl,
    editUrl,
  });
  await sendMail({ ...msg, to: biz.ownerEmail });

  revalidatePath("/admin/emprendimientos");
  revalidatePath(`/admin/emprendimientos/${id}`);
  revalidatePath(`/e/${biz.slug}`);
  revalidatePath("/");
  revalidatePath("/explorar");
}

export async function deleteBusinessAdmin(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await db.delete(businesses).where(eq(businesses.id, id));
  await logEvent({
    type: "business.deleted",
    actorEmail: admin.email,
    entityType: "businesses",
    entityId: id,
  });
  revalidatePath("/admin/emprendimientos");
}

export async function getBusinessSummary(id: string) {
  const [row] = await db
    .select({ slug: businesses.slug, count: sql<number>`0::int` })
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);
  return row;
}
