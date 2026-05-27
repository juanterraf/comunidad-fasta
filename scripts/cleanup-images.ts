import "../src/db/_env";

import { readdir } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/db";
import { businesses } from "../src/db/schema";
import { deleteImage } from "../src/lib/images";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function root(): string {
  return process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
}

function businessDir(): string {
  return path.join(root(), "businesses");
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");

  let files: string[];
  try {
    files = await readdir(businessDir());
  } catch {
    console.log("→ no hay carpeta de imágenes todavía. Nada que limpiar.");
    process.exit(0);
  }

  const ids = new Set<string>();
  for (const f of files) {
    const m = f.match(/^([0-9a-f-]{36})-(orig|card|thumb)\.webp$/i);
    if (m && UUID_RE.test(m[1])) {
      ids.add(m[1].toLowerCase());
    }
  }

  const rows = await db.select({ id: businesses.id }).from(businesses);
  const known = new Set(rows.map((r) => r.id.toLowerCase()));

  const orphans = [...ids].filter((id) => !known.has(id));

  console.log(`→ archivos analizados: ${files.length}`);
  console.log(`→ businesses en DB: ${known.size}`);
  console.log(`→ huérfanos detectados: ${orphans.length}`);

  if (orphans.length === 0) {
    process.exit(0);
  }

  if (dryRun) {
    for (const id of orphans) console.log(`  · ${id} (dry-run)`);
    process.exit(0);
  }

  for (const id of orphans) {
    await deleteImage(id);
    console.log(`  ✓ borrado ${id}`);
  }
  console.log("✓ cleanup terminado");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
