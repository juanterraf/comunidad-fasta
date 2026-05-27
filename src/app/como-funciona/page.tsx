import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";

export default function ComoFuncionaPage() {
  return (
    <article>
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-14 md:pt-24 pb-14 md:pb-20">
          <p className="editorial-rule mb-10">Cómo funciona</p>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <h1 className="lg:col-span-8 display-xl text-5xl md:text-7xl lg:text-[96px]">
              Una vidriera con un filtro de pertenencia.
            </h1>
            <p className="lg:col-span-4 lg:pt-3 text-lg md:text-xl text-[var(--color-muted)] leading-relaxed">
              Antes de buscarlo afuera, fijate si lo hace alguien de la
              comunidad.
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer prominente */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-warm)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8">
          <Disclaimer />
        </div>
      </section>

      {/* Tres pasos del flujo */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12 md:mb-14">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-3">El flujo</p>
            <h2 className="font-display text-3xl md:text-4xl tracking-[-0.025em] leading-[1.05]">
              Tres pasos.
              <br />
              Sin trámites.
            </h2>
          </div>
          <p className="lg:col-span-7 lg:col-start-6 text-[var(--color-muted)] text-base md:text-lg leading-relaxed">
            No hay registro, no hay verificación de identidad, no hay reseñas.
            La confianza la aporta la comunidad: dos personas que ya están
            adentro confirman que te conocen.
          </p>
        </div>

        <ol className="border-t border-[var(--color-border)]">
          <Step
            n="01"
            title="Te sumás"
            body="Completás los datos de tu emprendimiento e indicás tres miembros validados de la comunidad que te conocen."
          />
          <Step
            n="02"
            title="Avisamos a los tres"
            body="Reciben un mail con un solo botón. No piden datos, no se loguean, no escriben nada. Un click."
          />
          <Step
            n="03"
            title="Dos confirman, salís"
            body="El emprendimiento queda visible en /explorar y te llega un mail con el link permanente y otro para editar."
          />
        </ol>
      </section>

      {/* Bloques qué es / qué no es / por qué */}
      <section className="bg-[var(--color-surface-warm)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <Block n="01" title="Qué es">
              Un directorio donde se concentran los emprendimientos, oficios y
              servicios que ofrecen las familias, docentes, egresados y
              miembros de la comunidad FASTA — Colegio Boisdron, Tucumán.
            </Block>
            <Block n="02" title="Qué no es">
              No es un marketplace, no hay transacciones, no hay comisiones, no
              hay calificaciones públicas. Es una vidriera de quienes
              pertenecen a la comunidad.
            </Block>
            <Block n="03" title="Por qué">
              Queremos que comprarle a alguien de la comunidad sea lo natural,
              no la excepción. Sin pedir nada gratis, sin donaciones — sólo
              vincular oferta y demanda que ya están dentro.
            </Block>
          </div>
        </div>
      </section>

      {/* CTAs finales */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <p className="eyebrow mb-3">Sumarte</p>
            <h2 className="font-display text-4xl md:text-6xl tracking-[-0.035em] leading-[0.98] mb-8">
              ¿Listo para sumar
              <br />
              <span className="text-[var(--color-accent)]">lo tuyo?</span>
            </h2>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="/sumarte"
                className="inline-flex items-center gap-2 h-12 px-6 bg-[var(--color-ink)] text-[var(--color-bg)] text-[15px] font-medium hover:bg-[var(--color-accent)] transition-colors"
              >
                Sumar mi emprendimiento
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/explorar"
                className="text-[15px] font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
              >
                Explorar primero
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 py-8 md:py-12 border-b border-[var(--color-border)]">
      <p className="md:col-span-2 font-display text-3xl md:text-4xl text-[var(--color-accent)] tracking-[-0.02em]">
        {n}
      </p>
      <h3 className="md:col-span-3 font-display text-2xl md:text-3xl tracking-[-0.025em] leading-tight">
        {title}
      </h3>
      <p className="md:col-span-7 text-[var(--color-ink-soft)] text-base md:text-lg leading-relaxed">
        {body}
      </p>
    </li>
  );
}

function Block({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.22em] uppercase font-medium text-[var(--color-subtle)] mb-3">
        {n}
      </p>
      <h3 className="font-display text-2xl tracking-[-0.02em] mb-4">{title}</h3>
      <p className="text-[var(--color-ink-soft)] text-[15px] md:text-base leading-relaxed">
        {children}
      </p>
    </div>
  );
}
