"use client";

import { useState } from "react";
import { money } from "@/lib/money";
import type { ProposalContent } from "@/db/schema";


const input = "w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

type Props = {
  raw: string;
  error?: string;
  ok?: string;
  proposal: { reference: string; title: string; currency: string; status: string; validUntil: string | null };
  brand: { businessName: string; logoUrl: string | null; primaryColor: string; accentColor: string; footer: string | null; signatureUrl: string | null };
  profile: { email: string | null; phone: string | null; website: string | null; description: string | null };
  content: ProposalContent | null;
  requireEmailVerify: boolean;
  clientEmail: string | null;
  acceptAction: (fd: FormData) => Promise<void>;
  declineAction: (fd: FormData) => Promise<void>;
  changeRequestAction: (fd: FormData) => Promise<void>;
};

export default function PublicProposalClient({ raw, error, ok, proposal, brand, profile, content, requireEmailVerify, clientEmail, acceptAction, declineAction, changeRequestAction }: Props) {
  const [signatureType, setSignatureType] = useState<"click" | "typed" | "drawn">("click");
  const [typedName, setTypedName] = useState("");
  const [drawn, setDrawn] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"view" | "accept" | "decline" | "change">("view");

  const sections = (content?.sections ?? []).filter((s) => s.enabled && s.body.trim());
  const pricing = content?.pricing;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Document */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Cover header */}
          <div className="px-8 py-8" style={{ background: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${shade(brand.primaryColor)} 100%)` }}>
            {brand.logoUrl && <img src={brand.logoUrl} alt="logo" className="h-12 mb-3 bg-white/90 rounded px-2 py-1" />}
            <div className="text-white/80 text-xs uppercase tracking-widest">Proposal</div>
            <h1 className="text-white text-2xl font-bold mt-1">{proposal.title}</h1>
            <div className="text-white/70 text-sm mt-2">{brand.businessName} · {proposal.reference}</div>
          </div>

          <div className="px-8 py-8 space-y-8">
            {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}
            {ok === "accepted" && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">Thank you — your acceptance has been recorded. The provider has been notified.</div>}
            {ok === "declined" && <div className="rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-sm px-4 py-3">Your response has been recorded.</div>}
            {ok === "change_requested" && <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3">Your change request has been sent.</div>}

            {sections.length === 0 && <p className="text-slate-500 text-sm italic">This proposal has no content yet.</p>}
            {sections.map((s) => (
              <section key={s.id}>
                <h2 className="text-slate-900 font-semibold text-lg mb-2" style={{ color: brand.primaryColor }}>{s.title}</h2>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{s.body}</div>
              </section>
            ))}

            {/* Comparison table */}
            {content?.comparison?.enabled && content.comparison.rows.length > 0 && (
              <section>
                <h2 className="text-slate-900 font-semibold text-lg mb-3" style={{ color: brand.primaryColor }}>Package comparison</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-3 py-2 border-b border-slate-200 text-slate-600 font-medium">Feature</th>
                        {content.comparison.columns.map((c, i) => (
                          <th key={i} className={`text-left px-3 py-2 border-b border-slate-200 font-medium ${content.comparison.recommended === c ? "text-white" : "text-slate-600"}`} style={content.comparison.recommended === c ? { background: brand.primaryColor } : {}}>
                            {c}{content.comparison.recommended === c && <span className="ml-1 text-[10px] opacity-80">★ recommended</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {content.comparison.rows.map((r, ri) => (
                        <tr key={ri} className={ri % 2 ? "bg-slate-50/50" : ""}>
                          <td className="px-3 py-2 border-b border-slate-100 text-slate-700">{r.feature}</td>
                          {r.values.map((v, vi) => (
                            <td key={vi} className={`px-3 py-2 border-b border-slate-100 ${v === "Not included" ? "text-slate-400" : v === "Included" ? "text-emerald-600" : "text-slate-700"}`}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {content.comparison.note && <p className="text-slate-400 text-xs mt-2">{content.comparison.note}</p>}
              </section>
            )}

            {/* Pricing summary */}
            {pricing && (
              <section>
                <h2 className="text-slate-900 font-semibold text-lg mb-3" style={{ color: brand.primaryColor }}>Investment summary</h2>
                <div className="rounded-lg border border-slate-200 p-4 text-sm space-y-1.5">
                  <Row label="Subtotal" value={money(pricing.subtotal, pricing.currency)} />
                  {Number(pricing.discount) > 0 && <Row label="Discount" value={`− ${money(pricing.discount, pricing.currency)}`} />}
                  {Number(pricing.tax) > 0 && <Row label={`Tax (${pricing.taxRate}%)`} value={money(pricing.tax, pricing.currency)} />}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <Row label="Total" value={money(pricing.total, pricing.currency)} bold />
                  </div>
                </div>
              </section>
            )}

            {content?.assumptions && content.assumptions.length > 0 && (
              <section>
                <h2 className="text-slate-900 font-semibold text-lg mb-2" style={{ color: brand.primaryColor }}>Assumptions</h2>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                  {content.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </section>
            )}

            <div className="border-t border-slate-200 pt-4 text-slate-500 text-xs flex flex-wrap gap-4">
              {profile.email && <span>✉ {profile.email}</span>}
              {profile.phone && <span>☎ {profile.phone}</span>}
              {profile.website && <span>🌐 {profile.website}</span>}
              {proposal.validUntil && <span>Valid until {proposal.validUntil}</span>}
            </div>
            {brand.footer && <div className="text-center text-slate-400 text-xs pt-2">{brand.footer}</div>}
          </div>
        </div>

        {/* Actions */}
        {proposal.status !== "accepted" && proposal.status !== "declined" && (
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button onClick={() => setMode("accept")} className="rounded-lg px-6 py-3 text-white font-medium shadow" style={{ background: brand.primaryColor }}>Accept proposal</button>
            <button onClick={() => setMode("decline")} className="rounded-lg bg-white border border-slate-300 text-slate-600 px-6 py-3 font-medium">Decline</button>
            <button onClick={() => setMode("change")} className="rounded-lg bg-white border border-slate-300 text-slate-600 px-6 py-3 font-medium">Request changes</button>
          </div>
        )}

        {mode === "accept" && (
          <form action={acceptAction} className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Accept this proposal</h3>
            <input type="hidden" name="token" value={raw} />
            <input type="hidden" name="signatureType" value={signatureType} />
            <input type="hidden" name="signatureData" value={signatureType === "typed" ? typedName : signatureType === "drawn" ? drawn : "click"} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 text-xs mb-1">Your full name *</label>
                <input name="signerName" required className={input} value={typedName} onChange={(e) => setTypedName(e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-600 text-xs mb-1">Your email {requireEmailVerify ? `* (must match ${clientEmail})` : ""}</label>
                <input name="signerEmail" type="email" required={requireEmailVerify} defaultValue={clientEmail ?? ""} className={input} />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 text-xs mb-1.5">Signature method</label>
              <div className="flex gap-2">
                {(["click", "typed", "drawn"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setSignatureType(m)} className={`rounded-lg px-3 py-1.5 text-xs border ${signatureType === m ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-500"}`}>
                    {m === "click" ? "Click to confirm" : m === "typed" ? "Type name" : "Draw signature"}
                  </button>
                ))}
              </div>
            </div>
            {signatureType === "drawn" && (
              <div>
                <label className="block text-slate-600 text-xs mb-1">Draw your signature below (mouse or finger)</label>
                <SignaturePad onChange={setDrawn} />
              </div>
            )}
            <label className="flex items-start gap-2 text-slate-700 text-sm">
              <input type="checkbox" name="statement" className="mt-1 rounded" required />
              <span>I confirm I am authorized to accept this proposal on behalf of the client, and I accept the scope, pricing and terms as written in this document.</span>
            </label>
            <p className="text-slate-400 text-xs">This records an acceptance event tied to the exact version of the proposal you reviewed. It may not constitute a legally binding e-signature in every jurisdiction — consult legal advice for high-value contracts.</p>
            <button className="w-full rounded-lg py-3 text-white font-medium" style={{ background: brand.primaryColor }}>Confirm acceptance</button>
          </form>
        )}

        {mode === "decline" && (
          <form action={declineAction} className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Decline proposal</h3>
            <input type="hidden" name="token" value={raw} />
            <textarea name="reason" rows={3} placeholder="It helps to know why (budget, timing, scope…)" className={input} />
            <button className="rounded-lg bg-slate-700 text-white px-5 py-2.5 text-sm">Submit</button>
          </form>
        )}

        {mode === "change" && (
          <form action={changeRequestAction} className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Request changes</h3>
            <input type="hidden" name="token" value={raw} />
            <textarea name="message" rows={3} required placeholder="What would you like changed?" value={message} onChange={(e) => setMessage(e.target.value)} className={input} />
            <button className="rounded-lg bg-slate-700 text-white px-5 py-2.5 text-sm">Send request</button>
          </form>
        )}

        <p className="text-center text-slate-400 text-xs mt-6">Powered by Proposal AI · secured link, expires automatically</p>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "text-slate-900 font-semibold" : "text-slate-500"}>{label}</span>
      <span className={bold ? "text-slate-900 font-bold" : "text-slate-700"}>{value}</span>
    </div>
  );
}

