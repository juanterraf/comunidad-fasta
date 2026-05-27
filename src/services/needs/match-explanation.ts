export type MatchSignals = {
  matchedTags: string[];
  categoryMatched: boolean;
  categoryName: string | null;
  categoryByName: boolean;
  zoneMatched: boolean;
  textMatched: boolean;
  featured: boolean;
};

export function explainMatch(signals: MatchSignals): string[] {
  const reasons: string[] = [];

  if (signals.matchedTags.length > 0) {
    const tags = signals.matchedTags.slice(0, 3).join(", ");
    reasons.push(`Coincide en etiquetas: ${tags}.`);
  }
  if (signals.categoryMatched && signals.categoryName) {
    reasons.push(`Mismo rubro que buscás (${signals.categoryName}).`);
  } else if (signals.categoryByName && signals.categoryName) {
    reasons.push(`Rubro afín: ${signals.categoryName}.`);
  }
  if (signals.zoneMatched) {
    reasons.push("Coincide la zona indicada.");
  }
  if (signals.textMatched && reasons.length < 2) {
    reasons.push("Coincide con lo que describe el emprendimiento.");
  }
  if (signals.featured && reasons.length < 3) {
    reasons.push("Destacado por la comunidad.");
  }
  if (reasons.length === 0) {
    reasons.push("Podría estar relacionado por contexto.");
  }
  return reasons.slice(0, 3);
}
