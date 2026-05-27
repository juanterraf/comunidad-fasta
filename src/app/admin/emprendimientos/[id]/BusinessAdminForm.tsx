"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { deleteBusinessAdmin, updateBusinessAdmin } from "@/actions/businesses";
import type { Business, Category } from "@/db/schema";

export function BusinessAdminForm({
  business,
  categories,
}: {
  business: Business;
  categories: Category[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateBusinessAdmin, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={business.id} />
      <Field label="Nombre">
        <Input name="name" defaultValue={business.name} required />
      </Field>
      <Field label="Slug">
        <Input name="slug" defaultValue={business.slug} />
      </Field>
      <Field label="Descripción (máx 500)">
        <Textarea name="description" rows={4} maxLength={500} defaultValue={business.description ?? ""} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Rubro">
          <Select name="categoryId" defaultValue={business.categoryId ?? ""}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select name="status" defaultValue={business.status}>
            <option value="pending">Pending</option>
            <option value="active">Activo</option>
            <option value="paused">En pausa</option>
            <option value="rejected">Rechazado</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Barrio">
          <Input name="neighborhood" defaultValue={business.neighborhood ?? ""} />
        </Field>
        <Field label="Dirección">
          <Input name="address" defaultValue={business.address ?? ""} />
        </Field>
      </div>
      <Field label="Mail del dueño">
        <Input type="email" name="ownerEmail" required defaultValue={business.ownerEmail} />
      </Field>
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
        <Cb name="delivers" defaultChecked={business.delivers} label="Envía a domicilio" />
        <Cb name="onlineOnly" defaultChecked={business.onlineOnly} label="Online" />
        <Cb name="byAppointment" defaultChecked={business.byAppointment} label="Con cita previa" />
      </div>
      <Field label="Tags (separadas por coma, máx 5)">
        <Input name="tags" defaultValue={(business.tags ?? []).join(", ")} />
      </Field>

      <fieldset className="border border-[var(--color-border)] rounded-md p-4 space-y-3">
        <legend className="text-sm font-medium px-1">Ubicación en el mapa</legend>
        <p className="text-xs text-[var(--color-muted)]">
          Si tiene local físico, completá lat/lng. Online-only no se geolocaliza.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Latitud">
            <Input
              name="lat"
              type="number"
              step="0.000001"
              defaultValue={business.lat ?? ""}
              placeholder="-26.8241"
            />
          </Field>
          <Field label="Longitud">
            <Input
              name="lng"
              type="number"
              step="0.000001"
              defaultValue={business.lng ?? ""}
              placeholder="-65.2226"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="border border-[var(--color-border)] rounded-md p-4 space-y-3">
        <legend className="text-sm font-medium px-1">Historia</legend>
        <p className="text-xs text-[var(--color-muted)]">
          Crónica del emprendimiento. Si la marcás como destacada, aparece en la home.
        </p>
        <Field label="Historia (texto largo, hasta 8000 caracteres)">
          <Textarea name="story" rows={8} maxLength={8000} defaultValue={business.story ?? ""} />
        </Field>
        <Cb
          name="isFeaturedStory"
          defaultChecked={business.isFeaturedStory}
          label="Destacar en la home"
        />
      </fieldset>

      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        <Button
          type="submit"
          variant="ghost"
          formAction={deleteBusinessAdmin}
          onClick={(e) => {
            if (!confirm("¿Eliminar este emprendimiento? No se podrá deshacer.")) {
              e.preventDefault();
            }
          }}
        >
          Eliminar
        </Button>
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
