import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { communityNeeds, categories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import {
  searchByNeed,
  type MatchedResultSnapshot,
} from "@/services/needs/need-search";
import { whatsappHref } from "@/lib/contact";
import {
  NEED_STATUS_LABEL,
  NEED_URGENCY_LABEL,
  NEED_STATUSES,
  NEED_URGENCIES,
  type NeedStatus,
  type NeedUrgency,
} from "@/config/needs";
import { NeedActions } from "./NeedActions";

export const dynamic = "force-dynamic";

export default async function NeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [row] = await db
    .select({
      need: communityNeeds,
      categoryName: categories.name,
    })
    .from(communityNeeds)
    .leftJoin(categories, eq(communityNeeds.categoryHintId, categories.id))
    .where(eq(communityNeeds.id, id))
    .limit(1);

  if (!row) notFound();
  const need = row.need;

  const live = await searchByNeed({
    rawQuery: need.queryOriginal,
    zone: need.zone,
    categoryHintId: need.categoryHintId,
  });

  const statusLabel = (NEED_STATUSES as readonly string[]).includes(need.status)
    ? NEED_STATUS_LABEL[need.status as NeedStatus]
    : need.status;
  const urgencyLabel =
    need.urgency && (NEED_URGENCIES as readonly string[]).includes(need.urgency)
      ? NEED_URGENCY_LABEL[need.urgency as NeedUrgency]
      : need.urgency ?? null;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/necesidades"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={14} /> Volver
      </Link>

      <header>
        <p className="eyebrow mb-2">Necesidad #{need.id.slice(0, 8)}</p>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight mb-3">
          “{need.queryOriginal}”
        </h1>
        <p className="text-xs text-[var(--color-muted)]">
          Recibida el {new Date(need.createdAt).toLocaleString("es-AR")}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Block label="Estado">
          <span className="font-medium">{statusLabel}</span>
        </Block>
        <Block label="Zona">{need.zone ?? "—"}</Block>
        <Block label="Rubro sugerido">{row.categoryName ?? "—"}</Block>
        <Block label="Urgencia">{urgencyLabel ?? "—"}</Block>
        <Block label="Presupuesto">{need.budget ?? "—"}</Block>
        <Block label="Consultas ampliadas">
          {need.queryExpanded ? (
            <span className="font-mono text-xs leading-relaxed">{need.queryExpanded}</span>
          ) : (
            "—"
          )}
        </Block>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Contacto</h2>
        {need.consent ? (
          <div className="border border-[var(--color-border)] rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase text-[var(--color-muted)] mb-0.5">Nombre</p>
              <p>{need.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-[var(--color-muted)] mb-0.5">Mail</p>
              {need.email ? (
                <a className="underline" href={`mailto:${need.email}`}>
                  {need.email}
                </a>
              ) : (
                "—"
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-[var(--color-muted)] mb-0.5">WhatsApp</p>
              {whatsappHref(need.whatsapp) ? (
                <a
                  className="underline"
                  href={whatsappHref(need.whatsapp)!}
                  target="_blank"
                  rel="noreferrer"
                >
                  {need.whatsapp}
                </a>
              ) : (
                "—"
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)] border border-dashed border-[var(--color-border)] rounded-md p-4">
            La persona no marcó consentimiento. No guardamos datos personales.
          </p>
        )}
      </section>

      <NeedActions
        id={need.id}
        initialStatus={need.status}
        initialNotes={need.adminNotes ?? ""}
      />

      <section>
        <h2 className="eyebrow mb-3">Emprendimientos sugeridos ahora</h2>
        {live.results.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Sin coincidencias contra el estado actual de la base.
          </p>
        ) : (
          <ul className="space-y-2">
            {live.results.map((r) => (
              <li
                key={r.id}
                className="border border-[var(--color-border)] rounded-md p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/emprendimientos/${r.id}`}
                    className="font-medium hover:underline"
                  >
                    {r.name}
                  </Link>
                  <p className="text-xs text-[var(--color-muted)]">
                    {r.categoryName ?? "—"} · {r.neighborhood ?? "—"} · score {r.score}
                  </p>
                  <ul className="text-xs text-[var(--color-ink-soft)] mt-1 space-y-0.5">
                    {r.reasons.map((reason, i) => (
                      <li key={i}>· {reason}</li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/e/${r.slug}`}
                  target="_blank"
                  className="text-xs text-[var(--color-muted)] underline whitespace-nowrap"
                >
                  ver ficha →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="eyebrow mb-3">Resultados al momento de la consulta</h2>
        <SnapshotResults snapshot={need.matchedResults} />
      </section>
    </div>
  );
}

function SnapshotResults({ snapshot }: { snapshot: unknown }) {
  const list = (Array.isArray(snapshot) ? snapshot : []) as MatchedResultSnapshot[];
  if (list.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No se devolvieron resultados al momento de la consulta.
      </p>
    );
  }
  return (
    <ol className="text-sm space-y-1">
      {list.map((s) => (
        <li key={s.id} className="text-[var(--color-ink-soft)]">
          <span className="font-medium">{s.name}</span>{" "}
          <span className="text-xs text-[var(--color-muted)]">
            (score {s.score}, {s.categoryName ?? "sin rubro"})
          </span>
        </li>
      ))}
    </ol>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--color-border)] rounded-md p-3">
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
