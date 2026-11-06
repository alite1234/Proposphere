"use server";

import { db } from "@/db";
import { quotations, quotationItems, payments, receipts, taxSettings, clients, proposalEvents } from "@/db/schema";
import { requireTenant, logActivity, notify, nextRef } from "@/lib/server";
import { computeTotals, num, isValidAmount } from "@/lib/money";
import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ItemInput = { description: string; quantity: string; unit: string; unitPrice: string; lineDiscount: string; lineTaxRate: string; serviceId?: string };

function parseItems(formData: FormData): ItemInput[] {
  const descriptions = formData.getAll("item_description").map(String);
  const quantities = formData.getAll("item_quantity").map(String);
  const units = formData.getAll("item_unit").map(String);
  const prices = formData.getAll("item_price").map(String);
  const discounts = formData.getAll("item_discount").map(String);
  const taxes = formData.getAll("item_tax").map(String);
  const serviceIds = formData.getAll("item_service").map(String);
  return descriptions
    .map((d, i) => ({
      description: d.trim(),
      quantity: quantities[i] || "1",
      unit: units[i] || "item",
      unitPrice: prices[i] || "0",
      lineDiscount: discounts[i] || "0",
      lineTaxRate: taxes[i] || "0",
      serviceId: serviceIds[i] || undefined,
    }))
    .filter((x) => x.description && isValidAmount(x.quantity) && isValidAmount(x.unitPrice) && Number(x.quantity) > 0);
}

import type { ActionState } from "@/lib/action-state";

export async function createQuotationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await requireTenant();
  const items = parseItems(formData);
  if (items.length === 0) return { error: "Add at least one valid line item (quantity > 0)." };
  const [fin] = await db.select().from(taxSettings).where(eq(taxSettings.businessId, t.businessId)).limit(1);
  const currency = String(formData.get("currency") || fin?.currency || "NGN").toUpperCase();
  const discountType = (String(formData.get("discountType") || "none") as "none" | "amount" | "percent");
  const totals = computeTotals(items, { discountType, discountValue: String(formData.get("discountValue") || "0"), taxRate: String(formData.get("taxRate") || "0") });
  const reference = await nextRef(t.businessId, "quotation");
  const clientId = String(formData.get("clientId") || "") || null;
  const expiryDate = String(formData.get("expiryDate") || "") || null;

  const [q] = await db
    .insert(quotations)
    .values({
      businessId: t.businessId,
      clientId,
      reference,
      status: "draft",
      currency,
      subtotal: totals.subtotal,
      discountType,
      discountValue: totals.discountValue,
      taxRate: totals.taxRate,
      tax: totals.tax,
      total: totals.total,
      paymentTerms: String(formData.get("paymentTerms") || "") || null,
      notes: String(formData.get("notes") || "") || null,
      snapshot: { items, totals, issuedAt: new Date().toISOString() },
    })
    .returning({ id: quotations.id });

  await db.insert(quotationItems).values(
    items.map((it, i) => ({
      quotationId: q.id,
      serviceId: it.serviceId || null,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      lineDiscount: it.lineDiscount,
      lineTaxRate: it.lineTaxRate,
      lineTotal: totals.lines[i].lineTotal,
      position: i,
    }))
  );
  await logActivity(t.businessId, "quotation.created", { actor: t.user.email, objectType: "quotation", objectId: q.id, details: { reference, total: totals.total } });
  redirect(`/quotations/${q.id}`);
}

export async function setQuotationStatusAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "draft");
  await db.update(quotations).set({ status }).where(and(eq(quotations.id, id), eq(quotations.businessId, t.businessId)));
  await logActivity(t.businessId, "quotation.status_changed", { actor: t.user.email, objectType: "quotation", objectId: id, details: { status } });
  revalidatePath(`/quotations/${id}`);
}

