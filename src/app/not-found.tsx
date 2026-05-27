import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ErrorShell } from "@/components/ui/ErrorShell";

export default function NotFound() {
  return (
    <ErrorShell
      eyebrow="Página no encontrada"
      title="404."
      body="La página que buscás no existe, se mudó, o quizá el link estaba mal escrito."
      actions={
        <>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-12 px-6 bg-[var(--color-ink)] text-[var(--color-bg)] text-[15px] font-medium hover:bg-[var(--color-accent)] transition-colors"
          >
            Volver al inicio
            <ArrowRight size={17} />
          </Link>
          <Link
            href="/explorar"
            className="text-[15px] font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
          >
            Explorar la comunidad
          </Link>
        </>
      }
    />
  );
}
