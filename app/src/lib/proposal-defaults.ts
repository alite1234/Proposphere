import type { ProposalSectionData, ProposalContent } from "@/db/schema";

// Section selection adapts to complexity (spec §6.1): simple jobs get a lean set.
export const ALL_SECTIONS: { kind: string; title: string; simple?: boolean }[] = [
  { kind: "cover", title: "Cover Page", simple: true },
  { kind: "meta", title: "Proposal Reference & Date", simple: true },
  { kind: "parties", title: "Prepared For / Prepared By", simple: true },
  { kind: "toc", title: "Table of Contents" },
  { kind: "executive_summary", title: "Executive Summary", simple: true },
  { kind: "understanding", title: "Understanding of the Client's Business", simple: true },
  { kind: "challenges", title: "Current Challenges or Opportunity", simple: true },
  { kind: "objectives", title: "Project Objectives", simple: true },
  { kind: "solution", title: "Proposed Solution", simple: true },
  { kind: "scope", title: "Scope of Work", simple: true },
  { kind: "features", title: "Features and Functionality" },
  { kind: "deliverables", title: "Deliverables", simple: true },
  { kind: "why_needed", title: "Why This Service Is Needed", simple: true },
  { kind: "benefits", title: "Expected Benefits and Outcomes", simple: true },
  { kind: "methodology", title: "Implementation Methodology" },
  { kind: "timeline", title: "Project Timeline and Milestones", simple: true },
  { kind: "comparison", title: "Package Comparison Table", simple: true },
  { kind: "recommended", title: "Recommended Package" },
  { kind: "pricing", title: "Investment and Pricing Summary", simple: true },
  { kind: "payment_schedule", title: "Payment Schedule" },
  { kind: "why_us", title: "Why Choose Us?", simple: true },
  { kind: "portfolio", title: "Relevant Portfolio and Case Studies" },
  { kind: "team", title: "Team and Qualifications" },
  { kind: "assumptions", title: "Assumptions and Dependencies", simple: true },
  { kind: "exclusions", title: "Exclusions" },
  { kind: "risks", title: "Risks and Mitigation" },
  { kind: "terms", title: "Terms and Conditions", simple: true },
  { kind: "validity", title: "Proposal Validity", simple: true },
  { kind: "acceptance", title: "Acceptance Instructions", simple: true },
  { kind: "contact", title: "Contact Information and Next Steps", simple: true },
];

export function defaultSections(complexity: "simple" | "standard" | "full"): ProposalSectionData[] {
  return ALL_SECTIONS.filter((s) => (complexity === "full" ? true : complexity === "standard" ? s.simple || !["toc", "team", "risks"].includes(s.kind) : s.simple))
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
