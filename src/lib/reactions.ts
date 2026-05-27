export const REACTION_KINDS = [
  "heart",
  "star",
  "raised_hands",
  "hug",
  "kiss",
  "fire",
  "sparkle",
] as const;

export type ReactionKind = (typeof REACTION_KINDS)[number];

export const REACTION_META: Record<
  ReactionKind,
  { emoji: string; label: string }
> = {
  heart: { emoji: "❤️", label: "Me encanta" },
  star: { emoji: "⭐", label: "Brillan" },
  raised_hands: { emoji: "🙌", label: "¡Bravo!" },
  hug: { emoji: "🤗", label: "Un abrazo" },
  kiss: { emoji: "😋", label: "Para chuparse los dedos" },
  fire: { emoji: "🔥", label: "Imperdible" },
  sparkle: { emoji: "✨", label: "Joya" },
};

export function isReactionKind(s: string): s is ReactionKind {
  return (REACTION_KINDS as readonly string[]).includes(s);
}
