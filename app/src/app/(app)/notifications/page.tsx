import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { markAllReadAction } from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

const KIND_ICONS: Record<string, string> = {
  proposal_accepted: "🎉",
  proposal_declined: "😔",
  revision_requested: "✏️",
  payment_recorded: "💰",
  proposal_sent: "📤",
  proposal_created: "📄",
  project_created: "🚀",
};

export default async function NotificationsPage() {
  const t = await requireTenant();
  const rows = await db.select().from(notifications).where(eq(notifications.businessId, t.businessId)).orderBy(desc(notifications.createdAt)).limit(100);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-0.5">In-app alerts for proposals, payments and project activity.</p>
        </div>
        <form action={markAllReadAction}><button className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 hover:bg-slate-700">Mark all read</button></form>
      </div>
      <ul className="space-y-2">
        {rows.map((n) => (
          <li key={n.id} className={`rounded-xl border p-4 flex gap-3 ${n.read ? "bg-slate-900/50 border-slate-800" : "bg-slate-900 border-blue-500/30"}`}>
            <span className="text-xl">{KIND_ICONS[n.kind] ?? "🔔"}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">{n.title}</div>
              {n.body && <div className="text-slate-400 text-xs mt-0.5">{n.body}</div>}
              <div className="text-slate-600 text-[11px] mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {n.link && <a href={n.link} className="text-blue-400 text-xs hover:text-blue-300 self-center">open →</a>}
          </li>
        ))}
        {rows.length === 0 && <li className="text-slate-500 text-sm text-center py-10">No notifications yet.</li>}
      </ul>
    </div>
  );
}
