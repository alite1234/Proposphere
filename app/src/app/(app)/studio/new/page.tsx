import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createOpportunityAction } from "@/app/actions/studio";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-slate-300 text-xs font-medium mb-1";

export default async function NewOpportunityPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const t = await requireTenant();
  const { clientId } = await searchParams;
  const existingClients = await db.select().from(clients).where(and(eq(clients.businessId, t.businessId))).limit(50);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New opportunity</h1>
        <p className="text-slate-400 text-sm mt-0.5">Tell the AI about the prospective client and what you want to propose. The more honest detail, the better the discovery.</p>
      </div>
      <form action={createOpportunityAction} className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className={label}>Opportunity title *</label><input name="title" required className={input} placeholder="Website redesign for XYZ Fashion" /></div>
          <div>
            <label className={label}>Existing client (optional)</label>
            <select name="clientId" defaultValue={clientId ?? ""} className={input}>
              <option value="">— New / not in CRM —</option>
              {existingClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className={label}>Client or company name</label><input name="clientName" className={input} placeholder="XYZ Fashion Ltd" /></div>
          <div><label className={label}>Industry</label><input name="industry" className={input} placeholder="Fashion / retail" /></div>
          <div><label className={label}>Location</label><input name="location" className={input} /></div>
          <div><label className={label}>Contact person</label><input name="contactName" className={input} /></div>
          <div><label className={label}>Contact role</label><input name="contactRole" className={input} placeholder="Founder" /></div>
          <div><label className={label}>Website or public profile</label><input name="website" className={input} placeholder="https://" /></div>
          <div><label className={label}>How you found the opportunity</label><input name="source" className={input} placeholder="Referral" /></div>
          <div className="md:col-span-2"><label className={label}>What the client does</label><textarea name="clientDescription" rows={2} className={input} /></div>
          <div><label className={label}>Known business goals</label><textarea name="goals" rows={2} className={input} /></div>
          <div><label className={label}>Known challenges</label><textarea name="challenges" rows={2} className={input} /></div>
          <div className="md:col-span-2"><label className={label}>Conversation notes / uploaded brief</label><textarea name="brief" rows={3} className={input} /></div>
          <div className="md:col-span-2"><label className={label}>What service do you want to propose, and why approach this client now?</label><textarea name="desiredOutcome" rows={3} className={input} required /></div>
        </div>
        <button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Create opportunity & analyse</button>
      </form>
    </div>
  );
}
