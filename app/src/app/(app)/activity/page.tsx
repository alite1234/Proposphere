import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const t = await requireTenant();
  const rows = await db.select().from(activityLogs).where(eq(activityLogs.businessId, t.businessId)).orderBy(desc(activityLogs.createdAt)).limit(200);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity log</h1>
        <p className="text-slate-400 text-sm mt-0.5">Every important action: actor, timestamp, object and details.</p>
      </div>
      <ul className="space-y-1.5">
        {rows.map((a) => (
          <li key={a.id} className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-slate-200 font-medium">{a.action.replaceAll("_", " ")}</span>
            {a.actor && <span className="text-slate-500 text-xs">by {a.actor}</span>}
            {a.objectType && <span className="text-slate-600 text-xs">({a.objectType})</span>}
            {Object.keys(a.details).length > 0 && <span className="text-slate-500 text-xs truncate">{JSON.stringify(a.details)}</span>}
            <span className="text-slate-600 text-xs ml-auto shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-slate-500 text-sm text-center py-10">No activity recorded yet.</li>}
      </ul>
    </div>
  );
}
