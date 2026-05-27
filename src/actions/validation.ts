"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  accessTokens,
  businesses,
  categories,
  families,
  validationRequests,
} from "@/db/schema";
import { deleteImage, processAndStore } from "@/lib/images";
import { sendMail, templates } from "@/lib/mail";
import { inDays, inHours, newToken } from "@/lib/tokens";
import { slugify } from "@/lib/slugify";
import { logEvent } from "@/lib/log";
import { searchValidatedFamilies } from "@/actions/families";
import { appUrl } from "@/lib/env";
import { clientIp, rateLimit, retryMessage } from "@/lib/rate-limit";

const SubmitSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  categoryId: z.string().uuid(),
  neighborhood: z.string().trim().max(120).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  ownerEmail: z.string().trim().toLowerCase().email(),
  ownerName: z.string().trim().min(2).max(120),
  ownerRole: z.enum(["familia", "docente", "egresado", "otro"]).default("familia"),
  ownerPhone: z.string().trim().max(40).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  instagram: z.string().trim().max(60).optional().nullable(),
  website: z.string().trim().max(300).optional().nullable(),
  delivers: z.coerce.boolean().optional(),
  onlineOnly: z.coerce.boolean().optional(),
  byAppointment: z.coerce.boolean().optional(),
  tags: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  validatorIds: z.array(z.string().uuid()).length(3, "Elegí 3 validadores distintos."),
});

