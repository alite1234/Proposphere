import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { payments, quotations, proposals, expenses, clients, projects } from "@/db/schema";
import { and, eq, ne, desc, sql, inArray } from "drizzle-orm";
import { money } from "@/lib/money";
import { recordExpenseAction } from "@/app/actions/expenses";

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const t = await requireTenant();
  const { range } = await searchParams;
  const days = range === "30" ? 30 : range === "90" ? 90 : range === "365" ? 365 : 0;
  const since = days > 0 ? new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10) : null;

  const payWhere = since ? and(eq(payments.businessId, t.businessId), sql`${payments.paymentDate} >= ${since}`) : eq(payments.businessId, t.businessId);
  const rows = await db.select().from(payments).where(payWhere).orderBy(desc(payments.paymentDate));
  const confirmed = rows.filter((p) => p.status === "confirmed");
  const received = confirmed.filter((p) => !p.amount.startsWith("-")).reduce((a, p) => a + Number(p.amount), 0);
  const refunded = confirmed.filter((p) => p.amount.startsWith("-")).reduce((a, p) => a + Math.abs(Number(p.amount)), 0);
  const pending = rows.filter((p) => p.status === "pending").reduce((a, p) => a + Number(p.amount), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const receivedThisMonth = confirmed.filter((p) => !p.amount.startsWith("-") && p.paymentDate.startsWith(thisMonth)).reduce((a, p) => a + Number(p.amount), 0);

  const [issuedQuotes, acceptedProposals, clientRows] = await Promise.all([
    db.select({ total: quotations.total, currency: quotations.currency, status: quotations.status }).from(quotations).where(and(eq(quotations.businessId, t.businessId), inArray(quotations.status, ["issued", "sent", "viewed", "accepted"]))),
    db.select({ total: sql<string>`coalesce(sum(${proposals.total}),0)` }).from(proposals).where(and(eq(proposals.businessId, t.businessId), eq(proposals.status, "accepted"))),
    db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.businessId, t.businessId)),
  ]);
  const quoteValue = issuedQuotes.reduce((a, q) => a + Number(q.total), 0);
  const acceptedValue = Number(acceptedProposals[0]?.total ?? 0);
  const outstanding = quoteValue - received;

  const expenseRows = await db.select().from(expenses).where(eq(expenses.businessId, t.businessId)).orderBy(desc(expenses.date)).limit(50).catch(() => []);
  const expenseTotal = expenseRows.reduce((a, e) => a + Number(e.amount), 0);

  // Income by month (last 6 months)
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push({ label: d.toLocaleDateString(undefined, { month: "short" }), value: confirmed.filter((p) => !p.amount.startsWith("-") && p.paymentDate.startsWith(key)).reduce((a, p) => a + Number(p.amount), 0) });
  }
  const maxMonth = Math.max(...months.map((m) => m.value), 1);

  // Income by client
  const byClient = new Map<string, number>();
  for (const p of confirmed.filter((x) => !x.amount.startsWith("-"))) {
    const name = clientRows.find((c) => c.id === p.clientId)?.name ?? "Unassigned";
    byClient.set(name, (byClient.get(name) ?? 0) + Number(p.amount));
  }
  const topClients = [...byClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // By method
  const byMethod = new Map<string, number>();
  for (const p of confirmed.filter((x) => !x.amount.startsWith("-"))) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount));

  const cards = [
    { label: "Revenue received", value: money(received, "NGN"), note: "Confirmed payments (cash in)" },
    { label: "Received this month", value: money(receivedThisMonth, "NGN"), note: thisMonth },
    { label: "Outstanding receivables", value: money(Math.max(0, outstanding), "NGN"), note: "Issued quotations not yet paid" },
    { label: "Accepted proposal value", value: money(acceptedValue, "NGN"), note: "Not revenue until paid" },
    { label: "Issued quotation value", value: money(quoteValue, "NGN"), note: "Pipeline, not cash" },
    { label: "Refunds / reversals", value: money(refunded, "NGN"), note: "Confirmed reversals" },
    ...(expenseRows.length > 0 ? [{ label: "Expenses recorded", value: money(expenseTotal, "NGN"), note: "Optional expense tracking" }, { label: "Net cash position", value: money(received - refunded - expenseTotal, "NGN"), note: "Received − refunds − expenses" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Cash received is shown separately from proposal and quotation value — never mixed.</p>
        </div>
        <div className="flex gap-1.5 text-xs">
          {["all", "30", "90", "365"].map((r) => (
            <a key={r} href={`/finance?range=${r}`} className={`rounded-full px-3 py-1.5 border ${String(range ?? "all") === r ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-900 border-slate-700 text-slate-400"}`}>{r === "all" ? "All time" : `Last ${r}d`}</a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-slate-900 border border-slate-800 p-4">
            <div className="text-slate-400 text-xs">{c.label}</div>
            <div className="text-white text-xl font-bold mt-1">{c.value}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">{c.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm mb-4">Income by month</h2>
          <div className="flex items-end gap-3 h-40">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${(m.value / maxMonth) * 100}%`, minHeight: m.value > 0 ? "4px" : "2px" }} />
                <span className="text-slate-500 text-[10px]">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Top clients by revenue received</h2>
          {topClients.length === 0 ? <p className="text-slate-500 text-sm">No payments yet.</p> : (
            <ul className="space-y-2.5">
              {topClients.map(([name, v]) => (
                <li key={name}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">{name}</span><span className="text-emerald-400">{money(v, "NGN")}</span></div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(v / Math.max(...topClients.map((x) => x[1]), 1)) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
          <h2 className="text-white font-semibold text-sm mt-5 mb-2">Payments by method</h2>
          <div className="flex flex-wrap gap-2">
            {[...byMethod.entries()].map(([m, v]) => (
              <span key={m} className="text-xs bg-slate-800 text-slate-300 rounded-full px-3 py-1.5">{m.replace("_", " ")}: {money(v, "NGN")}</span>
            ))}
            {byMethod.size === 0 && <span className="text-slate-500 text-sm">—</span>}
          </div>
        </div>
      </div>

      <details className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <summary className="text-white text-sm font-medium cursor-pointer">+ Record an expense (optional)</summary>
        <form action={recordExpenseAction} className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-4 items-end">
          <div className="col-span-1"><label className="block text-slate-300 text-xs mb-1">Amount *</label><input name="amount" type="number" step="0.01" min="0.01" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div><label className="block text-slate-300 text-xs mb-1">Currency</label><input name="currency" defaultValue="NGN" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div><label className="block text-slate-300 text-xs mb-1">Category</label><input name="category" placeholder="Software, hosting…" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div className="col-span-2"><label className="block text-slate-300 text-xs mb-1">Description</label><input name="description" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div><label className="block text-slate-300 text-xs mb-1">Date</label><input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div className="col-span-2 md:col-span-3"><label className="block text-slate-300 text-xs mb-1">Vendor / payee</label><input name="vendor" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div className="col-span-2 md:col-span-6"><button className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 hover:bg-slate-700">Save expense</button></div>
        </form>
        <p className="text-slate-500 text-xs mt-2">Expense tracking is a simple record — it does not constitute formal accounting or tax compliance.</p>
      </details>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <h2 className="text-white font-semibold text-sm mb-3">Payment ledger</h2>        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 text-xs uppercase">
              <tr><th className="text-left py-2">Date</th><th className="text-left py-2">Reference</th><th className="text-left py-2">Client</th><th className="text-left py-2">Method</th><th className="text-left py-2">Verification</th><th className="text-right py-2">Amount</th><th className="text-left py-2 pl-4">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.slice(0, 20).map((p) => (
                <tr key={p.id}>
                  <td className="py-2 text-slate-400 text-xs">{p.paymentDate}</td>
                  <td className="py-2 font-mono text-xs text-slate-300">{p.reference}</td>
                  <td className="py-2 text-slate-300">{clientRows.find((c) => c.id === p.clientId)?.name ?? "—"}</td>
                  <td className="py-2 text-slate-400 text-xs">{p.method.replace("_", " ")}</td>
                  <td className="py-2 text-xs">{p.verification === "provider" ? <span className="text-emerald-400">provider</span> : <span className="text-amber-400">manual</span>}</td>
                  <td className={`py-2 text-right font-medium ${p.amount.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>{money(p.amount, p.currency)}</td>
                  <td className="py-2 pl-4 text-xs text-slate-400">{p.status}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">No transactions in range.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
