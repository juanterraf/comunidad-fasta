"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reactions } from "@/db/schema";
import { getOrCreateAnonId } from "@/lib/anon";
import { isReactionKind, REACTION_KINDS, type ReactionKind } from "@/lib/reactions";
import { logEvent } from "@/lib/log";

export type ReactionState = {
  counts: Record<ReactionKind, number>;
  mine: Partial<Record<ReactionKind, boolean>>;
};

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
  const counts = emptyCounts();
  const rows = await db
    .select({ kind: reactions.kind, count: sql<number>`count(*)::int` })
    .from(reactions)
    .where(eq(reactions.businessId, businessId))
    .groupBy(reactions.kind);
  for (const r of rows) {
    if (isReactionKind(r.kind)) counts[r.kind] = r.count;
  }
  const mine: Partial<Record<ReactionKind, boolean>> = {};
  if (anonId) {
    const mineRows = await db
      .select({ kind: reactions.kind })
      .from(reactions)
      .where(and(eq(reactions.businessId, businessId), eq(reactions.anonId, anonId)));
    for (const r of mineRows) {
      if (isReactionKind(r.kind)) mine[r.kind] = true;
    }
  }
  return { counts, mine };
}

export async function toggleReaction(
  businessId: string,
  kind: string,
): Promise<ReactionState | { ok: false; error: string }> {
  if (!isReactionKind(kind)) {
    return { ok: false, error: "Reacción no permitida." };
  }
  const anonId = await getOrCreateAnonId();
  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(
      and(
        eq(reactions.businessId, businessId),
        eq(reactions.kind, kind),
        eq(reactions.anonId, anonId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
  } else {
    try {
      await db.insert(reactions).values({ businessId, kind, anonId });
      await logEvent({
        type: "reaction.added",
        entityType: "businesses",
        entityId: businessId,
        metadata: { kind },
      });
    } catch {
      // unique conflict por race condition: ignoramos
    }
  }

  return getReactions(businessId, anonId);
}
