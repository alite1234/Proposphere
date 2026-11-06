import { db } from "@/db";
import { proposalTokens, proposals, proposalVersions, brandSettings, businessProfiles, businesses, proposalAcceptances } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { rateLimit, sha256 } from "@/lib/auth";
import { headers } from "next/headers";
import { money } from "@/lib/money";
import { clientAcceptAction, clientDeclineAction, clientChangeRequestAction } from "@/app/actions/proposals";
import type { ProposalContent } from "@/db/schema";
import PublicProposalClient from "./PublicProposalClient";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { token: raw } = await params;
  const { error, ok } = await searchParams;
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`view:${ip}:${raw.slice(0, 8)}`, 30, 60_000)) {
    return <Centered title="Too many requests" body="Please try again in a minute." />;
  }

  const [token] = await db.select().from(proposalTokens).where(eq(proposalTokens.tokenHash, sha256(raw))).limit(1);
  if (!token || token.revoked) return <Centered title="Link invalid" body="This proposal link is invalid or has been revoked." />;
  if (token.expiresAt < new Date()) return <Centered title="Link expired" body="This proposal link has expired. Please ask for a fresh link." />;

  await db.update(proposalTokens).set({ viewCount: sql`${proposalTokens.viewCount} + 1` }).where(eq(proposalTokens.id, token.id));

  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, token.proposalId)).limit(1);
  if (!proposal) notFound();
  const [version] = await db.select().from(proposalVersions).where(eq(proposalVersions.proposalId, proposal.id)).limit(1);
  const content = (version?.content ?? null) as ProposalContent | null;
  const [brand] = await db.select().from(brandSettings).where(eq(brandSettings.businessId, proposal.businessId)).limit(1);
  const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessId, proposal.businessId)).limit(1);
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, proposal.businessId)).limit(1);
  const existing = await db.select().from(proposalAcceptances).where(eq(proposalAcceptances.proposalId, proposal.id)).limit(1);

  if (existing[0] || proposal.status === "accepted") {
    return (
      <Centered
        title="Proposal already accepted"
        body={`This proposal was accepted on ${existing[0] ? new Date(existing[0].createdAt).toLocaleDateString() : "a previous date"}. The accepted version is locked.`}
      />
    );
  }

  return (
    <PublicProposalClient
      raw={raw}
      error={error}
      ok={ok}
      proposal={{
        reference: proposal.reference,
        title: proposal.title,
        currency: proposal.currency,
        status: proposal.status,
        validUntil: proposal.validUntil,
      }}
      brand={{
        businessName: biz?.name ?? "",
        logoUrl: brand?.logoUrl ?? null,
        primaryColor: brand?.primaryColor ?? "#1e40af",
        accentColor: brand?.accentColor ?? "#f59e0b",
        footer: brand?.footerText ?? null,
        signatureUrl: brand?.signatureUrl ?? null,
      }}
      profile={{ email: profile?.email ?? null, phone: profile?.phone ?? null, website: profile?.website ?? null, description: profile?.description ?? null }}
      content={content}
      requireEmailVerify={token.requireEmailVerify}
      clientEmail={token.clientEmail}
      acceptAction={clientAcceptAction}
      declineAction={clientDeclineAction}
      changeRequestAction={clientChangeRequestAction}
    />
  );
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-white text-xl font-bold mb-2">{title}</div>
        <p className="text-slate-400 text-sm">{body}</p>
      </div>
    </div>
  );
}
