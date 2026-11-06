import Link from "next/link";
import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { proposals, proposalVersions, proposalTokens, proposalEvents, changeRequests, clients, taxSettings, proposalAcceptances } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProposalEditor from "@/components/ProposalEditor";
import { updateProposalAction, setStatusAction, shareProposalAction, revokeTokenAction, duplicateProposalAction, convertToProjectAction, convertToQuotationAction, addChangeRequestAction } from "@/app/actions/proposals";
import { money } from "@/lib/money";
import type { ProposalContent } from "@/db/schema";

export const dynamic = "force-dynamic";

const input = "rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const STATUSES = ["draft", "discovery_in_progress", "ready_for_review", "sent", "viewed", "changes_requested", "accepted", "declined", "expired", "withdrawn", "converted_to_project"];

export default async function ProposalDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; token?: string; error?: string }> }) {
  const t = await requireTenant();
  const { id } = await params;
  const { saved, token, error } = await searchParams;
  const [p] = await db.select().from(proposals).where(and(eq(proposals.id, id), eq(proposals.businessId, t.businessId))).limit(1);
  if (!p) notFound();
  const [client] = p.clientId ? await db.select().from(clients).where(eq(clients.id, p.clientId)).limit(1) : [null];
  const versions = await db.select().from(proposalVersions).where(eq(proposalVersions.proposalId, p.id)).orderBy(desc(proposalVersions.version));
  const tokens = await db.select().from(proposalTokens).where(eq(proposalTokens.proposalId, p.id)).orderBy(desc(proposalTokens.createdAt));
  const events = await db.select().from(proposalEvents).where(eq(proposalEvents.proposalId, p.id)).orderBy(desc(proposalEvents.createdAt)).limit(20);
  const crs = await db.select().from(changeRequests).where(eq(changeRequests.proposalId, p.id)).orderBy(desc(changeRequests.createdAt));
  const acceptances = await db.select().from(proposalAcceptances).where(eq(proposalAcceptances.proposalId, p.id));
  const [fin] = await db.select().from(taxSettings).where(eq(taxSettings.businessId, t.businessId)).limit(1);
  const content = (versions[0]?.content ?? null) as ProposalContent | null;
  const locked = p.status === "accepted" && !!p.acceptedVersion;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/proposals" className="text-slate-500 text-xs hover:text-slate-300">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{p.reference}</h1>
          <p className="text-slate-400 text-sm">{p.title} · {client?.name ?? "No client"} · v{p.currentVersion} · {money(p.total, p.currency)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={setStatusAction} className="flex gap-1.5">
            <input type="hidden" name="proposalId" value={p.id} />
            <select name="status" defaultValue={p.status} className={input}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
            <button className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 hover:bg-slate-700">Set</button>
          </form>
          <form action={duplicateProposalAction}><input type="hidden" name="proposalId" value={p.id} /><button className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 hover:bg-slate-700">Duplicate</button></form>
          {p.status === "accepted" && (
            <>
              <form action={convertToProjectAction}><input type="hidden" name="proposalId" value={p.id} /><button className="rounded-lg bg-violet-600 text-white text-sm px-3 py-2 hover:bg-violet-500">Convert to project</button></form>
              <form action={convertToQuotationAction}><input type="hidden" name="proposalId" value={p.id} /><button className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 hover:bg-slate-700">Create quotation</button></form>
            </>
          )}
        </div>
      </div>

      {saved && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3">Saved as version {p.currentVersion}.</div>}
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3">{error}</div>}
      {locked && <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-3">🔒 This proposal was accepted (v{p.acceptedVersion}). The accepted version is locked against silent editing — duplicate it to create a new negotiation round.</div>}
      {token && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-3">
          <div className="text-blue-200 text-sm font-medium mb-1">Secure acceptance link created (copy it now — it is shown only once):</div>
          <code className="block bg-slate-950 rounded px-3 py-2 text-xs text-blue-300 break-all select-all">{`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/p/${token}`}</code>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {content ? (
            <form action={updateProposalAction}>
              <input type="hidden" name="proposalId" value={p.id} />
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 mb-4">
                <label className="block text-slate-300 text-xs mb-1">Proposal title</label>
                <input name="title" defaultValue={p.title} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
              </div>
              <ProposalEditor initial={content} currency={p.currency} taxDefault={Number(fin?.defaultTaxRate ?? 0)} />
            </form>
          ) : (
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-8 text-center text-slate-500 text-sm">No version content yet.</div>
          )}
        </div>

        <div className="space-y-4">
          {/* Share */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h2 className="text-white font-semibold text-sm">Share & acceptance</h2>
            <form action={shareProposalAction} className="space-y-2">
              <input type="hidden" name="proposalId" value={p.id} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 text-xs mb-1">Expires in (days)</label>
                  <input name="expiryDays" type="number" min="1" defaultValue={30} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs mb-1">Client email (optional)</label>
                  <input name="clientEmail" type="email" defaultValue={client?.email ?? ""} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-slate-300 text-xs"><input type="checkbox" name="requireEmailVerify" className="rounded bg-slate-800" /> Require email verification to accept</label>
              <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5">Generate secure link</button>
            </form>
            {tokens.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {tokens.map((tk) => {
                  const expired = tk.expiresAt < new Date();
                  const state = tk.revoked ? "revoked" : expired ? "expired" : "active";
                  return (
                    <div key={tk.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">v{tk.version} · {state} · {tk.viewCount} views · expires {new Date(tk.expiresAt).toLocaleDateString()}</span>
                      {!tk.revoked && !expired && (
                        <form action={revokeTokenAction}>
                          <input type="hidden" name="proposalId" value={p.id} />
                          <input type="hidden" name="tokenId" value={tk.id} />
                          <button className="text-red-400 hover:text-red-300">revoke</button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {acceptances.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <div className="text-emerald-400 text-xs font-medium mb-1">✓ Accepted</div>
                {acceptances.map((a) => (
                  <div key={a.id} className="text-slate-400 text-xs">By {a.signerName} on v{a.version} · {a.signatureType} signature · {new Date(a.createdAt).toLocaleString()} · hash {a.documentHash?.slice(0, 12)}…</div>
                ))}
              </div>
            )}
          </div>

          {/* Change requests */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-2">
            <h2 className="text-white font-semibold text-sm">Change requests ({crs.length})</h2>
            {crs.map((c) => (
              <div key={c.id} className="text-slate-300 text-xs border-l-2 border-slate-700 pl-2 py-1">
                <span className={c.fromClient ? "text-amber-400" : "text-slate-500"}>{c.fromClient ? "Client" : "You"}:</span> {c.message}
                <div className="text-slate-600">{new Date(c.createdAt).toLocaleString()}</div>
              </div>
            ))}
            <form action={addChangeRequestAction} className="flex gap-2 pt-1">
              <input type="hidden" name="proposalId" value={p.id} />
              <input name="message" placeholder="Add internal note / request…" className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-xs" />
              <button className="text-blue-400 text-xs hover:text-blue-300">Add</button>
            </form>
          </div>

          {/* Versions */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <h2 className="text-white font-semibold text-sm mb-2">Version history</h2>
            <ul className="space-y-1.5 text-xs">
              {versions.map((v) => (
                <li key={v.id} className="flex justify-between text-slate-400">
                  <span>v{v.version} {v.version === p.currentVersion && <span className="text-blue-400">current</span>}{v.version === p.acceptedVersion && <span className="text-emerald-400"> accepted</span>}</span>
                  <span>{new Date(v.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Audit trail */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <h2 className="text-white font-semibold text-sm mb-2">Audit trail</h2>
            <ul className="space-y-1.5 text-xs">
              {events.map((e) => (
                <li key={e.id} className="flex justify-between gap-2 text-slate-400">
                  <span>{e.kind.replace(/_/g, " ")}{e.actor ? ` · ${e.actor}` : ""}</span>
                  <span className="shrink-0">{new Date(e.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
