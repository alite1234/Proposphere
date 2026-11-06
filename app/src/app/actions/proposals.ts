"use server";

import { db } from "@/db";
import { proposals, proposalVersions, proposalTokens, proposalEvents, proposalAcceptances, changeRequests, projects, projectTasks, clients, taxSettings, quotations, quotationItems } from "@/db/schema";
import { requireTenant, logActivity, notify, nextRef } from "@/lib/server";
import { generateToken, documentHash } from "@/lib/tokens";
import { computeTotals, num } from "@/lib/money";
import { emptyContent } from "@/lib/proposal-defaults";
import { and, eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ProposalContent } from "@/db/schema";

async function owned(proposalId: string) {
  const t = await requireTenant();
  const [p] = await db.select().from(proposals).where(and(eq(proposals.id, proposalId), eq(proposals.businessId, t.businessId))).limit(1);
  if (!p) redirect("/proposals");
  return { t, p };
}

export async function createManualProposalAction(formData: FormData) {
  const t = await requireTenant();
  const [fin] = await db.select().from(taxSettings).where(eq(taxSettings.businessId, t.businessId)).limit(1);
  const currency = fin?.currency ?? "NGN";
  const reference = await nextRef(t.businessId, "proposal");
  const complexity = (String(formData.get("complexity") || "standard") as "simple" | "standard" | "full");
  const content = emptyContent(complexity, currency);
  const clientId = String(formData.get("clientId") || "") || null;
  const [p] = await db
    .insert(proposals)
    .values({
      businessId: t.businessId,
      clientId,
      reference,
      title: String(formData.get("title") || "Untitled proposal").trim() || "Untitled proposal",
      status: "draft",
      currency,
      currentVersion: 1,
    })
    .returning({ id: proposals.id });
  await db.insert(proposalVersions).values({ proposalId: p.id, version: 1, content, createdBy: t.user.id });
  await db.insert(proposalEvents).values({ proposalId: p.id, kind: "created", actor: t.user.email });
  await logActivity(t.businessId, "proposal.created", { actor: t.user.email, objectType: "proposal", objectId: p.id, details: { reference } });
  redirect(`/proposals/${p.id}`);
}

export async function updateProposalAction(formData: FormData) {
  const { t, p } = await owned(String(formData.get("proposalId") || ""));
  if (p.status === "accepted" && p.acceptedVersion) {
    // Locked: accepted versions cannot be silently edited. Create a new version instead.
    redirect(`/proposals/${p.id}?error=This+proposal+has+been+accepted+and+is+locked.+Duplicate+it+to+make+changes.`);
  }

  const existing = await db.select().from(proposalVersions).where(eq(proposalVersions.proposalId, p.id)).orderBy(desc(proposalVersions.version)).limit(1);
  const base = existing[0]?.content as ProposalContent | undefined;
  const content: ProposalContent = base ? JSON.parse(JSON.stringify(base)) : emptyContent("standard", p.currency);
  // Sections
  const sectionIds = formData.getAll("sectionId").map(String);
  const enabledIds = new Set(formData.getAll("sectionEnabled").map(String));
  content.sections = sectionIds.map((sid) => {
    const prev = content.sections.find((s) => s.id === sid);
    return {
      id: sid,
      kind: prev?.kind ?? sid,
      title: String(formData.get(`section_title_${sid}`) || prev?.title || sid),
      enabled: enabledIds.has(sid),
      body: String(formData.get(`section_body_${sid}`) || ""),
    } as ProposalContent["sections"][number];
  });

  // Comparison table
  const cmpEnabled = formData.get("cmp_enabled") === "on";
  const columns = String(formData.get("cmp_columns") || "").split("|").map((x) => x.trim()).filter(Boolean);
  const rows: { feature: string; values: string[] }[] = [];
  const featureNames = formData.getAll("cmp_feature").map(String);
  featureNames.forEach((f, i) => {
    const values = columns.map((_, ci) => String(formData.get(`cmp_val_${i}_${ci}`) || ""));
    if (f.trim()) rows.push({ feature: f.trim(), values });
  });
  content.comparison = {
    enabled: cmpEnabled,
    columns,
    rows,
    recommended: String(formData.get("cmp_recommended") || "") || undefined,
    note: String(formData.get("cmp_note") || "") || undefined,
  };

  // Pricing — recalculated server-side from inputs
  const linesRaw = String(formData.get("pricing_lines") || "[]");
  let lines: { quantity: number; unitPrice: number; lineDiscount: number; lineTaxRate: number }[] = [];
  try { lines = JSON.parse(linesRaw); } catch {}
  const discountType = (String(formData.get("discountType") || "none") as "none" | "amount" | "percent");
  const totals = computeTotals(lines, { discountType, discountValue: String(formData.get("discountValue") || "0"), taxRate: String(formData.get("taxRate") || "0") });
  content.pricing = {
    subtotal: totals.subtotal,
    discount: totals.discountAmount,
    discountType,
    discountValue: totals.discountValue,
    taxRate: totals.taxRate,
    tax: totals.tax,
    total: totals.total,
    currency: p.currency,
  };
  content.assumptions = String(formData.get("assumptions") || "").split("\n").map((x) => x.trim()).filter(Boolean);

  // Save as new version
  const newVersion = p.currentVersion + 1;
  await db.insert(proposalVersions).values({ proposalId: p.id, version: newVersion, content, createdBy: t.user.id });
  await db
    .update(proposals)
    .set({
      title: String(formData.get("title") || p.title).trim() || p.title,
      status: formData.get("status") ? String(formData.get("status")) : p.status,
      total: totals.total,
      currentVersion: newVersion,
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, p.id));
  await db.insert(proposalEvents).values({ proposalId: p.id, kind: "revision", actor: t.user.email, data: { version: newVersion } });
  await logActivity(t.businessId, "proposal.updated", { actor: t.user.email, objectType: "proposal", objectId: p.id, details: { version: newVersion } });
  revalidatePath(`/proposals/${p.id}`);
  redirect(`/proposals/${p.id}?saved=1`);
}

