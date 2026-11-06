"use server";

import { db } from "@/db";
import { opportunities, discoverySessions, proposals, proposalVersions, proposalEvents, services, packages, portfolioItems, businessProfiles, clients, taxSettings } from "@/db/schema";
import { requireTenant, logActivity, notify, nextRef } from "@/lib/server";
import { askJson, aiAvailable } from "@/lib/ai";
import { emptyContent, defaultSections } from "@/lib/proposal-defaults";
import { buildFallbackSections, type FallbackContext } from "@/lib/proposal-fallback";
import { computeTotals, num } from "@/lib/money";
import type { Recommendation, ProposalSectionData, ProposalContent } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";

const analysisSchema = z.object({
  likelyNeeds: z.array(z.string()),
  unclearOrMissing: z.array(z.string()),
  risksAndAssumptions: z.array(z.string()),
  relevantServiceIds: z.array(z.string()),
  likelyConcerns: z.array(z.string()),
  infoNeededToPrice: z.array(z.string()),
  summary: z.string(),
});

const questionsSchema = z.object({
  questions: z.array(z.object({ question: z.string(), why: z.string() })).min(3).max(10),
});

const recommendationsSchema = z.object({
  recommendations: z.array(
    z.object({
      name: z.string(),
      what: z.string(),
      why: z.string(),
      problem: z.string(),
      level: z.enum(["essential", "recommended", "optional"]),
      serviceName: z.string().optional(),
      estimatedCost: z.string().optional(),
      timelineImpact: z.string().optional(),
    })
  ).min(1).max(12),
});

const contentSchema = z.object({
  sections: z.array(
    z.object({
      kind: z.string(),
      body: z.string(),
    })
  ).min(1),
  assumptions: z.array(z.string()).default([]),
});

const SYSTEM = `You are a thoughtful business development consultant inside Proposphere, a platform for service providers.
Rules you must never break:
- Use ONLY the information supplied by the user. Never invent clients, testimonials, awards, certifications, results or performance claims.
- Never invent prices. Reference services only by the names/prices the user configured.
- Clearly label estimates and assumptions.
- Write in the user's preferred tone.`;

function heuristicQuestions(industry: string | null): { question: string; why: string }[] {
  const base = [
    { question: "What is the primary purpose or goal of this project?", why: "Anchors scope and success criteria." },
    { question: "What is the target launch or delivery date?", why: "Determines timeline feasibility and pricing." },
    { question: "Who provides images, content and access credentials?", why: "Avoids scope gaps and delays." },
    { question: "Is there an existing system or website to migrate or replace?", why: "Affects effort and risk." },
    { question: "Is ongoing maintenance or support needed after delivery?", why: "Affects package and pricing structure." },
    { question: "What is the budget range the client has indicated?", why: "Guides package recommendation." },
  ];
  if (industry && /web|site|app|software|digital/i.test(industry)) {
    base.unshift(
      { question: "Does the client need an admin dashboard?", why: "Common hidden requirement that affects price." },
      { question: "Should customers be able to make payments on the platform?", why: "Payment integration changes scope significantly." },
      { question: "Is SEO setup required at launch?", why: "Frequently requested; must be scoped." }
    );
  }
  return base.slice(0, 8);
}

export async function createOpportunityAction(formData: FormData) {
  const t = await requireTenant();
  const g = (k: string) => String(formData.get(k) || "").trim() || null;
  const clientId = g("clientId");

  let clientName = g("clientName");
  if (clientId) {
    const [c] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.businessId, t.businessId))).limit(1);
    if (c) clientName = c.name;
  }

  const [opp] = await db
    .insert(opportunities)
    .values({
      businessId: t.businessId,
      clientId: clientId,
      title: String(formData.get("title") || "Untitled opportunity").trim(),
      clientName,
      industry: g("industry"),
      clientDescription: g("clientDescription"),
      website: g("website"),
      contactName: g("contactName"),
      contactRole: g("contactRole"),
      location: g("location"),
      goals: g("goals"),
      challenges: g("challenges"),
      source: g("source"),
      brief: g("brief"),
      desiredOutcome: g("desiredOutcome"),
    })
    .returning({ id: opportunities.id });

  const [session] = await db
    .insert(discoverySessions)
    .values({ businessId: t.businessId, opportunityId: opp.id, status: "draft" })
    .returning({ id: discoverySessions.id });

  await logActivity(t.businessId, "opportunity.created", { actor: t.user.email, objectType: "opportunity", objectId: opp.id });
  redirect(`/studio/${session.id}`);
}

