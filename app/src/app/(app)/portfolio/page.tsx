import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { portfolioItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { savePortfolioAction, deletePortfolioAction } from "@/app/actions/portfolio";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-slate-300 text-xs font-medium mb-1";

const KINDS = ["project", "case_study", "testimonial", "award", "certification", "team_bio", "reference"];

export default async function PortfolioPage() {
  const t = await requireTenant();
  const items = await db.select().from(portfolioItems).where(eq(portfolioItems.businessId, t.businessId)).orderBy(desc(portfolioItems.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio & credibility library</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Evidence the AI may cite in proposals. <span className="text-amber-400">The AI never invents clients, testimonials, awards or results — only what you add here.</span>
        </p>
      </div>

      <details className="rounded-xl bg-slate-900 border border-slate-800 p-5" open={items.length === 0}>
        <summary className="text-white text-sm font-medium cursor-pointer">+ Add evidence item</summary>
        <form action={savePortfolioAction} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className={label}>Type</label>
            <select name="kind" className={input}>{KINDS.map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}</select>
          </div>
          <div className="md:col-span-2"><label className={label}>Title *</label><input name="title" required className={input} placeholder="E-commerce store for XYZ Fashion" /></div>
          <div className="md:col-span-3"><label className={label}>Description</label><textarea name="description" rows={2} className={input} /></div>
          <div><label className={label}>Category</label><input name="category" className={input} placeholder="Web design" /></div>
          <div><label className={label}>Date</label><input name="date" type="date" className={input} /></div>
          <div><label className={label}>Result / metric</label><input name="resultMetric" className={input} placeholder="+40% online sales in 3 months" /></div>
          <div className="md:col-span-2"><label className={label}>Image URL</label><input name="imageUrl" className={input} /></div>
          <div className="md:col-span-3"><button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save item</button></div>
        </form>
      </details>

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((i) => (
            <div key={i.id} className="rounded-xl bg-slate-900 border border-slate-800 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide bg-slate-800 text-slate-400 rounded px-1.5 py-0.5">{i.kind.replace("_", " ")}</span>
                <form action={deletePortfolioAction}>
                  <input type="hidden" name="id" value={i.id} />
                  <button className="text-slate-500 hover:text-red-400 text-xs">delete</button>
                </form>
              </div>
              <div className="text-white font-medium text-sm mt-2">{i.title}</div>
              {i.description && <p className="text-slate-400 text-xs mt-1">{i.description}</p>}
              {i.resultMetric && <div className="text-emerald-400 text-xs mt-2">{i.resultMetric}</div>}
              {i.date && <div className="text-slate-500 text-xs mt-1">{i.date}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