// Workflow D: record payment -> validate -> ledger -> receipt
export async function recordPaymentAction(formData: FormData) {
  const t = await requireTenant();
  const clientId = String(formData.get("clientId") || "") || null;
  const quotationId = String(formData.get("quotationId") || "") || null;
  const amount = String(formData.get("amount") || "0");
  if (!isValidAmount(amount) || Number(amount) <= 0) redirect("/payments/new?error=Enter+a+valid+amount.");
  const reference = await nextRef(t.businessId, "payment").catch(() => `PAY-${Date.now()}`);
  const paymentType = String(formData.get("paymentType") || "part");
  const isRefund = paymentType === "refund";

  const [payment] = await db
    .insert(payments)
    .values({
      businessId: t.businessId,
      clientId,
      quotationId,
      reference,
      amount: isRefund ? `-${num(amount)}` : num(amount),
      currency: String(formData.get("currency") || "NGN").toUpperCase(),
      paymentType,
      method: String(formData.get("method") || "bank_transfer"),
      providerRef: String(formData.get("providerRef") || "") || null,
      verification: String(formData.get("providerRef") || "") ? "provider" : "manual",
      status: "confirmed",
      paymentDate: String(formData.get("paymentDate") || new Date().toISOString().slice(0, 10)),
      notes: String(formData.get("notes") || "") || null,
      recordedBy: t.user.id,
    })
    .returning({ id: payments.id });

  // Auto-generate receipt for non-refund payments
  let receiptId: string | null = null;
  if (!isRefund) {
    // Prior confirmed payments for this client, excluding the one just recorded.
    let previousPaid = 0;
    if (clientId) {
      const prior = await db
        .select({ total: payments.amount })
        .from(payments)
        .where(and(eq(payments.businessId, t.businessId), eq(payments.clientId, clientId), eq(payments.status, "confirmed"), ne(payments.id, payment.id)));
      previousPaid = prior.reduce((a, p) => a + Number(p.total), 0);
    }
    const totalAmount = quotationId ? Number((await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1))[0]?.total ?? 0) : 0;
    const outstanding = Math.max(0, totalAmount - previousPaid - Number(amount));
    const recRef = await nextRef(t.businessId, "receipt");
    const [rec] = await db
      .insert(receipts)
      .values({
        businessId: t.businessId,
        paymentId: payment.id,
        clientId,
        reference: recRef,
        amount: num(amount),
        currency: String(formData.get("currency") || "NGN").toUpperCase(),
        previousPaid: num(previousPaid),
        totalAmount: num(totalAmount),
        outstanding: num(outstanding),
        notes: String(formData.get("notes") || "") || null,
      })
      .returning({ id: receipts.id });
    receiptId = rec.id;
  }

  await logActivity(t.businessId, isRefund ? "payment.refunded" : "payment.recorded", { actor: t.user.email, objectType: "payment", objectId: payment.id, details: { amount } });
  await notify(t.businessId, "payment_recorded", `Payment of ${amount} recorded`, { link: receiptId ? `/receipts/${receiptId}` : "/payments" });
  redirect(receiptId ? `/receipts/${receiptId}` : "/payments");
}

export async function reversePaymentAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  const [p] = await db.select().from(payments).where(and(eq(payments.id, id), eq(payments.businessId, t.businessId))).limit(1);
  if (!p) redirect("/payments");
  // No silent edits: corrections happen through reversal records with an audit trail.
  await db.update(payments).set({ status: "reversed" }).where(eq(payments.id, id));
  await db.insert(payments).values({
    businessId: t.businessId,
    clientId: p.clientId,
    quotationId: p.quotationId,
    reference: `${p.reference}-REV`,
    amount: p.amount.startsWith("-") ? p.amount.slice(1) : `-${p.amount}`,
    currency: p.currency,
    paymentType: "refund",
    method: p.method,
    verification: "manual",
    status: "confirmed",
    notes: `Reversal of ${p.reference}`,
    reversalOf: p.id,
    recordedBy: t.user.id,
  });
  await logActivity(t.businessId, "payment.reversed", { actor: t.user.email, objectType: "payment", objectId: id });
  revalidatePath("/payments");
}
