import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, MapPin, Search } from "lucide-react";
import { db } from "@/db";
import { communityNeeds } from "@/db/schema";
import { searchByNeed } from "@/services/needs/need-search";
import { Tag } from "@/components/ui/Tag";
import { WhatsappIcon, InstagramIcon } from "@/components/icons/Brand";
import { instagramHandle, instagramHref, whatsappHref } from "@/lib/contact";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Resultados — Comunidad FASTA",
    robots: { index: false, follow: false },
  };
}

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [need] = await db
    .select()
    .from(communityNeeds)
    .where(eq(communityNeeds.id, id))
    .limit(1);

  if (!need) notFound();

  // El snapshot persistido en `matchedResults` se reserva para auditoría
  // (el admin lo ve tal como se mostró). Para el usuario re-ejecutamos la
  // búsqueda en cada visita: garantiza datos frescos (fotos, contacto) y
  // refleja emprendimientos nuevos que pudieron sumarse.
  const search = await searchByNeed({
    rawQuery: need.queryOriginal,
    zone: need.zone,
    categoryHintId: need.categoryHintId,
  });

  const results = search.results;
  const hasResults = results.length > 0;
  const matchedTriggers = search.expanded.matched.map((m) => m.trigger);

  return (
    <section className="max-w-6xl mx-auto px-5 md:px-8 pt-8 md:pt-12 pb-20 md:pb-24">
      <Link
        href="/necesito"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] mb-8"
      >
        <ArrowLeft size={14} /> Buscar otra cosa
      </Link>

      <header className="mb-12 md:mb-14 max-w-4xl">
        <p className="editorial-rule mb-6">Resultados</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-[-0.03em] leading-[1.02] mb-6">
          Buscaste{" "}
          <span className="text-[var(--color-accent)]">“{need.queryOriginal}”</span>
        </h1>
        <p className="text-[var(--color-muted)] text-base md:text-lg leading-relaxed">
          {hasResults
            ? `${results.length} ${
                results.length === 1 ? "emprendimiento podría" : "emprendimientos podrían"
              } ayudarte. Ordenados por relevancia.`
            : "No encontramos coincidencias claras todavía."}
        </p>
        {matchedTriggers.length > 0 ? (
          <p className="text-xs text-[var(--color-subtle)] mt-4">
            Ampliamos la búsqueda con contextos comunitarios:{" "}
            <em className="not-italic font-medium text-[var(--color-ink-soft)]">
              {matchedTriggers.join(", ")}
            </em>
            .
          </p>
        ) : null}
      </header>

      {hasResults ? (
        <ul className="space-y-4">
          {results.map((r) => (
            <li
              key={r.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-ink)] transition-colors"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-0">
                <div className="aspect-[4/3] sm:aspect-auto bg-[var(--color-border)] relative">
                  {r.photoFilename ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/image/${r.id}/card`}
                      alt={r.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div>
                      {r.categoryName ? (
                        <Tag variant="default">{r.categoryName}</Tag>
                      ) : null}
                      <h2 className="font-display text-xl md:text-2xl tracking-tight mt-2">
                        <Link
                          href={`/e/${r.slug}`}
                          className="hover:text-[var(--color-accent)]"
                        >
                          {r.name}
                        </Link>
                      </h2>
                    </div>
                    {r.neighborhood ? (
                      <p className="flex items-center gap-1 text-xs text-[var(--color-subtle)] pt-1">
                        <MapPin size={12} /> {r.neighborhood}
                      </p>
                    ) : null}
                  </div>

                  {r.description ? (
                    <p className="text-sm text-[var(--color-ink-soft)] clamp-2 mb-3">
                      {r.description}
                    </p>
                  ) : null}

                  {r.reasons.length > 0 ? (
                    <ul className="text-xs text-[var(--color-muted)] mb-4 space-y-0.5">
                      {r.reasons.map((reason, i) => (
                        <li key={i}>· {reason}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {whatsappHref(r.whatsapp) ? (
                      <a
                        href={whatsappHref(r.whatsapp)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#25D366] text-white text-xs font-medium hover:bg-[#1ebe57] transition-colors"
                      >
                        <WhatsappIcon className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    ) : null}
                    {instagramHandle(r.instagram) ? (
                      <a
                        href={instagramHref(r.instagram)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-xs font-medium hover:border-[var(--color-ink)] transition-colors"
                      >
                        <InstagramIcon className="w-3.5 h-3.5" /> Instagram
                      </a>
                    ) : null}
                    <Link
                      href={`/e/${r.slug}`}
                      className="inline-flex items-center h-9 px-3.5 rounded-full bg-[var(--color-ink)] text-[var(--color-bg)] text-xs font-medium hover:bg-[var(--color-ink-soft)] transition-colors"
                    >
                      Ver más →
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border border-[var(--color-border)] py-20 md:py-28 px-5 text-center">
          <div className="flex justify-center mb-5">
            <Search size={22} className="text-[var(--color-ink-soft)]" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl tracking-[-0.025em] mb-4">
            Todavía no encontramos lo que buscás.
          </h2>
          <p className="text-[var(--color-muted)] max-w-md mx-auto mb-8 leading-relaxed">
            Tu pedido quedó registrado para que la administración lo derive o
            para detectar nuevos servicios que la comunidad podría sumar.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-5">
            <Link
              href="/necesito"
              className="inline-flex items-center h-11 px-5 bg-[var(--color-ink)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)] transition-colors"
            >
              Probar otra búsqueda
            </Link>
            <Link
              href="/explorar"
              className="text-sm font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
            >
              Explorar todo
            </Link>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--color-subtle)] mt-10 leading-relaxed max-w-2xl">
        Estos resultados son sugerencias automáticas según lo que escribiste y
        el contexto que la comunidad fue cargando. Si algo no encaja, contanos
        de nuevo con más detalle.
      </p>
    </section>
  );
}
