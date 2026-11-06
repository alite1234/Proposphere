import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { clients, clientInteractions, proposals, quotations, payments, projects, receipts } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { addInteractionAction, saveClientAction, deleteClientAction } from "@/app/actions/crm";
import { money } from "@/lib/money";
import { taxSettings } from "@/db/schema";
import Link from "next/link";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-slate-300 text-xs font-medium mb-1";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  const { id } = await params;
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.businessId, t.businessId))).limit(1);
  if (!client) notFound();
  const [fin] = await db.select().from(taxSettings).where(eq(taxSettings.businessId, t.businessId)).limit(1);
  const currency = fin?.currency ?? "NGN";

  const [interactions, props, quotes, pays, projs, recs] = await Promise.all([
    db.select().from(clientInteractions).where(eq(clientInteractions.clientId, id)).orderBy(desc(clientInteractions.createdAt)),
    db.select().from(proposals).where(and(eq(proposals.businessId, t.businessId), eq(proposals.clientId, id))).orderBy(desc(proposals.createdAt)),
    db.select().from(quotations).where(and(eq(quotations.businessId, t.businessId), eq(quotations.clientId, id))).orderBy(desc(quotations.createdAt)),
    db.select().from(payments).where(and(eq(payments.businessId, t.businessId), eq(payments.clientId, id))).orderBy(desc(payments.createdAt)),
    db.select().from(projects).where(and(eq(projects.businessId, t.businessId), eq(projects.clientId, id))),
    db.select().from(receipts).where(and(eq(receipts.businessId, t.businessId), eq(receipts.clientId, id))),
  ]);

  const lifetimeRevenue = pays.filter((p) => p.status === "confirmed" && p.paymentType !== "refund").reduce((a, p) => a + Number(p.amount), 0);
  const outstanding = quotes.filter((q) => q.status === "issued" || q.status === "viewed" || q.status === "accepted").reduce((a, q) => a + Number(q.total), 0) - lifetimeRevenue;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/clients" className="text-slate-500 text-xs hover:text-slate-300">← Back to clients</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{client.name}</h1>
          <p className="text-slate-400 text-sm">{client.contactPerson ?? ""}{client.role ? ` · ${client.role}` : ""} · {client.relationshipStatus}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/studio/new?clientId=${client.id}`} className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5">New proposal</Link>
          <Link href={`/quotations`} className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 hover:bg-slate-700">New quotation</Link>
          <form action={deleteClientAction}>
            <input type="hidden" name="id" value={client.id} />
            <button className="rounded-lg bg-slate-800 border border-slate-700 text-red-400 text-sm px-4 py-2.5 hover:bg-red-500/10">Delete</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4"><div className="text-slate-400 text-xs">Lifetime revenue</div><div className="text-white text-xl font-bold mt-1">{money(lifetimeRevenue, currency)}</div></div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4"><div className="text-slate-400 text-xs">Proposals</div><div className="text-white text-xl font-bold mt-1">{props.length}</div></div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4"><div className="text-slate-400 text-xs">Quotations</div><div className="text-white text-xl font-bold mt-1">{quotes.length}</div></div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4"><div className="text-slate-400 text-xs">Projects</div><div className="text-white text-xl font-bold mt-1">{projs.length}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Interactions */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <h2 className="text-white font-semibold text-sm mb-3">Interaction timeline</h2>
            <form action={addInteractionAction} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <input type="hidden" name="clientId" value={id} />
              <select name="kind" className={input}><option value="note">Note</option><option value="call">Call</option><option value="meeting">Meeting</option><option value="email">Email</option><option value="message">Message</option></select>
              <input name="summary" placeholder="What happened?" className={input + " sm:col-span-2"} />
              <input name="followUpAt" type="date" className={input} title="Follow-up date" />
              <input name="outcome" placeholder="Outcome" className={input} />
              <input name="nextAction" placeholder="Next action" className={input + " sm:col-span-2"} />
              <button className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-500 sm:col-span-1">Record</button>
            </form>
            {interactions.length === 0 ? (
              <p className="text-slate-500 text-sm">No interactions recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {interactions.map((i) => (
                  <li key={i.id} className="border-l-2 border-slate-700 pl-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 uppercase">{i.kind}</span>
                      <span className="text-slate-500">{new Date(i.createdAt).toLocaleString()}</span>
                      {i.followUpAt && <span className={new Date(i.followUpAt) < new Date() ? "text-red-400" : "text-blue-400"}>follow-up {new Date(i.followUpAt).toLocaleDateString()}</span>}
                    </div>
                    {i.summary && <div className="text-slate-200 text-sm mt-1">{i.summary}</div>}
                    {i.outcome && <div className="text-slate-400 text-xs">Outcome: {i.outcome}</div>}
                    {i.nextAction && <div className="text-slate-400 text-xs">Next: {i.nextAction}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <h2 className="text-white font-semibold text-sm mb-3">Documents & payments</h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-slate-400 text-xs uppercase mb-1.5">Proposals</div>
                {props.length === 0 ? <p className="text-slate-500 text-xs">None</p> : props.map((p) => (
                  <Link key={p.id} href={`/proposals/${p.id}`} className="flex justify-between py-1 text-slate-200 hover:text-blue-300"><span>{p.reference} · {p.title}</span><span className="text-slate-500">{p.status}</span></Link>
                ))}
              </div>
              <div>
                <div className="text-slate-400 text-xs uppercase mb-1.5">Quotations</div>
                {quotes.length === 0 ? <p className="text-slate-500 text-xs">None</p> : quotes.map((q) => (
                  <Link key={q.id} href={`/quotations/${q.id}`} className="flex justify-between py-1 text-slate-200 hover:text-blue-300"><span>{q.reference}</span><span className="text-slate-500">{money(q.total, currency)} · {q.status}</span></Link>
                ))}
              </div>
              <div>
                <div className="text-slate-400 text-xs uppercase mb-1.5">Payments</div>
                {pays.length === 0 ? <p className="text-slate-500 text-xs">None</p> : pays.map((p) => (
                  <div key={p.id} className="flex justify-between py-1 text-slate-200"><span>{p.reference} · {p.paymentType}</span><span className={p.status === "confirmed" ? "text-emerald-400" : "text-slate-500"}>{money(p.amount, p.currency)} · {p.status}</span></div>
                ))}
              </div>
              <div>
                <div className="text-slate-400 text-xs uppercase mb-1.5">Receipts</div>
                {recs.length === 0 ? <p className="text-slate-500 text-xs">None</p> : recs.map((r) => (
                  <Link key={r.id} href={`/receipts/${r.id}`} className="flex justify-between py-1 text-slate-200 hover:text-blue-300"><span>{r.reference}</span><span className="text-slate-500">{money(r.amount, r.currency)}</span></Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit client */}
        <form action={saveClientAction} className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm">Client details</h2>
          <input type="hidden" name="id" value={client.id} />
          <div><label className={labelCls}>Name</label><input name="name" defaultValue={client.name} className={input} /></div>
          <div><label className={labelCls}>Contact person</label><input name="contactPerson" defaultValue={client.contactPerson ?? ""} className={input} /></div>
          <div><label className={labelCls}>Role</label><input name="role" defaultValue={client.role ?? ""} className={input} /></div>
          <div><label className={labelCls}>Email</label><input name="email" defaultValue={client.email ?? ""} className={input} /></div>
          <div><label className={labelCls}>Phone</label><input name="phone" defaultValue={client.phone ?? ""} className={input} /></div>
          <div><label className={labelCls}>Website</label><input name="website" defaultValue={client.website ?? ""} className={input} /></div>
          <div><label className={labelCls}>Industry</label><input name="industry" defaultValue={client.industry ?? ""} className={input} /></div>
          <div><label className={labelCls}>Address</label><input name="address" defaultValue={client.address ?? ""} className={input} /></div>
          <div><label className={labelCls}>Lead source</label><input name="leadSource" defaultValue={client.leadSource ?? ""} className={input} /></div>
          <div><label className={labelCls}>Tags (comma separated)</label><input name="tags" defaultValue={client.tags.join(", ")} className={input} /></div>
          <div>
            <label className={labelCls}>Relationship</label>
            <select name="relationshipStatus" defaultValue={client.relationshipStatus} className={input}>
              <option value="lead">Lead</option><option value="client">Client</option><option value="archived">Archived</option>
            </select>
          </div>
          <div><label className={labelCls}>Notes</label><textarea name="notes" rows={3} defaultValue={client.notes ?? ""} className={input} /></div>
          <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5">Save changes</button>
        </form>
      </div>
    </div>
  );
}
