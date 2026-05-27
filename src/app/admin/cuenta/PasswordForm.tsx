"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeAdminPassword } from "@/actions/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changeAdminPassword, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
          Contraseña actual
        </label>
        <Input
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
          Nueva contraseña
        </label>
        <Input
          type="password"
          name="newPassword"
          required
          minLength={12}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
          Repetir nueva contraseña
        </label>
        <Input
          type="password"
          name="confirmPassword"
          required
          minLength={12}
          autoComplete="new-password"
        />
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-[var(--color-ink)]">Contraseña actualizada.</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