export async function setStatusAction(formData: FormData) {
  const { t, p } = await owned(String(formData.get("proposalId") || ""));
  const status = String(formData.get("status") || "draft");
  await db.update(proposals).set({ status, updatedAt: new Date() }).where(eq(proposals.id, p.id));
  await db.insert(proposalEvents).values({ proposalId: p.id, kind: status === "sent" ? "sent" : "status_changed", actor: t.user.email, data: { status } });
  await logActivity(t.businessId, "proposal.status_changed", { actor: t.user.email, objectType: "proposal", objectId: p.id, details: { status } });
  if (status === "sent") await notify(t.businessId, "proposal_sent", `Proposal ${p.reference} marked as sent`, { link: `/proposals/${p.id}` });
  revalidatePath(`/proposals/${p.id}`);
}

export async function shareProposalAction(formData: FormData) {
  const { t, p } = await owned(String(formData.get("proposalId") || ""));
  const days = Number(formData.get("expiryDays") || 30);
  const requireEmailVerify = formData.get("requireEmailVerify") === "on";
  const clientEmail = String(formData.get("clientEmail") || "") || null;
  const { raw, hash } = generateToken();
  await db.insert(proposalTokens).values({
    proposalId: p.id,
    tokenHash: hash,
    version: p.currentVersion,
    expiresAt: new Date(Date.now() + days * 24 * 3600 * 1000),
    requireEmailVerify,
    clientEmail,
  });
  await db.update(proposals).set({ status: p.status === "draft" ? "sent" : p.status, updatedAt: new Date() }).where(eq(proposals.id, p.id));
  await db.insert(proposalEvents).values({ proposalId: p.id, kind: "link_created", actor: t.user.email, data: { expiresInDays: days } });
  await logActivity(t.businessId, "proposal.shared", { actor: t.user.email, objectType: "proposal", objectId: p.id });
  revalidatePath(`/proposals/${p.id}`);
  redirect(`/proposals/${p.id}?token=${encodeURIComponent(raw)}`);
}

export async function revokeTokenAction(formData: FormData) {
  const { t } = await owned(String(formData.get("proposalId") || ""));
  const tokenId = String(formData.get("tokenId") || "");
  await db.update(proposalTokens).set({ revoked: true }).where(and(eq(proposalTokens.id, tokenId), eq(proposalTokens.proposalId, String(formData.get("proposalId")))));
  await logActivity(t.businessId, "proposal.token_revoked", { actor: t.user.email, objectType: "proposal", objectId: String(formData.get("proposalId")) });
  revalidatePath(`/proposals/${String(formData.get("proposalId"))}`);
}

