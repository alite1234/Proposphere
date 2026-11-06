import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { quotations, clients, taxSettings, services } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { createQuotationAction } from "@/app/actions/finance";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-700/50 text-slate-300",
  issued: "bg-amber-500/15 text-amber-300",
  sent: "bg-amber-500/15 text-amber-300",
  viewed: "bg-cyan-500/15 text-cyan-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
  expired: "bg-slate-700/50 text-slate-400",
  cancelled: "bg-slate-700/50 text-slate-400",
  converted: "bg-violet-500/15 text-violet-300",
};

export default async function QuotationsPage() {
  const t = await requireTenant();
  const [rows, clientList, svc, fin] = await Promise.all([
    db.select().from(quotations).where(eq(quotations.businessId, t.businessId)).orderBy(desc(quotations.createdAt)),
    db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.businessId, t.businessId)),
    db.select().from(services).where(and(eq(services.businessId, t.businessId), eq(services.active, true))),
    db.select().from(taxSettings).where(eq(taxSettings.businessId, t.businessId)).limit(1),
  ]);
  const currency = fin[0]?.currency ?? "NGN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Quotations</h1>
        <p className="text-slate-400 text-sm mt-0.5">All totals calculated server-side with decimal-safe arithmetic.</p>
      </div>

      <details className="rounded-xl bg-slate-900 border border-slate-800 p-5" open={rows.length === 0}>
        <summary className="text-white text-sm font-medium cursor-pointer">+ New quotation</summary>
        <form action={createQuotationAction} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 text-xs mb-1">Client</label>
              <select name="clientId" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm">
                <option value="">— none —</option>
                {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">Currency</label>
              <input name="currency" defaultValue={currency} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">Expiry date</label>
              <input name="expiryDate" type="date" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">Tax rate %</label>
              <input name="taxRate" type="number" step="0.01" min="0" defaultValue={fin[0]?.defaultTaxRate ?? "0"} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-slate-300 text-xs font-medium">Line items</div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input name="item_service" list={`svc-list`} hidden defaultValue="" />
                <input name="item_description" placeholder={`Item ${i + 1} description`} className="col-span-12 md:col-span-5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
                <input name="item_quantity" type="number" step="0.01" min="0" placeholder="Qty" defaultValue={i === 0 ? "1" : ""} className="col-span-4 md:col-span-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
                <input name="item_unit" placeholder="Unit" defaultValue="item" className="col-span-3 md:col-span-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
                <input name="item_price" type="number" step="0.01" min="0" placeholder="Unit price" className="col-span-5 md:col-span-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
                <input name="item_discount" type="number" step="0.01" min="0" placeholder="Line disc." className="col-span-4 md:col-span-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
                <input name="item_tax" type="number" step="0.01" min="0" placeholder="Line tax %" className="col-span-4 md:col-span-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
              </div>
            ))}
            <datalist id="svc-list">
              {svc.map((s) => <option key={s.id} value={s.name} />)}
            </datalist>
            <p className="text-slate-500 text-xs">Tip: type an item name matching one of your services. Leave unused rows blank.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 text-xs mb-1">Overall discount type</label>
              <select name="discountType" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm">
                <option value="none">None</option><option value="amount">Fixed amount</option><option value="percent">Percent</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">Discount value</label>
              <input name="discountValue" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-300 text-xs mb-1">Payment terms</label>
              <input name="paymentTerms" placeholder="50% deposit, balance on delivery" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-slate-300 text-xs mb-1">Notes / exclusions</label>
              <textarea name="notes" rows={2} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Create quotation</button>
        </form>
      </details>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Reference</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Issued</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {rows.map((q) => (
              <tr key={q.id} className="hover:bg-slate-900">
                <td className="px-4 py-3"><Link href={`/quotations/${q.id}`} className="text-blue-300 hover:text-blue-200 font-mono text-xs">{q.reference}</Link></td>
                <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{clientList.find((c) => c.id === q.clientId)?.name ?? "—"}</td>
                <td className="px-4 py-3"><span className={`text-[11px] rounded-full px-2 py-1 ${STATUS_STYLES[q.status] ?? ""}`}>{q.status}</span></td>
                <td className="px-4 py-3 text-slate-200">{money(q.total, q.currency)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{q.issueDate}</td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{q.expiryDate ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No quotations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
