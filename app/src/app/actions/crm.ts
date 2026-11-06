"use server";

import { db } from "@/db";
import { clients, clientInteractions } from "@/db/schema";
import { requireTenant, logActivity } from "@/lib/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(fd: FormData, k: string) {
  return String(fd.get(k) || "").trim() || null;
}

export async function saveClientAction(formData: FormData) {
  const t = await requireTenant();
  const id = s(formData, "id");
  const values = {
    businessId: t.businessId,
    name: String(formData.get("name") || "").trim(),
    type: String(formData.get("type") || "organization"),
    industry: s(formData, "industry"),
    contactPerson: s(formData, "contactPerson"),
    role: s(formData, "role"),
    email: s(formData, "email"),
    phone: s(formData, "phone"),
    address: s(formData, "address"),
    website: s(formData, "website"),
    leadSource: s(formData, "leadSource"),
    tags: String(formData.get("tags") || "").split(",").map((x) => x.trim()).filter(Boolean),
    notes: s(formData, "notes"),
    relationshipStatus: String(formData.get("relationshipStatus") || "lead"),
    pipelineStage: String(formData.get("pipelineStage") || "new_lead"),
  };
  if (!values.name) return;
  let clientId = id;
  if (id) {
    await db.update(clients).set(values).where(and(eq(clients.id, id), eq(clients.businessId, t.businessId)));
  } else {
    const [row] = await db.insert(clients).values(values).returning({ id: clients.id });
    clientId = row.id;
  }
  await logActivity(t.businessId, id ? "client.updated" : "client.created", { actor: t.user.email, objectType: "client", objectId: clientId, details: { name: values.name } });
  revalidatePath("/clients");
  if (!id) redirect(`/clients/${clientId}`);
}

export async function addInteractionAction(formData: FormData) {
  const t = await requireTenant();
  const clientId = String(formData.get("clientId") || "");
  const followUpAt = s(formData, "followUpAt");
  await db.insert(clientInteractions).values({
    businessId: t.businessId,
    clientId,
    kind: String(formData.get("kind") || "note"),
    summary: s(formData, "summary"),
    outcome: s(formData, "outcome"),
    nextAction: s(formData, "nextAction"),
    followUpAt: followUpAt ? new Date(followUpAt) : undefined,
    createdBy: t.user.id,
  });
  await db.update(clients).set({ lastInteractionAt: new Date() }).where(and(eq(clients.id, clientId), eq(clients.businessId, t.businessId)));
  await logActivity(t.businessId, "interaction.recorded", { actor: t.user.email, objectType: "client", objectId: clientId });
  revalidatePath(`/clients/${clientId}`);
}

export async function moveStageAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  const stage = String(formData.get("stage") || "");
  await db.update(clients).set({ pipelineStage: stage }).where(and(eq(clients.id, id), eq(clients.businessId, t.businessId)));
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function deleteClientAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.businessId, t.businessId)));
  await logActivity(t.businessId, "client.deleted", { actor: t.user.email, objectType: "client", objectId: id });
  revalidatePath("/clients");
  redirect("/clients");
}
