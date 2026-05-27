"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { ErrorShell } from "@/components/ui/ErrorShell";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error:", error);
  }, [error]);

  return (
    <ErrorShell
      eyebrow="Algo salió mal"
      title="Disculpá."
      body={
        <>
          <p className="mb-3">
            Tuvimos un problema cargando esta página. Probá de nuevo en un rato;
            si sigue, avisanos.
          </p>
          {error.digest ? (
            <p className="text-xs text-[var(--color-subtle)] font-mono">
              ref: {error.digest}
            </p>
          ) : null}
        </>
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 h-12 px-6 bg-[var(--color-ink)] text-[var(--color-bg)] text-[15px] font-medium hover:bg-[var(--color-accent)] transition-colors"
          >
            <RotateCcw size={16} />
            Probar de nuevo
          </button>
          <Link
            href="/"
            className="text-[15px] font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
          >
            Volver al inicio
          </Link>
        </>
      }
    />
  );
}
