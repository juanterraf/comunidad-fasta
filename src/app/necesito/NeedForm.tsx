"use client";

import { useActionState, useState } from "react";
import { Search } from "lucide-react";
import { submitNeed } from "@/actions/needs";
import type { Category } from "@/db/schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const EXAMPLE =
  "Ej: necesito souvenirs para comunión, profe de matemática, torta de cumpleaños, arreglo de aire acondicionado…";

export function NeedForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(submitNeed, null);
  const [showContact, setShowContact] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="query" className="block text-sm font-medium mb-1.5">
          Tu necesidad
        </label>
        <Textarea
          id="query"
          name="query"
          required
          rows={4}
          maxLength={500}
          placeholder={EXAMPLE}
          invalid={Boolean(state && !state.ok)}
        />
        <p className="text-xs text-[var(--color-subtle)] mt-1.5">
          Cuanto más concreto, mejor matcheamos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="zone" className="block text-sm font-medium mb-1.5">
            Zona o barrio <span className="text-[var(--color-subtle)]">(opcional)</span>
          </label>
          <Input
            id="zone"
            name="zone"
            placeholder="Ej: Yerba Buena, Tafí Viejo…"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="categoryHintId" className="block text-sm font-medium mb-1.5">
            Rubro sugerido <span className="text-[var(--color-subtle)]">(opcional)</span>
          </label>
          <Select id="categoryHintId" name="categoryHintId" defaultValue="">
            <option value="">No estoy seguro</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="urgency" className="block text-sm font-medium mb-1.5">
            Urgencia <span className="text-[var(--color-subtle)]">(opcional)</span>
          </label>
          <Select id="urgency" name="urgency" defaultValue="">
            <option value="">Sin apuro</option>
            <option value="soon">En los próximos días</option>
            <option value="urgent">Lo necesito hoy o mañana</option>
          </Select>
        </div>
        <div>
          <label htmlFor="budget" className="block text-sm font-medium mb-1.5">
            Presupuesto estimado <span className="text-[var(--color-subtle)]">(opcional)</span>
          </label>
          <Input
            id="budget"
            name="budget"
            placeholder="Ej: hasta 50.000"
            autoComplete="off"
            maxLength={120}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <button
          type="button"
          onClick={() => setShowContact((v) => !v)}
          className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          {showContact ? "Ocultar datos de contacto" : "Querés que te contactemos? Dejá tus datos"}
        </button>
        {showContact ? (
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input name="name" placeholder="Tu nombre" maxLength={120} autoComplete="name" />
              <Input
                name="email"
                type="email"
                placeholder="tu@mail"
                maxLength={200}
                autoComplete="email"
              />
            </div>
            <Input
              name="whatsapp"
              placeholder="WhatsApp (con código de país)"
              maxLength={40}
              autoComplete="tel"
            />
            <label className="flex items-start gap-2 text-sm text-[var(--color-ink-soft)] leading-snug">
              <input
                type="checkbox"
                name="consent"
                className="mt-1 accent-[var(--color-ink)]"
              />
              <span>
                Acepto que los datos ingresados sean utilizados para gestionar esta consulta
                dentro de la comunidad.
              </span>
            </label>
          </div>
        ) : null}
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-accent)]">{state.error}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending}
        iconLeft={<Search size={18} />}
      >
        {pending ? "Buscando…" : "Buscar en la comunidad"}
      </Button>
    </form>
  );
}
