/**
 * Extracts sections from L1 report markdown files.
 * Handles multiple report formats:
 *   - `## SECTION N: Title`  (Altum-style)
 *   - `# N. Title`           (Apollo-style)
 *   - `### N.N Title`        (Sub-sections like 7.1, 8.3)
 *   - Unnumbered `# TITLE`   headings (Executive Summary, Conclusion, etc.)
 *
 * Uses keyword-based tab mapping so section numbers don't need to be
 * consistent across reports.
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

// ── Heading matchers ───────────────────────────────────────────

/**
 * Match section headings in multiple formats.
 * Returns [sectionNumber, title] or null.
 */
function matchSectionHeading(line: string): [number, string] | null {
  const trimmed = line.trim();

  // Format 1: ## SECTION N: Title  or  # SECTION N: Title
  const fmtSection = trimmed.match(/^#{1,4}\s*SECTION\s+(\d+)\s*[:\-–—]\s*(.+)/i);
  if (fmtSection) return [parseInt(fmtSection[1], 10), fmtSection[2].trim()];

  // Format 2: # N. Title  or  ## N. Title (e.g., "# 3. TEAM ASSESSMENT")
  // Careful: must NOT match sub-sections like "## 7.5 Claims" (no period after sub-number)
  const fmtNumbered = trimmed.match(/^#{1,4}\s+(\d+)\.\s+(.+)/);
  if (fmtNumbered) {
    // Make sure this isn't a sub-section (e.g., "7.5") by checking the next char
    const num = fmtNumbered[1];
    if (num.length <= 2) return [parseInt(num, 10), fmtNumbered[2].trim()];
  }

  return null;
}

/**
 * Match sub-section headings like ### 7.1 People or ## 8.3 Exit Environment.
 * Returns [virtualNumber (mainSection * 100 + sub), title] or null.
 */
function matchSubSectionHeading(line: string): [number, string] | null {
  const trimmed = line.trim();
  const match = trimmed.match(/^#{2,4}\s+(\d+)\.(\d+)\s+(.+)/);
  if (match) {
    const mainNum = parseInt(match[1], 10);
    const subNum = parseInt(match[2], 10);
    return [mainNum * 100 + subNum, match[3].trim()];
  }
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
  [/^#{1,2}\s*Findings\s+Overview/i, 105, 'Findings Overview'],
];

function matchNamedSection(line: string): [number, string] | null {
  const trimmed = line.trim();
  for (const [pattern, num, title] of NAMED_SECTIONS) {
    if (pattern.test(trimmed)) return [num, title];
  }
  return null;
}

// ── Sub-section splitting ──────────────────────────────────────

/**
 * Post-process sections: if a section's content contains sub-section
 * headings (like ### 7.1 People), split them into their own ReportSection
 * entries with virtual section numbers (mainSection * 100 + subNumber).
 */
function splitSubSections(sections: ReportSection[]): ReportSection[] {
  const result: ReportSection[] = [];

  for (const section of sections) {
    const lines = section.content.split('\n');
    const hasSubSections = lines.some(l =>
      /^#{2,4}\s+\d+\.\d+\s+/.test(l.trim())
    );

    if (!hasSubSections) {
      result.push(section);
      continue;
    }

    // Split the section content by sub-section headings
    let currentSub: ReportSection | null = null;
    let subContentLines: string[] = [];
    let preambleLines: string[] = [];
    let foundFirstSub = false;

    for (const line of lines) {
      if (shouldSkipLine(line)) continue;

      const subMatch = matchSubSectionHeading(line);

      if (subMatch) {
        // Flush previous sub-section
        if (currentSub) {
          currentSub.content = subContentLines.join('\n').trim();
          if (currentSub.content) result.push(currentSub);
        }
        foundFirstSub = true;
        currentSub = {
          sectionNumber: subMatch[0],
          title: subMatch[1],
          content: '',
        };
        subContentLines = [];
      } else if (foundFirstSub && currentSub) {
        subContentLines.push(line);
      } else {
        preambleLines.push(line);
      }
    }

    // Add preamble as the parent section (with original section number)
    const preamble = preambleLines.join('\n').trim();
    if (preamble) {
      result.push({ ...section, content: preamble });
    }

    // Flush last sub-section
    if (currentSub) {
      currentSub.content = subContentLines.join('\n').trim();
      if (currentSub.content) result.push(currentSub);
    }
  }

  return result;
}

// ── Main parser ────────────────────────────────────────────────

/**
 * Parse a full L1 markdown report into sections, including sub-sections.
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

  // Split sections that contain sub-sections (e.g., 7.1, 8.3)
  return splitSubSections(sections);
}

// ── Keyword-based tab mapping ──────────────────────────────────

/**
 * Keywords used to match section titles to tabs.
 * A section matches a tab if any keyword is found in its title.
 */
const TAB_KEYWORDS: Record<string, RegExp[]> = {
  overview: [
    /executive\s+summary/i,
    /submission\s+quality/i,
    /fund\s+structure/i,
    /final\s+assessment/i,
    /^cover$/i,
    /^verdict$/i,
    /^rationale$/i,
    /hard\s+floor/i,
    /scorecard\s+summary/i,
    /conclusion/i,
    /recommendation/i,
    /overall\s+rating/i,
    /limitations/i,
    /findings\s+overview/i,
    /terms\s+(&|and)\s+structure/i,
  ],
  team: [
    /^people/i,
    /team/i,
    /organi[sz]ational/i,
    /leadership/i,
    /^network/i,
  ],
  performance: [
    /track\s+record/i,
    /performance/i,
    /financial/i,
    /^claims/i,
  ],
  strategy: [
    /^strategy/i,
    /^market/i,
    /philosophy/i,
    /comparative/i,
    /risk\s+management/i,
    /operational/i,
    /domain\s+research/i,
    /co.?investment\s+submarket/i,
    /exit\s+environment/i,
    /regulatory\s+environment/i,
    /lmm\s+pe/i,
  ],
  red_flags: [
    /^flags$/i,
    /red\s+flag/i,
    /risk\s+areas/i,
    /risk\s+flags/i,
  ],
  interrogatory: [
    /meeting\s+conditions/i,
    /meeting\s+questions/i,
    /interrogatory/i,
    /questions\s+for\s+gp/i,
  ],
  data_room: [
    /gap\s+register/i,
    /data\s+room/i,
    /checklist/i,
  ],
  documents: [
    /source\s+appendix/i,
    /entity\s+verification/i,
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
 * Legacy section-number-based tab mapping (fallback).
 */
export const TAB_SECTION_MAP: Record<string, number[]> = {
  overview: [1, 2, 3, 4, 10, 100, 101, 103, 104, 105],
  team: [701, 706],
  performance: [703, 705],
  strategy: [704, 7, 8, 801, 802, 803, 804],
  red_flags: [5],
  interrogatory: [6, 9],
  data_room: [707],
  documents: [702, 11, 13, 102],
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
