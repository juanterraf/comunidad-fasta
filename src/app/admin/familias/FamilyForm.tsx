"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FAMILY_ROLE_OPTIONS } from "@/config/roles";
import type { Family } from "@/db/schema";

type Props = {
  family?: Family;
  action: (prev: unknown, fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  deleteAction?: (fd: FormData) => Promise<void>;
};

export function FamilyForm({ family, action, deleteAction }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) {
      router.push("/admin/familias");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {family ? <input type="hidden" name="id" value={family.id} /> : null}
      <Field label="Nombre visible">
        <Input
          name="displayName"
          required
          defaultValue={family?.displayName ?? ""}
        />
      </Field>
      <Field label="Mail">
        <Input
          type="email"
          name="email"
          required
          defaultValue={family?.email ?? ""}
        />
      </Field>
      <Field label="Rol">
        <Select name="role" defaultValue={family?.role ?? "familia"}>
          {FAMILY_ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Teléfono">
        <Input name="phone" defaultValue={family?.phone ?? ""} />
      </Field>
      <Field label="Notas internas">
        <Textarea name="notes" rows={3} defaultValue={family?.notes ?? ""} />
      </Field>
      <div className="flex flex-wrap gap-4">
        <Checkbox name="isSeed" defaultChecked={family?.isSeed ?? false} label="Semilla" />
        <Checkbox
          name="validated"
          defaultChecked={family?.validated ?? false}
          label="Validada"
        />
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        {family && deleteAction ? (
          <Button
            type="submit"
            variant="ghost"
            formAction={deleteAction}
            onClick={(e) => {
              if (!confirm("¿Eliminar esta familia? No se podrá deshacer.")) {
                e.preventDefault();
              }
            }}
          >
            Eliminar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="w-4 h-4" />
      {label}
    </label>
  );
}
