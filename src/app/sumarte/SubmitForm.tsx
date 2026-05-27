"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { submitBusiness, searchValidators } from "@/actions/validation";
import { MapPicker } from "@/components/map/MapPickerLoader";
import type { Category } from "@/db/schema";

type V = { id: string; displayName: string; email: string };

export function SubmitForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(submitBusiness, null);
  const [validators, setValidators] = useState<V[]>([]);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [onlineOnly, setOnlineOnly] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <Field label="Nombre del emprendimiento">
        <Input name="name" required maxLength={120} />
      </Field>
      <Field label="Descripción (máx 500)">
        <Textarea name="description" rows={4} maxLength={500} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Rubro">
          <Select name="categoryId" required defaultValue="">
            <option value="" disabled>
              Elegí un rubro
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Barrio / zona">
          <Input name="neighborhood" />
        </Field>
      </div>
      <Field label="Dirección (opcional)">
        <Input name="address" />
      </Field>

      {!onlineOnly ? (
        <div>
          <span className="text-sm font-medium block mb-1">Ubicación en el mapa</span>
          <p className="text-xs text-[var(--color-muted)] mb-2">
            Opcional. Si tu emprendimiento tiene local físico, hacé click para fijar el pin.
          </p>
          <MapPicker value={pin} onChange={setPin} />
          {pin ? (
            <p className="text-xs text-[var(--color-muted)] mt-2">
              Pin en {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}.{" "}
              <button
                type="button"
                onClick={() => setPin(null)}
                className="underline"
              >
                Quitar
              </button>
            </p>
          ) : null}
          <input type="hidden" name="lat" value={pin ? pin.lat.toString() : ""} />
          <input type="hidden" name="lng" value={pin ? pin.lng.toString() : ""} />
        </div>
      ) : null}
      <Field label="Foto del emprendimiento">
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          required
          className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[var(--color-ink)] file:text-[var(--color-bg)] file:cursor-pointer"
        />
        <p className="text-xs text-[var(--color-muted)] mt-1">
          Una sola imagen. Máximo 8MB. La recortamos automático para vista previa.
        </p>
      </Field>

      <fieldset className="border border-[var(--color-border)] rounded-md p-4 space-y-3">
        <legend className="text-sm font-medium px-1">Contacto</legend>
        <p className="text-xs text-[var(--color-muted)]">
          Tenés que dejar al menos uno: WhatsApp o Instagram.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="WhatsApp (con código de país)">
            <Input name="whatsapp" placeholder="5493815550101" />
          </Field>
          <Field label="Instagram (sin @)">
            <Input name="instagram" placeholder="micuenta" />
          </Field>
          <Field label="Sitio web">
            <Input name="website" type="url" />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <Cb name="delivers" label="Envío a domicilio" />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="onlineOnly"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.currentTarget.checked)}
              className="w-4 h-4"
            />
            Solo online
          </label>
          <Cb name="byAppointment" label="Con cita previa" />
        </div>
      </fieldset>

      <Field label="Tags (separadas por coma, máx 5)">
        <Input name="tags" placeholder="ej. casero, eventos, vegano" />
      </Field>

      <fieldset className="border border-[var(--color-border)] rounded-md p-4 space-y-3">
        <legend className="text-sm font-medium px-1">Tus datos</legend>
        <p className="text-xs text-[var(--color-muted)]">
          Esto identifica de quién es el emprendimiento. Si la administración
          ya te conocía, respetamos los datos que tenga cargados.
        </p>
        <Field label="Tu nombre o el de tu familia">
          <Input name="ownerName" required maxLength={120} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Tu mail">
            <Input name="ownerEmail" type="email" required />
          </Field>
          <Field label="Tu rol en la comunidad">
            <Select name="ownerRole" defaultValue="familia">
              <option value="familia">Familia</option>
              <option value="docente">Docente</option>
              <option value="egresado">Egresado</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
        </div>
        <Field label="Teléfono (opcional, solo lo ve la administración)">
          <Input name="ownerPhone" type="tel" maxLength={40} />
        </Field>
      </fieldset>

      <fieldset className="border border-[var(--color-border)] rounded-md p-4 space-y-3">
        <legend className="text-sm font-medium px-1">Validadores</legend>
        <p className="text-xs text-[var(--color-muted)]">
          Elegí 3 familias o miembros validados de la comunidad que te conocen.
          Cuando dos confirmen, salís al aire.
        </p>
        <ValidatorPicker selected={validators} onChange={setValidators} />
        {validators.map((v) => (
          <input key={v.id} type="hidden" name="validatorIds" value={v.id} />
        ))}
      </fieldset>

      {state && state.ok === false ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando…" : "Enviar pedido"}
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

function Cb({ name, label }: { name: string; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} className="w-4 h-4" />
      {label}
    </label>
  );
}

function ValidatorPicker({
  selected,
  onChange,
}: {
  selected: V[];
  onChange: (xs: V[]) => void;
}) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<V[]>([]);
  const [busy, setBusy] = useState(false);

  async function doSearch(term: string) {
    setQ(term);
    if (term.trim().length < 2) {
      setOpts([]);
      return;
    }
    setBusy(true);
    try {
      const res = await searchValidators(term);
      setOpts(res);
    } finally {
      setBusy(false);
    }
  }

  function add(v: V) {
    if (selected.some((s) => s.id === v.id)) return;
    if (selected.length >= 3) return;
    onChange([...selected, v]);
    setQ("");
    setOpts([]);
  }
  function remove(id: string) {
    onChange(selected.filter((v) => v.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((v) => (
          <span
            key={v.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-ink)] text-[var(--color-bg)] text-xs"
          >
            {v.displayName}
            <button
              type="button"
              onClick={() => remove(v.id)}
              className="opacity-70 hover:opacity-100"
              aria-label="Quitar"
            >
              ×
            </button>
          </span>
        ))}
        {selected.length < 3
          ? Array.from({ length: 3 - selected.length }).map((_, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-full border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)]"
              >
                falta {3 - selected.length - i}
              </span>
            ))
          : null}
      </div>
      {selected.length < 3 ? (
        <div className="relative">
          <Input
            type="search"
            value={q}
            onChange={(e) => doSearch(e.currentTarget.value)}
            placeholder="Buscar por nombre o mail…"
          />
          {opts.length > 0 ? (
            <ul className="absolute z-10 mt-1 left-0 right-0 bg-white border border-[var(--color-border)] rounded-md shadow-sm max-h-64 overflow-y-auto">
              {opts.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => add(v)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-border)]/40"
                  >
                    <span className="font-medium">{v.displayName}</span>{" "}
                    <span className="text-[var(--color-muted)] text-xs">· {v.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {busy ? <p className="text-xs text-[var(--color-muted)] mt-1">Buscando…</p> : null}
        </div>
      ) : null}
    </div>
  );
}
