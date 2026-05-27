import { NextResponse } from "next/server";
import { readImage, type Size } from "@/lib/images";

const VALID = new Set<Size>(["orig", "card", "thumb"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; size: string }> },
) {
  const { id, size } = await params;
  if (!UUID_RE.test(id) || !VALID.has(size as Size)) {
    return new NextResponse("not found", { status: 404 });
  }
  const buf = await readImage(id, size as Size);
  if (!buf) {
    return new NextResponse("not found", { status: 404 });
  }
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
}
