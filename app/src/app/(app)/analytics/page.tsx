import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { proposals, clients, projects, projectTasks, payments, clientInteractions } from "@/db/schema";
import { and, eq, sql, inArray } from "drizzle-orm";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const t = await requireTenant();
  const bid = t.businessId;

  const [statusCounts, leadSourceCounts, stageCounts, projectCounts, overdueTasks, interactions, proposalValues] = await Promise.all([
    db.select({ status: proposals.status, n: sql<number>`count(*)`, value: sql<string>`coalesce(sum(${proposals.total}),0)` }).from(proposals).where(eq(proposals.businessId, bid)).groupBy(proposals.status),
    db.select({ source: clients.leadSource, n: sql<number>`count(*)` }).from(clients).where(eq(clients.businessId, bid)).groupBy(clients.leadSource),
    db.select({ stage: clients.pipelineStage, n: sql<number>`count(*)` }).from(clients).where(eq(clients.businessId, bid)).groupBy(clients.pipelineStage),
    db.select({ status: projects.status, n: sql<number>`count(*)` }).from(projects).where(eq(projects.businessId, bid)).groupBy(projects.status),
    db.select({ n: sql<number>`count(*)` }).from(projectTasks).innerJoin(projects, eq(projects.id, projectTasks.projectId)).where(and(eq(projects.businessId, bid), sql`${projectTasks.status} != 'done'`, sql`${projectTasks.dueDate} < now()`)),
    db.select({ n: sql<number>`count(*)` }).from(clientInteractions).where(and(eq(clientInteractions.businessId, bid), sql`${clientInteractions.followUpAt} < now()`)),
    db.select({ total: proposals.total, currency: proposals.currency }).from(proposals).where(and(eq(proposals.businessId, bid), sql`${proposals.status} in ('sent','viewed','changes_requested','accepted','declined','expired')`)),
  ]);

  const byStatus = new Map(statusCounts.map((r) => [r.status, { n: Number(r.n), value: Number(r.value) }]));
  const decided = (byStatus.get("accepted")?.n ?? 0) + (byStatus.get("declined")?.n ?? 0) + (byStatus.get("expired")?.n ?? 0);
  const accepted = byStatus.get("accepted")?.n ?? 0;
  // Acceptance rate: accepted / proposals with a final decision (clearly defined metric)
  const acceptanceRate = decided > 0 ? Math.round((accepted / decided) * 100) : null;
  const avgValue = proposalValues.length > 0 ? proposalValues.reduce((a, p) => a + Number(p.total), 0) / proposalValues.length : 0;
  const pipelineValue = [...stageCounts].filter((s) => !["won", "lost", "archived"].includes(s.stage)).length;
  const totalLeads = [...stageCounts].reduce((a, s) => a + Number(s.n), 0);
  const wonCount = Number(stageCounts.find((s) => s.stage === "won")?.n ?? 0);
  const leadConversion = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : null;

  const cards = [
    { label: "Acceptance rate", value: acceptanceRate === null ? "—" : `${acceptanceRate}%`, note: `${accepted} accepted of ${decided} with final decision` },
    { label: "Average proposal value", value: money(avgValue, "NGN"), note: `${proposalValues.length} sent proposals` },
    { label: "Lead → client conversion", value: leadConversion === null ? "—" : `${leadConversion}%`, note: `${wonCount} won of ${totalLeads} in pipeline` },
    { label: "Overdue tasks", value: String(Number(overdueTasks[0]?.n ?? 0)), note: "Across all active projects" },
    { label: "Overdue follow-ups", value: String(Number(interactions[0]?.n ?? 0)), note: "Reminders past their date" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-0.5">Defined, traceable metrics — every number states what it measures.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-slate-900 border border-slate-800 p-4">
            <div className="text-slate-400 text-xs">{c.label}</div>
            <div className="text-white text-xl font-bold mt-1">{c.value}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">{c.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Proposals by status</h2>
          {statusCounts.length === 0 ? <p className="text-slate-500 text-sm">No proposals yet.</p> : (
            <ul className="space-y-2">
              {statusCounts.map((s) => (
                <li key={s.status} className="flex justify-between text-sm">
                  <span className="text-slate-300 capitalize">{s.status.replace(/_/g, " ")}</span>
                  <span className="text-slate-400">{Number(s.n)} · {money(s.value, "NGN")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Leads by source</h2>
          {leadSourceCounts.length === 0 ? <p className="text-slate-500 text-sm">No clients yet.</p> : (
            <ul className="space-y-2">
              {leadSourceCounts.map((s) => (
                <li key={s.source ?? "unknown"} className="flex justify-between text-sm">
                  <span className="text-slate-300">{s.source ?? "Unknown"}</span><span className="text-slate-400">{Number(s.n)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Projects by status</h2>
          {projectCounts.length === 0 ? <p className="text-slate-500 text-sm">No projects yet.</p> : (
            <ul className="space-y-2">
              {projectCounts.map((s) => (
                <li key={s.status} className="flex justify-between text-sm">
                  <span className="text-slate-300 capitalize">{s.status.replace(/_/g, " ")}</span><span className="text-slate-400">{Number(s.n)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <h2 className="text-white font-semibold text-sm mb-3">CRM pipeline by stage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {stageCounts.map((s) => (
            <div key={s.stage} className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 text-center">
              <div className="text-white text-lg font-bold">{Number(s.n)}</div>
              <div className="text-slate-500 text-[11px] capitalize">{s.stage.replace(/_/g, " ")}</div>
            </div>
          ))}
          {stageCounts.length === 0 && <p className="text-slate-500 text-sm">Pipeline is empty.</p>}
        </div>
      </div>
    </div>
  );
}
