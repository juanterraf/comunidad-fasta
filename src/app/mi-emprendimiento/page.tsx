import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, categories } from "@/db/schema";
import { getOwnerSession } from "@/lib/auth";
import { OwnerEditForm } from "./OwnerEditForm";
import { logoutOwner } from "@/actions/owner";

export const dynamic = "force-dynamic";

export default async function MiEmprendimientoPage() {
  const session = await getOwnerSession();
  if (!session.businessId) redirect("/editar");

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
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
      status: businesses.status,
      categoryName: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(eq(businesses.id, session.businessId))
    .limit(1);

  if (rows.length === 0) {
    return redirect("/editar");
  }
  const b = rows[0];

  return (
    <section className="max-w-2xl mx-auto px-5 md:px-8 pt-10 md:pt-14 pb-16">
      <div className="flex items-center justify-between mb-6">
        <p className="eyebrow">Mi emprendimiento</p>
        <form action={logoutOwner}>
          <button className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] underline">
            Cerrar sesión
          </button>
        </form>
      </div>
      <h1 className="font-display text-4xl md:text-5xl tracking-[-0.03em] leading-[1.02] mb-3">
        {b.name}
      </h1>
      <p className="text-sm text-[var(--color-muted)] mb-2">
        <Link href={`/e/${b.slug}`} target="_blank" className="underline hover:text-[var(--color-ink)]">
          /e/{b.slug}
        </Link>
        {" · "}
        {b.categoryName ?? "—"}
        {" · "}estado: {b.status}
      </p>
      <p className="text-sm text-[var(--color-muted)] mb-10 leading-relaxed border-b border-[var(--color-border)] pb-6">
        Podés editar tu descripción, contacto, barrio y tags. Para cambiar el
        nombre, el rubro, la foto o el mail propietario, escribinos al admin.
      </p>
      <OwnerEditForm business={b} />
    </section>
  );
}
