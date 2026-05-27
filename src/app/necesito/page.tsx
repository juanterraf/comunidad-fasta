import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { NeedForm } from "./NeedForm";

export const dynamic = "force-dynamic";

export default async function NecesitoPage() {
  const cats = await db.select().from(categories).orderBy(asc(categories.displayOrder));

  return (
    <section className="max-w-3xl mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-20 md:pb-24">
      <header className="mb-12 md:mb-14">
        <p className="editorial-rule mb-6">Necesito algo</p>
        <h1 className="display-xl text-4xl sm:text-5xl md:text-7xl mb-5">
          ¿Qué estás necesitando?
        </h1>
        <p className="text-[var(--color-muted)] text-lg md:text-xl leading-relaxed max-w-2xl">
          Escribí lo que buscás y te mostramos emprendimientos, servicios o
          comercios de la comunidad que podrían ayudarte.
        </p>
      </header>
      <NeedForm categories={cats} />
      <p className="text-xs text-[var(--color-subtle)] mt-10 leading-relaxed border-t border-[var(--color-border)] pt-6">
        Lo que escribís queda guardado para que la administración pueda derivar
        tu pedido o detectar qué le hace falta a la comunidad. No publicamos
        consultas ni datos personales.
      </p>
    </section>
  );
}
