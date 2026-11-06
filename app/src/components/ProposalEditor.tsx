"use client";

import { useState } from "react";
import type { ProposalContent } from "@/db/schema";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

type Line = { name: string; quantity: number; unitPrice: number };

export default function ProposalEditor({ initial, currency, taxDefault }: { initial: ProposalContent; currency: string; taxDefault: number }) {
  const [sections, setSections] = useState(initial.sections);
  const [lines, setLines] = useState<Line[]>(
    // Seed from pricing total is not possible; start with one blank line
    [{ name: "", quantity: 1, unitPrice: 0 }]
  );
  const [discountType, setDiscountType] = useState<string>(initial.pricing.discountType || "none");
  const [discountValue, setDiscountValue] = useState<string>(initial.pricing.discountValue || "0");
  const [taxRate, setTaxRate] = useState<string>(initial.pricing.taxRate || String(taxDefault));
  const [cmp, setCmp] = useState(initial.comparison);

  const subtotal = lines.reduce((a, l) => a + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const discountAmount = discountType === "percent" ? (subtotal * (Number(discountValue) || 0)) / 100 : discountType === "amount" ? Number(discountValue) || 0 : 0;
  const capped = Math.max(0, Math.min(discountAmount, subtotal));
  const tax = ((subtotal - capped) * (Number(taxRate) || 0)) / 100;
  const total = subtotal - capped + tax;
  // Display-only estimate; the server recalculates authoritative totals with decimal math.
  const fmt = (v: number) => `${currency === "NGN" ? "₦" : currency + " "}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const move = (i: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Sections */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Sections ({sections.filter((s) => s.enabled).length} enabled)</h2>
          <span className="text-slate-500 text-xs">Reorder, enable/disable and edit every section.</span>
        </div>
        {sections.map((s, i) => (
          <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <input type="hidden" name="sectionId" value={s.id} />
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                <input type="checkbox" name="sectionEnabled" value={s.id} defaultChecked={s.enabled} className="rounded bg-slate-800" />
                enabled
              </label>
              <input name={`section_title_${s.id}`} defaultValue={s.title} className="flex-1 bg-transparent text-white text-sm font-medium border-b border-slate-800 focus:outline-none focus:border-blue-500" />
              <button type="button" onClick={() => move(i, -1)} className="text-slate-500 hover:text-white px-1">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="text-slate-500 hover:text-white px-1">↓</button>
            </div>
            <textarea name={`section_body_${s.id}`} rows={s.kind === "comparison" ? 2 : 5} defaultValue={s.body} placeholder={`Content for ${s.title.toLowerCase()}…`} className={input + " font-normal"} />
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <label className="flex items-center gap-2 text-white text-sm font-medium">
          <input type="checkbox" name="cmp_enabled" defaultChecked={cmp.enabled} className="rounded bg-slate-800" />
          Include package comparison table (on by default)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-300 text-xs mb-1">Package columns (pipe-separated)</label>
            <input name="cmp_columns" defaultValue={cmp.columns.join(" | ")} placeholder="Basic | Professional | Enterprise" className={input} onChange={(e) => setCmp({ ...cmp, columns: e.target.value.split("|").map((x) => x.trim()) })} />
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Recommended package</label>
            <input name="cmp_recommended" defaultValue={cmp.recommended ?? ""} className={input} />
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Table note</label>
            <input name="cmp_note" defaultValue={cmp.note ?? ""} className={input} />
          </div>
        </div>
        <div className="space-y-2">
          {cmp.rows.map((row, ri) => (
            <div key={ri} className="flex gap-2 items-center">
              <input name="cmp_feature" defaultValue={row.feature} placeholder="Feature" className={input + " flex-1"} />
              {cmp.columns.map((_, ci) => (
                <input key={ci} name={`cmp_val_${ri}_${ci}`} defaultValue={row.values[ci] ?? ""} placeholder="—" className={input + " w-28"} />
              ))}
              <button type="button" onClick={() => setCmp({ ...cmp, rows: cmp.rows.filter((_, x) => x !== ri) })} className="text-slate-500 hover:text-red-400 text-xs px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setCmp({ ...cmp, rows: [...cmp.rows, { feature: "", values: cmp.columns.map(() => "") }] })} className="text-blue-400 text-xs hover:text-blue-300">+ Add row</button>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <h2 className="text-white font-semibold text-sm">Pricing</h2>
        <p className="text-slate-500 text-xs">Preview only — the server recalculates all totals with decimal-safe arithmetic. The AI never sets prices.</p>
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input placeholder="Item name" value={l.name} onChange={(e) => setLines(lines.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))} className={input + " flex-1"} />
            <input type="number" step="0.01" min="0" placeholder="Qty" value={l.quantity} onChange={(e) => setLines(lines.map((x, xi) => (xi === i ? { ...x, quantity: Number(e.target.value) } : x)))} className={input + " w-20"} />
            <input type="number" step="0.01" min="0" placeholder="Unit price" value={l.unitPrice} onChange={(e) => setLines(lines.map((x, xi) => (xi === i ? { ...x, unitPrice: Number(e.target.value) } : x)))} className={input + " w-32"} />
            <button type="button" onClick={() => setLines(lines.filter((_, xi) => xi !== i))} className="text-slate-500 hover:text-red-400 text-xs px-1">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setLines([...lines, { name: "", quantity: 1, unitPrice: 0 }])} className="text-blue-400 text-xs hover:text-blue-300">+ Add line</button>
        <input type="hidden" name="pricing_lines" value={JSON.stringify(lines.filter((l) => l.name.trim()))} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-slate-300 text-xs mb-1">Discount type</label>
            <select name="discountType" value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={input}>
              <option value="none">None</option><option value="amount">Fixed amount</option><option value="percent">Percent</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Discount value</label>
            <input name="discountValue" type="number" step="0.01" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className={input} disabled={discountType === "none"} />
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Tax rate %</label>
            <input name="taxRate" type="number" step="0.01" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={input} />
          </div>
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
            <div className="text-slate-400 text-[11px]">Subtotal {fmt(subtotal)}</div>
            <div className="text-slate-400 text-[11px]">Discount −{fmt(capped)}</div>
            <div className="text-slate-400 text-[11px]">Tax {fmt(tax)}</div>
            <div className="text-white font-bold text-sm mt-1">Total {fmt(total)}</div>
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <label className="block text-white text-sm font-medium mb-1">Assumptions (one per line)</label>
        <textarea name="assumptions" rows={3} defaultValue={(initial.assumptions ?? []).join("\n")} placeholder="Client provides all copy and images…" className={input} />
      </div>

      <button className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-6 py-3">Save as new version</button>
    </div>
  );
}
