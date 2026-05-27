"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/categories";
import type { Category } from "@/db/schema";

export function CategoriesEditor({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-6">
      <NewCategoryForm />
      <ul className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-md">
        {categories.map((c) => (
          <li key={c.id}>
            <CategoryRow c={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewCategoryForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createCategory, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form
      action={action}
      className="border border-[var(--color-border)] rounded-md p-4 space-y-3 max-w-xl"
    >
      <p className="text-sm font-medium">Nueva categoría</p>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_80px_auto] gap-2">
        <Input name="name" placeholder="Nombre" required />
        <Input name="icon" placeholder="icono (tabler)" />
        <Input name="displayOrder" type="number" defaultValue={0} />
        <Button type="submit" disabled={pending}>
          {pending ? "…" : "+"}
        </Button>
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}
    </form>
  );
}

function CategoryRow({ c }: { c: Category }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateCategory, null);
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="px-3 py-2">
      <input type="hidden" name="id" value={c.id} />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_80px_auto_auto] gap-2 items-center">
        <Input name="name" defaultValue={c.name} required />
        <Input name="icon" defaultValue={c.icon ?? ""} />
        <Input name="displayOrder" type="number" defaultValue={c.displayOrder} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "…" : "Guardar"}
        </Button>
        <Button
          type="submit"
          variant="ghost"
          formAction={deleteCategory}
          onClick={(e) => {
            if (!confirm(`¿Borrar "${c.name}"?`)) e.preventDefault();
          }}
        >
          ×
        </Button>
      </div>
      <p className="text-xs text-[var(--color-muted)] mt-1">slug: {c.slug}</p>
    </form>
  );
}
