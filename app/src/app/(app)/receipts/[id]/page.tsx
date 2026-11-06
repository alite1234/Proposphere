import Link from "next/link";
import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { receipts, clients, payments, quotations, projects, brandSettings, businesses, businessProfiles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { money } from "@/lib/money";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  const { id } = await params;
  const [r] = await db.select().from(receipts).where(and(eq(receipts.id, id), eq(receipts.businessId, t.businessId))).limit(1);
  if (!r) notFound();
  const [payment] = await db.select().from(payments).where(eq(payments.id, r.paymentId)).limit(1);
  const [client] = r.clientId ? await db.select().from(clients).where(eq(clients.id, r.clientId)).limit(1) : [null];
  const [brand] = await db.select().from(brandSettings).where(eq(brandSettings.businessId, t.businessId)).limit(1);
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, t.businessId)).limit(1);
  const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessId, t.businessId)).limit(1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <Link href="/receipts" className="text-slate-500 text-xs hover:text-slate-300">← Back to receipts</Link>
        <PrintButton />
      </div>
      <div className="bg-white text-slate-900 rounded-xl p-8 max-w-2xl mx-auto shadow" id="print-area">
        <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div>
            {brand?.logoUrl && <img src={brand.logoUrl} alt="logo" className="h-10 mb-2" />}
            <div className="font-bold text-xl" style={{ color: brand?.primaryColor ?? "#1e40af" }}>{biz?.name}</div>
            <div className="text-slate-500 text-xs mt-1">{profile?.email}{profile?.phone ? ` · ${profile.phone}` : ""}{profile?.address ? ` · ${profile.address}` : ""}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs uppercase tracking-widest">Receipt</div>
            <div className="font-mono font-semibold">{r.reference}</div>
            <div className="text-slate-500 text-xs mt-1">{payment?.paymentDate ?? new Date(r.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {client && (
          <div className="py-4 text-sm">
            <div className="text-slate-400 text-xs uppercase mb-1">Received from</div>
            <div className="font-medium">{client.name}</div>
            <div className="text-slate-500 text-xs">{client.email}{client.phone ? ` · ${client.phone}` : ""}</div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 p-4 text-sm space-y-2 my-4">
          <div className="flex justify-between"><span className="text-slate-500">Amount received</span><span className="font-bold text-lg text-emerald-700">{money(r.amount, r.currency)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-slate-500">Payment method</span><span className="text-slate-700">{payment?.method?.replace("_", " ")}{payment?.providerRef ? ` · ref ${payment.providerRef}` : ""}</span></div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Verification</span>
            <span className={payment?.verification === "provider" ? "text-emerald-600" : "text-amber-600"}>
              {payment?.verification === "provider" ? "Verified via payment provider" : "Manually confirmed by provider of service"}
            </span>
          </div>
          {Number(r.totalAmount) > 0 && (
            <>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-xs"><span className="text-slate-500">Total project/quotation amount</span><span>{money(r.totalAmount, r.currency)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Previously paid</span><span>{money(r.previousPaid, r.currency)}</span></div>
              <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Outstanding balance</span><span>{money(r.outstanding, r.currency)}</span></div>
            </>
          )}
          {payment?.paymentType && <div className="flex justify-between text-xs"><span className="text-slate-500">Payment type</span><span className="capitalize">{payment.paymentType}</span></div>}
          {r.notes && <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">{r.notes}</div>}
        </div>

        {brand?.signatureUrl && <img src={brand.signatureUrl} alt="signature" className="h-10" />}
        {brand?.stampUrl && <img src={brand.stampUrl} alt="stamp" className="h-16 opacity-70" />}
        {brand?.footerText && <div className="text-center text-slate-400 text-xs mt-6">{brand.footerText}</div>}
        <div className="text-center text-slate-300 text-[10px] mt-2">This receipt was generated from a recorded payment on Proposphere.</div>
      </div>
    </div>
  );
}
