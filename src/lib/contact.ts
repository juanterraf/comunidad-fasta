export function whatsappHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function instagramHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const handle = raw.replace(/^@/, "").trim();
  return handle || null;
}

export function instagramHref(raw: string | null | undefined): string | null {
  const handle = instagramHandle(raw);
  return handle ? `https://instagram.com/${handle}` : null;
}
