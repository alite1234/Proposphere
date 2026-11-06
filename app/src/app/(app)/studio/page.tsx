import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { discoverySessions, opportunities } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const t = await requireTenant();
  const sessions = await db
    .select({
      id: discoverySessions.id,
      status: discoverySessions.status,
      title: opportunities.title,
      clientName: opportunities.clientName,
      createdAt: discoverySessions.createdAt,
    })
    .from(discoverySessions)
    .innerJoin(opportunities, eq(opportunities.id, discoverySessions.opportunityId))
    .where(eq(discoverySessions.businessId, t.businessId))
    .orderBy(desc(discoverySessions.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Proposal Studio</h1>
          <p className="text-slate-400 text-sm mt-0.5">Describe the opportunity. The AI analyses it, asks what matters, and drafts with you.</p>
        </div>
        <Link href="/studio/new" className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5">New opportunity</Link>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-10 text-center">
          <p className="text-slate-300 font-medium">No discovery sessions yet</p>
          <p className="text-slate-500 text-sm mt-1">Start by describing a prospective client and what you want to propose.</p>
          <Link href="/studio/new" className="inline-block mt-4 rounded-lg bg-blue-600 text-white text-sm font-medium px-5 py-2.5">Start your first opportunity</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <Link key={s.id} href={`/studio/${s.id}`} className="rounded-xl bg-slate-900 border border-slate-800 p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide bg-slate-800 text-slate-400 rounded px-1.5 py-0.5">{s.status}</span>
                <span className="text-slate-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-white font-medium text-sm mt-2">{s.title}</div>
              <div className="text-slate-500 text-xs mt-0.5">{s.clientName ?? "No client set"}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
