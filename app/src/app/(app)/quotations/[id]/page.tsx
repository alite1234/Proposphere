import Link from "next/link";
import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { quotations, quotationItems, clients, payments, receipts, brandSettings, businesses, businessProfiles } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { setQuotationStatusAction, recordPaymentAction } from "@/app/actions/finance";
import { money } from "@/lib/money";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "issued", "sent", "viewed", "accepted", "rejected", "expired", "cancelled", "converted"];

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  const { id } = await params;
  const [q] = await db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.businessId, t.businessId))).limit(1);
  if (!q) notFound();
  const [items, client, pays, brand, biz, profile] = await Promise.all([
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, q.id)).orderBy(quotationItems.position),
    q.clientId ? db.select().from(clients).where(eq(clients.id, q.clientId)).limit(1) : Promise.resolve([null]),
    db.select().from(payments).where(and(eq(payments.businessId, t.businessId), eq(payments.quotationId, q.id))).orderBy(desc(payments.createdAt)),
    db.select().from(brandSettings).where(eq(brandSettings.businessId, t.businessId)).limit(1),
    db.select().from(businesses).where(eq(businesses.id, t.businessId)).limit(1),
    db.select().from(businessProfiles).where(eq(businessProfiles.businessId, t.businessId)).limit(1),
  ]);
  const paid = pays.filter((p) => p.status === "confirmed" && p.paymentType !== "refund").reduce((a, p) => a + Number(p.amount), 0);
  const snapshotItems = (q.snapshot as { items?: { description: string; quantity: string; unitPrice: string }[] })?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href="/quotations" className="text-slate-500 text-xs hover:text-slate-300">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{q.reference}</h1>
          <p className="text-slate-400 text-sm">{client[0]?.name ?? "No client"} · {q.status} · issued {q.issueDate}{q.expiryDate ? ` · expires ${q.expiryDate}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <form action={setQuotationStatusAction} className="flex gap-1.5">
            <input type="hidden" name="id" value={q.id} />
            <select name="status" defaultValue={q.status} className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            <button className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 hover:bg-slate-700">Set</button>
          </form>
          <PrintButton />
        </div>
      </div>

      {/* Document preview */}
      <div className="bg-white text-slate-900 rounded-xl p-8 max-w-3xl mx-auto shadow" id="print-area">
        <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div>
            {brand[0]?.logoUrl && <img src={brand[0].logoUrl} alt="logo" className="h-10 mb-2" />}
            <div className="font-bold text-xl" style={{ color: brand[0]?.primaryColor ?? "#1e40af" }}>{biz[0]?.name}</div>
            <div className="text-slate-500 text-xs mt-1">{profile[0]?.email}{profile[0]?.phone ? ` · ${profile[0].phone}` : ""}{profile[0]?.address ? ` · ${profile[0].address}` : ""}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs uppercase tracking-widest">Quotation</div>
            <div className="font-mono font-semibold">{q.reference}</div>
            <div className="text-slate-500 text-xs mt-1">Issued {q.issueDate}</div>
            {q.expiryDate && <div className="text-slate-500 text-xs">Valid until {q.expiryDate}</div>}
          </div>
        </div>

        {client[0] && (
          <div className="py-4 text-sm">
            <div className="text-slate-400 text-xs uppercase mb-1">Prepared for</div>
            <div className="font-medium">{client[0].name}</div>
            <div className="text-slate-500 text-xs">{client[0].contactPerson}{client[0].email ? ` · ${client[0].email}` : ""}{client[0].phone ? ` · ${client[0].phone}` : ""}</div>
          </div>
        )}

        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2">{it.description}</td>
                <td className="py-2 text-right">{Number(it.quantity)} {it.unit}</td>
                <td className="py-2 text-right">{money(it.unitPrice, q.currency)}</td>
                <td className="py-2 text-right">{money(it.lineTotal, q.currency)}</td>
              </tr>
            ))}
            {items.length === 0 && snapshotItems.map((it, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2">{it.description}</td>
                <td className="py-2 text-right">{Number(it.quantity)}</td>
                <td className="py-2 text-right">{money(it.unitPrice, q.currency)}</td>
                <td className="py-2 text-right">{money(Number(it.quantity) * Number(it.unitPrice), q.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-64 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(q.subtotal, q.currency)}</span></div>
          {Number(q.discountValue) > 0 && q.discountType !== "none" && (
            <div className="flex justify-between"><span className="text-slate-500">Discount ({q.discountType === "percent" ? `${Number(q.discountValue)}%` : money(q.discountValue, q.currency)})</span><span>− {money(q.discountValue, q.currency)}</span></div>
          )}
          {Number(q.tax) > 0 && <div className="flex justify-between"><span className="text-slate-500">Tax ({Number(q.taxRate)}%)</span><span>{money(q.tax, q.currency)}</span></div>}
          <div className="flex justify-between border-t border-slate-300 pt-1.5 font-bold"><span>Total payable</span><span>{money(q.total, q.currency)}</span></div>
          {paid > 0 && <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{money(paid, q.currency)}</span></div>}
          {paid > 0 && <div className="flex justify-between font-semibold"><span>Outstanding</span><span>{money(Number(q.total) - paid, q.currency)}</span></div>}
        </div>

        {(q.paymentTerms || q.notes) && (
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-1">
            {q.paymentTerms && <div><span className="font-medium">Payment terms:</span> {q.paymentTerms}</div>}
            {q.notes && <div><span className="font-medium">Notes:</span> {q.notes}</div>}
          </div>
        )}
        {brand[0]?.signatureUrl && <img src={brand[0].signatureUrl} alt="signature" className="h-10 mt-4" />}
        {brand[0]?.footerText && <div className="text-center text-slate-400 text-xs mt-6">{brand[0].footerText}</div>}
      </div>

      {/* Record payment against quotation */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 max-w-3xl mx-auto print:hidden">
        <h2 className="text-white font-semibold text-sm mb-3">Record a payment against this quotation</h2>
        <form action={recordPaymentAction} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
          <input type="hidden" name="clientId" value={q.clientId ?? ""} />
          <input type="hidden" name="quotationId" value={q.id} />
          <input type="hidden" name="currency" value={q.currency} />
          <div className="col-span-1"><label className="block text-slate-300 text-xs mb-1">Amount</label><input name="amount" type="number" step="0.01" min="0.01" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div className="col-span-1">
            <label className="block text-slate-300 text-xs mb-1">Type</label>
            <select name="paymentType" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm"><option value="deposit">Deposit</option><option value="part">Part</option><option value="instalment">Instalment</option><option value="milestone">Milestone</option><option value="final">Final</option><option value="full">Full</option></select>
          </div>
          <div className="col-span-1">
            <label className="block text-slate-300 text-xs mb-1">Method</label>
            <select name="method" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm"><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="mobile_money">Mobile money</option><option value="other">Other</option></select>
          </div>
          <div className="col-span-1"><label className="block text-slate-300 text-xs mb-1">Date</label><input name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div className="col-span-2"><button className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2.5">Record payment & issue receipt</button></div>
        </form>
      </div>
    </div>
  );
}
