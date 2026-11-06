import Link from "next/link";
import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { proposals, clients, projects, payments, quotations, activityLogs, clientInteractions, projectTasks } from "@/db/schema";
import { and, eq, desc, sql, inArray, ne, gte, lte, or, isNull } from "drizzle-orm";
import { money } from "@/lib/money";
import { aiAvailable } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = await requireTenant();
  const bid = t.businessId;

  const [receivedRows, acceptedRows, awaitingRows, activeProjects, newLeads, overdueFollowUps, recent, upcomingTasks] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(${payments.amount}),0)` }).from(payments).where(and(eq(payments.businessId, bid), eq(payments.status, "confirmed"), ne(payments.paymentType, "refund"))),
    db.select({ n: sql<number>`count(*)` }).from(proposals).where(and(eq(proposals.businessId, bid), eq(proposals.status, "accepted"))),
    db.select({ n: sql<number>`count(*)` }).from(proposals).where(and(eq(proposals.businessId, bid), inArray(proposals.status, ["sent", "viewed", "changes_requested"]))),
    db.select({ n: sql<number>`count(*)` }).from(projects).where(and(eq(projects.businessId, bid), inArray(projects.status, ["planning", "in_progress", "waiting_client", "review"]))),
    db.select({ n: sql<number>`count(*)` }).from(clients).where(and(eq(clients.businessId, bid), eq(clients.relationshipStatus, "lead"))),
    db
      .select({ n: sql<number>`count(*)` })
      .from(clientInteractions)
      .where(and(eq(clientInteractions.businessId, bid), sql`${clientInteractions.followUpAt} < now()`, sql`${clientInteractions.followUpAt} is not null`)),
    db.select().from(activityLogs).where(eq(activityLogs.businessId, bid)).orderBy(desc(activityLogs.createdAt)).limit(8),
    db
      .select({ id: projectTasks.id, title: projectTasks.title, dueDate: projectTasks.dueDate, projectName: projects.name })
      .from(projectTasks)
      .innerJoin(projects, eq(projects.id, projectTasks.projectId))
      .where(and(eq(projects.businessId, bid), ne(projectTasks.status, "done"), sql`${projectTasks.dueDate} is not null`))
      .orderBy(projectTasks.dueDate)
      .limit(5),
  ]);

  const received = Number(receivedRows[0]?.total ?? 0);
  const sentCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(proposals)
    .where(and(eq(proposals.businessId, bid), sql`${proposals.status} in ('sent','viewed','changes_requested','accepted','declined','expired')`));
  const sent = Number(sentCount[0]?.n ?? 0);
  const accepted = Number(acceptedRows[0]?.n ?? 0);
  const acceptanceRate = sent > 0 ? Math.round((accepted / sent) * 100) : null;

  const cards = [
    { label: "Revenue received", value: money(received, "NGN"), note: "Confirmed payments only", href: "/payments" },
    { label: "Proposals awaiting response", value: String(Number(awaitingRows[0]?.n ?? 0)), note: "Sent, viewed or in revision", href: "/proposals" },
    { label: "Active projects", value: String(Number(activeProjects[0]?.n ?? 0)), note: "In planning or delivery", href: "/projects" },
    { label: "New leads", value: String(Number(newLeads[0]?.n ?? 0)), note: "In your CRM pipeline", href: "/clients" },
    { label: "Acceptance rate", value: acceptanceRate === null ? "—" : `${acceptanceRate}%`, note: `${accepted} accepted of ${sent} decided`, href: "/analytics" },
    { label: "Overdue follow-ups", value: String(Number(overdueFollowUps[0]?.n ?? 0)), note: "Reminders past due", href: "/clients" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">{t.businessName} · money shown is received cash, not proposal value</p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio/new" className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 transition-colors">New proposal (AI)</Link>
          <Link href="/quotations" className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-4 py-2.5 border border-slate-700 transition-colors">New quotation</Link>
        </div>
      </div>

      {!aiAvailable() && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-300">
          AI provider not configured. Add <code className="font-mono">GEMINI_API_KEY</code> (or GROQ/CEREBRAS) to <code className="font-mono">.env</code> to enable the AI Proposal Studio. Everything else works without AI.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-600 transition-colors">
            <div className="text-slate-400 text-xs uppercase tracking-wide">{c.label}</div>
            <div className="text-white text-2xl font-bold mt-1.5">{c.value}</div>
            <div className="text-slate-500 text-xs mt-1">{c.note}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Upcoming deadlines</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-slate-500 text-sm">No scheduled tasks yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-slate-200">{task.title}</div>
                    <div className="text-slate-500 text-xs">{task.projectName}</div>
                  </div>
                  <div className={`text-xs ${task.dueDate && new Date(task.dueDate) < new Date() ? "text-red-400" : "text-slate-400"}`}>{task.dueDate}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-slate-500 text-sm">Nothing yet — create your first proposal.</p>
          ) : (
            <ul className="space-y-2.5">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-slate-300 truncate">{a.action.replaceAll("_", " ")}</span>
                  <span className="text-slate-500 text-xs shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
