import { mkdir, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const SIZES = {
  orig: { width: 1400, quality: 75 },
  card: { width: 800, height: 600, quality: 72 },
  thumb: { width: 200, height: 150, quality: 68 },
} as const;
export type Size = keyof typeof SIZES;

// effort 6 = compresión máxima (encode ~2-3x más lento que default 4,
// pero el upload es one-shot y la ganancia en bytes vale).
// smartSubsample mejora bordes nítidos (texto/líneas) con costo ~0.
const WEBP_OPTS = { effort: 6, smartSubsample: true } as const;

function root(): string {
  return process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
}

function businessDir(): string {
  return path.join(root(), "businesses");
}

export function filenameFor(id: string, size: Size): string {
  return `${id}-${size}.webp`;
}

export function pathFor(id: string, size: Size): string {
  return path.join(businessDir(), filenameFor(id, size));
}

export async function processAndStore(
  id: string,
  buffer: ArrayBuffer | Buffer,
): Promise<{ baseFilename: string }> {
  await mkdir(businessDir(), { recursive: true });
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  await Promise.all([
    sharp(buf, { failOn: "none" })
      .rotate()
      .resize(SIZES.orig.width, undefined, { withoutEnlargement: true, fit: "inside" })
      .webp({ quality: SIZES.orig.quality, ...WEBP_OPTS })
      .toFile(pathFor(id, "orig")),
    sharp(buf, { failOn: "none" })
      .rotate()
      .resize(SIZES.card.width, SIZES.card.height, { fit: "cover", position: "centre" })
      .webp({ quality: SIZES.card.quality, ...WEBP_OPTS })
      .toFile(pathFor(id, "card")),
    sharp(buf, { failOn: "none" })
      .rotate()
      .resize(SIZES.thumb.width, SIZES.thumb.height, { fit: "cover", position: "centre" })
      .webp({ quality: SIZES.thumb.quality, ...WEBP_OPTS })
      .toFile(pathFor(id, "thumb")),
  ]);

  return { baseFilename: `${id}.webp` };
}

export async function readImage(id: string, size: Size): Promise<Buffer | null> {
  try {
    const p = pathFor(id, size);
    await stat(p);
    return await readFile(p);
  } catch {
    return null;
  }
}

export async function deleteImage(id: string): Promise<void> {
  for (const size of ["orig", "card", "thumb"] as const) {
    try {
      await unlink(pathFor(id, size));
    } catch {
      // ignore — file may not exist
    }
  }
}

export async function writePlaceholder(id: string, color: string): Promise<void> {
  await mkdir(businessDir(), { recursive: true });
  for (const size of ["orig", "card", "thumb"] as const) {
    const { width, height } = SIZES[size] as { width: number; height?: number };
    const h = height ?? Math.round(width * 0.75);
    await sharp({
      create: {
        width,
        height: h,
        channels: 3,
        background: color,
      },
    })
      .webp({ quality: 75 })
      .toFile(pathFor(id, size));
  }
}
