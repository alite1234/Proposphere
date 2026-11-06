import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { projects, clients, projectTasks, proposals } from "@/db/schema";
import { and, eq, desc, ne, sql } from "drizzle-orm";
import { createProjectAction } from "@/app/actions/projects";
import { money } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-slate-700/50 text-slate-300",
  planning: "bg-blue-500/15 text-blue-300",
  in_progress: "bg-cyan-500/15 text-cyan-300",
  waiting_client: "bg-amber-500/15 text-amber-300",
  on_hold: "bg-orange-500/15 text-orange-300",
  review: "bg-indigo-500/15 text-indigo-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-red-500/15 text-red-300",
};

export default async function ProjectsPage() {
  const t = await requireTenant();
  const rows = await db.select().from(projects).where(eq(projects.businessId, t.businessId)).orderBy(desc(projects.createdAt));
  const clientList = await db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.businessId, t.businessId));
  const accepted = await db
    .select({ id: proposals.id, reference: proposals.reference, title: proposals.title })
    .from(proposals)
    .where(and(eq(proposals.businessId, t.businessId), eq(proposals.status, "accepted")));

  const progressByProject = await db
    .select({
      projectId: projectTasks.projectId,
      total: sql<number>`coalesce(sum(${projectTasks.weight}),0)`,
      done: sql<number>`coalesce(sum(case when ${projectTasks.status} = 'done' then ${projectTasks.weight} else 0 end),0)`,
    })
    .from(projectTasks)
    .innerJoin(projects, eq(projects.id, projectTasks.projectId))
    .where(eq(projects.businessId, t.businessId))
    .groupBy(projectTasks.projectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="text-slate-400 text-sm mt-0.5">Progress is calculated from completed tasks and their weights — never estimated by AI.</p>
      </div>

      <details className="rounded-xl bg-slate-900 border border-slate-800 p-5" open={rows.length === 0}>
        <summary className="text-white text-sm font-medium cursor-pointer">+ New project</summary>
        <form action={createProjectAction} className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="md:col-span-2"><label className="block text-slate-300 text-xs mb-1">Project name *</label><input name="name" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">Client</label>
            <select name="clientId" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm"><option value="">— none —</option>{clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div><label className="block text-slate-300 text-xs mb-1">Value</label><input name="value" type="number" step="0.01" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div><label className="block text-slate-300 text-xs mb-1">Currency</label><input name="currency" defaultValue="NGN" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div><label className="block text-slate-300 text-xs mb-1">Due date</label><input name="dueDate" type="date" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div className="md:col-span-3"><label className="block text-slate-300 text-xs mb-1">Agreed scope</label><textarea name="scope" rows={2} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" /></div>
          <div className="md:col-span-3"><button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5">Create project</button></div>
        </form>
        {accepted.length > 0 && (
          <p className="text-slate-500 text-xs mt-3">Tip: accepted proposals can be converted from the proposal page — {accepted.map((a) => a.reference).join(", ")}.</p>
        )}
      </details>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((p) => {
          const prog = progressByProject.find((x) => x.projectId === p.id);
          const pct = prog && Number(prog.total) > 0 ? Math.round((Number(prog.done) / Number(prog.total)) * 100) : 0;
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className="rounded-xl bg-slate-900 border border-slate-800 p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] rounded-full px-2 py-1 ${STATUS_STYLES[p.status] ?? ""}`}>{p.status.replace(/_/g, " ")}</span>
                <span className="text-slate-500 text-xs">{money(p.value, p.currency)}</span>
              </div>
              <div className="text-white font-medium text-sm mt-2">{p.name}</div>
              <div className="text-slate-500 text-xs">{clientList.find((c) => c.id === p.clientId)?.name ?? "No client"}</div>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1"><span>Progress</span><span>{pct}%</span></div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} /></div>
              </div>
              {p.dueDate && <div className="text-slate-500 text-xs mt-2">Due {p.dueDate}</div>}
            </Link>
          );
        })}
      </div>
      {rows.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No projects yet. Convert an accepted proposal or create one manually.</p>}
    </div>
  );
}
