/**
 * Extracts sections from an L1 report markdown file by splitting on SECTION headings.
 * Handles multiple heading formats: `## SECTION N:`, `# SECTION N:`, or bare `SECTION N:`.
 */

export interface ReportSection {
  sectionNumber: number;
  title: string;
  content: string;
}

/**
 * Parse a full L1 markdown report into numbered sections.
 * Matches lines like:
 *   ## SECTION 1: Executive Summary
 *   # SECTION 2: Submission Quality
 *   SECTION 3: MODULE A – Fund Structure
 */
export function parseReportSections(markdown: string): ReportSection[] {
  const lines = markdown.split('\n');
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;
  let contentLines: string[] = [];

  // Match any markdown heading level (or none) followed by SECTION N:
  const sectionRegex = /^#{0,4}\s*SECTION\s+(\d+)\s*[:\-–—]\s*(.+)/i;

  for (const line of lines) {
    const match = line.match(sectionRegex);
    if (match) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        sections.push(currentSection);
      }
      currentSection = {
        sectionNumber: parseInt(match[1], 10),
        title: match[2].trim(),
      content: '',
      };
      contentLines = [];
    } else if (currentSection) {
      contentLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Get specific sections by their numbers.
 */
export function getSectionsByNumbers(sections: ReportSection[], numbers: number[]): ReportSection[] {
  return sections.filter(s => numbers.includes(s.sectionNumber));
}

/**
 * Get a single section's content by number.
 */
export function getSectionContent(sections: ReportSection[], sectionNumber: number): string | null {
  const section = sections.find(s => s.sectionNumber === sectionNumber);
  return section?.content ?? null;
}

/**
 * Combine multiple sections into a single markdown string.
 * Includes section titles as H2 headings for a cohesive report layout.
 */
export function combineSections(sections: ReportSection[]): string {
  return sections
    .map(s => {
      // Clean up the title: remove "MODULE X –" prefix for cleaner display
      const cleanTitle = s.title
        .replace(/^MODULE\s+[A-Z]\s*[–—-]\s*/i, '')
        .replace(/^APPENDIX\s+[A-Z]\s*[–—-]\s*/i, '');
      return `## ${cleanTitle}\n\n${s.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Tab-to-section mapping for the L1 report.
 *
 * Overview:      Sections 1 (Exec Summary), 2 (Submission Quality), 3 (Fund Structure), 11 (Final Assessment)
 * Team & Ops:    Sections 5 (Team & Org), 7 (Risk Management & Ops)
 * Performance:   Section 6 (Performance & Track Record)
 * Strategy:      Sections 4 (Strategy & Philosophy), 12 (Comparative Context)
 * Red Flags:     Section 8
 * Interrogatory: Section 9
 * Data Room:     Section 10
 * Sources:       Section 13
 */
export const TAB_SECTION_MAP: Record<string, number[]> = {
  overview: [1, 2, 3, 11],
  team: [5],
  performance: [6],
  strategy: [4, 7, 12],
  red_flags: [8],
  interrogatory: [9],
  data_room: [10],
  documents: [13],
};

/**
 * Get the combined markdown content for a given tab key.
 */
export function getTabMarkdown(sections: ReportSection[], tabKey: string): string | null {
  const sectionNumbers = TAB_SECTION_MAP[tabKey];
  if (!sectionNumbers) return null;
  const matched = getSectionsByNumbers(sections, sectionNumbers);
  if (matched.length === 0) return null;
  return combineSections(matched);
}
