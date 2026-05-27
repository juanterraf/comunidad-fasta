export function escapeHtml(value: string | null | undefined): string {
  if (value == null) return "";
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

export function escapeAttr(value: string | null | undefined): string {
  return escapeHtml(value);
}
