export const NEED_STATUSES = [
  "new",
  "reviewed",
  "resolved",
  "discarded",
  "spam",
  "featured",
] as const;

export type NeedStatus = (typeof NEED_STATUSES)[number];

export const NEED_STATUS_LABEL: Record<NeedStatus, string> = {
  new: "Nueva",
  reviewed: "Revisada",
  resolved: "Resuelta",
  discarded: "Descartada",
  spam: "Spam",
  featured: "Destacada",
};

export const NEED_STATUS_BADGE_CLASS: Record<NeedStatus, string> = {
  new: "bg-[var(--color-secondary)] text-white",
  reviewed: "bg-[var(--color-border)]/60 text-[var(--color-ink-soft)]",
  resolved: "bg-[var(--color-ink)] text-[var(--color-bg)]",
  featured: "bg-[var(--color-accent)] text-white",
  discarded: "bg-white border border-[var(--color-border)] text-[var(--color-muted)]",
  spam: "bg-white border border-[var(--color-border)] text-[var(--color-muted)] line-through",
};

export const NEED_URGENCIES = ["none", "soon", "urgent"] as const;
export type NeedUrgency = (typeof NEED_URGENCIES)[number];

export const NEED_URGENCY_LABEL: Record<NeedUrgency, string> = {
  none: "Sin apuro",
  soon: "En los próximos días",
  urgent: "Hoy o mañana",
};
