"use server";

import { z, type ZodType } from "zod";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { communityNeeds, needSearchLogs } from "@/db/schema";
import { searchByNeed, snapshotFromResults } from "@/services/needs/need-search";
import { logEvent } from "@/lib/log";
import { clientIp, rateLimit, retryMessage } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/admin-guard";
import { NEED_STATUSES, NEED_URGENCIES, type NeedStatus } from "@/config/needs";

function emptyToNull<T extends ZodType>(schema: T) {
  return schema.optional().nullable().or(z.literal("").transform(() => null));
}

const SubmitSchema = z.object({
  query: z.string().trim().min(3, "Contanos un poco más qué necesitás.").max(500),
  zone: z.string().trim().max(120).optional().nullable(),
  categoryHintId: emptyToNull(z.string().uuid()),
  urgency: z.enum(NEED_URGENCIES).optional().nullable(),
  budget: z.string().trim().max(120).optional().nullable(),
  name: z.string().trim().max(120).optional().nullable(),
  email: emptyToNull(z.string().trim().toLowerCase().email("Mail inválido.")),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  consent: z.coerce.boolean().optional(),
});

type SubmitResult = { ok: false; error: string };

export async function submitNeed(_prev: unknown, fd: FormData): Promise<SubmitResult | void> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`submit-need:ip:${ip}`, 10, 60 * 60_000);
  if (!ipLimit.ok) {
    return { ok: false, error: `Demasiadas búsquedas. ${retryMessage(ipLimit.retryAfterMs)}` };
  }

  const parsed = SubmitSchema.safeParse({
    query: fd.get("query") ?? "",
    zone: fd.get("zone") || null,
    categoryHintId: fd.get("categoryHintId") || null,
    urgency: (fd.get("urgency") as string) || null,
    budget: fd.get("budget") || null,
    name: fd.get("name") || null,
    email: fd.get("email") || null,
    whatsapp: fd.get("whatsapp") || null,
    consent: fd.get("consent") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const data = parsed.data;
  const hasPersonalData = Boolean(data.name || data.email || data.whatsapp);
  if (hasPersonalData && !data.consent) {
    return {
      ok: false,
      error:
        "Si dejás un dato de contacto, marcá la casilla de consentimiento para que podamos usarlo.",
    };
  }

  const search = await searchByNeed({
    rawQuery: data.query,
    zone: data.zone ?? null,
    categoryHintId: data.categoryHintId ?? null,
  });

  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent")?.slice(0, 500) ?? null;

  const [inserted] = await db
    .insert(communityNeeds)
    .values({
      queryOriginal: data.query,
      queryExpanded: search.expanded.expandedText,
      name: data.consent ? data.name ?? null : null,
      email: data.consent ? data.email ?? null : null,
      whatsapp: data.consent ? data.whatsapp ?? null : null,
      zone: data.zone ?? null,
      categoryHintId: data.categoryHintId ?? null,
      urgency: data.urgency ?? null,
      budget: data.budget ?? null,
      consent: data.consent ?? false,
      status: "new",
      matchedResults: snapshotFromResults(search.results),
      ipAddress: ip,
      userAgent,
    })
    .returning();

  await Promise.all([
    db.insert(needSearchLogs).values({
      needId: inserted.id,
      query: data.query,
      resultsCount: search.results.length,
    }),
    logEvent({
      type: "need.created",
      actorEmail: data.email ?? null,
      entityType: "community_needs",
      entityId: inserted.id,
      metadata: {
        resultsCount: search.results.length,
        matchedSynonyms: search.expanded.matched.map((m) => m.trigger),
      },
    }),
  ]);

  redirect(`/necesito/resultados/${inserted.id}`);
}

export async function logResultClick(needId: string, businessId: string): Promise<void> {
  if (!needId || !businessId) return;
  const ip = await clientIp();
  const limit = rateLimit(`need-click:${ip}`, 60, 60_000);
  if (!limit.ok) return;
  try {
    await db.insert(needSearchLogs).values({
      needId,
      query: "",
      resultsCount: 0,
      clickedBusinessId: businessId,
    });
  } catch (err) {
    console.error("[need:click] failed", err);
  }
}

const StatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(NEED_STATUSES),
});

export async function updateNeedStatus(
  id: string,
  status: NeedStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const parsed = StatusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Estado inválido." };

  await Promise.all([
    db
      .update(communityNeeds)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(communityNeeds.id, parsed.data.id)),
    logEvent({
      type: `need.status.${parsed.data.status}`,
      actorEmail: admin.email,
      entityType: "community_needs",
      entityId: parsed.data.id,
    }),
  ]);
  return { ok: true };
}

const NotesSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(4000).nullable(),
});

export async function updateNeedNotes(
  id: string,
  notes: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const parsed = NotesSchema.safeParse({ id, notes });
  if (!parsed.success) return { ok: false, error: "Notas inválidas." };

  await Promise.all([
    db
      .update(communityNeeds)
      .set({ adminNotes: parsed.data.notes ?? null, updatedAt: new Date() })
      .where(eq(communityNeeds.id, parsed.data.id)),
    logEvent({
      type: "need.notes_updated",
      actorEmail: admin.email,
      entityType: "community_needs",
      entityId: parsed.data.id,
    }),
  ]);
  return { ok: true };
}
