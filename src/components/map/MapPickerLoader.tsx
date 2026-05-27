"use client";

import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-sm text-[var(--color-muted)]">
      Cargando mapa…
    </div>
  ),
});

export { MapPicker };
