import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { businessProfiles, services, portfolioItems } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { saveProfileAction, saveBrandAction } from "@/app/actions/settings";
import Link from "next/link";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-slate-300 text-xs font-medium mb-1";

export default async function OnboardingPage() {
  const t = await requireTenant();
  const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessId, t.businessId)).limit(1);
  const [svcCount] = await db.select({ n: count() }).from(services).where(eq(services.businessId, t.businessId));
  const [pfCount] = await db.select({ n: count() }).from(portfolioItems).where(eq(portfolioItems.businessId, t.businessId));
  const steps = [
    { done: !!profile?.description, title: "1. Business profile", desc: "Tell the AI what you do and who you serve.", href: "#profile" },
    { done: Number(svcCount?.n ?? 0) > 0, title: "2. Services & prices", desc: "Add your catalogue once, reuse everywhere.", href: "/services" },
    { done: Number(pfCount?.n ?? 0) > 0, title: "3. Portfolio & credibility", desc: "Real evidence only — the AI never invents it.", href: "/portfolio" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold text-white">Welcome, {t.user.name.split(" ")[0]}</h1>
        <p className="text-slate-400 text-sm mt-1">Complete your business profile so every proposal starts from real facts. You can return to this later.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((s) => (
          <div key={s.title} className={`rounded-xl border p-4 ${s.done ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-800 bg-slate-900"}`}>
            <div className="flex items-center gap-2">
              {s.done ? <span className="text-emerald-400">✓</span> : <span className="text-slate-500">○</span>}
              <span className="text-white text-sm font-medium">{s.title}</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      <form action={saveProfileAction} id="profile" className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h2 className="text-white font-semibold">Business profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>Industry</label><input name="industry" defaultValue={profile?.industry ?? ""} className={input} placeholder="Web development" /></div>
          <div><label className={label}>Contact person</label><input name="contactPerson" defaultValue={profile?.contactPerson ?? t.user.name} className={input} /></div>
          <div><label className={label}>Business email</label><input name="email" type="email" defaultValue={profile?.email ?? t.user.email} className={input} /></div>
          <div><label className={label}>Phone</label><input name="phone" defaultValue={profile?.phone ?? ""} className={input} /></div>
        </div>
        <div><label className={label}>Short description of your business</label><textarea name="description" rows={2} defaultValue={profile?.description ?? ""} className={input} placeholder="We design and build conversion-focused websites for small businesses…" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>What you do</label><textarea name="whatWeDo" rows={2} defaultValue={profile?.whatWeDo ?? ""} className={input} /></div>
          <div><label className={label}>Who you serve</label><textarea name="whoWeServe" rows={2} defaultValue={profile?.whoWeServe ?? ""} className={input} /></div>
          <div><label className={label}>Main differentiators</label><textarea name="differentiators" rows={2} defaultValue={profile?.differentiators ?? ""} className={input} /></div>
          <div><label className={label}>Common client problems you solve</label><textarea name="problemsSolved" rows={2} defaultValue={profile?.problemsSolved ?? ""} className={input} /></div>
        </div>
        <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save & continue</button>
      </form>

      <form action={saveBrandAction} className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h2 className="text-white font-semibold">Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>Logo URL</label><input name="logoUrl" className={input} placeholder="https://…/logo.png" /></div>
          <div><label className={label}>Primary colour</label><input name="primaryColor" type="color" defaultValue="#1e40af" className="h-10 w-full rounded-lg bg-slate-800 border border-slate-700 px-1" /></div>
          <div><label className={label}>Secondary colour</label><input name="secondaryColor" type="color" defaultValue="#64748b" className="h-10 w-full rounded-lg bg-slate-800 border border-slate-700 px-1" /></div>
          <div><label className={label}>Accent colour</label><input name="accentColor" type="color" defaultValue="#f59e0b" className="h-10 w-full rounded-lg bg-slate-800 border border-slate-700 px-1" /></div>
        </div>
        <input type="hidden" name="documentStyle" value="corporate" />
        <input type="hidden" name="fontFamily" value="Inter" />
        <input type="hidden" name="showPageNumbers" />
        <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save branding</button>
      </form>

      <div className="flex flex-wrap gap-3 justify-center pb-4">
        <Link href="/services" className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 hover:bg-slate-700">Add services & packages →</Link>
        <Link href="/portfolio" className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 hover:bg-slate-700">Add portfolio →</Link>
        <Link href="/dashboard" className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-500">Go to dashboard</Link>
      </div>
    </div>
  );
}