export async function analyzeAction(formData: FormData) {
  const t = await requireTenant();
  const sessionId = String(formData.get("sessionId") || "");
  const [session] = await db.select().from(discoverySessions).where(and(eq(discoverySessions.id, sessionId), eq(discoverySessions.businessId, t.businessId))).limit(1);
  if (!session) redirect("/studio");
  const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, session.opportunityId)).limit(1);
  const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessId, t.businessId)).limit(1);
  const svc = await db.select().from(services).where(and(eq(services.businessId, t.businessId), eq(services.active, true)));
  const pf = await db.select().from(portfolioItems).where(and(eq(portfolioItems.businessId, t.businessId), eq(portfolioItems.visible, true)));

  if (aiAvailable()) {
    const context = JSON.stringify({
      business: { description: profile?.description, whatWeDo: profile?.whatWeDo, whoWeServe: profile?.whoWeServe, differentiators: profile?.differentiators, tone: profile?.toneOfVoice },
      services: svc.map((s) => ({ id: s.id, name: s.name, price: s.basePrice, unit: s.unit, deliverables: s.deliverables })),
      evidence: pf.map((p) => ({ kind: p.kind, title: p.title, result: p.resultMetric })),
      opportunity: opp,
    });
    try {
      const analysis = await askJson(SYSTEM, `Analyse this opportunity and respond with the schema.\n\n${context}`, analysisSchema);
      const q = await askJson(
        SYSTEM,
        `Generate 5-8 adaptive discovery questions for this specific opportunity. Each question must matter for scoping or pricing THIS opportunity. Do not repeat obvious generic questions.\n\n${context}`,
        questionsSchema
      );
      await db
        .update(discoverySessions)
        .set({ analysis: analysis, questions: q.questions.map((x, i) => ({ id: `q_${i}`, question: x.question, why: x.why })), status: "analyzed" })
        .where(eq(discoverySessions.id, sessionId));
    } catch {
      await db
        .update(discoverySessions)
        .set({ analysis: { summary: "AI analysis unavailable — check provider configuration.", likelyNeeds: [], unclearOrMissing: [], risksAndAssumptions: [], relevantServiceIds: [], likelyConcerns: [], infoNeededToPrice: [] }, questions: heuristicQuestions(opp?.industry ?? null).map((x, i) => ({ id: `q_${i}`, question: x.question, why: x.why })), status: "analyzed" })
        .where(eq(discoverySessions.id, sessionId));
    }
  } else {
    await db
      .update(discoverySessions)
      .set({ questions: heuristicQuestions(opp?.industry ?? null).map((x, i) => ({ id: `q_${i}`, question: x.question, why: x.why })), status: "analyzed" })
      .where(eq(discoverySessions.id, sessionId));
  }
  redirect(`/studio/${sessionId}`);
}

export async function answerQuestionsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await requireTenant();
  const sessionId = String(formData.get("sessionId") || "");
  const [session] = await db.select().from(discoverySessions).where(and(eq(discoverySessions.id, sessionId), eq(discoverySessions.businessId, t.businessId))).limit(1);
  if (!session) return { error: "Session not found." };

  const answers: Record<string, string> = {};
  session.questions.forEach((q, i) => {
    const a = String(formData.get(`q_${i}`) || "").trim();
    if (a) answers[q.question] = a;
  });

  const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, session.opportunityId)).limit(1);
  const svc = await db.select().from(services).where(and(eq(services.businessId, t.businessId), eq(services.active, true)));
  const pkgs = await db.select().from(packages).where(and(eq(packages.businessId, t.businessId), eq(packages.active, true)));

  let recommendations: Recommendation[] = [];
  if (aiAvailable()) {
    try {
      const res = await askJson(
        SYSTEM,
        `Based on this opportunity, discovery answers and the user's actual service catalogue, recommend features/services for the proposal. Only recommend things the user can actually deliver (match serviceName to their catalogue where possible). If a service has a price, you may reference it as estimatedCost; otherwise omit estimatedCost entirely.\n\nOpportunity: ${JSON.stringify(opp)}\nAnswers: ${JSON.stringify(answers)}\nCatalogue: ${JSON.stringify(svc.map((s) => ({ name: s.name, price: s.basePrice, unit: s.unit })))}\nPackages: ${JSON.stringify(pkgs.map((p) => ({ name: p.name, price: p.price, features: p.features })))}`,
        recommendationsSchema
      );
      recommendations = res.recommendations.map((r, i) => ({
        id: `rec_${i}`,
        name: r.name,
        what: r.what,
        why: r.why,
        problem: r.problem,
        level: r.level,
        serviceId: svc.find((s) => s.name.toLowerCase() === (r.serviceName ?? "").toLowerCase())?.id,
        estimatedCost: r.estimatedCost,
        timelineImpact: r.timelineImpact,
        decision: "pending" as const,
      }));
    } catch {
      recommendations = [];
    }
  }
  if (recommendations.length === 0) {
    recommendations = svc.slice(0, 6).map((s, i) => ({
      id: `rec_${i}`,
      name: s.name,
      what: s.description ?? s.name,
      why: "Matches your catalogue for this type of opportunity.",
      problem: "Core requirement",
      level: (i === 0 ? "essential" : i < 3 ? "recommended" : "optional") as Recommendation["level"],
      serviceId: s.id,
      estimatedCost: s.basePrice && Number(s.basePrice) > 0 ? s.basePrice : undefined,
      decision: "pending" as const,
    }));
  }

  await db.update(discoverySessions).set({ answers, recommendations, status: "ready" }).where(eq(discoverySessions.id, sessionId));
  revalidatePath(`/studio/${sessionId}`);
  return { ok: true };
}

