import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session.adminId) redirect("/admin");
  return (
    <div className="max-w-sm mx-auto px-4 pt-16 pb-12">
      <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-muted)] mb-4">
        Admin
      </p>
      <h1 className="font-serif text-3xl mb-6">Entrar</h1>
      <LoginForm />
    </div>
  );
}
