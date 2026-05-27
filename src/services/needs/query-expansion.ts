import { SYNONYMS, STOPWORDS, type SynonymEntry } from "@/config/community-search";
import { stripDiacritics } from "@/lib/text";

export type ExpandedQuery = {
  original: string;
  normalized: string;
  tokens: string[];
  expandedTokens: string[];
  expandedText: string;
  matched: Array<{ trigger: string; expansions: string[]; categorySlugs?: string[] }>;
  suggestedCategorySlugs: string[];
};

export function normalizeText(input: string): string {
  return stripDiacritics(input.toLowerCase())
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function matchEntry(entry: SynonymEntry, normalized: string, tokens: Set<string>): string | null {
  for (const trigger of entry.triggers) {
    const tnorm = normalizeText(trigger);
    if (!tnorm) continue;
    if (tnorm.includes(" ")) {
      if (normalized.includes(tnorm)) return trigger;
    } else if (tokens.has(tnorm)) {
      return trigger;
    }
  }
  return null;
}

export function expandQuery(input: string): ExpandedQuery {
  const normalized = normalizeText(input);
  const tokens = tokenize(input);
  const tokenSet = new Set(tokens);

  const matched: ExpandedQuery["matched"] = [];
  const expansionSet = new Set<string>(tokens);
  const categorySet = new Set<string>();

  for (const entry of SYNONYMS) {
    const trigger = matchEntry(entry, normalized, tokenSet);
    if (!trigger) continue;
    matched.push({
      trigger,
      expansions: entry.expansions,
      categorySlugs: entry.categorySlugs,
    });
    for (const phrase of entry.expansions) {
      for (const t of tokenize(phrase)) expansionSet.add(t);
    }
    for (const slug of entry.categorySlugs ?? []) categorySet.add(slug);
  }

  const expandedTokens = Array.from(expansionSet);
  return {
    original: input,
    normalized,
    tokens,
    expandedTokens,
    expandedText: expandedTokens.join(" "),
    matched,
    suggestedCategorySlugs: Array.from(categorySet),
  };
}
