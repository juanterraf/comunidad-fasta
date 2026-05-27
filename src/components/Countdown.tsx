"use client";

import { useEffect, useState } from "react";

function parts(diffMs: number) {
  const s = Math.max(0, Math.floor(diffMs / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function Countdown({ to, accent }: { to: string; accent?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return <span className="text-sm tabular-nums text-[var(--color-muted)]">…</span>;
  }

  const diff = target - now;
  if (diff <= 0) {
    return <span className="text-sm text-[var(--color-muted)]">terminada</span>;
  }
  const { d, h, m, s } = parts(diff);
  const big = d > 0;
  return (
    <span
      className="font-mono text-sm font-semibold tabular-nums"
      style={accent ? { color: accent } : undefined}
    >
      {big ? `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`}
    </span>
  );
}
