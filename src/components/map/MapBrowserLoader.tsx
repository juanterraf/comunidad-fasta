"use client";

import dynamic from "next/dynamic";

const MapBrowser = dynamic(() => import("./MapBrowser"), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] min-h-[420px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-sm text-[var(--color-muted)]">
      Cargando mapa…
    </div>
  ),
});

export { MapBrowser };
