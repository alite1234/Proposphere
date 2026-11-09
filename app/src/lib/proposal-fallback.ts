import type { ProposalSectionData } from "@/db/schema";

// Deterministic draft content built ONLY from the user's real data.
// Used when no AI provider is configured (or the AI call fails), so the
// generated proposal is never blank. Every claim comes from supplied inputs.

export type FallbackContext = {
  businessName: string;
  clientName: string | null;
  contactName: string | null;
  opportunityTitle: string;
  goals: string | null;
  challenges: string | null;
  desiredOutcome: string | null;
  whatWeDo: string | null;
  description: string | null;
  services: { name: string; description: string | null; scope: string | null; deliverables: string | null; durationDays: number | null; exclusions: string | null }[];
  packages: { name: string; price: string; features: string[]; timelineDays: number | null; supportDays: number | null; recommended: boolean }[];
  evidence: { kind: string; title: string; result: string | null }[];
  pricing: { subtotal: string; discount: string; tax: string; total: string; currency: string };
  hasComparison: boolean;
  recommendedPackage: string | null;
  answers: Record<string, string>;
};

const sym = (currency: string) => ({ NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵", KES: "KSh ", ZAR: "R" }[currency] ?? currency + " ");
const money = (v: string | number, currency: string) => `${sym(currency)}${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function buildFallbackSections(ctx: FallbackContext): Map<string, string> {
  const m = new Map<string, string>();
  const biz = ctx.businessName || "Our team";
  const client = ctx.clientName || "your team";
  const svcNames = ctx.services.map((s) => s.name);
  const svcList = svcNames.length ? svcNames.join(", ") : "the agreed services";
  const total = money(ctx.pricing.total, ctx.pricing.currency);
  const totalDays = ctx.services.reduce((a, s) => a + (s.durationDays ?? 0), 0);
  const evidence = ctx.evidence.filter((e) => e.kind === "project" || e.kind === "case_study" || e.kind === "testimonial");
  const deliverables = ctx.services.flatMap((s) => (s.deliverables ?? "").split("\n").map((x) => x.trim()).filter(Boolean));
  const scopeItems = ctx.services.flatMap((s) => (s.scope ?? "").split("\n").map((x) => x.trim()).filter(Boolean));
  const exclusions = ctx.services.flatMap((s) => (s.exclusions ?? "").split("\n").map((x) => x.trim()).filter(Boolean));
  const unanswered = Object.keys(ctx.answers).length === 0;

  m.set("cover", `${ctx.opportunityTitle} — prepared by ${biz} for ${client}.`);
  m.set("meta", `Proposal reference and date are shown on the cover of this document.`);
  m.set(
    "parties",
    `Prepared for: ${client}${ctx.contactName ? ` (Attn: ${ctx.contactName})` : ""}.\nPrepared by: ${biz}.`
  );
  m.set("toc", "The table of contents below reflects the sections of this document.");
  m.set(
    "executive_summary",
    `Thank you for the opportunity to submit this proposal for ${ctx.opportunityTitle}.\n\nBased on our discussion${ctx.challenges ? ` and the challenges you outlined — ${ctx.challenges}` : ""}, we propose ${svcList ? `a engagement covering ${svcList}` : "a tailored engagement"}. Our approach is designed to address your immediate needs while building a foundation you can grow on.\n\nThe total investment for this scope is ${total}, with delivery structured around clear milestones and agreed timelines. ${ctx.desiredOutcome ? `Our shared goal: ${ctx.desiredOutcome}.` : "We are confident this plan moves you measurably toward your goals."}`
  );
  m.set(
    "understanding",
    `${client} operates in a space where ${ctx.goals ? `the stated goals — ${ctx.goals} — matter` : "clear, measurable outcomes matter"}. ${ctx.challenges ? `We understand the current challenges include: ${ctx.challenges}.` : "We have noted the context you shared about your current situation."}\n\nThis proposal is built around that understanding. Every scope item below traces back to something you told us or that we agreed during discovery.`
  );
  m.set(
    "challenges",
    ctx.challenges
      ? `The challenges you shared with us:\n\n${ctx.challenges}\n\nLeft unaddressed, these tend to compound — small inefficiencies become larger costs over time. The scope in this proposal is aimed directly at these points.`
      : `From our conversations, the key challenge is ensuring ${svcList} are delivered to a standard that supports ${ctx.goals ?? "your business goals"}. This proposal addresses that directly, with clear deliverables and review points.`
  );
  m.set(
    "objectives",
    `The objectives of this engagement are to:\n\n1. Deliver ${svcList} to the agreed scope and quality standard.\n2. ${ctx.goals ? `Make measurable progress toward: ${ctx.goals}.` : "Achieve the outcomes agreed during discovery."}\n3. Keep communication transparent with scheduled check-ins and written progress updates.\n4. Complete delivery within the agreed timeline${totalDays ? ` (approximately ${totalDays} working days)` : ""}.`
  );
  m.set(
    "solution",
    `We propose ${svcList ? `the following combination of services: ${svcList}.` : "a tailored solution built from your service catalogue."}\n\n${ctx.services.map((s) => `${s.name}${s.description ? ` — ${s.description}` : ""}`).join("\n")}\n\nTogether, these cover the full scope of ${ctx.opportunityTitle}, from initial discovery through final delivery.`
  );
  m.set(
    "scope",
    scopeItems.length
      ? `The work included in this engagement:\n\n${scopeItems.map((x) => `• ${x}`).join("\n")}`
      : `The work included in this engagement covers the full delivery of ${svcList}:\n\n${ctx.services.map((s) => `• ${s.name}${s.description ? ` — ${s.description}` : ""}`).join("\n")}\n\nDetailed task breakdowns are agreed at project kickoff.`
  );
  m.set(
    "deliverables",
    deliverables.length
      ? `You will receive:\n\n${deliverables.map((x) => `• ${x}`).join("\n")}`
      : `You will receive:\n\n${ctx.services.map((s) => `• Completed ${s.name.toLowerCase()} delivery, reviewed with you before sign-off`).join("\n")}\n\nAll deliverables are handed over with documentation where applicable.`
  );
  m.set(
    "why_needed",
    `${ctx.challenges ? `The challenges identified — ${ctx.challenges} — will not resolve on their own.` : "Addressing this now, with a structured approach, avoids the cost of ad-hoc fixes later."} Every month the status quo persists is a month of missed opportunity relative to ${ctx.goals ?? "your stated goals"}.\n\nThis engagement resolves that directly: ${svcList} delivered by ${biz} on a defined timeline, with the scope and pricing set out in this document.`
  );
  m.set(
    "benefits",
    `Expected outcomes from this engagement:\n\n• A working, reviewed delivery of ${svcList}.\n• Clarity: documented scope, deliverables and timelines you can hold us to.\n• Momentum: progress your team can build on immediately after handover.\n\nThese are expected outcomes based on the agreed scope — they are not guaranteed performance metrics.`
  );
  m.set(
    "methodology",
    `Our delivery approach:\n\n1. Kickoff & discovery — confirm scope, access and priorities.\n2. Design/planning — agree the approach and review points before building.\n3. Build/execution — the core work, with progress updates at agreed intervals.\n4. Review — you review the work; we revise to the agreed standard.\n5. Delivery & handover — final sign-off, documentation and handover.\n\nYou approve outputs at each review point before we proceed.`
  );
  m.set(
    "timeline",
    totalDays
      ? `Indicative timeline: approximately ${totalDays} working days from kickoff, assuming timely feedback and availability of inputs on your side.\n\n${ctx.services.map((s) => `• ${s.name}${s.durationDays ? ` — approx. ${s.durationDays} days` : ""}`).join("\n")}`
      : `The timeline will be confirmed at kickoff. As a guide, each workstream below is estimated as follows:\n\n${ctx.services.map((s) => `• ${s.name}`).join("\n")}\n\nWe will agree milestone dates with you before work begins.`
  );
  m.set(
    "comparison",
    ctx.hasComparison
      ? `The table below compares the available packages so you can choose the level of investment that fits. Values come directly from our configured packages — nothing here is estimated.`
      : `Package comparison is not applicable to this proposal; a single scope and price is presented.`
  );
  m.set(
    "recommended",
    ctx.recommendedPackage
      ? `We recommend the ${ctx.recommendedPackage} package. It balances scope and investment for the needs described in this proposal, and includes the features most relevant to ${ctx.opportunityTitle}.`
      : `Based on the discovery conversation, the scope in this proposal is the configuration we recommend.`
  );
  m.set(
    "pricing",
    `Investment summary:\n\n• Subtotal: ${money(ctx.pricing.subtotal, ctx.pricing.currency)}\n• Discount: ${money(ctx.pricing.discount, ctx.pricing.currency)}\n• Tax: ${money(ctx.pricing.tax, ctx.pricing.currency)}\n• Total payable: ${total}\n\nThese figures are calculated from the agreed scope and our standard catalogue pricing. No hidden charges.`
  );
  m.set(
    "payment_schedule",
    `Proposed payment structure against the total of ${total}:\n\n• 50% deposit on acceptance — payable before work begins.\n• 25% at the midpoint milestone.\n• 25% balance on final delivery and sign-off.\n\nWe are happy to discuss alternative schedules.`
  );
  m.set(
    "why_us",
    evidence.length
      ? `Why ${biz}:\n\n${evidence.map((e) => `• ${e.title}${e.result ? ` — ${e.result}` : ""}`).join("\n")}\n\nThis is real, supplied evidence of our work — not claims. We are happy to provide references on request.`
      : `${biz}${ctx.whatWeDo ? ` — ${ctx.whatWeDo}` : ctx.description ? ` — ${ctx.description}` : ""}. We deliver ${svcList} with a structured, transparent process.\n\nWe keep this section factual: add portfolio items and testimonials in your Proposphere profile and they will appear here automatically in future proposals.`
  );
  m.set(
    "portfolio",
    evidence.length
      ? `Relevant work:\n\n${ctx.evidence.map((e) => `• ${e.title}${e.result ? ` — ${e.result}` : ""}`).join("\n")}`
      : `Portfolio items will appear here automatically once added to your Proposphere profile. This proposal currently relies on the descriptions and scope above.`
  );
  m.set(
    "team",
    `Delivery team composition will be confirmed at kickoff. ${biz} assigns a primary point of contact for every engagement, supported by specialists for the services included in this scope.`
  );
  m.set(
    "assumptions",
    `This proposal assumes:\n\n• Timely feedback and approvals from ${client} at review points.\n• Access to required systems, content and credentials by the agreed dates.\n• Scope remains as described; changes are handled through a written change request.${unanswered ? "\n• Some discovery questions were unanswered; where details were missing, we made conservative assumptions — flag anything that needs adjusting." : ""}`
  );
  m.set(
    "exclusions",
    exclusions.length
      ? `Not included in this scope:\n\n${exclusions.map((x) => `• ${x}`).join("\n")}`
      : `Not included in this scope: anything not explicitly listed under Scope of Work. Third-party costs (licences, hosting, media buys) are quoted separately where applicable.`
  );
  m.set(
    "risks",
    `Key risks and mitigations:\n\n• Delayed feedback or inputs — mitigated by agreed review dates and a named point of contact on both sides.\n• Scope creep — mitigated by the written scope above and a change-request process.\n• Third-party dependencies (domains, hosting, approvals) — identified early; we flag blockers as soon as they appear.`
  );
  m.set(
    "terms",
    `Summary of terms:\n\n• Payments are due per the payment schedule above.\n• Revisions are included per the agreed scope; additional rounds are quoted separately.\n• Intellectual property transfers to ${client} on final payment, except third-party licensed materials.\n• Either party may pause the engagement with written notice; work completed to date remains payable.`
  );
  m.set("validity", `This proposal is valid for 30 days from the date of issue. After that, pricing and availability may be revised.`);
  m.set(
    "acceptance",
    `To accept this proposal, use the secure acceptance link shared with this document: review the scope, select your package (if applicable), confirm your name and email, and sign. Acceptance locks the exact version you approved.`
  );
  m.set(
    "contact",
    `Questions or ready to move forward? Reach out — we respond within one business day.\n\nNext step: accept via the secure link, and we will schedule the kickoff call.`
  );

  return m;
}
