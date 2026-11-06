import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { saveClientAction, moveStageAction } from "@/app/actions/crm";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STAGES = [
  { id: "new_lead", label: "New lead" },
  { id: "contacted", label: "Contacted" },
  { id: "discovery_scheduled", label: "Discovery" },
  { id: "needs_identified", label: "Needs identified" },
  { id: "proposal_prep", label: "Proposal in prep" },
  { id: "proposal_sent", label: "Proposal sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "existing_client", label: "Existing client" },
  { id: "archived", label: "Archived" },
];

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-slate-300 text-xs font-medium mb-1";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  const t = await requireTenant();
  const { q, stage } = await searchParams;

  const conditions = [eq(clients.businessId, t.businessId)];
  if (q) conditions.push(sql`(${clients.name} ilike ${"%" + q + "%"} or coalesce(${clients.email},'') ilike ${"%" + q + "%"} or coalesce(${clients.contactPerson},'') ilike ${"%" + q + "%"})`);
  if (stage) conditions.push(eq(clients.pipelineStage, stage));

  const rows = await db.select().from(clients).where(and(...conditions)).orderBy(desc(clients.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients / CRM</h1>
          <p className="text-slate-400 text-sm mt-0.5">Every lead and client relationship in one place.</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={q ?? ""} placeholder="Search clients…" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm w-56" />
          <button className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3">Search</button>
        </form>
      </div>

      {/* Pipeline */}
      <div className="flex gap-1.5 flex-wrap">
        <Link href="/clients" className={`text-xs rounded-full px-3 py-1.5 border ${!stage ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"}`}>All ({rows.length})</Link>
        {STAGES.map((s) => (
          <Link key={s.id} href={`/clients?stage=${s.id}`} className={`text-xs rounded-full px-3 py-1.5 border ${stage === s.id ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"}`}>{s.label}</Link>
        ))}
      </div>

      <details className="rounded-xl bg-slate-900 border border-slate-800 p-5" open={rows.length === 0}>
        <summary className="text-white text-sm font-medium cursor-pointer">+ Add client / lead</summary>
        <form action={saveClientAction} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div><label className={labelCls}>Name *</label><input name="name" required className={input} /></div>
          <div>
            <label className={labelCls}>Type</label>
            <select name="type" className={input}><option value="organization">Organization</option><option value="individual">Individual</option></select>
          </div>
          <div><label className={labelCls}>Industry</label><input name="industry" className={input} /></div>
          <div><label className={labelCls}>Contact person</label><input name="contactPerson" className={input} /></div>
          <div><label className={labelCls}>Role / title</label><input name="role" className={input} /></div>
          <div><label className={labelCls}>Email</label><input name="email" type="email" className={input} /></div>
          <div><label className={labelCls}>Phone</label><input name="phone" className={input} /></div>
          <div><label className={labelCls}>Lead source</label><input name="leadSource" className={input} placeholder="Referral, X, Instagram…" /></div>
          <div>
            <label className={labelCls}>Pipeline stage</label>
            <select name="pipelineStage" className={input}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          </div>
          <div className="md:col-span-2"><label className={labelCls}>Tags (comma separated)</label><input name="tags" className={input} /></div>
          <div className="md:col-span-3"><label className={labelCls}>Notes</label><textarea name="notes" rows={2} className={input} /></div>
          <div className="md:col-span-3"><button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save client</button></div>
        </form>
      </details>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Source</th>
              <th className="text-left px-4 py-3">Stage</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Last interaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-900">
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.id}`} className="text-white hover:text-blue-300 font-medium">{c.name}</Link>
                  <div className="text-slate-500 text-xs">{c.relationshipStatus}{c.tags.length ? ` · ${c.tags.join(", ")}` : ""}</div>
                </td>
                <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{c.contactPerson ?? "—"}<div className="text-slate-500 text-xs">{c.email ?? ""}</div></td>
                <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{c.leadSource ?? "—"}</td>
                <td className="px-4 py-3">
                  <form action={moveStageAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={c.id} />
                    <select name="stage" defaultValue={c.pipelineStage} className="bg-slate-800 border border-slate-700 rounded text-xs text-white px-2 py-1">
                      {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <button className="text-slate-400 hover:text-blue-300 text-xs">→</button>
                  </form>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{c.lastInteractionAt ? new Date(c.lastInteractionAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No clients yet. Add your first lead above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
