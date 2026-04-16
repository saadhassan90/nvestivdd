---
name: L1 Report Structure & Tab Mapping
description: 11-section markdown template with sub-section parsing (7.x, 8.x) and keyword-based tab mapping
type: feature
---

## Report Structure
11 sections: Cover, Verdict, Hard Floor, Scorecard Summary, Flags, Meeting Conditions, Research Findings (7.1-7.7), Domain Research (8.1-8.4), Meeting Questions, Conclusion, Source Appendix.

## Sub-section Parsing
Section 7 (Research Findings) splits into sub-sections 7.1-7.7 with virtual numbers (701-707).
Section 8 (Domain Research) splits into sub-sections 8.1-8.4 with virtual numbers (801-804).
Parser: `matchSubSectionHeading` matches `### N.N Title` patterns.
Post-processing: `splitSubSections` runs after initial parse.

## Tab Mapping (keyword-based, with section number fallback)
- **Overview**: Cover, Verdict, Hard Floor, Scorecard Summary, Conclusion, Findings Overview
- **Team**: 7.1 People, 7.6 Network
- **Performance**: 7.3 Track Record, 7.5 Claims
- **Strategy**: 7.4 Strategy, 8.1-8.4 Domain Research sub-sections
- **Red Flags**: Section 5 Flags
- **Interrogatory**: Section 6 Meeting Conditions, Section 9 Meeting Questions
- **Data Room**: 7.7 Gap Register
- **Documents**: 7.2 Entity Verification, Section 11 Source Appendix

## Rendering
`MarkdownSectionCards` component splits combined markdown by `##`/`###` headings into individual styled cards.
Replaces single-blob `ReportMarkdownSection` in all tabs.
