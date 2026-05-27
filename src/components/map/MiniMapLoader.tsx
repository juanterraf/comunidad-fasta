"use client";

import dynamic from "next/dynamic";

const MiniMap = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
  ),
});

export { MiniMap };
