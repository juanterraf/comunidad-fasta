"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { updateOwnBusiness } from "@/actions/owner";

type B = {
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  delivers: boolean;
  onlineOnly: boolean;
  byAppointment: boolean;
  tags: string[] | null;
};

export function OwnerEditForm({ business }: { business: B }) {
  const [state, action, pending] = useActionState(updateOwnBusiness, null);

  return (
    <form action={action} className="space-y-4">
      <Field label="Descripción (máx 500)">
        <Textarea
          name="description"
          rows={5}
          maxLength={500}
          defaultValue={business.description ?? ""}
        />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Barrio / zona">
          <Input name="neighborhood" defaultValue={business.neighborhood ?? ""} />
        </Field>
        <Field label="Dirección">
          <Input name="address" defaultValue={business.address ?? ""} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="WhatsApp">
          <Input name="whatsapp" defaultValue={business.whatsapp ?? ""} />
        </Field>
        <Field label="Instagram">
          <Input name="instagram" defaultValue={business.instagram ?? ""} />
        </Field>
        <Field label="Sitio web">
          <Input name="website" defaultValue={business.website ?? ""} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <Cb name="delivers" defaultChecked={business.delivers} label="Envío a domicilio" />
        <Cb name="onlineOnly" defaultChecked={business.onlineOnly} label="Online" />
        <Cb name="byAppointment" defaultChecked={business.byAppointment} label="Con cita previa" />
      </div>
      <Field label="Tags (máx 5, separadas por coma)">
        <Input name="tags" defaultValue={(business.tags ?? []).join(", ")} />
      </Field>
      {state && state.ok === false ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}
      {state && state.ok ? (
        <p className="text-sm text-[var(--color-muted)]">Guardado.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
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

function Cb({
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
