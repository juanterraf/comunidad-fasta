/**
 * Backfill: vincula businesses huérfanos (ownerFamilyId NULL) con su
 * family por email. Si no existe family para ese email, la crea con
 * validated=false y role='familia' por default.
 *
 * Idempotente: si ya está vinculado, no toca nada.
 *
 * Uso: pnpm backfill:owner-family
 */
import "@/db/_env";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { businesses, families } from "@/db/schema";

async function main() {
  const orphans = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      ownerEmail: businesses.ownerEmail,
    })
    .from(businesses)
    .where(isNull(businesses.ownerFamilyId));

  console.log(`→ huérfanos detectados: ${orphans.length}`);

  for (const b of orphans) {
    const email = b.ownerEmail.trim().toLowerCase();
    const [existing] = await db
      .select({ id: families.id })
      .from(families)
      .where(eq(families.email, email))
      .limit(1);

    let familyId: string;
    if (existing) {
      familyId = existing.id;
      console.log(`  ✓ ${b.name} → familia existente (${email})`);
    } else {
      const fallbackName = email.split("@")[0] ?? email;
      const [created] = await db
        .insert(families)
        .values({
          email,
          displayName: fallbackName,
          role: "familia",
          validated: false,
        })
        .returning({ id: families.id });
      familyId = created.id;
      console.log(`  + ${b.name} → familia creada (${email})`);
    }

    await db
      .update(businesses)
      .set({ ownerFamilyId: familyId })
      .where(eq(businesses.id, b.id));
  }

  console.log("✓ backfill terminado");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
