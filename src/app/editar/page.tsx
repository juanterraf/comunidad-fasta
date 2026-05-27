import { RequestEditForm } from "./RequestEditForm";

export const dynamic = "force-dynamic";

export default function EditarPage() {
  return (
    <section className="max-w-md mx-auto px-5 md:px-8 pt-16 md:pt-28 pb-20">
      <p className="editorial-rule inline-flex mb-6">Editar mi emprendimiento</p>
      <h1 className="display-xl text-5xl md:text-6xl mb-4">
        Pedí tu link.
      </h1>
      <p className="text-[var(--color-muted)] text-base md:text-lg mb-10 leading-relaxed">
        Ingresá el mail con el que registraste tu emprendimiento y te llega un
        link de un solo uso para editarlo.
      </p>
      <RequestEditForm />
    </section>
  );
}
