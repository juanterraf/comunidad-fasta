import { db } from "@/db";
import { events } from "@/db/schema";

export type EventInput = {
  type: string;
  actorEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logEvent(e: EventInput): Promise<void> {
  try {
    await db.insert(events).values({
      type: e.type,
      actorEmail: e.actorEmail ?? null,
      entityType: e.entityType ?? null,
      entityId: e.entityId ?? null,
      metadata: (e.metadata ?? null) as unknown as never,
    });
  } catch (err) {
    console.error("[log] failed:", e.type, err);
  }
}
