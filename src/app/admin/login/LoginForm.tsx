"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/actions/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, null);
  return (
    <form action={action} className="space-y-3">
      <Input
        type="email"
        name="email"
        placeholder="tu@mail"
        required
        autoComplete="username"
      />
      <Input
        type="password"
        name="password"
        placeholder="contraseña"
        required
        autoComplete="current-password"
      />
      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
