"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { businesses, reactions } from "@/db/schema";
import { getOrCreateAnonId } from "@/lib/anon";
import { isReactionKind, REACTION_KINDS, type ReactionKind } from "@/lib/reactions";
import { logEvent } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";

export type ReactionState = {
  counts: Record<ReactionKind, number>;
  mine: Partial<Record<ReactionKind, boolean>>;
};

const ToggleInput = z.object({
  businessId: z.string().uuid(),
  kind: z.string().refine(isReactionKind, "Reacción no permitida."),
});

function emptyCounts(): Record<ReactionKind, number> {
  return REACTION_KINDS.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {} as Record<ReactionKind, number>);
}

export async function getReactions(
  businessId: string,
  anonId: string | null,
): Promise<ReactionState> {
  const countsQuery = db
    .select({ kind: reactions.kind, count: sql<number>`count(*)::int` })
    .from(reactions)
    .where(eq(reactions.businessId, businessId))
    .groupBy(reactions.kind);

  const mineQuery = anonId
    ? db
        .select({ kind: reactions.kind })
        .from(reactions)
        .where(and(eq(reactions.businessId, businessId), eq(reactions.anonId, anonId)))
    : Promise.resolve([] as Array<{ kind: string }>);

  const [rows, mineRows] = await Promise.all([countsQuery, mineQuery]);

  const counts = emptyCounts();
  for (const r of rows) {
    if (isReactionKind(r.kind)) counts[r.kind] = r.count;
  }
  const mine: Partial<Record<ReactionKind, boolean>> = {};
  for (const r of mineRows) {
    if (isReactionKind(r.kind)) mine[r.kind] = true;
  }
  return { counts, mine };
}

export async function toggleReaction(
  businessId: string,
  kind: string,
): Promise<ReactionState | { ok: false; error: string }> {
  const parsed = ToggleInput.safeParse({ businessId, kind });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Entrada inválida." };
  }

  const anonId = await getOrCreateAnonId();
  const limit = rateLimit(`reaction:${anonId}`, 30, 60_000);
  if (!limit.ok) {
    return { ok: false, error: "Demasiadas reacciones. Probá en un rato." };
  }

  const [biz] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, parsed.data.businessId), eq(businesses.status, "active")))
    .limit(1);
  if (!biz) {
    return { ok: false, error: "Emprendimiento no disponible." };
  }

  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(
      and(
        eq(reactions.businessId, parsed.data.businessId),
        eq(reactions.kind, parsed.data.kind),
        eq(reactions.anonId, anonId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
  } else {
    try {
      await db
        .insert(reactions)
        .values({ businessId: parsed.data.businessId, kind: parsed.data.kind, anonId });
      await logEvent({
        type: "reaction.added",
        entityType: "businesses",
        entityId: parsed.data.businessId,
        metadata: { kind: parsed.data.kind },
      });
    } catch {
      // unique conflict por race condition: ignoramos
    }
  }

  return getReactions(parsed.data.businessId, anonId);
}
