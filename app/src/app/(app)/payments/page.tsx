import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { payments, clients, quotations } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { recordPaymentAction, reversePaymentAction } from "@/app/actions/finance";
import { money } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const t = await requireTenant();
  const { error } = await searchParams;
  const [rows, clientList, quotes] = await Promise.all([
    db.select().from(payments).where(eq(payments.businessId, t.businessId)).orderBy(desc(payments.createdAt)),
    db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.businessId, t.businessId)),
    db.select({ id: quotations.id, reference: quotations.reference }).from(quotations).where(and(eq(quotations.businessId, t.businessId))).orderBy(desc(quotations.createdAt)).limit(50),
  ]);

  const received = rows.filter((p) => p.status === "confirmed" && !p.amount.startsWith("-")).reduce((a, p) => a + Number(p.amount), 0);
  const refunded = rows.filter((p) => p.status === "reversed" || p.amount.startsWith("-")).reduce((a, p) => a + Math.abs(Number(p.amount)), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-slate-400 text-sm mt-0.5">Immutable ledger — corrections happen through reversal records, never silent edits.</p>
      </div>
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4"><div className="text-slate-400 text-xs">Total received</div><div className="text-white text-xl font-bold mt-1">{money(received, "NGN")}</div></div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4"><div className="text-slate-400 text-xs">Refunded / reversed</div><div className="text-white text-xl font-bold mt-1">{money(refunded, "NGN")}</div></div>
      </div>

      <details className="rounded-xl bg-slate-900 border border-slate-800 p-5" open={rows.length === 0}>
        <summary className="text-white text-sm font-medium cursor-pointer">+ Record a payment</summary>
        <form action={recordPaymentAction} className="grid grid-cols-2 md:grid-cols-7 gap-2 mt-4 items-end">
          <div className="col-span-2 md:col-span-1"><label className="block text-slate-300 text-xs mb-1">Amount *</label><input name="amount" type="number" step="0.01" min="0.01" required className={input} /></div>
          <div><label className="block text-slate-300 text-xs mb-1">Currency</label><input name="currency" defaultValue="NGN" className={input} /></div>
          <div className="col-span-2"><label className="block text-slate-300 text-xs mb-1">Client</label>
            <select name="clientId" className={input}><option value="">— none —</option>{clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div className="col-span-2"><label className="block text-slate-300 text-xs mb-1">Against quotation</label>
            <select name="quotationId" className={input}><option value="">— none —</option>{quotes.map((q) => <option key={q.id} value={q.id}>{q.reference}</option>)}</select>
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Type</label>
            <select name="paymentType" className={input}><option value="deposit">Deposit</option><option value="part">Part</option><option value="instalment">Instalment</option><option value="milestone">Milestone</option><option value="final">Final</option><option value="full">Full</option><option value="refund">Refund</option></select>
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Method</label>
            <select name="method" className={input}><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="mobile_money">Mobile money</option><option value="other">Other</option></select>
          </div>
          <div><label className="block text-slate-300 text-xs mb-1">Date</label><input name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={input} /></div>
          <div className="col-span-2"><label className="block text-slate-300 text-xs mb-1">Provider reference (if verified)</label><input name="providerRef" className={input} placeholder="Leave empty for manual payment" /></div>
          <div className="col-span-2"><label className="block text-slate-300 text-xs mb-1">Notes</label><input name="notes" className={input} /></div>
          <div className="col-span-2 md:col-span-7"><button className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5">Record payment</button></div>
        </form>
        <p className="text-slate-500 text-xs mt-2">A receipt is generated automatically for non-refund payments. Manual payments are labelled as manually confirmed.</p>
      </details>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Reference</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Verification</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{p.reference}</td>
                <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{clientList.find((c) => c.id === p.clientId)?.name ?? "—"}</td>
                <td className={`px-4 py-3 font-medium ${p.amount.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>{money(p.amount, p.currency)}</td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{p.paymentType}</td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">{p.verification === "provider" ? "provider-verified" : "manual"}</td>
                <td className="px-4 py-3"><span className={`text-[11px] rounded-full px-2 py-1 ${p.status === "confirmed" ? "bg-emerald-500/15 text-emerald-300" : p.status === "reversed" ? "bg-red-500/15 text-red-300" : "bg-slate-700/50 text-slate-300"}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{p.paymentDate}</td>
                <td className="px-4 py-3">
                  {p.status === "confirmed" && !p.amount.startsWith("-") && (
                    <form action={reversePaymentAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-red-400 hover:text-red-300 text-xs">reverse</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No payments recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-slate-500 text-xs">Need a receipt? <Link href="/receipts" className="text-blue-400">View all receipts</Link> — every confirmed payment gets one automatically.</p>
    </div>
  );
}
