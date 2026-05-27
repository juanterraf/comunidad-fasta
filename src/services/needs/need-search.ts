import { sql } from "drizzle-orm";
import { db } from "@/db";
import { SEARCH_WEIGHTS } from "@/config/community-search";
import { expandQuery, normalizeText, type ExpandedQuery } from "./query-expansion";
import { explainMatch } from "./match-explanation";

export type NeedSearchInput = {
  rawQuery: string;
  zone?: string | null;
  categoryHintId?: string | null;
};

export type NeedSearchResultRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  neighborhood: string | null;
  photoFilename: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  tags: string[];
  score: number;
  reasons: string[];
};

export type NeedSearchResponse = {
  expanded: ExpandedQuery;
  results: NeedSearchResultRow[];
};

export type MatchedResultSnapshot = {
  id: string;
  slug: string;
  name: string;
  score: number;
  reasons: string[];
  categoryName: string | null;
};

export function snapshotFromResults(
  results: NeedSearchResultRow[],
): MatchedResultSnapshot[] {
  return results.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    score: r.score,
    reasons: r.reasons,
    categoryName: r.categoryName,
  }));
}

type CandidateRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  neighborhood: string | null;
  photoFilename: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  tags: string[] | null;
  isFeaturedStory: boolean;
  approvedAt: Date | null;
  tsRank: number;
};

function tagOverlap(tags: string[], tokenSet: Set<string>): string[] {
  if (!tags.length) return [];
  const out: string[] = [];
  for (const tag of tags) {
    const norm = normalizeText(tag);
    if (!norm) continue;
    if (tokenSet.has(norm)) {
      out.push(tag);
      continue;
    }
    for (const piece of norm.split(" ")) {
      if (tokenSet.has(piece)) {
        out.push(tag);
        break;
      }
    }
  }
  return out;
}

function recencyBoost(approvedAt: Date | null): number {
  if (!approvedAt) return 0;
  const days = (Date.now() - approvedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 0) return SEARCH_WEIGHTS.recencyBoost;
  if (days >= SEARCH_WEIGHTS.recencyDays) return 0;
  return SEARCH_WEIGHTS.recencyBoost * (1 - days / SEARCH_WEIGHTS.recencyDays);
}

export async function searchByNeed(input: NeedSearchInput): Promise<NeedSearchResponse> {
  const expanded = expandQuery(input.rawQuery);
  const zoneNorm = input.zone ? normalizeText(input.zone) : "";
  const categoryHintId = input.categoryHintId ?? null;

  const tsQuery = expanded.expandedText.length > 0 ? expanded.expandedText : expanded.normalized;
  const tokenArrayParam = expanded.expandedTokens.length > 0 ? expanded.expandedTokens : [""];

  const candidatesRaw = await db.execute<CandidateRow>(sql`
    select
      b.id,
      b.slug,
      b.name,
      b.description,
      b.neighborhood,
      b.photo_filename as "photoFilename",
      b.category_id as "categoryId",
      c.name as "categoryName",
      c.slug as "categorySlug",
      b.whatsapp,
      b.instagram,
      b.website,
      b.tags,
      b.is_featured_story as "isFeaturedStory",
      b.approved_at as "approvedAt",
      ts_rank(
        to_tsvector(
          'spanish',
          coalesce(b.name, '') || ' ' ||
          coalesce(b.description, '') || ' ' ||
          coalesce(c.name, '') || ' ' ||
          coalesce(array_to_string(b.tags, ' '), '')
        ),
        websearch_to_tsquery('spanish', ${tsQuery})
      )::float8 as "tsRank"
    from businesses b
    left join categories c on c.id = b.category_id
    where b.status = 'active'
      and (
        to_tsvector(
          'spanish',
          coalesce(b.name, '') || ' ' ||
          coalesce(b.description, '') || ' ' ||
          coalesce(c.name, '') || ' ' ||
          coalesce(array_to_string(b.tags, ' '), '')
        ) @@ websearch_to_tsquery('spanish', ${tsQuery})
        or b.tags && ${tokenArrayParam}::text[]
        or (${categoryHintId}::uuid is not null and b.category_id = ${categoryHintId}::uuid)
        or (${zoneNorm}::text <> '' and lower(coalesce(b.neighborhood, '')) like '%' || ${zoneNorm} || '%')
      )
    limit 120
  `);

  const tokenSet = new Set(expanded.expandedTokens);
  const suggestedCats = new Set(expanded.suggestedCategorySlugs);

  const scored = candidatesRaw.rows.map((row: CandidateRow) => {
    const tags = row.tags ?? [];
    const matchedTags = tagOverlap(tags, tokenSet);
    const categoryMatched = categoryHintId !== null && row.categoryId === categoryHintId;
    const categoryByName =
      !categoryMatched && row.categorySlug !== null && suggestedCats.has(row.categorySlug);
    const zoneMatched =
      zoneNorm !== "" &&
      typeof row.neighborhood === "string" &&
      normalizeText(row.neighborhood).includes(zoneNorm);
    const textMatched = row.tsRank > 0;
    const featured = !!row.isFeaturedStory;

    let score = 0;
    score += row.tsRank * SEARCH_WEIGHTS.textRank;
    score += matchedTags.length * SEARCH_WEIGHTS.tagOverlap;
    if (categoryMatched) score += SEARCH_WEIGHTS.categoryMatch;
    if (categoryByName) score += SEARCH_WEIGHTS.categoryNameMatch;
    if (zoneMatched) score += SEARCH_WEIGHTS.zoneMatch;
    if (featured) score += SEARCH_WEIGHTS.featured;
    score += recencyBoost(row.approvedAt);

    const reasons = explainMatch({
      matchedTags,
      categoryMatched,
      categoryName: row.categoryName,
      categoryByName,
      zoneMatched,
      textMatched,
      featured,
    });

    return { row, score, matchedTags, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  const results: NeedSearchResultRow[] = scored
    .filter((s) => s.score >= SEARCH_WEIGHTS.minScore)
    .slice(0, 20)
    .map(({ row, score, reasons }) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      neighborhood: row.neighborhood,
      photoFilename: row.photoFilename,
      categoryName: row.categoryName,
      categorySlug: row.categorySlug,
      whatsapp: row.whatsapp,
      instagram: row.instagram,
      website: row.website,
      tags: row.tags ?? [],
      score: Math.round(score * 100) / 100,
      reasons,
    }));

  return { expanded, results };
}
