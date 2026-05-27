"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { respondValidation } from "@/actions/validation";

export function ValidatorButtons({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | "approved" | "recorded">(null);

  async function pick(decision: "yes" | "no") {
    setBusy(decision);
    setError(null);
    const res = await respondValidation(token, decision);
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.outcome === "already") {
      setDone("recorded");
      router.refresh();
      return;
    }
    setDone(res.outcome === "approved" ? "approved" : "recorded");
  }

  if (done) {
    return (
      <div className="text-center py-8 px-5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-accent)]/12 text-[var(--color-accent)] mb-3">
          <Check size={22} strokeWidth={2.5} />
        </div>
        <p className="font-display text-xl mb-1">
          {done === "approved"
            ? "Gracias. Con tu confirmación ya sale al aire."
            : "Gracias por tu respuesta."}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          Listo. No tenés que hacer nada más.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => pick("yes")}
        disabled={busy !== null}
        className="w-full h-14 rounded-full bg-[var(--color-ink)] text-[var(--color-bg)] font-medium text-base disabled:opacity-50 hover:bg-[var(--color-ink-soft)] transition-colors inline-flex items-center justify-center gap-2"
      >
        <Check size={18} />
        {busy === "yes" ? "Guardando…" : "Sí, lo/la conozco"}
      </button>
      <button
        type="button"
        onClick={() => pick("no")}
        disabled={busy !== null}
        className="w-full h-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-ink)] text-base disabled:opacity-50 hover:border-[var(--color-ink)] transition-colors inline-flex items-center justify-center gap-2"
      >
        <X size={18} />
        {busy === "no" ? "Guardando…" : "No lo/la conozco"}
      </button>
      {error ? <p className="text-sm text-[var(--color-accent)] text-center">{error}</p> : null}
    </div>
  );
}
