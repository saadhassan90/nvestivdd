/**
 * Helpers for per-card comment threads.
 *
 * `sectionId` is the active tab key (e.g. "overview", "economics") supplied by
 * SectionContext. `cardId` is auto-derived from a card's title via slugify().
 * Together they uniquely identify a card on a deal page and form the key used
 * for `comments.section_id` + `comments.sub_card_id`.
 */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export const SECTION_LABELS: Record<string, string> = {
  overview: "Overview",
  investment_thesis: "Investment Thesis",
  market_reality: "Macro Context",
  team: "Team & Manager",
  track_record: "Track Record",
  economics: "Economics",
  regulatory_ops: "Regulatory & Ops",
  red_flags: "Risk Flags",
  interrogatory: "Diligence Questions",
  documents: "Sources",
  data_room: "Dataroom",
  analysis_log: "Analysis Log",
};

export function sectionLabel(sectionId: string | null | undefined): string {
  if (!sectionId) return "Deal";
  return SECTION_LABELS[sectionId] ?? toTitle(sectionId);
}

export function cardLabelFromId(cardId: string | null | undefined): string {
  if (!cardId) return "";
  return toTitle(cardId);
}

function toTitle(slug: string): string {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function cardDomId(sectionId: string, cardId: string): string {
  return `card-${sectionId}-${cardId}`;
}