"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleReaction, type ReactionState } from "@/actions/reactions";
import {
  REACTION_KINDS,
  REACTION_META,
  type ReactionKind,
} from "@/lib/reactions";

type Props = {
  businessId: string;
  initial: ReactionState;
};

export function ReactionBar({ businessId, initial }: Props) {
  const [state, setState] = useState<ReactionState>(initial);
  const [optimisticState, applyOptimistic] = useOptimistic(
    state,
    (current, kind: ReactionKind) => {
      const mineNow = !current.mine[kind];
      const delta = mineNow ? 1 : -1;
      return {
        counts: { ...current.counts, [kind]: current.counts[kind] + delta },
        mine: { ...current.mine, [kind]: mineNow },
      };
    },
  );
  const [pending, startTransition] = useTransition();

  function onClick(kind: ReactionKind) {
    startTransition(async () => {
      applyOptimistic(kind);
      const res = await toggleReaction(businessId, kind);
      if ("ok" in res && res.ok === false) return;
      setState(res as ReactionState);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_KINDS.map((k) => {
        const count = optimisticState.counts[k];
        const isMine = optimisticState.mine[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onClick(k)}
            disabled={pending}
            title={REACTION_META[k].label}
            aria-pressed={!!isMine}
            className={`inline-flex items-center gap-2 px-4 h-11 border text-sm transition-colors disabled:opacity-60 ${
              isMine
                ? "bg-[var(--color-accent-soft)] border-[var(--color-accent)] text-[var(--color-accent)]"
                : "bg-[var(--color-surface)] border-[var(--color-border-strong)] hover:border-[var(--color-ink)] text-[var(--color-ink-soft)]"
            }`}
          >
            <span className="text-lg leading-none">{REACTION_META[k].emoji}</span>
            {count > 0 ? (
              <span className="text-xs font-semibold tabular-nums">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
