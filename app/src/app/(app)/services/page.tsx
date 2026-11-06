import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { services, packages, taxSettings } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { saveServiceAction, archiveServiceAction, savePackageAction, archivePackageAction } from "@/app/actions/services";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-slate-300 text-xs font-medium mb-1";

export default async function ServicesPage() {
  const t = await requireTenant();
  const [svc, pkgs, fin] = await Promise.all([
    db.select().from(services).where(and(eq(services.businessId, t.businessId), eq(services.active, true))).orderBy(desc(services.createdAt)),
    db.select().from(packages).where(and(eq(packages.businessId, t.businessId), eq(packages.active, true))).orderBy(desc(packages.createdAt)),
    db.select().from(taxSettings).where(eq(taxSettings.businessId, t.businessId)).limit(1),
  ]);
  const currency = fin[0]?.currency ?? "NGN";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Services & packages</h1>
        <p className="text-slate-400 text-sm mt-0.5">Configure offerings once — reuse them across proposals and quotations.</p>
      </div>

      {/* Services */}
      <section className="space-y-4">
        <h2 className="text-white font-semibold text-lg">Services ({svc.length})</h2>
        {svc.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {svc.map((s) => (
              <div key={s.id} className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-white font-medium text-sm">{s.name}</div>
                    {s.category && <div className="text-slate-500 text-xs">{s.category}</div>}
                  </div>
                  <form action={archiveServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-slate-500 hover:text-red-400 text-xs">archive</button>
                  </form>
                </div>
                {s.description && <p className="text-slate-400 text-xs mt-2 line-clamp-2">{s.description}</p>}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-emerald-400 font-semibold">{money(s.basePrice, currency)}{s.priceMax ? ` – ${money(s.priceMax, currency)}` : ""}</span>
                  <span className="text-slate-500 text-xs">per {s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <details className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <summary className="text-white text-sm font-medium cursor-pointer">+ Add a service or product</summary>
          <form action={saveServiceAction} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2"><label className={label}>Name *</label><input name="name" required className={input} /></div>
            <div><label className={label}>Category</label><input name="category" className={input} /></div>
            <div className="md:col-span-3"><label className={label}>Description</label><textarea name="description" rows={2} className={input} /></div>
            <div className="md:col-span-3"><label className={label}>Detailed scope</label><textarea name="scope" rows={2} className={input} /></div>
            <div className="md:col-span-3"><label className={label}>Deliverables (one per line)</label><textarea name="deliverables" rows={2} className={input} /></div>
            <div><label className={label}>Unit</label><input name="unit" defaultValue="item" className={input} /></div>
            <div><label className={label}>Default quantity</label><input name="defaultQuantity" type="number" step="0.01" min="0" defaultValue="1" className={input} /></div>
            <div><label className={label}>Base price *</label><input name="basePrice" type="number" step="0.01" min="0" required className={input} /></div>
            <div><label className={label}>Price max (optional)</label><input name="priceMax" type="number" step="0.01" min="0" className={input} /></div>
            <div><label className={label}>Delivery duration (days)</label><input name="durationDays" type="number" min="0" className={input} /></div>
            <div><label className={label}>Warranty/support (days)</label><input name="warrantyDays" type="number" min="0" className={input} /></div>
            <div><label className={label}>Tax rate %</label><input name="taxRate" type="number" step="0.01" min="0" defaultValue="0" className={input} /></div>
            <div className="md:col-span-3"><label className={label}>Exclusions</label><textarea name="exclusions" rows={2} className={input} /></div>
            <div className="md:col-span-3"><button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save service</button></div>
          </form>
        </details>
      </section>

      {/* Packages */}
      <section className="space-y-4">
        <h2 className="text-white font-semibold text-lg">Packages ({pkgs.length})</h2>
        {pkgs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pkgs.map((p) => (
              <div key={p.id} className={`rounded-xl border p-4 flex flex-col ${p.recommended ? "border-blue-500/50 bg-blue-500/5" : "bg-slate-900 border-slate-800"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-white font-medium text-sm">{p.name}{p.recommended && <span className="ml-2 text-[10px] bg-blue-600 text-white rounded-full px-2 py-0.5">Recommended</span>}</div>
                  <form action={archivePackageAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-slate-500 hover:text-red-400 text-xs">archive</button>
                  </form>
                </div>
                {p.description && <p className="text-slate-400 text-xs mt-2">{p.description}</p>}
                {p.features.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {p.features.slice(0, 5).map((f, i) => <li key={i} className="text-slate-300 text-xs flex gap-1.5"><span className="text-emerald-400">✓</span>{f}</li>)}
                    {p.features.length > 5 && <li className="text-slate-500 text-xs">+{p.features.length - 5} more</li>}
                  </ul>
                )}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-emerald-400 font-semibold">{money(p.price, currency)}</span>
                  <span className="text-slate-500 text-xs">{p.timelineDays ? `${p.timelineDays}d delivery` : ""}{p.supportDays ? ` · ${p.supportDays}d support` : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <details className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <summary className="text-white text-sm font-medium cursor-pointer">+ Add a package (Basic / Professional / Enterprise…)</summary>
          <form action={savePackageAction} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div><label className={label}>Package name *</label><input name="name" required className={input} placeholder="Professional" /></div>
            <div><label className={label}>Price *</label><input name="price" type="number" step="0.01" min="0" required className={input} /></div>
            <div><label className={label}>Delivery timeline (days)</label><input name="timelineDays" type="number" min="0" className={input} /></div>
            <div className="md:col-span-3"><label className={label}>Description</label><textarea name="description" rows={2} className={input} /></div>
            <div className="md:col-span-3">
              <label className={label}>Included services</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {svc.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-slate-300 text-xs bg-slate-800 rounded px-2.5 py-1.5">
                    <input type="checkbox" name="serviceIds" value={s.id} className="rounded bg-slate-700" />
                    {s.name} <span className="text-slate-500 ml-auto">{money(s.basePrice, currency)}</span>
                  </label>
                ))}
                {svc.length === 0 && <p className="text-slate-500 text-xs">Add services first.</p>}
              </div>
            </div>
            <div className="md:col-span-3"><label className={label}>Included features (one per line)</label><textarea name="features" rows={4} className={input} placeholder={"Custom design\nResponsive layout\nSEO setup"} /></div>
            <div><label className={label}>Support period (days)</label><input name="supportDays" type="number" min="0" className={input} /></div>
            <div className="md:col-span-2"><label className={label}>Limits / quantities</label><input name="limits" className={input} placeholder="Up to 5 pages, 2 revision rounds" /></div>
            <div className="md:col-span-3"><label className={label}>Terms and exclusions</label><textarea name="terms" rows={2} className={input} /></div>
            <label className="flex items-center gap-2 text-slate-300 text-sm md:col-span-2"><input type="checkbox" name="recommended" className="rounded bg-slate-800" /> Mark as recommended / popular</label>
            <div className="md:col-span-3"><button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save package</button></div>
          </form>
        </details>
      </section>
    </div>
  );
}
