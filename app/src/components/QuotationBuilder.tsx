"use client";

import { useActionState, useMemo, useState } from "react";
import Decimal from "decimal.js";
import { createQuotationAction } from "@/app/actions/finance";
import type { ActionState } from "@/lib/action-state";
import SubmitButton from "@/components/SubmitButton";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type BuilderService = {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  defaultQuantity: string;
  basePrice: string;
};

export type BuilderClient = { id: string; name: string };

type Line = {
  key: number;
  serviceId: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  lineDiscount: string;
  lineTaxRate: string;
};

let keySeq = 1;
const blankLine = (): Line => ({ key: keySeq++, serviceId: "", description: "", quantity: "1", unit: "item", unitPrice: "0", lineDiscount: "0", lineTaxRate: "0" });

const fmt = (v: Decimal.Value, currency: string) => {
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵", KES: "KSh ", ZAR: "R" };
  return `${symbols[currency] ?? currency + " "}${new Decimal(v).toDecimalPlaces(2).toFixed(2)}`;
};

export default function QuotationBuilder({
  services,
  clients,
  currency,
  defaultTaxRate,
}: {
  services: BuilderService[];
  clients: BuilderClient[];
  currency: string;
  defaultTaxRate: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createQuotationAction, null);
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const [discountType, setDiscountType] = useState<"none" | "amount" | "percent">("none");
  const [discountValue, setDiscountValue] = useState("0");
  const [taxRate, setTaxRate] = useState(defaultTaxRate || "0");
  const [currencyCode, setCurrencyCode] = useState(currency);

  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const pickService = (key: number, serviceId: string) => {
    const s = services.find((x) => x.id === serviceId);
    if (!s) {
      update(key, { serviceId: "" });
      return;
    }
    update(key, {
      serviceId: s.id,
      description: s.description || s.name,
      unit: s.unit || "item",
      quantity: Number(s.defaultQuantity) > 0 ? s.defaultQuantity : "1",
      unitPrice: s.basePrice || "0",
    });
  };

  // Live preview — display only; the server always recalculates with decimal-safe math.
  const totals = useMemo(() => {
    const d = (v: string | number) => (v === "" || v === null || v === undefined ? new Decimal(0) : new Decimal(v));
    let subtotal = new Decimal(0);
    for (const l of lines) {
      subtotal = subtotal.plus(d(l.quantity).times(d(l.unitPrice))).minus(d(l.lineDiscount));
    }
    const discountAmount =
      discountType === "amount" ? d(discountValue) : discountType === "percent" ? subtotal.times(d(discountValue).div(100)) : new Decimal(0);
    const capped = Decimal.max(new Decimal(0), Decimal.min(discountAmount, subtotal));
    const taxable = subtotal.minus(capped);
    const tax = taxable.times(d(taxRate).div(100));
    return { subtotal, discount: capped, tax, total: taxable.plus(tax) };
  }, [lines, discountType, discountValue, taxRate]);

  return (
    <form action={formAction} className="glass rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-white font-semibold">New quotation</h2>
          <p className="text-slate-500 text-xs mt-0.5">Pick a service to autofill price and unit — totals update live. The server recalculates everything on save.</p>
        </div>
        <span className="text-[10px] font-semibold tracking-widest text-emerald-300/80 uppercase">Live preview</span>
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm px-4 py-3">{state.error}</div>
      )}

      {/* Header fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-slate-400 text-xs mb-1.5">Client</label>
          <select name="clientId" className="field">
            <option value="">— none —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1.5">Currency</label>
          <input name="currency" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} className="field" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1.5">Expiry date</label>
          <input name="expiryDate" type="date" className="field" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1.5">Tax rate %</label>
          <input name="taxRate" type="number" step="0.01" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="field" />
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Line items</span>
          <button type="button" onClick={() => setLines((ls) => [...ls, blankLine()])} className="btn-ghost rounded-lg text-xs text-slate-200 px-3 py-1.5">
            + Add item
          </button>
        </div>
        {lines.map((l, i) => (
          <div key={l.key} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 md:col-span-5">
                <label className="block text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Service from catalogue</label>
                <select value={l.serviceId} onChange={(e) => pickService(l.key, e.target.value)} className="field">
                  <option value="">— custom item —</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} · {fmt(s.basePrice, currencyCode)}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-12 md:col-span-7">
                <label className="block text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Description</label>
                <input name="item_description" value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} placeholder="What is being quoted" className="field" />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 mt-2 items-end">
              <div className="col-span-3 md:col-span-1">
                <label className="block text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Qty</label>
                <input name="item_quantity" type="number" step="0.01" min="0" value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} className="field" />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="block text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Unit</label>
                <input name="item_unit" value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} className="field" />
              </div>
              <div className="col-span-5 md:col-span-2">
                <label className="block text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Unit price</label>
                <input name="item_price" type="number" step="0.01" min="0" value={l.unitPrice} onChange={(e) => update(l.key, { unitPrice: e.target.value })} className="field" />
              </div>
              <div className="col-span-6 md:col-span-2">
                <label className="block text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Line disc.</label>
                <input name="item_discount" type="number" step="0.01" min="0" value={l.lineDiscount} onChange={(e) => update(l.key, { lineDiscount: e.target.value })} className="field" />
              </div>
              <div className="col-span-6 md:col-span-2">
                <label className="block text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Line tax %</label>
                <input name="item_tax" type="number" step="0.01" min="0" value={l.lineTaxRate} onChange={(e) => update(l.key, { lineTaxRate: e.target.value })} className="field" />
              </div>
              <div className="col-span-12 md:col-span-3 flex items-center justify-between md:justify-end gap-3">
                <input type="hidden" name="item_service" value={l.serviceId} />
                <span className="text-slate-300 text-sm font-medium md:mr-2">
                  {fmt(new Decimal(l.quantity === "" ? 0 : l.quantity).times(l.unitPrice === "" ? 0 : l.unitPrice).minus(l.lineDiscount === "" ? 0 : l.lineDiscount), currencyCode)}
                </span>
                <button
                  type="button"
                  onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))}
                  title={lines.length > 1 ? "Remove item" : "At least one row is needed"}
                  className="text-slate-600 hover:text-red-400 text-xs p-1.5 rounded-md hover:bg-white/5 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discount + totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Overall discount</label>
            <div className="flex gap-2">
              <select name="discountType" value={discountType} onChange={(e) => setDiscountType(e.target.value as typeof discountType)} className="field w-32">
                <option value="none">None</option>
                <option value="amount">Amount</option>
                <option value="percent">Percent</option>
              </select>
              <input name="discountValue" type="number" step="0.01" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} disabled={discountType === "none"} className="field flex-1 disabled:opacity-40" />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Payment terms</label>
            <input name="paymentTerms" placeholder="50% deposit, balance on delivery" className="field" />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{fmt(totals.subtotal, currencyCode)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Discount</span><span className="text-amber-300">−{fmt(totals.discount, currencyCode)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Tax ({taxRate || 0}%)</span><span>{fmt(totals.tax, currencyCode)}</span></div>
            <div className="flex justify-between text-white font-semibold text-base pt-2 border-t border-white/10"><span>Total payable</span><span>{fmt(totals.total, currencyCode)}</span></div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-slate-400 text-xs mb-1.5">Notes / exclusions</label>
        <textarea name="notes" rows={2} className="field" />
      </div>

      <SubmitButton label="Create quotation" pending="Calculating & saving…" className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold" />
    </form>
  );
}
