import { randomBytes } from "node:crypto";

export function newToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function inDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function inHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
