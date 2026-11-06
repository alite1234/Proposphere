import Link from "next/link";
import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { projects, projectTasks, projectMilestones, clients, payments } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateProjectStatusAction, addTaskAction, toggleTaskAction, deleteTaskAction, addMilestoneAction, toggleMilestoneAction } from "@/app/actions/projects";
import { money } from "@/lib/money";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const input = "rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const STATUSES = ["not_started", "planning", "in_progress", "waiting_client", "on_hold", "review", "completed", "cancelled"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await requireTenant();
  const { id } = await params;
  const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.businessId, t.businessId))).limit(1);
  if (!project) notFound();
  const [client] = project.clientId ? await db.select().from(clients).where(eq(clients.id, project.clientId)).limit(1) : [null];
  const tasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, id)).orderBy(asc(projectTasks.createdAt));
  const milestones = await db.select().from(projectMilestones).where(eq(projectMilestones.projectId, id)).orderBy(asc(projectMilestones.createdAt));
  const pays = await db.select().from(payments).where(and(eq(payments.businessId, t.businessId), eq(payments.projectId, id)));

  const totalWeight = tasks.reduce((a, x) => a + x.weight, 0);
  const doneWeight = tasks.filter((x) => x.status === "done").reduce((a, x) => a + x.weight, 0);
  const pct = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
  const paid = pays.filter((p) => p.status === "confirmed" && !p.amount.startsWith("-")).reduce((a, p) => a + Number(p.amount), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/projects" className="text-slate-500 text-xs hover:text-slate-300">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{project.name}</h1>
          <p className="text-slate-400 text-sm">{client?.name ?? "No client"} · {money(project.value, project.currency)} · paid {money(paid, project.currency)}{project.dueDate ? ` · due ${project.dueDate}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <form action={updateProjectStatusAction} className="flex gap-1.5">
            <input type="hidden" name="id" value={id} />
            <select name="status" defaultValue={project.status} className={input}>{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
            <button className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 hover:bg-slate-700">Set</button>
          </form>
          <PrintButton />
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-white text-sm font-semibold">Overall completion</span>
          <span className="text-white text-2xl font-bold">{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center text-xs">
          <div><div className="text-slate-400">Total tasks</div><div className="text-white font-bold text-base">{tasks.length}</div></div>
          <div><div className="text-slate-400">Completed</div><div className="text-emerald-400 font-bold text-base">{tasks.filter((x) => x.status === "done").length}</div></div>
          <div><div className="text-slate-400">Overdue</div><div className="text-red-400 font-bold text-base">{tasks.filter((x) => x.status !== "done" && x.dueDate && x.dueDate < today).length}</div></div>
        </div>
        <p className="text-slate-500 text-[11px] mt-3">Weighted: {doneWeight} of {totalWeight} weight units complete.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <h2 className="text-white font-semibold text-sm mb-3">Tasks</h2>
            <form action={addTaskAction} className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
              <input type="hidden" name="projectId" value={id} />
              <input name="title" placeholder="Task title" required className={input + " col-span-2 md:col-span-2"} />
              <input name="dueDate" type="date" className={input} title="Due date" />
              <select name="priority" className={input}><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select>
              <input name="weight" type="number" min="1" defaultValue="1" title="Weight (relative effort)" className={input} />
              <button className="rounded-lg bg-blue-600 text-white text-sm font-medium px-3 hover:bg-blue-500">Add task</button>
            </form>
            {tasks.length === 0 ? (
              <p className="text-slate-500 text-sm">No tasks yet. Add deliverables as tasks.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task) => {
                  const overdue = task.status !== "done" && task.dueDate && task.dueDate < today;
                  return (
                    <li key={task.id} className="flex items-center gap-3 rounded-lg bg-slate-950/50 border border-slate-800 px-3 py-2.5">
                      <form action={toggleTaskAction}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="projectId" value={id} />
                        <button className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${task.status === "done" ? "bg-emerald-600 border-emerald-600 text-white" : overdue ? "border-red-500" : "border-slate-600"}`}>{task.status === "done" ? "✓" : ""}</button>
                      </form>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${task.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>{task.title}</div>
                        <div className="text-slate-500 text-[11px]">{task.priority} · weight {task.weight}{task.dueDate ? ` · due ${task.dueDate}` : ""}{overdue ? " · OVERDUE" : ""}</div>
                      </div>
                      <form action={deleteTaskAction}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="projectId" value={id} />
                        <button className="text-slate-600 hover:text-red-400 text-xs">✕</button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Milestones</h2>
          <form action={addMilestoneAction} className="space-y-2 mb-4">
            <input type="hidden" name="projectId" value={id} />
            <input name="name" placeholder="Milestone name" required className={input + " w-full"} />
            <div className="flex gap-2">
              <input name="dueDate" type="date" className={input + " flex-1"} />
              <input name="weight" type="number" min="1" defaultValue="1" className={input + " w-16"} title="Weight" />
            </div>
            <label className="flex items-center gap-2 text-slate-400 text-xs"><input type="checkbox" name="clientVisible" className="rounded bg-slate-800" /> Visible in client portal</label>
            <button className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs py-2 hover:bg-slate-700">Add milestone</button>
          </form>
          {milestones.length === 0 ? (
            <p className="text-slate-500 text-xs">No milestones yet.</p>
          ) : (
            <ul className="space-y-2">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <form action={toggleMilestoneAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="projectId" value={id} />
                    <button className={`w-4 h-4 rounded-full border ${m.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`} />
                  </form>
                  <span className={`text-xs flex-1 ${m.completed ? "text-slate-500 line-through" : "text-slate-300"}`}>{m.name}{m.clientVisible && <span className="text-slate-600"> · visible</span>}</span>
                  {m.dueDate && <span className="text-slate-600 text-[10px]">{m.dueDate}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
