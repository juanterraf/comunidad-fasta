"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateNeedNotes, updateNeedStatus } from "@/actions/needs";
import { NEED_STATUSES, NEED_STATUS_LABEL, type NeedStatus } from "@/config/needs";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export function NeedActions({
  id,
  initialStatus,
  initialNotes,
}: {
  id: string;
  initialStatus: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<NeedStatus>(initialStatus as NeedStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function changeStatus(next: NeedStatus) {
    setError(null);
    startTransition(async () => {
      const res = await updateNeedStatus(id, next);
      if (res.ok) {
        setStatus(next);
        setSavedAt(Date.now());
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function saveNotes() {
    setError(null);
    startTransition(async () => {
      const res = await updateNeedNotes(id, notes || null);
      if (res.ok) {
        setSavedAt(Date.now());
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="eyebrow mb-3">Estado</h2>
        <div className="flex flex-wrap gap-2">
          {NEED_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => changeStatus(s)}
              className={`text-xs font-medium px-3 h-9 rounded-full border transition-colors ${
                status === s
                  ? "bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)]"
                  : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] border-[var(--color-border)] hover:border-[var(--color-ink)]"
              } disabled:opacity-60`}
            >
              {NEED_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="eyebrow mb-3">Notas internas</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          rows={4}
          maxLength={4000}
          placeholder="Notas para la administración (no se muestran al usuario)."
        />
        <div className="flex items-center gap-3 mt-2">
          <Button type="button" size="sm" onClick={saveNotes} disabled={pending}>
            {pending ? "Guardando…" : "Guardar notas"}
          </Button>
          {savedAt ? (
            <span className="text-xs text-[var(--color-muted)]">Guardado.</span>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}
    </section>
  );
}