function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const ref = (el: HTMLCanvasElement | null) => {
    if (el && !el.dataset.bound) {
      el.dataset.bound = "1";
      const ctx = el.getContext("2d");
      if (!ctx) return;
      let isDrawing = false;
      const pos = (e: MouseEvent | TouchEvent) => {
        const rect = el.getBoundingClientRect();
        const t = "touches" in e ? e.touches[0] : (e as MouseEvent);
        return { x: (t as MouseEvent).clientX - rect.left, y: (t as MouseEvent).clientY - rect.top };
      };
      const start = (e: MouseEvent | TouchEvent) => { isDrawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
      const move = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        const p = pos(e); ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineTo(p.x, p.y); ctx.stroke();
      };
      const end = () => { if (isDrawing) { isDrawing = false; onChange(el.toDataURL()); } };
      el.addEventListener("mousedown", start); el.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);
      el.addEventListener("touchstart", start); el.addEventListener("touchmove", move); el.addEventListener("touchend", end);
    }
  };
  return <canvas ref={ref} width={500} height={140} className="w-full border border-dashed border-slate-300 rounded-lg touch-none bg-slate-50" />;
}

function shade(hex: string): string {
  try {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, (n >> 16) - 40), g = Math.max(0, ((n >> 8) & 255) - 40), b = Math.max(0, (n & 255) - 40);
    return `rgb(${r},${g},${b})`;
  } catch {
    return hex;
  }
}
