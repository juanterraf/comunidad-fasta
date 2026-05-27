import { redirect } from "next/navigation";
import { getAdminSession } from "./auth";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.adminId || !session.email) {
    redirect("/admin/login");
  }
  return { adminId: session.adminId, email: session.email };
}