async function uniqueSlug(base: string): Promise<string> {
  let candidate = slugify(base);
  let n = 2;
  while (true) {
    const existing = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${slugify(base)}-${n++}`;
  }
}

type SubmitError = { ok: false; error: string };

export async function submitBusiness(_prev: unknown, fd: FormData): Promise<SubmitError | void> {
  const validatorIdsRaw = fd.getAll("validatorIds").map(String).filter(Boolean);

  if (!fd.get("ownerEmail") || !fd.get("ownerName")) {
    return { ok: false, error: "Faltan datos del solicitante." };
  }

  const ip = await clientIp();
  const ipLimit = rateLimit(`submit-business:ip:${ip}`, 5, 60 * 60_000);
  if (!ipLimit.ok) {
    return { ok: false, error: `Demasiados envíos. ${retryMessage(ipLimit.retryAfterMs)}` };
  }
  const emailRaw = String(fd.get("ownerEmail") ?? "").trim().toLowerCase();
  if (emailRaw) {
    const emailLimit = rateLimit(`submit-business:email:${emailRaw}`, 3, 60 * 60_000);
    if (!emailLimit.ok) {
      return { ok: false, error: `Demasiados envíos. ${retryMessage(emailLimit.retryAfterMs)}` };
    }
  }

  const parsed = SubmitSchema.safeParse({
    name: fd.get("name"),
    description: fd.get("description") || null,
    categoryId: fd.get("categoryId"),
    neighborhood: fd.get("neighborhood") || null,
    address: fd.get("address") || null,
    ownerEmail: fd.get("ownerEmail"),
    ownerName: fd.get("ownerName"),
    ownerRole: (fd.get("ownerRole") as string) || "familia",
    ownerPhone: fd.get("ownerPhone") || null,
    whatsapp: fd.get("whatsapp") || null,
    instagram: fd.get("instagram") || null,
    website: fd.get("website") || null,
    delivers: fd.get("delivers") === "on",
    onlineOnly: fd.get("onlineOnly") === "on",
    byAppointment: fd.get("byAppointment") === "on",
    tags: (fd.get("tags") as string) ?? "",
    lat: fd.get("lat") ? (fd.get("lat") as string) : null,
    lng: fd.get("lng") ? (fd.get("lng") as string) : null,
    validatorIds: validatorIdsRaw,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  if (!parsed.data.whatsapp && !parsed.data.instagram) {
    return { ok: false, error: "Cargá al menos un WhatsApp o un Instagram para que te contacten." };
  }

  const uniqueValidators = Array.from(new Set(parsed.data.validatorIds));
  if (uniqueValidators.length !== 3) {
    return { ok: false, error: "Elegí 3 validadores distintos." };
  }

  const validators = await db
    .select()
    .from(families)
    .where(and(inArray(families.id, uniqueValidators), eq(families.validated, true)));
  if (validators.length !== 3) {
    return { ok: false, error: "Alguno de los validadores no está habilitado." };
  }
  if (validators.some((v) => v.email === parsed.data.ownerEmail)) {
    return { ok: false, error: "No podés validarte a vos mismo." };
  }

  const photo = fd.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { ok: false, error: "Subí una foto del emprendimiento." };
  }
  const maxMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 8);
  if (photo.size > maxMb * 1024 * 1024) {
    return { ok: false, error: `La foto pesa más de ${maxMb}MB.` };
  }

  const slug = await uniqueSlug(parsed.data.name);
  const tags = (parsed.data.tags ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);

  const businessId = randomUUID();
  try {
    const buf = Buffer.from(await photo.arrayBuffer());
    await processAndStore(businessId, buf);
  } catch (err) {
    console.error("[submit] image processing failed", err);
    await deleteImage(businessId);
    return { ok: false, error: "No pudimos procesar la foto. Probá con otra imagen (JPG o PNG)." };
  }

  const expiresAt = inDays(7);
  const reqInputs = validators.map((v) => ({
    businessId,
    validatorFamilyId: v.id,
    token: newToken(24),
    status: "pending" as const,
    expiresAt,
  }));

  let biz: typeof businesses.$inferSelect;
  let reqs: Array<typeof validationRequests.$inferSelect>;
  try {
    const result = await db.transaction(async (tx) => {
      // Upsert family por email: si ya existe (admin la cargó antes o
      // suma un segundo emprendimiento), respeta los campos existentes
      // y solo llena los vacíos. validated NO se toca acá; sigue siendo
      // decisión del admin.
      const [existingFamily] = await tx
        .select()
        .from(families)
        .where(eq(families.email, parsed.data.ownerEmail))
        .limit(1);

      let ownerFamilyId: string;
      if (existingFamily) {
        ownerFamilyId = existingFamily.id;
        const patch: Partial<typeof families.$inferInsert> = {};
        if (!existingFamily.displayName) patch.displayName = parsed.data.ownerName;
        if (!existingFamily.role) patch.role = parsed.data.ownerRole;
        if (!existingFamily.phone && parsed.data.ownerPhone)
          patch.phone = parsed.data.ownerPhone;
        if (Object.keys(patch).length > 0) {
          await tx.update(families).set(patch).where(eq(families.id, existingFamily.id));
        }
      } else {
        const [createdFamily] = await tx
          .insert(families)
          .values({
            email: parsed.data.ownerEmail,
            displayName: parsed.data.ownerName,
            role: parsed.data.ownerRole,
            phone: parsed.data.ownerPhone ?? null,
            validated: false,
          })
          .returning({ id: families.id });
        ownerFamilyId = createdFamily.id;
      }

      const [insertedBiz] = await tx
        .insert(businesses)
        .values({
          id: businessId,
          slug,
          name: parsed.data.name,
          description: parsed.data.description,
          address: parsed.data.address,
          neighborhood: parsed.data.neighborhood,
          categoryId: parsed.data.categoryId,
          ownerEmail: parsed.data.ownerEmail,
          ownerFamilyId,
          whatsapp: parsed.data.whatsapp,
          instagram: parsed.data.instagram,
          website: parsed.data.website,
          delivers: parsed.data.delivers ?? false,
          onlineOnly: parsed.data.onlineOnly ?? false,
          byAppointment: parsed.data.byAppointment ?? false,
          tags,
          lat: parsed.data.onlineOnly ? null : parsed.data.lat ?? null,
          lng: parsed.data.onlineOnly ? null : parsed.data.lng ?? null,
          status: "pending",
          photoFilename: `${businessId}.webp`,
        })
        .returning();
      const insertedReqs = await tx
        .insert(validationRequests)
        .values(reqInputs)
        .returning();
      return { biz: insertedBiz, reqs: insertedReqs };
    });
    biz = result.biz;
    reqs = result.reqs;
  } catch (err) {
    console.error("[submit] db transaction failed", err);
    await deleteImage(businessId);
    return { ok: false, error: "No pudimos guardar tu pedido. Intentá de nuevo en un rato." };
  }

  await logEvent({
    type: "business.created",
    actorEmail: parsed.data.ownerEmail,
    entityType: "businesses",
    entityId: biz.id,
    metadata: { name: biz.name, validators: validators.map((v) => v.email) },
  });

  await Promise.all(
    reqs.map(async (r) => {
      const v = validators.find((x) => x.id === r.validatorFamilyId);
      if (!v) return;
      const link = `${appUrl()}/validar/${r.token}`;
      const msg = templates.validationRequest({
        validatorName: v.displayName,
        applicantName: parsed.data.ownerName,
        businessName: biz.name,
        link,
      });
      await sendMail({ ...msg, to: v.email });
    }),
  );

  const ack = templates.applicantAck({
    applicantName: parsed.data.ownerName,
    businessName: biz.name,
  });
  await sendMail({ ...ack, to: parsed.data.ownerEmail });

  redirect("/sumarte/gracias");
}

export async function searchValidators(q: string) {
  const ip = await clientIp();
  const limit = rateLimit(`search-validators:ip:${ip}`, 30, 60_000);
  if (!limit.ok) return [];
  return searchValidatedFamilies(q);
}

async function expireOld() {
  await db
    .update(validationRequests)
    .set({ status: "expired" })
    .where(
      and(
        eq(validationRequests.status, "pending"),
        sql`${validationRequests.expiresAt} <= now()`,
      ),
    );
}

type ValidationLanding = {
  status: "pending" | "approved" | "rejected" | "expired" | "used" | "not_found";
  businessName?: string;
  applicantName?: string;
  categoryName?: string;
  neighborhood?: string;
  photoId?: string;
};

export async function inspectValidation(token: string): Promise<ValidationLanding> {
  await expireOld();
  const rows = await db
    .select({
      reqId: validationRequests.id,
      reqStatus: validationRequests.status,
      respondedAt: validationRequests.respondedAt,
      businessName: businesses.name,
      ownerEmail: businesses.ownerEmail,
      bizId: businesses.id,
      neighborhood: businesses.neighborhood,
      categoryName: categories.name,
    })
    .from(validationRequests)
    .leftJoin(businesses, eq(validationRequests.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(eq(validationRequests.token, token))
    .limit(1);

  if (rows.length === 0) return { status: "not_found" };
  const r = rows[0];
  if (r.respondedAt) {
    return { status: "used" };
  }
  if (r.reqStatus === "expired") return { status: "expired" };
  return {
    status: "pending",
    businessName: r.businessName ?? undefined,
    applicantName: r.ownerEmail ?? undefined,
    categoryName: r.categoryName ?? undefined,
    neighborhood: r.neighborhood ?? undefined,
    photoId: r.bizId ?? undefined,
  };
}

export async function respondValidation(
  token: string,
  decision: "yes" | "no",
): Promise<{ ok: true; outcome: "recorded" | "approved" | "already" } | { ok: false; error: string }> {
  await expireOld();

  const [req] = await db
    .select()
    .from(validationRequests)
    .where(eq(validationRequests.token, token))
    .limit(1);
  if (!req) return { ok: false, error: "Link inválido." };
  if (req.respondedAt) return { ok: true, outcome: "already" };
  if (req.status === "expired") return { ok: false, error: "Este link ya expiró." };

  const newStatus = decision === "yes" ? "approved" : "rejected";

  type ApprovedOutcome = {
    biz: typeof businesses.$inferSelect;
    editToken: string;
  } | null;

  let approvedOutcome: ApprovedOutcome = null;
  try {
    approvedOutcome = await db.transaction(async (tx) => {
      await tx
        .update(validationRequests)
        .set({ status: newStatus, respondedAt: new Date() })
        .where(eq(validationRequests.id, req.id));

      if (decision !== "yes") return null;

      const [count] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(validationRequests)
        .where(
          and(
            eq(validationRequests.businessId, req.businessId),
            eq(validationRequests.status, "approved"),
          ),
        );
      if ((count?.n ?? 0) < 2) return null;

      const [activated] = await tx
        .update(businesses)
        .set({ status: "active", approvedAt: new Date() })
        .where(and(eq(businesses.id, req.businessId), eq(businesses.status, "pending")))
        .returning();
      if (!activated) return null;

      const editToken = newToken(24);
      await tx.insert(accessTokens).values({
        token: editToken,
        email: activated.ownerEmail,
        purpose: "edit_business",
        targetId: activated.id,
        expiresAt: inHours(24 * 30),
      });
      return { biz: activated, editToken };
    });
  } catch (err) {
    console.error("[validation] transaction failed", err);
    return { ok: false, error: "No pudimos registrar tu respuesta. Probá de nuevo." };
  }

  await logEvent({
    type: `validation.${newStatus}`,
    entityType: "businesses",
    entityId: req.businessId,
    metadata: { reqId: req.id },
  });

  if (approvedOutcome) {
    const { biz, editToken } = approvedOutcome;
    await logEvent({
      type: "business.auto_approved",
      entityType: "businesses",
      entityId: biz.id,
    });
    const publicUrl = `${appUrl()}/e/${biz.slug}`;
    const editUrl = `${appUrl()}/editar/${editToken}`;
    const msg = templates.applicantApproved({
      applicantName: biz.ownerEmail.split("@")[0],
      businessName: biz.name,
      publicUrl,
      editUrl,
    });
    await sendMail({ ...msg, to: biz.ownerEmail });
    return { ok: true, outcome: "approved" };
  }

  return { ok: true, outcome: "recorded" };
}

