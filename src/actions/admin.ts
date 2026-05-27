"use server";

import { z } from "zod";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { logEvent } from "@/lib/log";
import { clientIp, rateLimit, retryMessage } from "@/lib/rate-limit";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function loginAdmin(_prev: unknown, formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Mail y contraseña requeridos." };
  }
  const ip = await clientIp();
  const ipLimit = rateLimit(`admin-login:ip:${ip}`, 10, 15 * 60_000);
  if (!ipLimit.ok) {
    return { ok: false as const, error: `Demasiados intentos. ${retryMessage(ipLimit.retryAfterMs)}` };
  }
  const emailLimit = rateLimit(`admin-login:email:${parsed.data.email}`, 5, 15 * 60_000);
  if (!emailLimit.ok) {
    return { ok: false as const, error: `Demasiados intentos. ${retryMessage(emailLimit.retryAfterMs)}` };
  }
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, parsed.data.email))
    .limit(1);
  if (!user) {
    return { ok: false as const, error: "Credenciales inválidas." };
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { ok: false as const, error: "Credenciales inválidas." };
  }
  const session = await getAdminSession();
  session.adminId = user.id;
  session.email = user.email;
  await session.save();
  await logEvent({
    type: "admin.login",
    actorEmail: user.email,
    entityType: "admin_users",
    entityId: user.id,
  });
  redirect("/admin");
}

export async function logoutAdmin() {
  const session = await getAdminSession();
  const email = session.email;
  session.destroy();
  if (email) {
    await logEvent({ type: "admin.logout", actorEmail: email });
  }
  redirect("/admin/login");
}

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual."),
    newPassword: z
      .string()
      .min(12, "Usá al menos 12 caracteres.")
      .max(200, "Máximo 200 caracteres."),
    confirmPassword: z.string().min(1, "Confirmá la contraseña nueva."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "La nueva contraseña tiene que ser distinta de la actual.",
    path: ["newPassword"],
  });

export async function changeAdminPassword(_prev: unknown, fd: FormData) {
  const admin = await requireAdmin();

  const parsed = PasswordSchema.safeParse({
    currentPassword: fd.get("currentPassword"),
    newPassword: fd.get("newPassword"),
    confirmPassword: fd.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const limit = rateLimit(`admin-password:${admin.adminId}`, 5, 15 * 60_000);
  if (!limit.ok) {
    return { ok: false as const, error: `Demasiados intentos. ${retryMessage(limit.retryAfterMs)}` };
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, admin.adminId))
    .limit(1);
  if (!user) {
    return { ok: false as const, error: "No encontramos tu cuenta." };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    await logEvent({
      type: "admin.password_change_failed",
      actorEmail: user.email,
      entityType: "admin_users",
      entityId: user.id,
    });
    return { ok: false as const, error: "La contraseña actual no coincide." };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(adminUsers).set({ passwordHash: newHash }).where(eq(adminUsers.id, user.id));

  await logEvent({
    type: "admin.password_changed",
    actorEmail: user.email,
    entityType: "admin_users",
    entityId: user.id,
  });
  return { ok: true as const };
}