export async function duplicateProposalAction(formData: FormData) {
  const { t, p } = await owned(String(formData.get("proposalId") || ""));
  const reference = await nextRef(t.businessId, "proposal");
  const [copy] = await db
    .insert(proposals)
    .values({
      businessId: t.businessId,
      clientId: p.clientId,
      reference,
      title: `${p.title} (copy)`,
      status: "draft",
      currency: p.currency,
      total: p.total,
      template: p.template,
      currentVersion: 1,
    })
    .returning({ id: proposals.id });
  const [latest] = await db.select().from(proposalVersions).where(eq(proposalVersions.proposalId, p.id)).orderBy(desc(proposalVersions.version)).limit(1);
  if (latest) await db.insert(proposalVersions).values({ proposalId: copy.id, version: 1, content: latest.content, createdBy: t.user.id });
  await logActivity(t.businessId, "proposal.duplicated", { actor: t.user.email, objectType: "proposal", objectId: copy.id });
  redirect(`/proposals/${copy.id}`);
}

export async function addChangeRequestAction(formData: FormData) {
  const { t, p } = await owned(String(formData.get("proposalId") || ""));
  const message = String(formData.get("message") || "").trim();
  if (!message) return;
  await db.insert(changeRequests).values({ proposalId: p.id, fromClient: false, message });
  await db.update(proposals).set({ status: "changes_requested", updatedAt: new Date() }).where(eq(proposals.id, p.id));
  await db.insert(proposalEvents).values({ proposalId: p.id, kind: "change_requested", actor: t.user.email, data: { message } });
  revalidatePath(`/proposals/${p.id}`);
}

export async function convertToProjectAction(formData: FormData) {
  const { t, p } = await owned(String(formData.get("proposalId") || ""));
  if (p.status !== "accepted") redirect(`/proposals/${p.id}?error=Only+accepted+proposals+can+be+converted+to+projects.`);
  const [project] = await db
    .insert(projects)
    .values({
      businessId: t.businessId,
      clientId: p.clientId,
      proposalId: p.id,
      name: p.title,
      status: "planning",
      currency: p.currency,
      value: p.total,
    })
    .returning({ id: projects.id });
  await db.update(proposals).set({ status: "converted_to_project" }).where(eq(proposals.id, p.id));
  await db.insert(proposalEvents).values({ proposalId: p.id, kind: "converted", actor: t.user.email });
  await logActivity(t.businessId, "project.created_from_proposal", { actor: t.user.email, objectType: "project", objectId: project.id });
  await notify(t.businessId, "project_created", `Project created from ${p.reference}`, { link: `/projects/${project.id}` });
  redirect(`/projects/${project.id}`);
}

export async function convertToQuotationAction(formData: FormData) {
  const { t, p } = await owned(String(formData.get("proposalId") || ""));
  const reference = await nextRef(t.businessId, "quotation");
  const content = (await db.select().from(proposalVersions).where(eq(proposalVersions.proposalId, p.id)).orderBy(desc(proposalVersions.version)).limit(1))[0]?.content as ProposalContent | undefined;
  const [q] = await db
    .insert(quotations)
    .values({
      businessId: t.businessId,
      clientId: p.clientId,
      proposalId: p.id,
      reference,
      status: "draft",
      currency: p.currency,
      subtotal: content?.pricing.subtotal ?? "0",
      discountType: (content?.pricing.discountType as "none" | "amount" | "percent") ?? "none",
      discountValue: content?.pricing.discountValue ?? "0",
      taxRate: content?.pricing.taxRate ?? "0",
      tax: content?.pricing.tax ?? "0",
      total: p.total,
      snapshot: { fromProposal: p.reference },
    })
    .returning({ id: quotations.id });
  redirect(`/quotations/${q.id}`);
}

// ---------- Public client-side actions (token-gated, no tenant session) ----------

