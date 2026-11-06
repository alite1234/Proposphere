import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { businessProfiles, brandSettings, taxSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { saveProfileAction, saveBrandAction, saveFinanceSettingsAction } from "@/app/actions/settings";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-slate-300 text-xs font-medium mb-1";
const card = "rounded-xl bg-slate-900 border border-slate-800 p-6";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const t = await requireTenant();
  const { saved } = await searchParams;
  const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessId, t.businessId)).limit(1);
  const [brand] = await db.select().from(brandSettings).where(eq(brandSettings.businessId, t.businessId)).limit(1);
  const [fin] = await db.select().from(taxSettings).where(eq(taxSettings.businessId, t.businessId)).limit(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Business settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">This profile powers every proposal, quotation and receipt the AI helps you build.</p>
      </div>
      {saved && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3">Saved successfully.</div>}

      {/* Identity & positioning */}
      <form action={saveProfileAction} className={card + " space-y-5"}>
        <h2 className="text-white font-semibold">Business identity & positioning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>Contact person</label><input name="contactPerson" defaultValue={profile?.contactPerson ?? ""} className={input} /></div>
          <div><label className={label}>Industry</label><input name="industry" defaultValue={profile?.industry ?? ""} className={input} placeholder="Web development" /></div>
          <div><label className={label}>Business email</label><input name="email" type="email" defaultValue={profile?.email ?? ""} className={input} /></div>
          <div><label className={label}>Phone</label><input name="phone" defaultValue={profile?.phone ?? ""} className={input} /></div>
          <div><label className={label}>Address</label><input name="address" defaultValue={profile?.address ?? ""} className={input} /></div>
          <div><label className={label}>Website</label><input name="website" defaultValue={profile?.website ?? ""} className={input} placeholder="https://" /></div>
          <div><label className={label}>Years in operation</label><input name="yearsInOperation" type="number" min="0" defaultValue={profile?.yearsInOperation ?? ""} className={input} /></div>
          <div><label className={label}>Tax ID (optional)</label><input name="taxId" defaultValue={profile?.taxId ?? ""} className={input} /></div>
        </div>
        <div><label className={label}>Short business description</label><textarea name="description" rows={2} defaultValue={profile?.description ?? ""} className={input} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>What the business does</label><textarea name="whatWeDo" rows={2} defaultValue={profile?.whatWeDo ?? ""} className={input} /></div>
          <div><label className={label}>Who it serves</label><textarea name="whoWeServe" rows={2} defaultValue={profile?.whoWeServe ?? ""} className={input} /></div>
          <div><label className={label}>Main differentiators</label><textarea name="differentiators" rows={2} defaultValue={profile?.differentiators ?? ""} className={input} /></div>
          <div><label className={label}>Common client problems solved</label><textarea name="problemsSolved" rows={2} defaultValue={profile?.problemsSolved ?? ""} className={input} /></div>
          <div><label className={label}>Geographic service area</label><input name="serviceArea" defaultValue={profile?.serviceArea ?? ""} className={input} /></div>
          <div><label className={label}>Typical project size</label><input name="typicalProjectSize" defaultValue={profile?.typicalProjectSize ?? ""} className={input} placeholder="₦50k – ₦500k" /></div>
          <div>
            <label className={label}>Preferred tone of communication</label>
            <select name="toneOfVoice" defaultValue={profile?.toneOfVoice ?? "professional"} className={input}>
              <option value="professional">Professional</option>
              <option value="formal">Formal</option>
              <option value="persuasive">Persuasive</option>
              <option value="concise">Concise</option>
              <option value="friendly">Friendly</option>
              <option value="technical">Technical</option>
            </select>
          </div>
          <div><label className={label}>Mission / positioning statement</label><input name="mission" defaultValue={profile?.mission ?? ""} className={input} /></div>
        </div>
        <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save profile</button>
      </form>

      {/* Branding */}
      <form action={saveBrandAction} className={card + " space-y-5"}>
        <h2 className="text-white font-semibold">Brand identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>Logo URL</label><input name="logoUrl" defaultValue={brand?.logoUrl ?? ""} className={input} placeholder="https://…/logo.png" /></div>
          <div><label className={label}>Document style / template</label>
            <select name="documentStyle" defaultValue={brand?.documentStyle ?? "corporate"} className={input}>
              {["corporate", "minimal", "modern", "creative", "technical", "consulting", "elegant"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div><label className={label}>Primary colour</label><input name="primaryColor" type="color" defaultValue={brand?.primaryColor ?? "#1e40af"} className="h-10 w-full rounded-lg bg-slate-800 border border-slate-700 px-1" /></div>
          <div><label className={label}>Secondary colour</label><input name="secondaryColor" type="color" defaultValue={brand?.secondaryColor ?? "#64748b"} className="h-10 w-full rounded-lg bg-slate-800 border border-slate-700 px-1" /></div>
          <div><label className={label}>Accent colour</label><input name="accentColor" type="color" defaultValue={brand?.accentColor ?? "#f59e0b"} className="h-10 w-full rounded-lg bg-slate-800 border border-slate-700 px-1" /></div>
          <div><label className={label}>Font family</label>
            <select name="fontFamily" defaultValue={brand?.fontFamily ?? "Inter"} className={input}>
              {["Inter", "Georgia", "Arial", "Helvetica", "Times New Roman", "Courier New"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div><label className={label}>Signature image URL</label><input name="signatureUrl" defaultValue={brand?.signatureUrl ?? ""} className={input} /></div>
          <div><label className={label}>Company stamp URL</label><input name="stampUrl" defaultValue={brand?.stampUrl ?? ""} className={input} /></div>
        </div>
        <div><label className={label}>Document footer text</label><input name="footerText" defaultValue={brand?.footerText ?? ""} className={input} placeholder="Thank you for your business" /></div>
        <label className="flex items-center gap-2 text-slate-300 text-sm"><input type="checkbox" name="showPageNumbers" defaultChecked={brand?.showPageNumbers ?? true} className="rounded bg-slate-800" /> Show page numbers on exported documents</label>
        <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save branding</button>
      </form>

      {/* Finance defaults */}
      <form action={saveFinanceSettingsAction} className={card + " space-y-5"}>
        <h2 className="text-white font-semibold">Currency & tax defaults</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={label}>Business name</label><input name="businessName" defaultValue={t.businessName} className={input} /></div>
          <div><label className={label}>Currency code</label><input name="currency" defaultValue={fin?.currency ?? "NGN"} className={input} placeholder="NGN, USD…" /></div>
          <div><label className={label}>Default tax rate %</label><input name="defaultTaxRate" defaultValue={fin?.defaultTaxRate ?? "0"} className={input} /></div>
          <div><label className={label}>Tax label</label><input name="taxLabel" defaultValue={fin?.taxLabel ?? "VAT"} className={input} /></div>
        </div>
        <label className="flex items-center gap-2 text-slate-300 text-sm"><input type="checkbox" name="pricesIncludeTax" defaultChecked={fin?.pricesIncludeTax ?? false} className="rounded bg-slate-800" /> Listed prices include tax</label>
        <p className="text-slate-500 text-xs">All totals are calculated server-side with decimal-safe arithmetic. The AI never computes money.</p>
        <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Save financial defaults</button>
      </form>
    </div>
  );
}
