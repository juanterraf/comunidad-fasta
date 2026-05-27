import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

const COOKIE_NAME = "cf_anon";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getOrCreateAnonId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME);
  if (existing?.value && existing.value.length >= 16) {
    return existing.value;
  }
  const id = randomBytes(18).toString("base64url");
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}

export async function readAnonId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}
