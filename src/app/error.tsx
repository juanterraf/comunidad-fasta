"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

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
    <section className="max-w-2xl mx-auto px-5 md:px-8 pt-20 md:pt-32 pb-20 text-center">
      <p className="editorial-rule inline-flex mb-6">Algo salió mal</p>
      <h1 className="display-xl text-5xl sm:text-6xl md:text-7xl mb-6">
        Disculpá.
      </h1>
      <p className="text-[var(--color-muted)] text-lg md:text-xl leading-relaxed mb-3 max-w-lg mx-auto">
        Tuvimos un problema cargando esta página. Probá de nuevo en un rato; si
        sigue, avisanos.
      </p>
      {error.digest ? (
        <p className="text-xs text-[var(--color-subtle)] mb-10 font-mono">
          ref: {error.digest}
        </p>
      ) : (
        <div className="mb-10" />
      )}
      <div className="flex flex-wrap justify-center items-center gap-5">
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
      </div>
    </section>
  );
}
