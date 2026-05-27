import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="max-w-2xl mx-auto px-5 md:px-8 pt-20 md:pt-32 pb-20 text-center">
      <p className="editorial-rule inline-flex mb-6">Página no encontrada</p>
      <h1 className="display-xl text-5xl sm:text-6xl md:text-7xl mb-6">404.</h1>
      <p className="text-[var(--color-muted)] text-lg md:text-xl leading-relaxed mb-12 max-w-lg mx-auto">
        La página que buscás no existe, se mudó, o quizá el link estaba mal
        escrito.
      </p>
      <div className="flex flex-wrap justify-center items-center gap-5">
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
      </div>
    </section>
  );
}
