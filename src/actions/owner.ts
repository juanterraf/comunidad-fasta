"use server";

import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { accessTokens, businesses } from "@/db/schema";
import { getOwnerSession } from "@/lib/auth";
import { sendMail, templates } from "@/lib/mail";
import { inHours, newToken } from "@/lib/tokens";
import { logEvent } from "@/lib/log";
import { appUrl } from "@/lib/env";
import { revalidatePath } from "next/cache";
import { clientIp, rateLimit, retryMessage } from "@/lib/rate-limit";

const EmailSchema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function requestEditLink(_prev: unknown, fd: FormData) {
  const parsed = EmailSchema.safeParse({ email: fd.get("email") });
  if (!parsed.success) {
    return { ok: false as const, error: "Ingresá un mail válido." };
  }
  const email = parsed.data.email;
  const ip = await clientIp();
  const ipLimit = rateLimit(`edit-link:ip:${ip}`, 15, 60 * 60_000);
  if (!ipLimit.ok) {
    return { ok: false as const, error: `Demasiados pedidos. ${retryMessage(ipLimit.retryAfterMs)}` };
  }
  const emailLimit = rateLimit(`edit-link:email:${email}`, 3, 15 * 60_000);
  if (!emailLimit.ok) {
    return { ok: false as const, error: `Demasiados pedidos. ${retryMessage(emailLimit.retryAfterMs)}` };
  }
  const rows = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.ownerEmail, email), eq(businesses.status, "active")))
    .limit(1);

  if (rows.length > 0) {
    const token = newToken(24);
    await db.insert(accessTokens).values({
      token,
      email,
      purpose: "edit_business",
      targetId: rows[0].id,
      expiresAt: inHours(24),
    });
    const link = `${appUrl()}/editar/${token}`;
    await sendMail({ ...templates.editMagicLink({ link }), to: email });
    await logEvent({
      type: "owner.edit_link_sent",
      actorEmail: email,
      entityType: "businesses",
      entityId: rows[0].id,
    });
  }
  return { ok: true as const };
}

export type TokenPreview = {
  status: "valid" | "used" | "expired" | "not_found";
  businessName?: string;
  email?: string;
};

export async function inspectEditToken(token: string): Promise<TokenPreview> {
  const [t] = await db
    .select({
      id: accessTokens.id,
      email: accessTokens.email,
      purpose: accessTokens.purpose,
      targetId: accessTokens.targetId,
      expiresAt: accessTokens.expiresAt,
      usedAt: accessTokens.usedAt,
      businessName: businesses.name,
    })
    .from(accessTokens)
    .leftJoin(businesses, eq(accessTokens.targetId, businesses.id))
    .where(eq(accessTokens.token, token))
    .limit(1);

  if (!t || t.purpose !== "edit_business" || !t.targetId) return { status: "not_found" };
  if (t.usedAt) return { status: "used" };
  if (t.expiresAt.getTime() <= Date.now()) return { status: "expired" };
  return {
    status: "valid",
    businessName: t.businessName ?? undefined,
    email: t.email,
  };
}

export async function consumeEditToken(fd: FormData) {
  const token = String(fd.get("token") ?? "");
  if (!token) redirect("/editar");

  const now = new Date();
  const [t] = await db
    .select()
    .from(accessTokens)
    .where(
      and(
        eq(accessTokens.token, token),
        eq(accessTokens.purpose, "edit_business"),
        isNull(accessTokens.usedAt),
        gt(accessTokens.expiresAt, now),
      ),
    )
    .limit(1);
  if (!t || !t.targetId) {
    // El GET a /editar/[token] renderiza el motivo (used/expired/not_found).
    redirect(`/editar/${token}`);
  }

  await db
    .update(accessTokens)
    .set({ usedAt: new Date() })
    .where(eq(accessTokens.id, t.id));

  const session = await getOwnerSession();
  session.businessId = t.targetId;
  session.email = t.email;
  session.issuedAt = Date.now();
  await session.save();

  await logEvent({
    type: "owner.session_opened",
    actorEmail: t.email,
    entityType: "businesses",
    entityId: t.targetId,
  });
  redirect("/mi-emprendimiento");
}

export async function logoutOwner() {
  const session = await getOwnerSession();
  session.destroy();
  redirect("/editar");
}

const EditSchema = z.object({
  description: z.string().trim().max(500).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  neighborhood: z.string().trim().max(120).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  instagram: z.string().trim().max(60).optional().nullable(),
  website: z.string().trim().max(300).optional().nullable(),
  delivers: z.coerce.boolean().optional(),
  onlineOnly: z.coerce.boolean().optional(),
  byAppointment: z.coerce.boolean().optional(),
  tags: z.string().optional(),
});

export async function updateOwnBusiness(_prev: unknown, fd: FormData) {
  const session = await getOwnerSession();
  if (!session.businessId) return { ok: false as const, error: "Sesión expirada." };

  const parsed = EditSchema.safeParse({
    description: fd.get("description") || null,
    address: fd.get("address") || null,
    neighborhood: fd.get("neighborhood") || null,
    whatsapp: fd.get("whatsapp") || null,
    instagram: fd.get("instagram") || null,
    website: fd.get("website") || null,
    delivers: fd.get("delivers") === "on",
    onlineOnly: fd.get("onlineOnly") === "on",
    byAppointment: fd.get("byAppointment") === "on",
    tags: (fd.get("tags") as string) ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  if (!parsed.data.whatsapp && !parsed.data.instagram) {
    return {
      ok: false as const,
      error: "Dejá al menos un WhatsApp o un Instagram.",
    };
  }
  const tags = (parsed.data.tags ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);

  const [updated] = await db
    .update(businesses)
    .set({
      description: parsed.data.description,
      address: parsed.data.address,
      neighborhood: parsed.data.neighborhood,
      whatsapp: parsed.data.whatsapp,
      instagram: parsed.data.instagram,
      website: parsed.data.website,
      delivers: parsed.data.delivers ?? false,
      onlineOnly: parsed.data.onlineOnly ?? false,
      byAppointment: parsed.data.byAppointment ?? false,
      tags,
    })
    .where(eq(businesses.id, session.businessId))
    .returning({ slug: businesses.slug });

  await logEvent({
    type: "business.self_updated",
    actorEmail: session.email,
    entityType: "businesses",
    entityId: session.businessId,
  });
  if (updated?.slug) revalidatePath(`/e/${updated.slug}`);
  revalidatePath("/mi-emprendimiento");
  return { ok: true as const };
}
