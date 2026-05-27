import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Truck, Wifi, CalendarCheck, BookOpen } from "lucide-react";
import { db } from "@/db";
import { businesses, categories } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { WhatsappIcon, InstagramIcon, GlobeIcon } from "@/components/icons/Brand";
import { ReactionBar } from "@/components/ReactionBar";
import { MiniMap } from "@/components/map/MiniMapLoader";
import { getReactions } from "@/actions/reactions";
import { readAnonId } from "@/lib/anon";
import { instagramHandle, instagramHref, whatsappHref } from "@/lib/contact";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const getBusinessBySlug = cache(async function getBusinessBySlug(slug: string) {
  const rows = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      name: businesses.name,
      description: businesses.description,
      address: businesses.address,
      neighborhood: businesses.neighborhood,
      photoFilename: businesses.photoFilename,
      whatsapp: businesses.whatsapp,
      instagram: businesses.instagram,
      website: businesses.website,
      delivers: businesses.delivers,
      onlineOnly: businesses.onlineOnly,
      byAppointment: businesses.byAppointment,
      tags: businesses.tags,
      lat: businesses.lat,
      lng: businesses.lng,
      story: businesses.story,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(eq(businesses.slug, slug), eq(businesses.status, "active")))
    .limit(1);
  return rows[0] ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBusinessBySlug(slug);
  if (!b) return { title: "No encontrado", robots: { index: false, follow: false } };

  const description = (b.description ?? "Emprendimiento de la comunidad FASTA.").slice(
    0,
    200,
  );
  const ogImage = b.photoFilename
    ? [
        {
          url: `/api/image/${b.id}/orig`,
          alt: b.name,
          width: 1600,
          height: 1200,
        },
      ]
    : undefined;

  return {
    title: b.name,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "article",
      siteName: "Comunidad FASTA",
      locale: "es_AR",
      url: `/e/${b.slug}`,
      title: b.name,
      description,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: b.name,
      description,
      images: b.photoFilename ? [`/api/image/${b.id}/orig`] : undefined,
    },
  };
}

