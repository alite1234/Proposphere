"use server";

import { db } from "@/db";
import { projects, projectTasks, projectMilestones } from "@/db/schema";
import { requireTenant, logActivity } from "@/lib/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProjectAction(formData: FormData) {
  const t = await requireTenant();
  const [p] = await db
    .insert(projects)
    .values({
      businessId: t.businessId,
      clientId: String(formData.get("clientId") || "") || null,
      name: String(formData.get("name") || "").trim() || "Untitled project",
      status: "planning",
      currency: String(formData.get("currency") || "NGN").toUpperCase(),
      value: String(formData.get("value") || "0"),
      startDate: String(formData.get("startDate") || "") || null,
      dueDate: String(formData.get("dueDate") || "") || null,
      scope: String(formData.get("scope") || "") || null,
    })
    .returning({ id: projects.id });
  await logActivity(t.businessId, "project.created", { actor: t.user.email, objectType: "project", objectId: p.id });
  redirect(`/projects/${p.id}`);
}

export async function updateProjectStatusAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  await db.update(projects).set({ status: String(formData.get("status") || "planning") }).where(and(eq(projects.id, id), eq(projects.businessId, t.businessId)));
  revalidatePath(`/projects/${id}`);
}

export async function addTaskAction(formData: FormData) {
  const t = await requireTenant();
  const projectId = String(formData.get("projectId") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const milestoneId = String(formData.get("milestoneId") || "") || null;
  await db.insert(projectTasks).values({
    projectId,
    milestoneId,
    title,
    description: String(formData.get("description") || "") || null,
    startDate: String(formData.get("startDate") || "") || null,
    dueDate: String(formData.get("dueDate") || "") || null,
    priority: String(formData.get("priority") || "medium"),
    weight: Math.max(1, Number(formData.get("weight") || 1)),
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function toggleTaskAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, id)).limit(1);
  if (!task) return;
  const done = task.status !== "done";
  await db.update(projectTasks).set({ status: done ? "done" : "todo", completedAt: done ? new Date() : null }).where(eq(projectTasks.id, id));
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteTaskAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  await db.delete(projectTasks).where(eq(projectTasks.id, id));
  revalidatePath(`/projects/${projectId}`);
}

export async function addMilestoneAction(formData: FormData) {
  const t = await requireTenant();
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await db.insert(projectMilestones).values({
    projectId,
    name,
    dueDate: String(formData.get("dueDate") || "") || null,
    weight: Math.max(1, Number(formData.get("weight") || 1)),
    clientVisible: formData.get("clientVisible") === "on",
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function toggleMilestoneAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const [m] = await db.select().from(projectMilestones).where(eq(projectMilestones.id, id)).limit(1);
  if (!m) return;
  await db.update(projectMilestones).set({ completed: !m.completed }).where(eq(projectMilestones.id, id));
  revalidatePath(`/projects/${projectId}`);
}
