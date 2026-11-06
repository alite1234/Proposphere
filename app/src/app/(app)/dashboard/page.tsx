import Link from "next/link";
import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { proposals, clients, projects, payments, activityLogs, clientInteractions, projectTasks } from "@/db/schema";
import { and, eq, desc, sql, inArray, ne } from "drizzle-orm";
import { money } from "@/lib/money";
import { aiAvailable } from "@/lib/ai";

export const dynamic = "force-dynamic";

const CARD_ICONS: Record<string, string> = {
  "Revenue received": "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "Proposals awaiting response": "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Active projects": "M19 11V9a2 2 0 00-2-2h-4l-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3m-5 3l3-3-3-3",
  "New leads": "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  "Acceptance rate": "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "Overdue follow-ups": "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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

  // Proposal pipeline funnel
  const pipeline = await db
    .select({ status: proposals.status, n: sql<number>`count(*)` })
    .from(proposals)
    .where(eq(proposals.businessId, bid))
    .groupBy(proposals.status);
  const funnelStages: { label: string; keys: string[]; tone: string }[] = [
    { label: "Drafting", keys: ["draft", "discovery_in_progress", "ready_for_review"], tone: "from-slate-500 to-slate-400" },
    { label: "Sent", keys: ["sent", "viewed"], tone: "from-blue-500 to-cyan-400" },
    { label: "In revision", keys: ["changes_requested"], tone: "from-amber-500 to-orange-400" },
    { label: "Accepted", keys: ["accepted"], tone: "from-emerald-500 to-teal-400" },
    { label: "Declined/expired", keys: ["declined", "expired", "withdrawn"], tone: "from-red-500 to-rose-400" },
  ];
  const funnel = funnelStages.map((s) => ({
    ...s,
    n: pipeline.filter((p) => s.keys.includes(p.status)).reduce((a, p) => a + Number(p.n), 0),
  }));
  const funnelMax = Math.max(...funnel.map((f) => f.n), 1);

  // Revenue by month, last 6 months (received cash only)
  const payRows = await db
    .select({ amount: payments.amount, paymentDate: payments.paymentDate })
    .from(payments)
    .where(and(eq(payments.businessId, bid), eq(payments.status, "confirmed"), ne(payments.paymentType, "refund")));
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push({
      label: d.toLocaleDateString(undefined, { month: "short" }),
      value: payRows.filter((p) => String(p.paymentDate).startsWith(key)).reduce((a, p) => a + Number(p.amount), 0),
    });
  }
  const maxMonth = Math.max(...months.map((m) => m.value), 1);

  const cards = [
    { label: "Revenue received", value: money(received, "NGN"), note: "Confirmed payments only", href: "/payments" },
    { label: "Proposals awaiting response", value: String(Number(awaitingRows[0]?.n ?? 0)), note: "Sent, viewed or in revision", href: "/proposals" },
    { label: "Active projects", value: String(Number(activeProjects[0]?.n ?? 0)), note: "In planning or delivery", href: "/projects" },
    { label: "New leads", value: String(Number(newLeads[0]?.n ?? 0)), note: "In your CRM pipeline", href: "/clients" },
    { label: "Acceptance rate", value: acceptanceRate === null ? "—" : `${acceptanceRate}%`, note: `${accepted} accepted of ${sent} decided`, href: "/analytics" },
    { label: "Overdue follow-ups", value: String(Number(overdueFollowUps[0]?.n ?? 0)), note: "Reminders past due", href: "/clients" },
  ];

  const isEmpty = received === 0 && sent === 0 && Number(activeProjects[0]?.n ?? 0) === 0 && Number(newLeads[0]?.n ?? 0) === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {greeting()}, <span className="gradient-text">{t.user.name.split(" ")[0]}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t.businessName} · money shown is received cash, not proposal value</p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio/new" className="btn-primary rounded-xl text-sm font-medium px-4 py-2.5">New proposal (AI)</Link>
          <Link href="/quotations" className="btn-ghost rounded-xl text-slate-200 text-sm font-medium px-4 py-2.5">New quotation</Link>
        </div>
      </div>

      {!aiAvailable() && (
        <div className="glass rounded-2xl px-4 py-3 text-sm text-amber-300/90 flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>
            AI provider not configured. Add <code className="font-mono text-amber-200">GEMINI_API_KEY</code> (or GROQ/CEREBRAS) to enable the AI Proposal Studio. Everything else works without AI.
          </span>
        </div>
      )}

      {isEmpty && (
        <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <div className="text-white font-semibold">Welcome to your new workspace</div>
            <p className="text-slate-400 text-sm mt-1">Start by completing your business profile, adding a service, or creating your first proposal.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/onboarding" className="btn-ghost rounded-xl text-slate-200 text-sm px-4 py-2.5">Business profile</Link>
            <Link href="/studio/new" className="btn-primary rounded-xl text-white text-sm px-4 py-2.5 font-medium">Create proposal</Link>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="glass glass-hover rounded-2xl p-5 group">
            <div className="flex items-start justify-between">
              <div className="text-slate-400 text-xs uppercase tracking-wider">{c.label}</div>
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={CARD_ICONS[c.label] ?? "M13 10V3L4 14h7v7l9-11h-7z"} />
                </svg>
              </div>
            </div>
            <div className="text-white text-[26px] font-bold mt-2 tracking-tight">{c.value}</div>
            <div className="text-slate-500 text-xs mt-1">{c.note}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue chart */}
        <div className="glass rounded-2xl p-5 lg:col-span-3">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-white font-semibold text-sm">Revenue received — last 6 months</h2>
            <span className="text-slate-500 text-xs">confirmed payments</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center" style={{ height: "100%" }}>
                  <div
                    className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-blue-600/70 to-violet-500/80 transition-all hover:from-blue-500 hover:to-violet-400"
                    style={{ height: `${Math.max((m.value / maxMonth) * 100, m.value > 0 ? 6 : 2)}%` }}
                    title={money(m.value, "NGN")}
                  />
                </div>
                <span className="text-slate-500 text-[10px]">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Proposal pipeline funnel */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Proposal pipeline</h2>
            <Link href="/analytics" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Analytics →</Link>
          </div>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{f.label}</span>
                  <span className="text-slate-300 font-medium">{f.n}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${f.tone} transition-all`}
                    style={{ width: `${Math.max((f.n / funnelMax) * 100, f.n > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Upcoming deadlines</h2>
        {upcomingTasks.length === 0 ? (
          <p className="text-slate-500 text-sm">No scheduled tasks yet.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {upcomingTasks.map((task) => {
              const overdue = task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <li key={task.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-slate-200 truncate">{task.title}</div>
                    <div className="text-slate-500 text-xs">{task.projectName}</div>
                  </div>
                  <span className={`text-xs shrink-0 rounded-md px-2 py-1 ${overdue ? "text-red-300 bg-red-500/10 border border-red-500/20" : "text-slate-400 bg-white/[0.03] border border-white/[0.06]"}`}>
                    {task.dueDate}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Recent activity */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">Recent activity</h2>
          <Link href="/activity" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-slate-500 text-sm">Nothing yet — create your first proposal.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm py-2.5 first:pt-0 last:pb-0">
                <span className="text-slate-300 capitalize truncate">{a.action.replaceAll("_", " ")}</span>
                <span className="text-slate-500 text-xs shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
