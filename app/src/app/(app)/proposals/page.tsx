import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { proposals, clients } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { createManualProposalAction } from "@/app/actions/proposals";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-700/50 text-slate-300",
  discovery_in_progress: "bg-blue-500/15 text-blue-300",
  ready_for_review: "bg-indigo-500/15 text-indigo-300",
  sent: "bg-amber-500/15 text-amber-300",
  viewed: "bg-cyan-500/15 text-cyan-300",
  changes_requested: "bg-orange-500/15 text-orange-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  declined: "bg-red-500/15 text-red-300",
  expired: "bg-slate-700/50 text-slate-400",
  withdrawn: "bg-slate-700/50 text-slate-400",
  converted_to_project: "bg-violet-500/15 text-violet-300",
};

export default async function ProposalsPage() {
  const t = await requireTenant();
  const rows = await db
    .select({
      id: proposals.id,
      reference: proposals.reference,
      title: proposals.title,
      status: proposals.status,
      total: proposals.total,
      currency: proposals.currency,
      version: proposals.currentVersion,
      updatedAt: proposals.updatedAt,
      clientName: clients.name,
    })
    .from(proposals)
    .leftJoin(clients, eq(clients.id, proposals.clientId))
    .where(eq(proposals.businessId, t.businessId))
    .orderBy(desc(proposals.updatedAt));

  const clientList = await db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.businessId, t.businessId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Proposals</h1>
          <p className="text-slate-400 text-sm mt-0.5">Multi-page documents with versioning and secure acceptance links.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio/new" className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5">AI proposal</Link>
        </div>
      </div>

      <details className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <summary className="text-white text-sm font-medium cursor-pointer">+ Create manually (without AI)</summary>
        <form action={createManualProposalAction} className="flex flex-wrap items-end gap-3 mt-4">
          <div className="flex-1 min-w-48">
            <label className="block text-slate-300 text-xs mb-1">Title</label>
            <input name="title" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" placeholder="Website redesign for XYZ" />
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Client</label>
            <select name="clientId" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm">
              <option value="">— none —</option>
              {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Complexity</label>
            <select name="complexity" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm">
              <option value="simple">Lean — 7 sections</option>
              <option value="standard" selected>Standard — 15 sections</option>
              <option value="full">Comprehensive — 30 sections</option>
            </select>
          </div>
          <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5">Create</button>
        </form>
      </details>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Reference</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Value</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Version</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900">
                <td className="px-4 py-3"><Link href={`/proposals/${p.id}`} className="text-blue-300 hover:text-blue-200 font-mono text-xs">{p.reference}</Link></td>
                <td className="px-4 py-3"><Link href={`/proposals/${p.id}`} className="text-white hover:text-blue-300">{p.title}</Link></td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{p.clientName ?? "—"}</td>
                <td className="px-4 py-3"><span className={`text-[11px] rounded-full px-2 py-1 ${STATUS_STYLES[p.status] ?? "bg-slate-700/50 text-slate-300"}`}>{p.status.replace(/_/g, " ")}</span></td>
                <td className="px-4 py-3 text-slate-200 hidden md:table-cell">{money(p.total, p.currency)}</td>
                <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">v{p.version}</td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{new Date(p.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No proposals yet. Use the AI Studio or create one manually.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
