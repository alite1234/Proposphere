import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { quotations, clients, taxSettings, services } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { money } from "@/lib/money";
import QuotationBuilder from "@/components/QuotationBuilder";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/[0.05] text-slate-300 border border-white/10",
  issued: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  sent: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  viewed: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25",
  accepted: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  rejected: "bg-red-500/15 text-red-300 border border-red-500/25",
  expired: "bg-white/[0.05] text-slate-400 border border-white/10",
  cancelled: "bg-white/[0.05] text-slate-400 border border-white/10",
  converted: "bg-violet-500/15 text-violet-300 border border-violet-500/25",
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Quotations</h1>
        <p className="text-slate-400 text-sm mt-0.5">Totals are always recalculated server-side with decimal-safe arithmetic.</p>
      </div>

      <QuotationBuilder
        services={svc.map((s) => ({ id: s.id, name: s.name, description: s.description, unit: s.unit, defaultQuantity: s.defaultQuantity, basePrice: s.basePrice }))}
        clients={clientList}
        currency={currency}
        defaultTaxRate={String(fin[0]?.defaultTaxRate ?? "0")}
      />

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-white/[0.07]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Reference</th>
              <th className="text-left px-4 py-3 hidden md:table-cell font-medium">Client</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 hidden md:table-cell font-medium">Issued</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell font-medium">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((q) => (
              <tr key={q.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-4 py-3"><Link href={`/quotations/${q.id}`} className="text-blue-300 hover:text-blue-200 font-mono text-xs">{q.reference}</Link></td>
                <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{clientList.find((c) => c.id === q.clientId)?.name ?? "—"}</td>
                <td className="px-4 py-3"><span className={`text-[11px] rounded-full px-2 py-1 ${STATUS_STYLES[q.status] ?? ""}`}>{q.status}</span></td>
                <td className="px-4 py-3 text-slate-200 font-medium">{money(q.total, q.currency)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{q.issueDate}</td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{q.expiryDate ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No quotations yet — create your first one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
