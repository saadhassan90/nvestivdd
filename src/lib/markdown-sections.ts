/**
 * Extracts sections from L1 report markdown files.
 * Handles multiple report formats:
 *   - `## SECTION N: Title`  (Altum-style)
 *   - `# N. Title`           (Apollo-style)
 *   - Unnumbered `# TITLE`   headings (Executive Summary, Conclusion, Appendix, etc.)
 *
 * Uses keyword-based tab mapping so section numbers don't need to be consistent across reports.
 */

export interface ReportSection {
  sectionNumber: number;
  title: string;
  content: string;
}

// Lines to skip when cleaning parsed DOCX output
const SKIP_PATTERNS = [
  /^##\s*Page\s+\d+/i,
  /^###\s*Images from page/i,
  /^-\s*`parsed-documents:\/\//,
  /Nvestiv Agentic DD System\s*\|\s*Page/i,
  /^Nvestiv\s*\|\s*Level 1/i,
  /^NVESTIV\s*\|\s*Level 1/i,
];

function shouldSkipLine(line: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(line.trim()));
}

/**
 * Match section headings in multiple formats.
 * Returns [sectionNumber, title] or null.
 */
function matchSectionHeading(line: string): [number, string] | null {
  const trimmed = line.trim();

  // Format 1: ## SECTION N: Title  or  # SECTION N: Title
  const fmtSection = trimmed.match(/^#{1,4}\s*SECTION\s+(\d+)\s*[:\-–—]\s*(.+)/i);
  if (fmtSection) return [parseInt(fmtSection[1], 10), fmtSection[2].trim()];

  // Format 2: # N. Title  or  ## N. Title (e.g., "# 3. TEAM ASSESSMENT (MODULE B)")
  const fmtNumbered = trimmed.match(/^#{1,4}\s+(\d+)\.\s+(.+)/);
  if (fmtNumbered) return [parseInt(fmtNumbered[1], 10), fmtNumbered[2].trim()];

  return null;
}

/**
 * Match well-known unnumbered section headings.
 * Assigns virtual section numbers (100+) to keep them unique.
 */
const NAMED_SECTIONS: [RegExp, number, string][] = [
  [/^#{1,2}\s*EXECUTIVE\s+SUMMARY/i, 100, 'Executive Summary'],
  [/^#{1,2}\s*CONCLUSION\s*[&\s]*RECOMMENDATION/i, 101, 'Conclusion & Recommendation'],
  [/^#{1,2}\s*APPENDIX[:\s]*.*RESEARCH\s+SOURCES/i, 102, 'Research Sources & Citations'],
  [/^#{1,2}\s*APPENDIX[:\s]*.*CITATION/i, 102, 'Research Sources & Citations'],
  [/^#{1,2}\s*LIMITATIONS\s*[&\s]*CONFIDENCE/i, 103, 'Limitations & Confidence'],
  [/^#{1,2}\s*FINAL\s+ASSESSMENT/i, 104, 'Final Assessment & Rating'],
  [/^#{1,2}\s*L1\s+OVERALL\s+RATING/i, 104, 'Final Assessment & Rating'],
];

function matchNamedSection(line: string): [number, string] | null {
  const trimmed = line.trim();
  for (const [pattern, num, title] of NAMED_SECTIONS) {
    if (pattern.test(trimmed)) return [num, title];
  }
  return null;
}

/**
 * Parse a full L1 markdown report into sections.
 */
export function parseReportSections(markdown: string): ReportSection[] {
  const lines = markdown.split('\n');
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    if (shouldSkipLine(line)) continue;

    const numbered = matchSectionHeading(line);
    const named = !numbered ? matchNamedSection(line) : null;
    const match = numbered || named;

    if (match) {
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        sections.push(currentSection);
      }
      currentSection = {
        sectionNumber: match[0],
        title: match[1],
        content: '',
      };
      contentLines = [];
    } else if (currentSection) {
      contentLines.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

// ── Keyword-based tab mapping ──────────────────────────────────

/**
 * Keywords used to match section titles to tabs.
 * Each tab has an array of keyword patterns (case-insensitive).
 * A section matches a tab if any keyword is found in its title.
 */
const TAB_KEYWORDS: Record<string, RegExp[]> = {
  overview: [
    /executive\s+summary/i,
    /submission\s+quality/i,
    /fund\s+structure/i,
    /final\s+assessment/i,
    /conclusion/i,
    /recommendation/i,
    /overall\s+rating/i,
    /limitations/i,
    /terms\s+(&|and)\s+structure/i,
  ],
  team: [
    /team/i,
    /organi[sz]ational/i,
    /leadership/i,
  ],
  performance: [
    /performance/i,
    /track\s+record/i,
    /financial/i,
  ],
  strategy: [
    /strategy/i,
    /market/i,
    /philosophy/i,
    /comparative/i,
    /risk\s+management/i,
    /operational/i,
  ],
  red_flags: [
    /red\s+flag/i,
    /risk\s+areas/i,
    /risk\s+flags/i,
  ],
  interrogatory: [
    /interrogatory/i,
    /questions\s+for\s+gp/i,
  ],
  data_room: [
    /data\s+room/i,
    /checklist/i,
  ],
  documents: [
    /research\s+sources/i,
    /citations/i,
    /appendix/i,
    /references/i,
  ],
};

/**
 * Determine which tab a section belongs to based on its title.
 */
function getTabForSection(section: ReportSection): string | null {
  for (const [tab, patterns] of Object.entries(TAB_KEYWORDS)) {
    if (patterns.some(p => p.test(section.title))) return tab;
  }
  return null;
}

// ── Public API ──────────────────────────────────────────────────

export function getSectionsByNumbers(sections: ReportSection[], numbers: number[]): ReportSection[] {
  return sections.filter(s => numbers.includes(s.sectionNumber));
}

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
      const cleanTitle = s.title
        .replace(/^MODULE\s+[A-Z]\s*[–—-]\s*/i, '')
        .replace(/^APPENDIX\s+[A-Z]\s*[–—-]\s*/i, '')
        .replace(/\s*\(MODULE\s+[A-Z]\)\s*/i, '');
      return `## ${cleanTitle}\n\n${s.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Legacy section-number-based tab mapping (for backwards compat).
 */
export const TAB_SECTION_MAP: Record<string, number[]> = {
  overview: [1, 2, 3, 11, 100, 101, 103, 104],
  team: [5],
  performance: [6],
  strategy: [4, 7, 12],
  red_flags: [8],
  interrogatory: [9],
  data_room: [10],
  documents: [13, 102],
};

/**
 * Get the combined markdown content for a given tab key.
 * Uses keyword-based matching first, falls back to section number mapping.
 */
export function getTabMarkdown(sections: ReportSection[], tabKey: string): string | null {
  // Keyword-based matching
  const matched = sections.filter(s => getTabForSection(s) === tabKey);

  // Fallback: section number mapping
  if (matched.length === 0) {
    const sectionNumbers = TAB_SECTION_MAP[tabKey];
    if (!sectionNumbers) return null;
    const fallback = getSectionsByNumbers(sections, sectionNumbers);
    if (fallback.length === 0) return null;
    return combineSections(fallback);
  }

  return combineSections(matched);
}
