import type { ProposalSectionData, ProposalContent } from "@/db/schema";

// Section selection adapts to complexity (spec §6.1). `tier` = minimum complexity
// at which the section appears: lean (7) ⊂ standard (15) ⊂ full (29).
// The AI writes complete content for the selected sections only — it never pads
// the document with extra sections.
export const ALL_SECTIONS: { kind: string; title: string; tier: "lean" | "standard" | "full" }[] = [
  { kind: "cover", title: "Cover Page", tier: "standard" },
  { kind: "meta", title: "Proposal Reference & Date", tier: "full" },
  { kind: "parties", title: "Prepared For / Prepared By", tier: "full" },
  { kind: "toc", title: "Table of Contents", tier: "full" },
  { kind: "executive_summary", title: "Executive Summary", tier: "lean" },
  { kind: "understanding", title: "Understanding of the Client's Business", tier: "standard" },
  { kind: "challenges", title: "Current Challenges or Opportunity", tier: "full" },
  { kind: "objectives", title: "Project Objectives", tier: "standard" },
  { kind: "solution", title: "Proposed Solution", tier: "lean" },
  { kind: "scope", title: "Scope of Work", tier: "lean" },
  { kind: "features", title: "Features and Functionality", tier: "full" },
  { kind: "deliverables", title: "Deliverables", tier: "standard" },
  { kind: "why_needed", title: "Why This Service Is Needed", tier: "full" },
  { kind: "benefits", title: "Expected Benefits and Outcomes", tier: "standard" },
  { kind: "methodology", title: "Implementation Methodology", tier: "full" },
  { kind: "timeline", title: "Project Timeline and Milestones", tier: "lean" },
  { kind: "comparison", title: "Package Comparison Table", tier: "standard" },
  { kind: "recommended", title: "Recommended Package", tier: "full" },
  { kind: "pricing", title: "Investment and Pricing Summary", tier: "lean" },
  { kind: "payment_schedule", title: "Payment Schedule", tier: "standard" },
  { kind: "why_us", title: "Why Choose Us?", tier: "lean" },
  { kind: "portfolio", title: "Relevant Portfolio and Case Studies", tier: "full" },
  { kind: "team", title: "Team and Qualifications", tier: "full" },
  { kind: "assumptions", title: "Assumptions and Dependencies", tier: "full" },
  { kind: "exclusions", title: "Exclusions", tier: "full" },
  { kind: "risks", title: "Risks and Mitigation", tier: "full" },
  { kind: "terms", title: "Terms and Conditions", tier: "full" },
  { kind: "validity", title: "Proposal Validity", tier: "full" },
  { kind: "acceptance", title: "Acceptance Instructions", tier: "standard" },
  { kind: "contact", title: "Contact Information and Next Steps", tier: "lean" },
];

const TIER_ORDER = { lean: 0, standard: 1, full: 2 } as const;

export function defaultSections(complexity: "simple" | "standard" | "full"): ProposalSectionData[] {
  const max = TIER_ORDER[complexity === "simple" ? "lean" : complexity];
  return ALL_SECTIONS.filter((s) => TIER_ORDER[s.tier] <= max)
    .map((s) => ({ id: s.kind, kind: s.kind, title: s.title, enabled: true, body: "" }));
}

export function emptyContent(complexity: "simple" | "standard" | "full", currency: string): ProposalContent {
  return {
    sections: defaultSections(complexity),
    comparison: { enabled: true, columns: [], rows: [], recommended: undefined, note: undefined },
    pricing: { subtotal: "0", discount: "0", discountType: "none", discountValue: "0", taxRate: "0", tax: "0", total: "0", currency },
    assumptions: [],
  };
}
