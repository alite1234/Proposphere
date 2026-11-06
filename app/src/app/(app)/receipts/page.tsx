import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { receipts, clients, payments, brandSettings, businesses, businessProfiles } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { money } from "@/lib/money";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const t = await requireTenant();
  const rows = await db
    .select({
      id: receipts.id,
      reference: receipts.reference,
      amount: receipts.amount,
      currency: receipts.currency,
      createdAt: receipts.createdAt,
      clientName: clients.name,
      paymentVerification: payments.verification,
      paymentMethod: payments.method,
    })
    .from(receipts)
    .leftJoin(clients, eq(clients.id, receipts.clientId))
    .leftJoin(payments, eq(payments.id, receipts.paymentId))
    .where(eq(receipts.businessId, t.businessId))
    .orderBy(desc(receipts.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Receipts</h1>
        <p className="text-slate-400 text-sm mt-0.5">Every receipt is generated from a recorded payment — never from an unverified statement.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Receipt</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Verification</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Method</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-900">
                <td className="px-4 py-3"><Link href={`/receipts/${r.id}`} className="text-blue-300 hover:text-blue-200 font-mono text-xs">{r.reference}</Link></td>
                <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{r.clientName ?? "—"}</td>
                <td className="px-4 py-3 text-slate-200">{money(r.amount, r.currency)}</td>
                <td className="px-4 py-3 text-xs hidden md:table-cell">
                  <span className={r.paymentVerification === "provider" ? "text-emerald-400" : "text-amber-400"}>
                    {r.paymentVerification === "provider" ? "provider-verified" : "manually confirmed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{r.paymentMethod?.replace("_", " ")}</td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No receipts yet — record a payment first.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