export default async function FichaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBusinessBySlug(slug);
  if (!b) notFound();

  const anonId = await readAnonId();
  const reactions = await getReactions(b.id, anonId);

  const attrs: Array<{ icon: React.ReactNode; label: string }> = [];
  if (b.delivers) attrs.push({ icon: <Truck size={13} />, label: "Envía a domicilio" });
  if (b.onlineOnly) attrs.push({ icon: <Wifi size={13} />, label: "Solo online" });
  if (b.byAppointment) attrs.push({ icon: <CalendarCheck size={13} />, label: "Con cita previa" });

  return (
    <article>
      {/* HERO de la ficha — imagen dominante + bloque editorial */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-6 md:pt-10 pb-12 md:pb-20">
          <Link
            href="/explorar"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] mb-8 md:mb-10"
          >
            <ArrowLeft size={14} /> Volver a explorar
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            {/* Imagen dominante */}
            <div className="lg:col-span-7">
              <div className="aspect-[4/5] md:aspect-[4/3] bg-[var(--color-border)] overflow-hidden">
                {b.photoFilename ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/image/${b.id}/orig`}
                    alt={b.name}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
            </div>

            {/* Info principal */}
            <div className="lg:col-span-5 flex flex-col">
              {b.categoryName ? (
                <Link
                  href={`/explorar?cat=${b.categorySlug}`}
                  className="text-[10px] tracking-[0.22em] uppercase font-medium text-[var(--color-accent)] mb-4 inline-block hover:underline w-fit"
                >
                  {b.categoryName}
                </Link>
              ) : null}

              <h1 className="display-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 break-words">
                {b.name}
              </h1>

              {(b.neighborhood || b.address) ? (
                <p className="flex items-start gap-2 text-[var(--color-muted)] text-[15px] mb-8">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    {b.neighborhood}
                    {b.neighborhood && b.address ? " · " : ""}
                    {b.address}
                  </span>
                </p>
              ) : null}

              {b.description ? (
                <p className="text-[17px] md:text-[19px] text-[var(--color-ink-soft)] leading-[1.55] mb-10">
                  {b.description}
                </p>
              ) : null}

              {/* Atributos como dato editorial (no pills coloridas) */}
              {attrs.length > 0 ? (
                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-10 pb-8 border-b border-[var(--color-border)]">
                  {attrs.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.15em] font-medium text-[var(--color-muted)]"
                    >
                      {a.icon}
                      {a.label}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* CTAs de contacto */}
              <div className="space-y-3">
                {whatsappHref(b.whatsapp) ? (
                  <a
                    href={whatsappHref(b.whatsapp)!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 h-14 px-6 bg-[var(--color-success)] text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    <span className="flex items-center gap-3">
                      <WhatsappIcon className="w-5 h-5" />
                      Escribir por WhatsApp
                    </span>
                    <span className="text-xs opacity-80 tracking-wide">
                      {b.whatsapp!.replace(/^(\d{2,3})(\d{2,3})(\d+)$/, "+$1 $2 $3")}
                    </span>
                  </a>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {instagramHandle(b.instagram) ? (
                    <a
                      href={instagramHref(b.instagram)!}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 h-12 px-5 border border-[var(--color-border-strong)] text-[var(--color-ink)] text-[14.5px] font-medium hover:border-[var(--color-ink)] transition-colors"
                    >
                      <InstagramIcon className="w-4 h-4" />
                      @{instagramHandle(b.instagram)}
                    </a>
                  ) : null}
                  {b.website ? (
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 h-12 px-5 border border-[var(--color-border-strong)] text-[var(--color-ink)] text-[14.5px] font-medium hover:border-[var(--color-ink)] transition-colors"
                    >
                      <GlobeIcon className="w-4 h-4 text-[var(--color-ink-soft)]" />
                      Sitio web
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Tags editoriales */}
              {b.tags && b.tags.length > 0 ? (
                <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
                  <p className="eyebrow mb-3">Etiquetas</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {b.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[14px] text-[var(--color-ink-soft)] before:content-['#'] before:text-[var(--color-subtle)] before:mr-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* HISTORIA — editorial con fondo cálido */}
      {b.story ? (
        <section className="bg-[var(--color-surface-warm)] border-b border-[var(--color-border)]">
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-20 md:py-32">
            <p className="flex items-center gap-2 eyebrow mb-6">
              <BookOpen size={13} /> Su historia
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl tracking-[-0.035em] leading-[1.02] md:leading-[0.98] mb-10 md:mb-12">
              Cómo empezó todo.
            </h2>
            <div className="text-[18px] md:text-[20px] leading-[1.7] text-[var(--color-ink-soft)] space-y-6 whitespace-pre-wrap font-light">
              {b.story}
            </div>
          </div>
        </section>
      ) : null}

      {/* MAPA */}
      {b.lat !== null && b.lng !== null && !b.onlineOnly ? (
        <section className="border-b border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
            <div className="flex items-end justify-between gap-3 mb-8 flex-wrap">
              <div>
                <p className="eyebrow mb-2">Ubicación</p>
                <h2 className="font-display text-3xl md:text-4xl tracking-[-0.025em]">
                  Dónde encontrarlo.
                </h2>
              </div>
              <Link
                href={`https://www.google.com/maps?q=${b.lat},${b.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
              >
                Cómo llegar →
              </Link>
            </div>
            <MiniMap lat={b.lat} lng={b.lng} />
          </div>
        </section>
      ) : null}

      {/* REACCIONES — buenas vibras de la comunidad */}
      <section>
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="eyebrow mb-3">De la comunidad</p>
              <h2 className="font-display text-3xl md:text-4xl tracking-[-0.025em] leading-tight mb-3">
                Dejá una buena vibra.
              </h2>
              <p className="text-[var(--color-muted)] text-[15px] leading-relaxed">
                Si te gusta lo que hacen, reconocelo y compartilo.
              </p>
            </div>
            <div className="lg:col-span-7 lg:border-l lg:border-[var(--color-border)] lg:pl-12">
              <ReactionBar businessId={b.id} initial={reactions} />
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
