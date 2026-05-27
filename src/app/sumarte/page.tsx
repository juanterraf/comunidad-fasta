import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SumartePage() {
  const cats = await db.select().from(categories).orderBy(asc(categories.displayOrder));

  return (
    <section className="max-w-3xl mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-20 md:pb-24">
      <header className="mb-12 md:mb-16">
        <p className="editorial-rule mb-6">Sumarte</p>
        <h1 className="display-xl text-4xl sm:text-5xl md:text-7xl mb-5">
          Sumá tu emprendimiento.
        </h1>
        <p className="text-[var(--color-muted)] text-lg md:text-xl leading-relaxed max-w-2xl">
          Completá los datos. Elegí al menos un miembro validado que te
          conozca (hasta tres). En cuanto uno confirme, sale al aire.
        </p>
      </header>
      <SubmitForm categories={cats} />
    </section>
  );
}
