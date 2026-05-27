export function FamilyStatusBadge({
  isSeed,
  validated,
}: {
  isSeed: boolean;
  validated: boolean;
}) {
  if (isSeed) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-ink)] text-[var(--color-bg)]">
        semilla
      </span>
    );
  }
  if (validated) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-ink)] text-[var(--color-ink)]">
        validada
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-[var(--color-border)] text-[var(--color-muted)]">
      no validada
    </span>
  );
}
