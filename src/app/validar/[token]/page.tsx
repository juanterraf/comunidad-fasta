import { MapPin } from "lucide-react";
import { inspectValidation } from "@/actions/validation";
import { ValidatorButtons } from "./ValidatorButtons";

export const dynamic = "force-dynamic";

export default async function ValidarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await inspectValidation(token);

  if (info.status === "not_found") {
    return <Message title="Link inválido" body="Este link no existe o ya fue invalidado." />;
  }
  if (info.status === "used") {
    return (
      <Message
        title="Ya respondiste"
        body="Gracias por tu respuesta anterior. No hace falta hacer nada más."
      />
    );
  }
  if (info.status === "expired") {
    return (
      <Message
        title="Link vencido"
        body="Pasaron más de 7 días. El pedido ya quedó cerrado."
      />
    );
  }

  return (
    <section className="max-w-md mx-auto px-5 pt-12 md:pt-20 pb-16">
      <header className="mb-10 text-center">
        <p className="editorial-rule inline-flex mb-5">Comunidad FASTA</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] leading-[1.05] mb-3">
          ¿Conocés a esta familia?
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Un solo click. No tenés que escribir nada.
        </p>
      </header>

      <article className="border border-[var(--color-border)] mb-8">
        {info.photoId ? (
          <div className="aspect-[4/3] bg-[var(--color-border)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/image/${info.photoId}/card`}
              alt={info.businessName ?? ""}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
        <div className="p-5 md:p-6">
          {info.categoryName ? (
            <p className="text-[10px] tracking-[0.22em] uppercase font-medium text-[var(--color-accent)] mb-3">
              {info.categoryName}
            </p>
          ) : null}
          <h2 className="font-display text-2xl md:text-3xl tracking-[-0.025em] leading-tight mb-3">
            {info.businessName}
          </h2>
          {info.neighborhood ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] mb-3">
              <MapPin size={12} /> {info.neighborhood}
            </p>
          ) : null}
          {info.applicantName ? (
            <p className="text-sm text-[var(--color-ink-soft)] border-t border-[var(--color-border)] pt-3 mt-3">
              <span className="text-[var(--color-muted)]">Solicita:</span>{" "}
              {info.applicantName}
            </p>
          ) : null}
        </div>
      </article>

      <ValidatorButtons token={token} />

      <p className="text-xs text-[var(--color-muted)] text-center mt-8 leading-relaxed">
        Si no conocés a esta familia, decí "No". No es un trámite — es solo
        confirmar pertenencia.
      </p>
    </section>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <section className="max-w-md mx-auto px-5 pt-20 md:pt-32 pb-16 text-center">
      <p className="editorial-rule inline-flex mb-6">Validación</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] mb-4">{title}</h1>
      <p className="text-[var(--color-muted)] leading-relaxed">{body}</p>
    </section>
  );
}
