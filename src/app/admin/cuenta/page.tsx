import { requireAdmin } from "@/lib/admin-guard";
import { PasswordForm } from "./PasswordForm";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const admin = await requireAdmin();
  return (
    <div className="max-w-md">
      <h1 className="font-serif text-3xl mb-2">Cuenta</h1>
      <p className="text-sm text-[var(--color-muted)] mb-6">
        Sesión iniciada como <strong>{admin.email}</strong>.
      </p>

      <section className="border border-[var(--color-border)] rounded-md p-5">
        <h2 className="font-serif text-xl mb-1">Cambiar contraseña</h2>
        <p className="text-sm text-[var(--color-muted)] mb-4">
          Mínimo 12 caracteres. Vas a seguir con la sesión abierta.
        </p>
        <PasswordForm />
      </section>
    </div>
  );
}
