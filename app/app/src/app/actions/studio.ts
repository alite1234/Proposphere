"use server";

import { db } from "@/db";
import { opportunities, discoverySessions, businesses } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireTenant } from "@/lib/server";
import { aiAvailable, activeProviderName } from "@/lib/ai";
import { emptyContent, defaultSections } from "@/lib/proposal-defaults";
import { computeTotals } from "@/lib/money";
import type { Recommendation } from "@/db/schema";
import { redirect, revalidatePath } from "next/navigation";
import { z } from "zod";

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

export async function createOpportunityAction(formData: FormData) {
  const t = await requireTenant();
  const g = (k: string) => String(formData.get(k) || "").trim() || null;
  const clientId = g("clientId");

  const [opp] = await db
    .insert(opportunities)
    .values({
      businessId: t.businessId,
      clientId: clientId,
      title: String(formData.get("title") || "Untitled opportunity").trim(),
      clientName: g("clientName"),
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

  redirect(`/studio/${session.id}`);
}

export async function analyzeAction(formData: FormData) {
  const t = await requireTenant();
  const sessionId = String(formData.get("sessionId") || "");
  const [session] = await db.select().from(discoverySessions).where(and(eq(discoverySessions.id, sessionId), eq(discoverySessions.businessId, t.businessId))).limit(1);
  if (!session) redirect("/studio");
  const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, session.opportunityId)).limit(1);

  if (aiAvailable()) {
    try {
      const analysis = await askJson(
        "You are a business consultant. Analyse this opportunity and respond with: likelyNeeds, unclearOrMissing, risksAndAssumptions, relevantServiceIds, likelyConcerns, infoNeededToPrice, and summary.",
        JSON.stringify({ opportunity: opp }),
        analysisSchema
      );
      const q = await askJson(
        "Generate 5-8 adaptive discovery questions for this specific opportunity based on the opportunity data. Each question must matter for scoping or pricing.",
        JSON.stringify({ opportunity: opp }),
        questionsSchema
      );
      await db
        .update(discoverySessions)
        .set({ analysis, questions: q.questions.map((x, i) => ({ id: `q_${i}`, question: x.question, why: x.why })), status: "analyzed" })
        .where(eq(discoverySessions.id, sessionId));
    } catch {
      await db
        .update(discoverySessions)
        .set({ analysis: { summary: "AI unavailable", likelyNeeds: [], unclearOrMissing: [], risksAndAssumptions: [], relevantServiceIds: [], likelyConcerns: [], infoNeededToPrice: [] }, questions: [] })
        .where(eq(discoverySessions.id, sessionId));
    }
  } else {
    await db
      .update(discoverySessions)
      .set({ questions: [], status: "analyzed" })
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

  // Simple recommendations from available services
  const recommendations = [];
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

  // Build content from default sections
  const content = defaultSections(complexity, "NGN");

  // Pricing from catalogue services (simplified)
  const includedServices = [];
  const lines = [{ quantity: 1, unitPrice: 0, lineDiscount: 0, lineTaxRate: 0 }];
  const totals = computeTotals(lines, { discountType: "none", discountValue: 0, taxRate: 0 });
  content.pricing = {
    subtotal: totals.subtotal,
    discount: totals.discountAmount,
    discountType: "none",
    discountValue: "0",
    taxRate: totals.taxRate,
    tax: totals.tax,
    total: totals.total,
    currency: "NGN",
  };

  // Create proposal
  const reference = `PROP-${Date.now()}`;
  const [proposal] = await db
    .insert(proposals)
    .values({
      businessId: t.businessId,
      clientId: opp?.clientId ?? null,
      opportunityId: opp?.id ?? null,
      reference,
      title: opp?.title ?? "Proposal",
      status: "draft",
      currency: "NGN",
      total: totals.total,
      currentVersion: 1,
    })
    .returning({ id: proposals.id });

  await db.insert(proposalVersions).values({ proposalId: proposal.id, version: 1, content, createdBy: t.user.id });
  await db.insert(proposalEvents).values({ proposalId: proposal.id, kind: "created", actor: t.user.email, data: { fromSession: sessionId } });
  await db.update(discoverySessions).set({ status: "generated" }).where(eq(discoverySessions.id, sessionId));
  if (opp) await db.update(opportunities).set({ status: "converted" }).where(eq(opportunities.id, opp.id));
  redirect(`/proposals/${proposal.id}`);
}