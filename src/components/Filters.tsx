"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  useTransition,
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import type { Category } from "@/db/schema";

type Props = {
  categories: Category[];
  barrios: string[];
};

const SEARCH_DEBOUNCE_MS = 300;

export function Filters({ categories, barrios }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = useMemo(
    () => ({
      q: sp.get("q") ?? "",
      cat: sp.get("cat") ?? "",
      barrio: sp.get("barrio") ?? "",
      envia: sp.get("envia") === "1",
      online: sp.get("online") === "1",
      cita: sp.get("cita") === "1",
    }),
    [sp],
  );

  const activeSecondary =
    Number(current.barrio !== "") +
    Number(current.envia) +
    Number(current.online) +
    Number(current.cita);

  useEffect(() => {
    if (!catOpen) return;
    function onClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [catOpen]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const update = useCallback(
    (patch: Partial<Record<string, string | boolean>>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === "" || v === false || v === undefined || v === null) params.delete(k);
        else if (v === true) params.set(k, "1");
        else params.set(k, String(v));
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [sp, pathname, router],
  );

  function onSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: value }), SEARCH_DEBOUNCE_MS);
  }

  const anyFilter =
    current.q ||
    current.cat ||
    current.barrio ||
    current.envia ||
    current.online ||
    current.cita;

  const currentCat = categories.find((c) => c.slug === current.cat);

  return (
    <div>
      <div className="relative border-b-2 border-[var(--color-ink)] pb-2 mb-6">
        <Search
          size={20}
          className="absolute left-0 top-1/2 -translate-y-1/2 -mt-1 text-[var(--color-ink)]"
        />
        <input
          type="search"
          placeholder="¿Qué estás buscando?"
          defaultValue={current.q}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          className="w-full pl-9 pr-4 py-2 bg-transparent font-display text-2xl md:text-3xl tracking-[-0.02em] placeholder:text-[var(--color-subtle)] focus:outline-none"
        />
        {pending ? (
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted)]"
            aria-live="polite"
          >
            Buscando…
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <div ref={catRef} className="relative">
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              aria-expanded={catOpen}
              className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:border-[var(--color-ink)] transition-colors"
            >
              <span className="text-[var(--color-muted)] text-[10px] tracking-[0.18em] uppercase font-medium mr-1">
                Rubro
              </span>
              {currentCat ? currentCat.name : "Todos"}
              <ChevronDown
                size={14}
                className={`transition-transform ${catOpen ? "rotate-180" : ""}`}
              />
            </button>
            {catOpen ? (
              <div className="absolute left-0 top-full mt-2 z-30 min-w-[260px] bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    update({ cat: "" });
                    setCatOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-surface-warm)] ${
                    !current.cat ? "font-medium text-[var(--color-accent)]" : ""
                  }`}
                >
                  Todos los rubros
                </button>
                <div className="max-h-80 overflow-y-auto border-t border-[var(--color-border)]">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        update({ cat: c.slug });
                        setCatOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-surface-warm)] ${
                        current.cat === c.slug
                          ? "font-medium text-[var(--color-accent)]"
                          : ""
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            className={`inline-flex items-center gap-2 h-10 px-4 text-sm font-medium border transition-colors ${
              advancedOpen || activeSecondary > 0
                ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                : "border-[var(--color-border-strong)] text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtros
            {activeSecondary > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold bg-[var(--color-accent)] text-white">
                {activeSecondary}
              </span>
            ) : null}
          </button>
        </div>

        {anyFilter ? (
          <button
            type="button"
            onClick={() =>
              update({
                q: "",
                cat: "",
                barrio: "",
                envia: false,
                online: false,
                cita: false,
              })
            }
            className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            <X size={14} /> Limpiar todo
          </button>
        ) : null}
      </div>

      {advancedOpen ? (
        <div className="mt-4 p-5 bg-[var(--color-surface-warm)] border border-[var(--color-border)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] tracking-[0.18em] uppercase font-medium text-[var(--color-muted)] block mb-2">
                Barrio
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Pill
                  active={!current.barrio}
                  onClick={() => update({ barrio: "" })}
                  label="Todos"
                />
                {barrios.map((b) => (
                  <Pill
                    key={b}
                    active={current.barrio === b}
                    onClick={() => update({ barrio: b })}
                    label={b}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase font-medium text-[var(--color-muted)] mb-2">
                Cómo trabajan
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Pill
                  active={current.envia}
                  onClick={() => update({ envia: !current.envia })}
                  label="Envía a domicilio"
                />
                <Pill
                  active={current.online}
                  onClick={() => update({ online: !current.online })}
                  label="Solo online"
                />
                <Pill
                  active={current.cita}
                  onClick={() => update({ cita: !current.cita })}
                  label="Con cita previa"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs font-medium px-3 h-8 border transition-colors ${
        active
          ? "bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)]"
          : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] border-[var(--color-border-strong)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      }`}
    >
      {label}
    </button>
  );
}