export async function clientAcceptAction(formData: FormData) {
  const raw = String(formData.get("token") || "");
  const signerName = String(formData.get("signerName") || "").trim();
  const signerEmail = String(formData.get("signerEmail") || "").trim();
  const signatureType = String(formData.get("signatureType") || "click") as "click" | "typed" | "drawn";
  const signatureData = String(formData.get("signatureData") || "") || null;
  const statementChecked = formData.get("statement") === "on";
  const selectedPackageId = String(formData.get("selectedPackageId") || "") || null;

  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? null;
  const userAgent = h.get("user-agent") ?? null;

  const { sha256 } = await import("@/lib/auth");
  const tokenHash = sha256(raw);
  const [token] = await db.select().from(proposalTokens).where(eq(proposalTokens.tokenHash, tokenHash)).limit(1);
  if (!token || token.revoked || token.expiresAt < new Date()) {
    redirect(`/p/${encodeURIComponent(raw)}?error=This+link+is+invalid,+expired+or+revoked.`);
  }
  if (token.requireEmailVerify && token.clientEmail && signerEmail.toLowerCase() !== token.clientEmail.toLowerCase()) {
    redirect(`/p/${encodeURIComponent(raw)}?error=Please+confirm+with+the+email+address+the+proposal+was+sent+to.`);
  }
  if (!signerName || !statementChecked) {
    redirect(`/p/${encodeURIComponent(raw)}?error=Please+enter+your+name+and+tick+the+acceptance+statement.`);
  }

  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, token.proposalId)).limit(1);
  if (!proposal) redirect(`/p/${encodeURIComponent(raw)}?error=Proposal+not+found.`);
  if (proposal.status === "accepted") redirect(`/p/${encodeURIComponent(raw)}?ok=already`);

  const [version] = await db.select().from(proposalVersions).where(and(eq(proposalVersions.proposalId, proposal.id), eq(proposalVersions.version, token.version))).limit(1);
  const content = version?.content as ProposalContent | undefined;

  await db.insert(proposalAcceptances).values({
    proposalId: proposal.id,
    version: token.version,
    tokenId: token.id,
    signerName,
    signerEmail: signerEmail || null,
    signatureType,
    signatureData,
    selectedPackageId,
    acceptedAmount: content?.pricing.total ?? proposal.total,
    currency: proposal.currency,
    documentHash: documentHash(content ?? {}),
    ip,
    userAgent,
  });
  await db.update(proposals).set({ status: "accepted", acceptedVersion: token.version, updatedAt: new Date() }).where(eq(proposals.id, proposal.id));
  await db.insert(proposalEvents).values({ proposalId: proposal.id, kind: "accepted", actor: signerName, data: { version: token.version, signatureType } });
  await notify(proposal.businessId, "proposal_accepted", `Proposal ${proposal.reference} was accepted by ${signerName}`, { link: `/proposals/${proposal.id}` });
  await logActivity(proposal.businessId, "proposal.accepted", { actor: signerName, objectType: "proposal", objectId: proposal.id, details: { version: token.version } });
  redirect(`/p/${encodeURIComponent(raw)}?ok=accepted`);
}

export async function clientDeclineAction(formData: FormData) {
  const raw = String(formData.get("token") || "");
  const reason = String(formData.get("reason") || "").trim();
  const { sha256 } = await import("@/lib/auth");
  const [token] = await db.select().from(proposalTokens).where(eq(proposalTokens.tokenHash, sha256(raw))).limit(1);
  if (!token || token.revoked || token.expiresAt < new Date()) redirect(`/p/${encodeURIComponent(raw)}?error=Invalid+link.`);
  await db.update(proposals).set({ status: "declined", updatedAt: new Date() }).where(eq(proposals.id, token.proposalId));
  await db.insert(proposalEvents).values({ proposalId: token.proposalId, kind: "declined", actor: "client", data: { reason } });
  if (reason) await db.insert(changeRequests).values({ proposalId: token.proposalId, fromClient: true, message: `Declined: ${reason}` });
  await notify((await db.select().from(proposals).where(eq(proposals.id, token.proposalId)).limit(1))[0].businessId, "proposal_declined", "A proposal was declined", { link: `/proposals/${token.proposalId}` });
  redirect(`/p/${encodeURIComponent(raw)}?ok=declined`);
}

export async function clientChangeRequestAction(formData: FormData) {
  const raw = String(formData.get("token") || "");
  const message = String(formData.get("message") || "").trim();
  if (!message) redirect(`/p/${encodeURIComponent(raw)}?error=Please+describe+the+changes+you+need.`);
  const { sha256 } = await import("@/lib/auth");
  const [token] = await db.select().from(proposalTokens).where(eq(proposalTokens.tokenHash, sha256(raw))).limit(1);
  if (!token || token.revoked || token.expiresAt < new Date()) redirect(`/p/${encodeURIComponent(raw)}?error=Invalid+link.`);
  await db.insert(changeRequests).values({ proposalId: token.proposalId, fromClient: true, message });
  await db.update(proposals).set({ status: "changes_requested", updatedAt: new Date() }).where(eq(proposals.id, token.proposalId));
  await db.insert(proposalEvents).values({ proposalId: token.proposalId, kind: "change_requested", actor: "client", data: { message } });
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, token.proposalId)).limit(1);
  await notify(proposal.businessId, "revision_requested", `Change requested on ${proposal.reference}`, { link: `/proposals/${proposal.id}` });
  redirect(`/p/${encodeURIComponent(raw)}?ok=change_requested`);
}