export async function decideRecommendationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await requireTenant();
  const sessionId = String(formData.get("sessionId") || "");
  const recId = String(formData.get("recId") || "");
  const decision = String(formData.get("decision") || "") as Recommendation["decision"];
  const [session] = await db.select().from(discoverySessions).where(and(eq(discoverySessions.id, sessionId), eq(discoverySessions.businessId, t.businessId))).limit(1);
  if (!session) return { error: "Session not found." };
  const recs = session.recommendations.map((r) => (r.id === recId ? { ...r, decision } : r));
  await db.update(discoverySessions).set({ recommendations: recs }).where(eq(discoverySessions.id, sessionId));
  revalidatePath(`/studio/${sessionId}`);
  return { ok: true };
}

export async function generateProposalAction(formData: FormData) {
  const t = await requireTenant();
  const sessionId = String(formData.get("sessionId") || "");
  const complexity = (String(formData.get("complexity") || "standard") as "simple" | "standard" | "full");
  const [session] = await db.select().from(discoverySessions).where(and(eq(discoverySessions.id, sessionId), eq(discoverySessions.businessId, t.businessId))).limit(1);
  if (!session) redirect("/studio");
  const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, session.opportunityId)).limit(1);
  const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessId, t.businessId)).limit(1);
  const [fin] = await db.select().from(taxSettings).where(eq(taxSettings.businessId, t.businessId)).limit(1);
  const currency = fin?.currency ?? "NGN";
  const svc = await db.select().from(services).where(and(eq(services.businessId, t.businessId), eq(services.active, true)));
  const pkgs = await db.select().from(packages).where(and(eq(packages.businessId, t.businessId), eq(packages.active, true)));
  const pf = await db.select().from(portfolioItems).where(and(eq(portfolioItems.businessId, t.businessId), eq(portfolioItems.visible, true)));

  const included = session.recommendations.filter((r) => r.decision === "include");
  const content = emptyContent(complexity, currency);

  // Pricing comes ONLY from approved catalogue data — computed by the app, never the AI.
  const includedServices = included.map((r) => svc.find((s) => s.id === r.serviceId)).filter(Boolean) as typeof svc;
  const lines = includedServices.map((s) => ({ quantity: Number(s.defaultQuantity), unitPrice: Number(s.basePrice), lineDiscount: 0, lineTaxRate: 0 }));
  const totals = computeTotals(lines, { discountType: "none", discountValue: 0, taxRate: Number(fin?.defaultTaxRate ?? 0) });
  content.pricing = {
    subtotal: totals.subtotal,
    discount: totals.discountAmount,
    discountType: "none",
    discountValue: "0",
    taxRate: totals.taxRate,
    tax: totals.tax,
    total: totals.total,
    currency,
  };

  // Comparison table built from the user's real packages only.
  if (pkgs.length >= 2) {
    const allFeatures = Array.from(new Set(pkgs.flatMap((p) => p.features)));
    content.comparison = {
      enabled: true,
      columns: pkgs.map((p) => p.name),
      rows: (allFeatures.map((f) => ({
        feature: f,
        values: pkgs.map((p) => (p.features.includes(f) ? "Included" : "Not included")),
      })) as { feature: string; values: string[] }[]).concat([
        { feature: "Delivery timeline", values: pkgs.map((p) => (p.timelineDays ? `${p.timelineDays} days` : "—")) },
        { feature: "Support period", values: pkgs.map((p) => (p.supportDays ? `${p.supportDays} days` : "—")) },
        { feature: "Price", values: pkgs.map((p) => `${currency === "NGN" ? "₦" : currency} ${Number(p.price).toLocaleString()}`) },
      ]),
      recommended: pkgs.find((p) => p.recommended)?.name,
      note: "Values come directly from your configured packages.",
    };
  }

  // AI drafts section bodies; user edits everything before sending.
  const fallbackCtx: FallbackContext = {
    businessName: t.businessName,
    clientName: opp?.clientName ?? null,
    contactName: opp?.contactName ?? null,
    opportunityTitle: opp?.title ?? "the project",
    goals: opp?.goals ?? null,
    challenges: opp?.challenges ?? null,
    desiredOutcome: opp?.desiredOutcome ?? null,
    whatWeDo: profile?.whatWeDo ?? null,
    description: profile?.description ?? null,
    services: includedServices.map((s) => ({ name: s.name, description: s.description, scope: s.scope, deliverables: s.deliverables, durationDays: s.durationDays, exclusions: s.exclusions })),
    packages: pkgs.map((p) => ({ name: p.name, price: p.price, features: p.features, timelineDays: p.timelineDays, supportDays: p.supportDays, recommended: p.recommended })),
    evidence: pf.map((p) => ({ kind: p.kind, title: p.title, result: p.resultMetric })),
    pricing: { subtotal: totals.subtotal, discount: totals.discountAmount, tax: totals.tax, total: totals.total, currency },
    hasComparison: content.comparison.enabled && content.comparison.rows.length > 0,
    recommendedPackage: pkgs.find((p) => p.recommended)?.name ?? null,
    answers: session.answers,
  };

  const applyFallback = () => {
    const fallback = buildFallbackSections(fallbackCtx);
    for (const s of content.sections) {
      const body = fallback.get(s.kind);
      if (body && !s.body.trim()) s.body = body;
    }
    if (!content.assumptions.length) {
      content.assumptions = [
        "Timely feedback and approvals from the client at review points.",
        "Access to required systems, content and credentials by the agreed dates.",
        "Scope remains as described; changes are handled through a written change request.",
      ];
    }
    if (content.comparison.enabled && !content.comparison.note) {
      content.comparison.note = "Values come directly from the configured packages.";
    }
  };

  if (aiAvailable()) {
    const context = JSON.stringify({
      business: profile,
      opportunity: opp,
      answers: session.answers,
      analysis: session.analysis,
      includedServices: includedServices.map((s) => ({ name: s.name, description: s.description, scope: s.scope, deliverables: s.deliverables, price: s.basePrice, deliverablesUnit: s.unit, durationDays: s.durationDays, exclusions: s.exclusions })),
      packages: pkgs.map((p) => ({ name: p.name, price: p.price, features: p.features, recommended: p.recommended, timelineDays: p.timelineDays, supportDays: p.supportDays, terms: p.terms })),
      evidence: pf.map((p) => ({ kind: p.kind, title: p.title, description: p.description, result: p.resultMetric, date: p.date })),
      pricing: content.pricing,
      comparison: content.comparison,
      sections: content.sections.filter((s) => s.enabled).map((s) => ({ kind: s.kind, title: s.title })),
      tone: profile?.toneOfVoice ?? "professional",
    });

    const sectionGuide: Record<string, string> = {
      cover: "One elegant sentence positioning the engagement.",
      meta: "State the proposal reference and today's date plainly.",
      parties: "Present 'Prepared for' (the client and contact) and 'Prepared by' (the business) using supplied details only.",
      toc: "A brief note that the full table of contents appears in the document contents page.",
      executive_summary: "The single most important section: who the client is, the core problem, the proposed solution in one paragraph, the expected outcome and the investment. Persuasive, concise, confident.",
      understanding: "Show genuine understanding of the client's business, market and situation based ONLY on the supplied opportunity information.",
      challenges: "Articulate the client's current challenges and the cost of leaving them unresolved. Factual, no fearmongering.",
      objectives: "Numbered, measurable project objectives derived from the client's goals and discovery answers.",
      solution: "Describe the proposed solution clearly, weaving in the included services by name.",
      scope: "Concrete in-scope work items as a bullet list, drawn from the included services' scope and deliverables.",
      features: "Feature/functionality breakdown mapped to what the included services actually deliver.",
      deliverables: "Explicit list of deliverables the client receives, from the services' deliverables data.",
      why_needed: "Explain why this service is needed now: the problem, the implications of inaction, and how the proposed work addresses it. Balanced and honest.",
      benefits: "Realistic expected benefits. Distinguish expected outcomes from guarantees. Never invent metrics.",
      methodology: "Step-by-step implementation approach: discovery, design, build, review, launch — grounded in the services' delivery style.",
      timeline: "Phase-by-phase timeline with indicative durations from the services/packages data. If dates are unknown, use relative phases.",
      comparison: "Briefly introduce the package comparison table that follows and how to read it.",
      recommended: "Recommend the marked package and explain in 2-3 sentences why it fits this client's needs.",
      pricing: "Present the investment using the EXACT computed figures supplied in pricing (subtotal, discount, tax, total) with the currency symbol. Never alter numbers.",
      payment_schedule: "Propose a sensible payment structure (e.g. deposit percentage, milestone payments, balance) referencing the exact total. Percentages are suggestions; amounts must derive from the stated total only.",
      why_us: "Use ONLY the supplied evidence (portfolio, testimonials, certifications, results). If evidence is thin, write a modest factual statement and note that more portfolio items would strengthen this section.",
      portfolio: "Reference the supplied portfolio items by title and result metric. Do not invent any.",
      team: "Describe team composition generically based on the services involved; use supplied team bios only if provided.",
      assumptions: "List working assumptions, especially where discovery questions were unanswered.",
      exclusions: "What is NOT included, drawn from the services' exclusions and package terms.",
      risks: "Honest project risks and practical mitigations relevant to this scope.",
      terms: "Standard commercial terms summary (validity, revisions, payment, ownership) — generic and professional.",
      validity: "State how long the proposal remains valid (use the proposal's valid-until date if supplied, otherwise suggest 30 days).",
      acceptance: "Clear instructions for how the client can accept (secure link, selecting a package, signing).",
      contact: "Contact details and next steps using the business profile's contact information.",
    };

    try {
      const res = await askJson(
        SYSTEM,
        `Draft the complete content for EVERY requested proposal section of this document. This will become the full multi-page proposal.

For each section:
- Write 2-5 substantial paragraphs, or a bullet list where the guide says so. Never one-liners (except 'meta' and 'cover').
- Follow the per-section writing guide exactly.
- Ground EVERYTHING in the supplied context. Use the business profile's tone (${String(profile?.toneOfVoice ?? "professional")}).
- Use ONLY supplied facts: never invent clients, testimonials, awards, certifications, results or prices.
- For 'pricing' and 'payment_schedule', reproduce the exact computed totals supplied — the numbers are calculated by the application and must not change.
- Where information is missing, write professionally around it and surface it as an assumption.
- Write complete, send-ready prose — no placeholders, no bracketed blanks, no meta commentary, no padding to hit a length.
- Draft ONLY the sections listed in 'sections' — never invent extra sections; document length comes from the user's chosen structure, not from you.

Per-section guide:
${Object.entries(sectionGuide).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

Respond filling every section kind provided.

${context}`,
        contentSchema,
        { maxOutputTokens: 16000 }
      );
      for (const s of content.sections) {
        const match = res.sections.find((r) => r.kind === s.kind);
        if (match && match.body.trim()) s.body = match.body;
      }
      content.assumptions = res.assumptions;
      if (content.comparison.enabled && !content.comparison.note) {
        content.comparison.note = "Values come directly from the configured packages.";
      }
      // Fill any section the AI left empty with deterministic draft content
      applyFallback();
    } catch {
      // AI failed — fall back to deterministic draft content from real data
      applyFallback();
    }
  } else {
    // No AI provider configured — deterministic draft content from real data
    applyFallback();
  }

  const reference = await nextRef(t.businessId, "proposal");
  const [proposal] = await db
    .insert(proposals)
    .values({
      businessId: t.businessId,
      clientId: opp?.clientId ?? null,
      opportunityId: opp?.id ?? null,
      reference,
      title: opp?.title ?? "Proposal",
      status: "draft",
      currency,
      total: totals.total,
      currentVersion: 1,
    })
    .returning({ id: proposals.id });

  await db.insert(proposalVersions).values({ proposalId: proposal.id, version: 1, content, createdBy: t.user.id });
  await db.insert(proposalEvents).values({ proposalId: proposal.id, kind: "created", actor: t.user.email, data: { fromSession: sessionId } });
  await db.update(discoverySessions).set({ status: "generated" }).where(eq(discoverySessions.id, sessionId));
  if (opp) await db.update(opportunities).set({ status: "converted" }).where(eq(opportunities.id, opp.id));
  await logActivity(t.businessId, "proposal.generated", { actor: t.user.email, objectType: "proposal", objectId: proposal.id, details: { reference } });
  await notify(t.businessId, "proposal_created", `Proposal ${reference} generated`, { link: `/proposals/${proposal.id}` });
  redirect(`/proposals/${proposal.id}`);
}
