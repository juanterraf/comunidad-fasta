import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

const password = process.env.SESSION_PASSWORD ?? "";
if (!password || password.length < 32) {
  console.warn(
    "[auth] SESSION_PASSWORD is missing or shorter than 32 chars. Iron-session will throw.",
  );
}

const baseOpts = {
  password,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

export type AdminSession = {
  adminId?: string;
  email?: string;
};

export type OwnerSession = {
  businessId?: string;
  email?: string;
  issuedAt?: number;
};

const adminOpts: SessionOptions = {
  ...baseOpts,
  cookieName: process.env.ADMIN_SESSION_COOKIE_NAME || "cf_admin",
};

const ownerOpts: SessionOptions = {
  ...baseOpts,
  cookieName: process.env.OWNER_SESSION_COOKIE_NAME || "cf_owner",
  cookieOptions: {
    ...baseOpts.cookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getAdminSession() {
  const store = await cookies();
  return getIronSession<AdminSession>(store, adminOpts);
}

export async function getOwnerSession() {
  const store = await cookies();
  return getIronSession<OwnerSession>(store, ownerOpts);
}
