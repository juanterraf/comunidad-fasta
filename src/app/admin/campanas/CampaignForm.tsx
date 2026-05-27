"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { deleteCampaign, upsertCampaign } from "@/actions/campaigns";
import type { Campaign, Category } from "@/db/schema";

function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60 * 1000).toISOString().slice(0, 16);
}

export function CampaignForm({
  campaign,
  categories,
}: {
  campaign?: Campaign;
  categories: Category[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(upsertCampaign, null);

  useEffect(() => {
    if (state?.ok) {
      router.push("/admin/campanas");
      router.refresh();
    }
  }, [state, router]);

  const initialIds = new Set<string>(campaign?.categoryIds ?? []);

  return (
    <form action={action} className="space-y-4 max-w-2xl">
      {campaign ? <input type="hidden" name="id" value={campaign.id} /> : null}
      <Field label="Título">
        <Input name="title" required defaultValue={campaign?.title ?? ""} />
      </Field>
      <Field label="Slug (opcional, se genera del título)">
        <Input name="slug" defaultValue={campaign?.slug ?? ""} />
      </Field>
      <Field label="Descripción">
        <Textarea name="description" rows={3} defaultValue={campaign?.description ?? ""} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Empieza">
          <Input
            type="datetime-local"
            name="startsAt"
            defaultValue={toLocalInput(campaign?.startsAt)}
          />
        </Field>
        <Field label="Termina">
          <Input
            type="datetime-local"
            name="endsAt"
            defaultValue={toLocalInput(campaign?.endsAt)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Color hex (#rrggbb)">
          <Input name="colorHex" defaultValue={campaign?.colorHex ?? "#c4502c"} />
        </Field>
        <Field label="CTA texto">
          <Input name="ctaText" placeholder="Ver participantes" defaultValue={campaign?.ctaText ?? ""} />
        </Field>
        <Field label="CTA link (opcional)">
          <Input
            name="ctaHref"
            placeholder="por defecto /explorar?campana=..."
            defaultValue={campaign?.ctaHref ?? ""}
          />
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm font-medium mb-2">Rubros que participan</legend>
        <p className="text-xs text-[var(--color-muted)] mb-2">
          Si elegís rubros, la campaña pre-filtra esos rubros en /explorar.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <label
              key={c.id}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-[var(--color-border)] text-sm cursor-pointer has-[:checked]:bg-[var(--color-ink)] has-[:checked]:text-[var(--color-bg)] has-[:checked]:border-[var(--color-ink)]"
            >
              <input
                type="checkbox"
                name="categoryIds"
                value={c.id}
                defaultChecked={initialIds.has(c.id)}
                className="sr-only"
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={campaign?.isActive ?? true}
          className="w-4 h-4"
        />
        Mostrar en home (activa)
      </label>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        {campaign ? (
          <Button
            type="submit"
            variant="ghost"
            formAction={deleteCampaign}
            onClick={(e) => {
              if (!confirm("¿Eliminar la campaña?")) e.preventDefault();
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
