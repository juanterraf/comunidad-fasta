import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { consumeEditToken, inspectEditToken } from "@/actions/owner";

export const dynamic = "force-dynamic";

export default async function ConsumeEditTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await inspectEditToken(token);

  if (preview.status !== "valid") {
    const title =
      preview.status === "used"
        ? "Este link ya se usó."
        : preview.status === "expired"
          ? "Este link expiró."
          : "Link inválido.";
    return (
      <section className="max-w-md mx-auto px-5 pt-20 md:pt-28 pb-16 text-center">
        <p className="editorial-rule inline-flex mb-6">Link inválido</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] mb-4">
          {title}
        </h1>
        <p className="text-[var(--color-muted)] leading-relaxed mb-8">
          Pedí uno nuevo desde{" "}
          <Link
            className="underline hover:text-[var(--color-ink)]"
            href="/editar"
          >
            /editar
          </Link>
          .
        </p>
        <Link
          href="/editar"
          className="inline-flex items-center gap-2 h-11 px-5 bg-[var(--color-ink)] text-[var(--color-bg)] text-sm font-medium hover:bg-[var(--color-accent)] transition-colors"
        >
          Pedir un link nuevo
          <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto px-5 pt-16 md:pt-24 pb-16">
      <p className="editorial-rule inline-flex mb-6">Editar mi emprendimiento</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] leading-[1.05] mb-4">
        Listo para entrar.
      </h1>
      <p className="text-[var(--color-muted)] leading-relaxed mb-8">
        {preview.businessName ? (
          <>
            Vas a abrir la edición de{" "}
            <span className="font-medium text-[var(--color-ink)]">
              {preview.businessName}
            </span>
            . El link es de un solo uso.
          </>
        ) : (
          "Confirmá para abrir la edición. El link es de un solo uso."
        )}
      </p>

      <form action={consumeEditToken}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 bg-[var(--color-ink)] text-[var(--color-bg)] text-[15px] font-medium hover:bg-[var(--color-accent)] transition-colors"
        >
          Entrar a editar
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="text-xs text-[var(--color-subtle)] mt-6 leading-relaxed">
        Si no fuiste vos quien pidió este link, simplemente cerrá esta página y
        el acceso queda sin usar.
      </p>
    </section>
  );
}
