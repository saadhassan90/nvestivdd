/**
 * Splits a combined markdown string into sub-section cards
 * based on heading structure (## or ### headings).
 */

export interface MarkdownCard {
  title: string;
  content: string;
  level: number; // heading level (2 or 3)
}

/**
 * Parse markdown into an array of cards, split by heading boundaries.
 * Content before the first heading becomes an untitled card.
 */
export function parseMarkdownCards(markdown: string): MarkdownCard[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const cards: MarkdownCard[] = [];
  let currentCard: MarkdownCard | null = null;
  let contentLines: string[] = [];

  const flushCard = () => {
    if (currentCard) {
      currentCard.content = contentLines.join('\n').trim();
      if (currentCard.content || currentCard.title) {
        cards.push(currentCard);
      }
    }
  };

  for (const line of lines) {
    // Skip page markers and noise
    if (/^##\s*Page\s+\d+/i.test(line.trim())) continue;
    if (/^---+$/.test(line.trim()) && currentCard && contentLines.length === 0) continue;

    const headingMatch = line.match(/^(#{2,3})\s+(.+)/);

    if (headingMatch) {
      flushCard();
      currentCard = {
        title: headingMatch[2]
          .trim()
          .replace(/^\*\*(.+)\*\*$/, '$1') // strip bold wrapping
          .replace(/^MODULE\s+[A-Z]\s*[–—-]\s*/i, '')
          .replace(/\s*\(MODULE\s+[A-Z]\)\s*/i, ''),
        content: '',
        level: headingMatch[1].length,
      };
      contentLines = [];
    } else if (currentCard) {
      contentLines.push(line);
    } else {
      // Content before first heading
      if (line.trim()) {
        if (!currentCard) {
          currentCard = { title: '', content: '', level: 0 };
          contentLines = [];
        }
        contentLines.push(line);
      }
    }
  }

  flushCard();
  return cards;
}
