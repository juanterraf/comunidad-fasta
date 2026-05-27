import { redirect } from "next/navigation";
import { consumeEditToken } from "@/actions/owner";

export const dynamic = "force-dynamic";

export default async function ConsumeEditTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await consumeEditToken(token);
  if (!res.ok) {
    return (
      <section className="max-w-md mx-auto px-5 pt-20 md:pt-28 pb-16 text-center">
        <p className="editorial-rule justify-center mb-6 inline-flex">Link inválido</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em] mb-4">
          No pudimos abrirlo.
        </h1>
        <p className="text-[var(--color-muted)] leading-relaxed">
          Este link ya se usó, expiró o no es válido. Pedí uno nuevo desde{" "}
          <a className="underline hover:text-[var(--color-ink)]" href="/editar">
            /editar
          </a>
          .
        </p>
      </section>
    );
  }
  redirect("/mi-emprendimiento");
}
