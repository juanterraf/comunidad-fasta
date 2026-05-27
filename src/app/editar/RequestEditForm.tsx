"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { requestEditLink } from "@/actions/owner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RequestEditForm() {
  const [state, action, pending] = useActionState(requestEditLink, null);

  if (state?.ok) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-secondary)]/12 text-[var(--color-secondary)] mb-3">
          <Mail size={18} />
        </div>
        <p className="font-display text-lg mb-1">Listo.</p>
        <p className="text-[var(--color-muted)] text-[15px] leading-relaxed">
          Si ese mail tiene un emprendimiento publicado, te llega un link en los
          próximos minutos. Es válido por 24 horas.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <Input
        type="email"
        name="email"
        required
        placeholder="tu@mail"
        autoComplete="email"
      />
      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Enviando…" : "Mandame el link"}
      </Button>
    </form>
  );
}
